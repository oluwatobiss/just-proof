"""Public-only simulations of imported production Attempt; fake capabilities only."""
import sys
sys.dont_write_bytecode=True
import copy
import importlib.util
import json
import os
from pathlib import Path
import tempfile
import stat

D=Path(__file__).parent
spec=importlib.util.spec_from_file_location('inert_component_proposal',D/'proposed-component-monitor.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
DEFS=json.loads((D/'container-definitions.json').read_text())
class Fake:
    def __init__(self,root,fault=None,variant=None):
        self.root=Path(root);self.fault=fault;self.variant=variant;self.calls=[];self.t=0.;self.containers={};self.nets={};self.streams={};self.events=[];self.injected=False;self.checks=0;self.a=None;self.owns_evidence=False;self.signal_times=[]
    def hit(self,point):
        self.calls.append(point)
        if self.fault==point and not self.injected:self.injected=True;raise m.GateError('INJECTED_FAILURE')
        if self.variant=='daemon-dead' and point.startswith(('inspect','status','term','kill','final-status')):raise m.GateError('DOCKER_TIMEOUT')
    def now(self):return self.t
    def sleep(self,n):self.t+=n
    def pending(self):
        if self.variant in ('SIGINT','SIGTERM') and self.containers and not self.injected:self.injected=True;return [self.variant]
        if self.variant=='watchdog' and self.containers and not self.injected:self.injected=True;self.t=415
        return []
    def check(self,authorization,final=False):
        self.hit('gate-final' if final else 'gate-initial');self.checks+=1
        m.validate_authorization(authorization,'a'*40,{'monitorSha256':'b'*64},DEFS['imageIds'])
        if self.variant=='gate-race' and final:raise m.GateError('PRE_RESERVATION_CHANGED')
    def reserve(self,authorization):
        self.hit('reserve');assert self.checks==2
        self.root.joinpath('evidence').mkdir(exist_ok=False);self.owns_evidence=True
        self.hit('marker');self.root.joinpath('evidence','attempt-started').write_bytes(b'public mock')
        self.hit('authorization-copy');data=json.dumps(authorization,sort_keys=True).encode();p=self.root.joinpath('evidence','authorization.json')
        with p.open('xb') as f:f.write(data);f.flush();os.fsync(f.fileno())
        p.chmod(0o444);assert p.read_bytes()==data
        self.hit('output-reserve');self.root.joinpath('output').mkdir(exist_ok=False)
    def reserved(self):return self.owns_evidence
    def create_network(self,n,d):self.hit('network-create:'+n);self.nets[n]='id-'+n;return self.nets[n]
    def create(self,k,d):
        self.hit('create:'+k);assert k not in self.containers
        self.containers[k]={'id':'id-'+k,'running':False,'rootPid':0,'exit':0,'oom':False,'ticks':0,'started':False,'term':False,'delivered':False};return 'id-'+k
    def inspect_created(self,k,cid):self.hit('inspect:'+k);return copy.deepcopy(self.containers[k])
    def start_attached(self,k,cid):
        self.hit('start:'+k);s=self.containers[k];assert not s['started'];s.update(running=True,rootPid=100+len(self.containers),started=True)
        self.streams[k]=True
    def inspect_all(self,ids):
        self.hit('status');rows={}
        for k in ids:
            self.hit('status:'+k);s=self.containers[k];s['ticks']+=1
            if k.endswith('-probe') and s['ticks']>=2 and s['started'] and self.variant!='watchdog':s['running']=False
            if s['term'] and self.variant not in ('ignore-term','watchdog'):s['running']=False;s['exit']=143 if not k.endswith('-probe') else 0
            r={x:s[x] for x in ('id','running','rootPid','exit','oom')}
            if k=='proof' and self.variant=='service-exit':s['running']=False;r['running']=False
            if k=='proof-probe' and self.variant=='probe-nonzero':r['exit']=2;r['running']=False
            if k=='proof' and self.variant=='oom':r['oom']=True
            if k=='proof' and self.variant=='replacement':r['id']='replacement'
            if k=='proof' and self.variant=='pid-replacement' and s['ticks']>1:r['rootPid']+=1
            rows[k]=r
        return rows
    def networks(self,nets,ids):
        self.hit('network')
        if self.variant=='foreign-network':raise m.GateError('FOREIGN_NETWORK_MEMBER')
        return {'configuredInternal':True}
    def processes(self,ids,status):
        self.hit('process')
        return {k:[{'pid':s['rootPid'],'ppid':1,'rssBytes':1024,'cpuPercent':0.0}] for k,s in status.items() if s['running']}
    def statistics(self,ids,status):self.hit('resource');return {k:{'memoryBytes':1024,'cpuPercent':0.,'pids':1,'networkRxBytes':0,'networkTxBytes':0,'blockReadBytes':0,'blockWriteBytes':0} for k,s in status.items() if s['running']}
    def capture_poll(self,k):
        self.hit('capture:'+k);s=self.containers[k];chunks=[]
        if not s['delivered']:
            if k.endswith('-probe'):
                kind=k.removesuffix('-probe');j={'kind':kind,'event':'dwell-passed','passed':True,'categories':{'proof':['READY']*3,'node':['BLOCK_ONE_PRESENT'],'indexer':['PUBLIC_HEIGHT']}[kind]}
                if kind=='indexer':j['height']=1
                raw=(json.dumps(j)+'\n').encode()
            else:raw=b'Listening on 0.0.0.0\n'
            chunks=[('stdout',raw)];s['delivered']=True
        running=s['running']
        if self.variant=='capture-exit':running=False
        return {'checkedAt':self.t-3 if self.variant=='capture-stale' else self.t,'chunks':chunks,'closed':[] if running else ['stdout','stderr'],'processExited':not running,'exitCode':s['exit']}
    def signal(self,k,sig):
        self.hit(sig.lower()+':'+k);self.signal_times.append((k,sig,self.now()))
        if sig=='TERM':assert not self.containers[k]['term'];self.containers[k]['term']=True
        else:self.containers[k].update(running=False,exit=137)
    def read(self):
        self.hit('os')
        if self.variant=='sample-gap' and self.containers and not self.injected:self.injected=True;self.t+=3
        return {'memKiB':{'MemTotal':12253256,'MemAvailable':8388608,'SwapTotal':8388608,'SwapFree':6291456},'diskBytes':[10737418240]*3,'cpuCount':8,'affinity':list(range(8))}
    def event(self,k,events):self.hit('diagnostic:'+k);self.events+=events
    def sample(self,row):self.hit('sample')
    def append_failure(self,j):self.hit('failure-journal');self.root.joinpath('evidence','journal').open('a').write(json.dumps(j)+'\n')
    def discover_owned(self,created):self.hit('discovery');return copy.deepcopy(self.containers)
    def final_status(self,created):
        self.hit('final-status');m.need(all(not s['running'] for s in self.containers.values()),'STILL_RUNNING');return copy.deepcopy(self.containers)
    def close_captures(self,created):self.hit('capture-close');return {'retained':True}
    def root_diff(self,created):self.hit('root-diff');return {}
    def final_bindings(self):self.hit('bindings');return True
    def preservation(self):self.hit('preservation');return True
    def managed(self):self.hit('managed');return True
    def cache(self):self.hit('cache');return True
    def final(self,name,value):self.hit('write-final:'+name)
    def result(self,value):self.hit('result-write');self.root.joinpath('evidence','result.json').write_text(json.dumps(value))

def run(fault=None,variant=None,authorization=True):
    with tempfile.TemporaryDirectory(prefix='jp-production-simulation-') as td:
        f=Fake(td,fault,variant);io=m.Capabilities(docker=f,clock=f,filesystem=f,signals=f,resources=f,evidence=f,gate=f)
        a=m.Attempt(io,DEFS);f.a=a
        auth={'authorized':authorization,'validForExecution':True,'phase':'3E3A4A','baselineCommit':'a'*40,'bindings':{'monitorSha256':'b'*64},'imageIds':DEFS['imageIds'],'permissions':{**{x:False for x in m.FALSE_PERMISSIONS},'publicComponentCharacterization':True,'autonomousEmptyBlocks':True},'reviewedTimeouts':True,'reviewedDefinitions':True}
        r,exit=a.run(auth)
        assert not any(x.startswith(('remove','restart','relaunch')) for x in f.calls)
        for k in DEFS['containers']:assert f.calls.count('create:'+k)<=1 and f.calls.count('start:'+k)<=1 and f.calls.count('term:'+k)<=1 and f.calls.count('kill:'+k)<=1
        # The fake adapter never deletes resources. Production uses only retained operations.
        assert set(f.containers)>=set(r['retainedContainers']) and set(f.nets)>=set(r['retainedNetworks'])
        for k,sig,at in f.signal_times:
            if sig=='KILL':assert at-a.shutdown.term[k]['at']>=5
        if 'start:node' in f.calls:assert f.calls.index('term:proof')<f.calls.index('start:node')
        return r,exit,list(f.calls)

cases=[]
r,exit,calls=run();assert exit==0 and r['componentCharacterizationPassed'] and r['finalizationComplete'],r
cases.append({'name':'complete production state machine sequence','passed':True})
for point in sorted(set(calls)-{'failure-journal'}):
    r,exit,c=run(fault=point);assert exit!=0,(point,r)
    if point.startswith('gate'):assert 'reserve' not in c
    cases.append({'name':'injected '+point,'passed':True})
for variant in ['gate-race','service-exit','probe-nonzero','oom','replacement','pid-replacement','foreign-network','sample-gap','capture-stale','capture-exit','SIGINT','SIGTERM','ignore-term','watchdog','daemon-dead']:
    r,exit,c=run(variant=variant);assert exit!=0,(variant,r)
    cases.append({'name':variant,'passed':True})
r,exit,c=run(authorization=False);assert exit!=0 and 'reserve' not in c;cases.append({'name':'authorization rejection without reservation','passed':True})
for point in ['discovery','final-status','capture-close','root-diff','write-final:final-network','bindings','preservation','managed','cache']:
    r,exit,c=run(fault=point)
    assert all(x in c for x in ['discovery','final-status','capture-close','root-diff','bindings','preservation','managed','cache','result-write']),point
    assert not r['finalizationComplete'] and r['successPermanentlyBlocked']
    cases.append({'name':'independent finalization after '+point,'passed':True})
r,exit,c=run(fault='failure-journal',variant='service-exit');assert exit!=0 and r['successPermanentlyBlocked'] and not r['finalizationComplete'];cases.append({'name':'failure journal write failure permanently blocks success','passed':True})
r,exit,c=run(variant='service-exit');assert r['componentRuntimeBlocked'] and r['finalizationComplete'];cases.append({'name':'runtime blocker retains complete finalization independently','passed':True})
state_machine_count=len(cases)
def rejected(name,fn):
    try:fn()
    except (m.GateError,FileExistsError):cases.append({'name':name,'passed':True});return
    raise AssertionError(name)
for name,raw in [('invalid UTF8',b'\xff\n'),('line limit',b'x'*4097),('byte exhaustion',b'x'*49152)]:
    rejected('capture '+name,lambda raw=raw:m.DiagnosticStream('proof').feed('stdout',raw))
c=m.DiagnosticStream('proof');c.feed('stdout',b'Listening')
rejected('capture partial final line',lambda:c.close('stdout',True))
rejected('capture pipe closes before container exit',lambda:m.DiagnosticStream('proof').close('stdout',False))
for mode in [stat.S_IFLNK,stat.S_IFDIR,stat.S_IFCHR,stat.S_IFBLK,stat.S_IFIFO,stat.S_IFSOCK]:
    rejected('nonregular file mode '+str(mode),lambda mode=mode:m.validate_file_mode(mode))
with tempfile.TemporaryDirectory(prefix='jp-preservation-simulation-') as td:
    root=Path(td);p=root/'regular';p.write_bytes(b'public bytes');assert m.identity(p)['type']=='regular'
    q=root/'symlink';q.symlink_to(p)
    rejected('symlink to identical bytes',lambda:m.identity(q))
    folder=root/'real';folder.mkdir();(folder/'child').write_bytes(b'public bytes')
    parent=root/'parentlink';parent.symlink_to(folder,target_is_directory=True)
    rejected('symlink parent rejected',lambda:m.identity(parent/'child'))
    f=Fake(root/'reservation');f.root.mkdir();(f.root/'evidence').mkdir();f.checks=2
    rejected('exclusive reservation collision',lambda:f.reserve(True));assert not f.reserved()
print(json.dumps({'productionModuleImportedInertly':True,'bytecodeDisabled':sys.dont_write_bytecode,'realAdaptersConstructed':False,'realMonitorMainExecuted':False,'dockerCommands':0,'httpRequests':0,'cases':cases,'stateMachineCases':state_machine_count,'supplementaryCases':len(cases)-state_machine_count,'count':len(cases),'passed':True},indent=2))
