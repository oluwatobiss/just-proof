"""Inert proposal: production state machine with explicit injected capabilities.
No I/O, adapter construction, threads, signal registration, or subprocess on import.
"""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import stat

BASE = Path('docs/development/evidence/phase-3e3a3e')
EVIDENCE = Path('docs/development/evidence/phase-3e3a4a')
OUTPUT = Path('/tmp/justproof-phase3e3a4a-public-components-attempt1')
AUTH = Path('/tmp/justproof-phase3e3a4a-authorization.json')
FLAG = '--separately-authorized-phase3e3a4a-public-components'
FALSE_PERMISSIONS = ('wallet','funding','proof','check','deployment','contractCall','userTransaction','download','pull','cacheMutation')
RESOURCE = {'MemTotal':12253256,'SwapTotal':8388608,'launchMemAvailable':8388608,'launchSwapFree':6291456,
            'runtimeMemAvailable':2097152,'runtimeSwapFree':2097152,'diskBytes':10737418240}
KINDS = ('proof','proof-probe','node','node-probe','indexer','indexer-probe')
FRESH = ('os','status','process','network','capture','resource')
class GateError(Exception):
    pass

def need(condition, code):
    if not condition:raise GateError(code)

def canonical_parents(path):
    path=Path(os.path.abspath(path))
    for parent in reversed(path.parents):
        s=parent.lstat()
        need(stat.S_ISDIR(s.st_mode) and not stat.S_ISLNK(s.st_mode),'PARENT_TYPE')
    need(path.parent.resolve()==path.parent,'PARENT_CANONICAL')
    return path

def validate_file_mode(mode):
    need(stat.S_ISREG(mode),'FILE_TYPE')

def identity(path):
    path=canonical_parents(path);before=path.lstat()
    validate_file_mode(before.st_mode)
    fd=os.open(path,os.O_RDONLY|os.O_NOFOLLOW)
    h=hashlib.sha256()
    with os.fdopen(fd,'rb') as f:
        opened=os.fstat(f.fileno())
        need((opened.st_dev,opened.st_ino)==(before.st_dev,before.st_ino),'FILE_RACE')
        for b in iter(lambda:f.read(1048576),b''):h.update(b)
        after=os.fstat(f.fileno())
    end=path.lstat()
    need((before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns)==(after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns)==(end.st_dev,end.st_ino,end.st_size,end.st_mtime_ns),'FILE_RACE')
    return {'type':'regular','bytes':after.st_size,'sha256':h.hexdigest()}

def validate_authorization(a, head, bindings, images):
    # Pure function. Complete validation precedes reservation.
    need(set(a) == {'authorized','validForExecution','phase','baselineCommit','bindings',
                    'imageIds','permissions','reviewedTimeouts','reviewedDefinitions'}, 'AUTH_FIELDS')
    need(a['authorized'] is True and a['validForExecution'] is True, 'AUTH_DISABLED')
    need(a['phase'] == '3E3A4A' and a['baselineCommit'] == head, 'AUTH_BASELINE')
    need(re.fullmatch('[0-9a-f]{40}', head) is not None, 'AUTH_HEAD')
    need(a['bindings'] == bindings and a['imageIds'] == images, 'AUTH_BINDINGS')
    need(type(a['permissions']) is dict and all(type(x) is bool for x in a['permissions'].values()),'AUTH_PERMISSION_TYPES')
    need(a['permissions'] == {**{x:False for x in FALSE_PERMISSIONS},
                              'publicComponentCharacterization':True,'autonomousEmptyBlocks':True}, 'AUTH_PERMISSIONS')
    need(a['reviewedTimeouts'] is True and a['reviewedDefinitions'] is True, 'AUTH_REVIEW')

