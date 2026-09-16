"""Local read-only preflight; writes evidence only. Never launches compilation or a monitor."""
from pathlib import Path
import subprocess, json, hashlib, os, shutil, datetime
base=Path('docs/development/evidence/phase-3e1')
cache=Path('/home/oluwatobiss/.cache/midnight/zk-params')
def command(args):
 p=subprocess.run(args,text=True,capture_output=True)
 return {'argv':args,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return {'path':str(p),'bytes':p.stat().st_size,'sha256':h.hexdigest()}
def read(p):
 try:return Path(p).read_text()
 except OSError as e:return {'unavailable':str(e)}
mem={line.split(':')[0]:int(line.split()[1]) for line in Path('/proc/meminfo').read_text().splitlines() if line.split(':')[0] in ['MemTotal','MemAvailable','SwapTotal','SwapFree']}
cgroups={}
for root in ['/sys/fs/cgroup/memory','/sys/fs/cgroup/memory/init.scope','/sys/fs/cgroup/unified','/sys/fs/cgroup/unified/init.scope']:
 for name in ['memory.limit_in_bytes','memory.usage_in_bytes','memory.memsw.limit_in_bytes','memory.memsw.usage_in_bytes','memory.stat','memory.use_hierarchy','memory.max','memory.current','memory.swap.max','memory.swap.current','cgroup.controllers']:
  cgroups[root+'/'+name]=read(root+'/'+name)
versions=[command(a) for a in [['compact','--version'],['compact','compile','+0.31.1','--version'],['compact','compile','+0.31.1','--language-version'],['compact','compile','+0.31.1','--runtime-version'],['node','--version'],['npm','--version']]]
paths=[Path('contracts/just-proof.compact'),*sorted(Path('contracts/managed/just-proof/zkir').glob('*.zkir'))]
tracked=subprocess.check_output(['git','ls-files','-z']).decode().strip('\0').split('\0')
preserved=sorted(set(tracked)|{str(p) for p in Path('contracts/managed').rglob('*') if p.is_file()})
cache_before=[digest(p) for p in sorted(cache.rglob('*')) if p.is_file()]
proposed=['/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1','/tmp/justproof-phase3e2-four-circuit-74591b08-attempt1.marker']
result={'capturedAtUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baselineHead':'74591b08a808cc94bb19e0fa4331db4bbdd44a44','baselineCleanConfirmedBeforeEvidenceCreation':True,'head':command(['git','rev-parse','HEAD']),'kernel':command(['uname','-a']),'distribution':read('/etc/os-release'),'versions':versions,'installedRuntime':json.loads(Path('node_modules/@midnight-ntwrk/compact-runtime/package.json').read_text())['version'],'memoryKiB':mem,'cgroupMembership':read('/proc/self/cgroup'),'cgroupMounts':[s for s in Path('/proc/self/mountinfo').read_text().splitlines() if 'cgroup' in s],'cgroupObservations':cgroups,'cpuCount':os.cpu_count(),'affinityCount':len(os.sched_getaffinity(0)),'nproc':command(['nproc']),'processLimits':read('/proc/self/limits'),'disk':[{'path':str(p),**dict(zip(['totalBytes','usedBytes','freeBytes'],shutil.disk_usage(p)))} for p in [Path.cwd(),Path('/tmp'),cache]],'cache':cache_before,'fingerprints':[digest(p) for p in paths],'proposedPaths':[{'path':p,'exists':os.path.lexists(p)} for p in proposed],'preservationBaseline':[digest(Path(p)) for p in preserved if Path(p).is_file()],'classification':'BLOCKED_INSUFFICIENT_RESOURCES','networkAccess':False,'buildAttempted':False}
assert all(not p['exists'] for p in result['proposedPaths'])
assert all(v['exit']==0 for v in versions)
assert result['head']['stdout'].strip()==result['baselineHead']
(base/'readiness.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'memoryKiB':mem,'cpuCount':result['cpuCount'],'affinityCount':result['affinityCount'],'disk':result['disk'],'cacheFiles':len(cache_before),'fingerprints':result['fingerprints']},indent=2))
