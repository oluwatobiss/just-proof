import os, pathlib, subprocess, time, signal, json, hashlib, re, resource, threading

base=pathlib.Path('docs/development/evidence/phase-3c').resolve()
out=pathlib.Path('/tmp/justproof-phase3c-three-circuits-20260915')
cache=pathlib.Path('/home/oluwatobiss/.cache/midnight/zk-params')
expected='4010eed928402850684930b2adb921153690a410fd5a88fcf52bd02847e87974'
assert json.loads((base/'gate.json').read_text())['passed'] is True
assert hashlib.sha256(pathlib.Path('contracts/just-proof.compact').read_bytes()).hexdigest()==expected
assert not out.exists(), 'output directory must be fresh'
with (base/'attempt-started').open('x') as f: f.write(time.strftime('%Y-%m-%dT%H:%M:%S%z'))
def inventory(root):
    return [{'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':hashlib.file_digest(p.open('rb'),'sha256').hexdigest()} for p in sorted(root.rglob('*')) if p.is_file()]
cache_before=inventory(cache)
(base/'cache-before.json').write_text(json.dumps(cache_before,indent=2))
existing={p.name for p in cache.iterdir() if p.is_file()}
cmd=['compact','compile','+0.31.1','contracts/just-proof.compact',str(out)]
env=os.environ.copy();env.update(RAYON_NUM_THREADS='2',XDG_CACHE_HOME='/home/oluwatobiss/.cache')
host='midnight-s3-fileshare-dev-eu-west-1.s3.eu-west-1.amazonaws.com'
def system_memory():
    d={}
    for line in pathlib.Path('/proc/meminfo').read_text().splitlines():
        k,v=line.split(':',1)
        if k in ['MemTotal','MemAvailable','SwapTotal','SwapFree']:d[k]=int(v.split()[0])
    return d
def process_tree(pid):
    rows={}
    for d in pathlib.Path('/proc').iterdir():
        if not d.name.isdigit():continue
        try:
            s=(d/'stat').read_text();t=s[s.rfind(')')+2:].split()
            ppid,pgrp=int(t[1]),int(t[2]);info={}
            for line in (d/'status').read_text().splitlines():
                if line.startswith(('VmRSS:','VmHWM:')):
                    k,v=line.split(':',1);info[k]=int(v.split()[0])
            rows[int(d.name)]={'pid':int(d.name),'ppid':ppid,'pgrp':pgrp,'name':(d/'comm').read_text().strip(),'rssKiB':info.get('VmRSS',0),'hwmKiB':info.get('VmHWM',0)}
        except (OSError,ValueError,IndexError):pass
    selected={k for k,v in rows.items() if k==pid or v['pgrp']==pid}
    while True:
        more={k for k,v in rows.items() if v['ppid'] in selected}
        if more<=selected:break
        selected|=more
    return [rows[k] for k in sorted(selected)]
(base/'pre-run.json').write_text(json.dumps({'systemKiB':system_memory(),'diskFreeBytes':__import__('shutil').disk_usage('/tmp').free,'sourceSha256':expected,'command':cmd},indent=2))
assert system_memory()['MemAvailable']>=768*1024 and system_memory()['SwapFree']>=512*1024, 'insufficient safe memory before launch'
started=time.monotonic();reason=None;term_at=None;peak=0;min_available=None;max_swap=0;names=set();requests=set();samples=0
log=(base/'build.log').open('w')
p=subprocess.Popen(cmd,env=env,stdout=log,stderr=subprocess.STDOUT,start_new_session=True)
def kill_group(sig):
    try:os.killpg(p.pid,sig)
    except ProcessLookupError:pass
hard_timer=threading.Timer(1350,lambda:kill_group(signal.SIGKILL));hard_timer.daemon=True;hard_timer.start()
try:
    with (base/'memory.jsonl').open('w') as memory:
        while True:
            elapsed=time.monotonic()-started;sysmem=system_memory();tree=process_tree(p.pid)
            rss=sum(x['rssKiB'] for x in tree);peak=max(peak,rss)
            min_available=sysmem['MemAvailable'] if min_available is None else min(min_available,sysmem['MemAvailable'])
            max_swap=max(max_swap,sysmem['SwapTotal']-sysmem['SwapFree']);names.update(x['name'] for x in tree)
            sample={'elapsedSeconds':round(elapsed,3),'aggregateRssKiB':rss,'processes':tree,'systemKiB':sysmem}
            memory.write(json.dumps(sample)+'\n');memory.flush();samples+=1
            text=(base/'build.log').read_text(errors='replace')
            requests.update(re.findall(r'bls_midnight_2p\d+',text))
            created={x.name for x in cache.iterdir() if x.is_file()}-existing
            requested_missing=(requests-existing)|{x for x in created if re.fullmatch(r'bls_midnight_2p\d+',x)}
            urls=re.findall(r'https?://([^/\s]+)',text)
            if reason is None:
                if any(x!=host for x in urls):reason='unexpected origin reported'
                elif len(requested_missing)>1:reason='more than one missing parameter'
                elif sysmem['MemAvailable']<768*1024 or sysmem['SwapFree']<512*1024:reason='safe stop: memory threshold'
                elif elapsed>=1345:reason='timeout: graceful stop at 1345 seconds, hard kill at 1350'
                if reason:term_at=elapsed;kill_group(signal.SIGTERM)
            if term_at is not None and elapsed-term_at>=5:kill_group(signal.SIGKILL)
            if p.poll() is not None:break
            time.sleep(0.5)
    code=p.wait()
finally:
    hard_timer.cancel();kill_group(signal.SIGKILL);log.close()
elapsed=time.monotonic()-started
result={'command':cmd,'environmentOverrides':{'RAYON_NUM_THREADS':'2','XDG_CACHE_HOME':env['XDG_CACHE_HOME']},'output':str(out),'compilerExit':code,'elapsedSeconds':elapsed,'stopReason':reason,'timeout':elapsed>=1345 or code==-9 and elapsed>=1349,'sampledPeakAggregateRssKiB':peak,'waitedChildMaxRssKiB':resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss,'minimumSystemAvailableKiB':min_available,'maximumSystemSwapUsedKiB':max_swap,'sampleCount':samples,'processNames':sorted(names),'reportedParameterNames':sorted(requests),'newCacheFiles':sorted({x.name for x in cache.iterdir() if x.is_file()}-existing),'expectedHost':host,'systemAfterKiB':system_memory()}
(base/'result.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))

(base/'artifact-manifest.json').write_text(json.dumps({'sourceSha256':expected,'outputDirectory':str(out),'artifacts':inventory(out)},indent=2))
(base/'cache-after.json').write_text(json.dumps(inventory(cache),indent=2))