def validate_resource(mem, disks, launch=False):
    need(all(type(mem.get(k)) is int and mem[k] >= 0 for k in ('MemTotal','MemAvailable','SwapTotal','SwapFree')), 'MEM_PARSE')
    prefix = 'launch' if launch else 'runtime'
    need(mem['MemTotal']>=RESOURCE['MemTotal'] and mem['SwapTotal']>=RESOURCE['SwapTotal'], 'CAPACITY')
    need(mem['MemAvailable']>=RESOURCE[prefix+'MemAvailable'] and mem['SwapFree']>=RESOURCE[prefix+'SwapFree'], 'HEADROOM')
    need(bool(disks) and all(type(n) is int and n>=RESOURCE['diskBytes'] for n in disks), 'DISK')

def validate_sample_timing(now, last, telemetry):
    need(0<=now-last<=2,'SAMPLE_GAP')
    need(0<=now-telemetry<=2,'CONTAINER_TELEMETRY_GAP')

def validate_inspection(i, spec, cid, network_id, mounts):
    # Pure validator. Fail closed on confinement discrepancies and replacement.
    h,c,n = i['HostConfig'],i['Config'],i['NetworkSettings']
    need(i['Id']==cid and i['Image']==spec['image'], 'CONTAINER_REPLACED')
    need(c['User']==spec['user'] and c.get('Entrypoint')==spec['entrypoint'] and (c.get('Cmd') or [])==spec['command'], 'CONTAINER_COMMAND')
    need(h['ReadonlyRootfs'] is True and h['Privileged'] is False, 'ROOT_PRIVILEGE')
    need(h.get('CapDrop')==['ALL'] and not h.get('CapAdd'), 'CAPABILITIES')
    need(h.get('SecurityOpt') in (['no-new-privileges'],['no-new-privileges:true']), 'SECURITY_OPTIONS')
    need(h['NetworkMode']==spec['network'] and set(n['Networks'])=={spec['network']}, 'NETWORK_ATTACHMENTS')
    need(n['Networks'][spec['network']]['NetworkID']==network_id, 'NETWORK_REPLACED')
    need(n['Networks'][spec['network']].get('IPAddress') in ('',spec['ip']), 'NETWORK_ADDRESS')
    need(not h.get('PortBindings') and not h.get('PublishAllPorts'), 'PUBLISHED_PORT')
    need(not any(v for v in (n.get('Ports') or {}).values()), 'EFFECTIVE_PORT')
    need(h.get('Dns')==['127.0.0.1'] and not h.get('ExtraHosts'), 'DNS_HOSTS')
    need(h.get('RestartPolicy',{}).get('Name')=='no' and h.get('AutoRemove') is False, 'RESTART_REMOVAL')
    need(h.get('Memory')==spec['memoryBytes'] and h.get('MemorySwap')==spec['memoryBytes'] and h.get('PidsLimit')==spec['pids'], 'CONTAINER_LIMITS')
    need(h.get('Tmpfs',{})==spec['tmpfs'], 'WRITE_PATHS')
    need(h.get('LogConfig')=={'Type':'none','Config':{}}, 'LOG_CONFIG')
    actual=[]
    for m in i.get('Mounts',[]):
        if m['Type']=='tmpfs':
            need(m['Destination'] in spec['tmpfs'], 'TMPFS_MOUNT')
        else:
            need(m['Type']=='bind' and m['RW'] is False, 'BIND_WRITABLE')
            actual.append((m['Source'],m['Destination']))
    need(sorted(actual)==sorted(mounts), 'MOUNTS')
    actual_env=dict(x.split('=',1) for x in c.get('Env',[]))
    need(actual_env==spec['effectiveEnvironment'], 'ENVIRONMENT')

def probe_event(j, kind):
    expected={'kind','event','passed','categories'}
    if kind=='indexer' and j.get('passed') is True:expected.add('height')
    need(set(j)==expected and j['kind']==kind,'PROBE_SCHEMA')
    need(j['event'] in ('observation','dwell-passed') and type(j['passed']) is bool,'PROBE_SCHEMA')
    allowed={'READY','NOT_READY','HTTP_REJECTED','BLOCK_ONE_PRESENT','PUBLIC_HEIGHT','TRANSPORT','DEADLINE','REDIRECT_REJECTED','RESPONSE_LIMIT','MALFORMED_PUBLIC_RESPONSE','PUBLIC_API_ERROR','FRAMING_REJECTED','MEDIA_REJECTED'}
    need(type(j['categories']) is list and len(j['categories'])==(3 if kind=='proof' else 1) and all(x in allowed for x in j['categories']),'PROBE_SCHEMA')
    if j['passed']:
        need(j['categories']==({'proof':['READY']*3,'node':['BLOCK_ONE_PRESENT'],'indexer':['PUBLIC_HEIGHT']}[kind]),'PROBE_SCHEMA')
    if 'height' in j:need(type(j['height']) is int and j['height']>=1,'PROBE_SCHEMA')
    need(j['event']!='dwell-passed' or j['passed'] is True,'PROBE_SCHEMA')
    return j

class DiagnosticStream:
    """Exact production incremental classifier. Raw bytes exist only in bounded memory."""
    def __init__(self,kind):
        self.kind=kind;self.buffers={'stdout':bytearray(),'stderr':bytearray()}
        self.closed=set();self.total=0;self.final_dwell=False
    def feed(self,channel,data):
        need(channel in self.buffers and channel not in self.closed,'CAPTURE_CHANNEL')
        self.total+=len(data);need(self.total<49152,'CAPTURE_BYTE_LIMIT')
        buf=self.buffers[channel];buf.extend(data);events=[]
        while b'\n' in buf:
            line,_,rest=buf.partition(b'\n');buf[:]=rest
            need(len(line)<=4096,'CAPTURE_LINE_LIMIT')
            try:text=line.decode('utf-8',errors='strict')
            except UnicodeError:raise GateError('CAPTURE_UTF8') from None
            if not text.strip():continue
            if self.kind.endswith('-probe'):
                need(not self.final_dwell,'PROBE_AFTER_FINAL')
                try:j=json.loads(text)
                except Exception:raise GateError('PROBE_SCHEMA') from None
                events.append(probe_event(j,self.kind.removesuffix('-probe')))
                if j['event']=='dwell-passed':
                    need(not self.final_dwell,'PROBE_DUPLICATE_FINAL');self.final_dwell=True
            else:
                low=text.lower()
                need(not re.search(r'seed|mnemonic|private|password|secret|authorization|request.body|response.body|environment|https?://|wss?://',low),'SENSITIVE_DIAGNOSTIC')
                need(not re.search(r'fetch|download|parameter.*missing|missing.*parameter',low),'PARAMETER_DIAGNOSTIC')
                if re.search(r'permission denied|read.only file system|configuration.*error',low):raise GateError('COMPONENT_CONFIGURATION')
                category=next((c for pattern,c in [(r'listening|server.*started|starting.*server','PUBLIC_STARTUP'),(r'best.*#[0-9]+|finalized.*#[0-9]+|imported.*#[0-9]+','PUBLIC_BLOCK_PROGRESS'),(r'shutdown|shutting down|signal.*term','PUBLIC_SHUTDOWN')] if re.search(pattern,low)),None)
                need(category is not None,'UNCLASSIFIED_DIAGNOSTIC');events.append({'category':category})
        need(len(buf)<=4096,'CAPTURE_LINE_LIMIT')
        return events
    def close(self,channel,container_exited):
        need(container_exited,'CAPTURE_EARLY_CLOSE')
        need(not self.buffers[channel],'CAPTURE_PARTIAL_LINE')
        self.closed.add(channel)
    def finished(self):return self.closed=={'stdout','stderr'}

class Capabilities:
    def __init__(self,*,docker,clock,filesystem,signals,resources,evidence,gate):
        self.docker=docker;self.clock=clock;self.filesystem=filesystem;self.signals=signals
        self.resources=resources;self.evidence=evidence;self.gate=gate

class Shutdown:
    """Single coordinator for normal cleanup, signals and watchdog. No docker stop."""
    def __init__(self,machine):self.m=machine;self.term={};self.kill=set();self.natural=set()
    def request(self,keys,reason):
        m=self.m;now=m.io.clock.now()
        for k in keys:
            if k not in m.created or k in self.term or k in self.natural:continue
            s=m.status.get(k)
            if s and not s['running']:
                self.natural.add(k);continue
            self.term[k]={'at':m.io.clock.now(),'reason':reason}
            m.action('term:'+k,lambda k=k:m.io.docker.signal(k,'TERM'),'cleanup')
    def poll(self,force=False):
        m=self.m;now=m.io.clock.now()
        for k,t in tuple(self.term.items()):
            s=m.status.get(k)
            if (force or now-t['at']>=5) and k not in self.kill and (s is None or s['running']):
                self.kill.add(k)
                m.action('kill:'+k,lambda k=k:m.io.docker.signal(k,'KILL'),'cleanup')
                m.record('shutdown','FORCED_KILL','cleanup')

class Attempt:
    """The production orchestration tested with fake adapters. No hidden live dependencies."""
    def __init__(self,io,definitions):
        self.io=io;self.d=definitions;self.created={};self.networks={};self.status={};self.root_pids={}
        self.captures={};self.started=set();self.completed=set();self.failures=[];self.reserved=False
        self.permanent=False;self.component_blocked=False;self.finalization_errors=[]
        self.fresh={};self.last_tick=None;self.epoch=None;self.shutdown=Shutdown(self);self.signal_seen=set()
    def record(self,stage,code,tier='monitor'):
        if not re.fullmatch('[A-Z0-9_]+',code):code='MONITOR_ERROR'
        entry={'ordinal':len(self.failures)+1,'stage':stage,'category':code,'tier':tier,'monotonic':self.io.clock.now()}
        self.failures.append(entry)
        if tier=='component':self.component_blocked=True
        else:self.permanent=True
        if tier in ('cleanup','finalization') and code not in self.finalization_errors:self.finalization_errors.append(code)
        if self.reserved:
            try:self.io.evidence.append_failure(entry)
            except Exception:
                self.permanent=True;self.finalization_errors.append('JOURNAL_WRITE_FAILED')
    def action(self,stage,fn,tier='monitor'):
        try:return fn()
        except Exception as e:
            self.record(stage,str(e) if isinstance(e,GateError) else 'ADAPTER_FAILED',tier)
            return None
    def require_action(self,stage,fn):
        before=len(self.failures);v=self.action(stage,fn)
        if len(self.failures)!=before:raise GateError('ABORT_RECORDED')
        return v
    def watchdog(self):
        now=self.io.clock.now()
        for sig in self.io.signals.pending():
            need(sig in ('SIGINT','SIGTERM'),'SIGNAL_SCHEMA')
            if sig not in self.signal_seen:self.record('signal',sig);self.signal_seen.add(sig)
            self.shutdown.request(tuple(self.created),'signal')
        if self.epoch is not None:
            if now-self.epoch>=415 and not any(x['category']=='OVERALL_TIMEOUT' for x in self.failures):
                self.record('watchdog','OVERALL_TIMEOUT');self.shutdown.request(tuple(self.created),'watchdog')
            if now-self.epoch>=420:self.shutdown.poll(force=True)
        self.shutdown.poll()
    def check_status(self,k,s):
        need(s['id']==self.created[k],'CONTAINER_REPLACED')
        need(type(s['running']) is bool and type(s['oom']) is bool,'STATUS_SCHEMA')
        if s['oom']:self.record('status:'+k,'OOM','component')
        if s['running']:
            need(type(s['rootPid']) is int and s['rootPid']>0,'ROOT_PID')
            if k in self.root_pids:need(self.root_pids[k]==s['rootPid'],'ROOT_PID_REPLACED')
            else:self.root_pids[k]=s['rootPid']
        elif k in self.started:
            if k.endswith('-probe'):
                if s['exit']!=0:self.record('status:'+k,'PROBE_NONZERO','component')
            elif k not in self.shutdown.term:
                self.record('status:'+k,'UNEXPECTED_SERVICE_EXIT','component')
            elif s['exit'] not in (0,143,-15):self.record('status:'+k,'UNEXPECTED_SIGNAL_EXIT','cleanup')
        self.status[k]=s
    def tick(self,cleanup=False):
        now=self.io.clock.now();self.watchdog()
        if self.last_tick is not None and now-self.last_tick>2:self.record('sampling','SAMPLE_GAP')
        self.last_tick=now
        osrow=self.require_action('os',self.io.resources.read)
        validate_resource(osrow['memKiB'],osrow['diskBytes'])
        need(type(osrow['cpuCount']) is int and type(osrow['affinity']) is list,'OS_SCHEMA')
        self.fresh['os']=self.io.clock.now()
        rows=self.require_action('status',lambda:self.io.docker.inspect_all(self.created))
        need(set(rows)==set(self.created),'STATUS_SET')
        for k,s in rows.items():self.check_status(k,s)
        self.fresh['status']=self.io.clock.now()
        self.require_action('network',lambda:self.io.docker.networks(self.networks,self.created))
        self.fresh['network']=self.io.clock.now()
        procs=self.require_action('process',lambda:self.io.docker.processes(self.created,self.status))
        for k,s in self.status.items():
            if s['running']:need(k in procs and self.root_pids[k] in [p['pid'] for p in procs[k]],'PROCESS_ROOT_MISSING')
        for rows in procs.values():
            for p in rows:
                need(all(type(p.get(x)) is int and p[x]>=0 for x in ('pid','ppid','rssBytes')) and type(p.get('cpuPercent')) in (int,float) and math.isfinite(p['cpuPercent']) and p['cpuPercent']>=0,'PROCESS_SCHEMA')
        self.fresh['process']=self.io.clock.now()
        stats=self.require_action('resource',lambda:self.io.docker.statistics(self.created,self.status))
        need(set(stats)=={k for k,s in self.status.items() if s['running']},'RESOURCE_SET')
        for r in stats.values():
            need(all(type(r.get(x)) is int and r[x]>=0 for x in ('memoryBytes','pids','networkRxBytes','networkTxBytes','blockReadBytes','blockWriteBytes')) and type(r.get('cpuPercent')) in (int,float) and math.isfinite(r['cpuPercent']) and r['cpuPercent']>=0,'RESOURCE_SCHEMA')
        self.fresh['resource']=self.io.clock.now()
        for k,c in self.captures.items():
            observation=self.require_action('capture:'+k,lambda k=k:self.io.docker.capture_poll(k))
            need(self.io.clock.now()-observation['checkedAt']<=2,'CAPTURE_GAP')
            for channel,b in observation['chunks']:
                events=c.feed(channel,b)
                if events:self.require_action('diagnostic:'+k,lambda k=k,events=events:self.io.evidence.event(k,events))
            exited=not self.status[k]['running']
            for channel in observation['closed']:c.close(channel,exited)
            if observation['processExited']:
                need(exited and c.finished(),'CAPTURE_PROCESS_EXIT')
                need(observation['exitCode']==self.status[k]['exit'],'CAPTURE_EXIT_MISMATCH')
                if k.endswith('-probe') and self.status[k]['exit']==0:need(c.final_dwell,'PROBE_FINAL_MISSING')
        self.fresh['capture']=self.io.clock.now()
        end=self.io.clock.now()
        need(all(0<=end-self.fresh[x]<=2 for x in FRESH),'TELEMETRY_STALE')
        self.require_action('sample',lambda:self.io.evidence.sample({'at':end,'freshness':dict(self.fresh),'os':osrow,'processes':procs,'resources':stats,'status':self.status,'containment':'CONFIGURED_INTERNAL_NETWORK_ONLY'}))
        self.watchdog()
        if not cleanup and (self.permanent or self.component_blocked):raise GateError('ABORT_RECORDED')
    def launch(self,k):
        need(k not in self.created,'RELAUNCH_FORBIDDEN')
        if k in ('node','indexer'):need('proof' in self.status and not self.status['proof']['running'] and self.captures['proof'].finished(),'PROOF_LEDGER_OVERLAP')
        cid=self.require_action('create:'+k,lambda:self.io.docker.create(k,self.d['containers'][k]))
        self.created[k]=cid
        self.require_action('inspect:'+k,lambda:self.io.docker.inspect_created(k,cid))
        self.captures[k]=DiagnosticStream(k)
        self.require_action('start:'+k,lambda:self.io.docker.start_attached(k,cid))
        self.started.add(k)
    def wait_probe(self,k):
        deadline=self.io.clock.now()+self.d['containers'][k]['deadlineSeconds']
        while True:
            self.tick()
            if not self.status[k]['running'] and self.captures[k].finished():
                need(self.status[k]['exit']==0 and self.captures[k].final_dwell,'PROBE_NOT_PASSED');self.completed.add(k);return
            if self.io.clock.now()>=deadline:self.record('probe:'+k,'COMPONENT_DEADLINE','component');raise GateError('ABORT_RECORDED')
            self.io.clock.sleep(.5)
    def stop_group(self,keys,reason):
        self.shutdown.request(keys,reason);deadline=self.io.clock.now()+8
        while True:
            self.tick(cleanup=True)
            if all(k not in self.created or (not self.status[k]['running'] and (k not in self.captures or self.captures[k].finished())) for k in keys):return
            if self.io.clock.now()>=deadline:self.record('shutdown','STOP_UNVERIFIED','cleanup');return
            self.io.clock.sleep(.5)
    def finalize(self):
        # Every collection independent. Failures never skip another collection.
        try:self.stop_group(tuple(self.created),'finalization')
        except Exception:self.record('shutdown','CLEANUP_FAILED','cleanup')
        for name,fn in [
            ('discovery',lambda:self.io.docker.discover_owned(self.created)),
            ('final-status',lambda:self.io.docker.final_status(self.created)),
            ('capture-close',lambda:self.io.docker.close_captures(self.created)),
            ('root-diff',lambda:self.io.docker.root_diff(self.created)),
            ('final-network',lambda:self.io.docker.networks(self.networks,self.created)),
            ('bindings',self.io.gate.final_bindings),
            ('preservation',self.io.filesystem.preservation),
            ('managed',self.io.filesystem.managed),
            ('cache',self.io.filesystem.cache)]:
            try:
                value=fn();self.io.evidence.final(name,value)
            except Exception:
                self.finalization_errors.append(name.upper().replace('-','_')+'_FAILED')
                self.record('finalization',self.finalization_errors[-1],'finalization')
        if any(s['running'] for s in self.status.values()):self.record('finalization','RUNNING_UNVERIFIED','cleanup');self.finalization_errors.append('RUNNING_UNVERIFIED')
    def run(self,authorization):
        try:
            self.io.gate.check(authorization,final=False)
            self.io.gate.check(authorization,final=True) # Full repeated gate, not just bindings.
        except Exception:
            self.record('preflight','PREFLIGHT_REJECTED');return self.result(False),1
        try:
            self.io.filesystem.reserve(authorization)
            self.reserved=True;self.epoch=self.io.clock.now()
            for n in self.d['networks']:
                self.networks[n]=self.require_action('network-create:'+n,lambda n=n:self.io.docker.create_network(n,self.d['networks'][n]))
            self.launch('proof');self.launch('proof-probe');self.wait_probe('proof-probe')
            self.stop_group(('proof-probe','proof'),'sequence')
            need(not self.permanent and not self.component_blocked,'ABORT_RECORDED')
            self.launch('node');self.launch('node-probe');self.wait_probe('node-probe')
            self.launch('indexer');self.launch('indexer-probe');self.wait_probe('indexer-probe')
        except Exception as e:
            self.reserved=self.reserved or self.io.filesystem.reserved()
            if not isinstance(e,GateError) or str(e)!='ABORT_RECORDED':self.record('orchestration',str(e) if isinstance(e,GateError) else 'ORCHESTRATION_FAILED','component' if isinstance(e,GateError) and str(e)=='COMPONENT_CONFIGURATION' else 'monitor')
        if self.reserved:self.finalize()
        r=self.result(True)
        if self.reserved:
            try:self.io.evidence.result(r)
            except Exception:self.finalization_errors.append('RESULT_WRITE_FAILED');self.record('result','RESULT_WRITE_FAILED','finalization');r=self.result(False)
        return r,0 if r['componentCharacterizationPassed'] and r['finalizationComplete'] else 1
    def result(self,complete):
        success=self.completed=={'proof-probe','node-probe','indexer-probe'} and not self.permanent and not self.component_blocked
        return {'outcome':('COMPONENT_CHARACTERIZATION_PASSED' if success else 'MONITOR_OR_FINALIZATION_FAILED' if self.permanent else 'COMPONENT_RUNTIME_BLOCKED'),
                'componentCharacterizationPassed':success,'componentRuntimeBlocked':self.component_blocked,
                'successPermanentlyBlocked':self.permanent,'finalizationComplete':complete and self.reserved and not self.finalization_errors,
                'finalizationErrors':list(self.finalization_errors),'failureJournal':list(self.failures),
                'shutdown':{'term':self.shutdown.term,'kill':sorted(self.shutdown.kill),'naturalExits':sorted(self.shutdown.natural)},
                'retainedContainers':self.created,'retainedNetworks':self.networks,
                'containment':'CONFIGURED_INTERNAL_NETWORK_ONLY','empiricalEgressDenialTested':False,
                'fullStackReadiness':False,'parameterReadiness':False,'proofGeneration':False,'cryptographicVerification':False,'r61Complete':False}

def main():
    import argparse
    import importlib.util
    import sys
    parser=argparse.ArgumentParser();parser.add_argument(FLAG,action='store_true',dest='enabled');parser.add_argument('--authorization-file',required=True)
    args=parser.parse_args();need(args.enabled and Path(args.authorization_file)==AUTH,'AUTH_FLAG_PATH')
    st=AUTH.lstat();need(stat.S_ISREG(st.st_mode) and stat.S_IMODE(st.st_mode)==0o600 and st.st_uid==os.getuid(),'AUTH_PERMISSION')
    identity(AUTH);raw=AUTH.read_bytes();need(len(raw)<=16384,'AUTH_SIZE');a=json.loads(raw)
    need(a.get('authorized') is True and a.get('validForExecution') is True,'AUTH_DISABLED')
    # Import alone is inert; constructor follows exact schema/hash authorization gate.
    sys.dont_write_bytecode=True
    spec=importlib.util.spec_from_file_location('reviewed_real_adapters',BASE/'proposed-real-adapters.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    domain=sys.modules[__name__]
    b={k:identity(p)['sha256'] for k,p in module.binding_paths(domain).items()}
    d=json.loads((BASE/'container-definitions.json').read_text())
    validate_authorization(a,a.get('baselineCommit'),b,d['imageIds'])
    real=module.RealAdapters(domain,d,a,raw,b)
    io=Capabilities(docker=real,clock=real,filesystem=real,signals=real,resources=real,evidence=real,gate=real)
    result,exit_code=Attempt(io,d).run(a)
    print(result['outcome'])
    return exit_code

if __name__=='__main__':
    try:raise SystemExit(main())
    except Exception:
        print('PUBLIC_COMPONENT_CHARACTERIZATION_BLOCKED');raise SystemExit(1)
