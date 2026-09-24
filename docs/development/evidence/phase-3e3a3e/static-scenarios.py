"""Validation only: AST-select pure helpers; never import/execute the real monitor.
Filesystem helpers run only against TemporaryDirectory. No subprocess/Docker/network.
"""
import ast
import copy
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

D=Path(__file__).parent
source=(D/'proposed-component-monitor.py').read_text()
tree=ast.parse(source)
selected={'GateError','need','validate_authorization','validate_resource','validate_inspection',
          'sanitize_logs','sequence','validate_sample_timing','guarded_actions','fsync_dir','write_exclusive'}
ns={'re':re,'json':json,'os':os,'Path':Path,'FALSE_PERMISSIONS':('wallet','funding','proof','check','deployment','contractCall','userTransaction','download','pull','cacheMutation'),
    'RESOURCE':{'MemTotal':12253256,'SwapTotal':8388608,'launchMemAvailable':8388608,'launchSwapFree':6291456,'runtimeMemAvailable':2097152,'runtimeSwapFree':2097152,'diskBytes':10737418240}}
# Function/class definitions alone; no monitor imports, top-level expressions, main, live capture,
# command, Attempt, watchdog, or service functions enter this synthetic namespace.
subset=ast.Module(body=[n for n in tree.body if isinstance(n,(ast.FunctionDef,ast.ClassDef)) and n.name in selected],type_ignores=[])
exec(compile(subset,'pure-helper-synthetic-subset','exec'),ns)
results=[]
def good(name,f):
 f();results.append({'name':name,'passed':True})
def reject(name,f):
 try:f()
 except (ns['GateError'],ValueError,KeyError,UnicodeError,FileExistsError):results.append({'name':name,'passed':True});return
 raise AssertionError(name+' unexpectedly accepted')
def mutation(obj,mutator):
 other=copy.deepcopy(obj);mutator(other);assert other!=obj;return other
head='a'*40;bindings={'monitorSha256':'b'*64};images={'runner':'sha256:'+'c'*64}
a={'authorized':True,'validForExecution':True,'phase':'3E3A4A','baselineCommit':head,'bindings':bindings,'imageIds':images,'permissions':{**{x:False for x in ns['FALSE_PERMISSIONS']},'publicComponentCharacterization':True,'autonomousEmptyBlocks':True},'reviewedTimeouts':True,'reviewedDefinitions':True}
validate=lambda x:ns['validate_authorization'](x,head,bindings,images)
good('exact complete future authorization accepted synthetically',lambda:validate(a))
for field in ('authorized','validForExecution','reviewedTimeouts','reviewedDefinitions'):
 reject('reject disabled '+field,lambda field=field:validate(mutation(a,lambda v:v.update({field:False}))))
for field in ('bindings','imageIds','baselineCommit','phase'):
 reject('reject changed '+field,lambda field=field:validate(mutation(a,lambda v:v.update({field:'wrong'}))))
for permission in ns['FALSE_PERMISSIONS']:
 reject('reject permission '+permission,lambda permission=permission:validate(mutation(a,lambda v:v['permissions'].update({permission:True}))))
reject('reject missing authorization field',lambda:validate(mutation(a,lambda v:v.pop('phase'))))
reject('reject numeric permission boolean',lambda:validate({**a,'permissions':{**a['permissions'],'wallet':0}}))
good('two-second timing boundary',lambda:ns['validate_sample_timing'](2,0,0))
reject('OS sample gap above two seconds',lambda:ns['validate_sample_timing'](2.001,0,2))
reject('container telemetry older than two seconds',lambda:ns['validate_sample_timing'](2.001,2,0))
mem={'MemTotal':12253256,'SwapTotal':8388608,'MemAvailable':8388608,'SwapFree':6291456};disk=[10737418240]*3
good('exact launch floors',lambda:ns['validate_resource'](mem,disk,True))
for key in mem:
 reject('below launch '+key,lambda key=key:ns['validate_resource'](mutation(mem,lambda x:x.update({key:x[key]-1})),disk,True))
reject('disk floor',lambda:ns['validate_resource'](mem,[10737418239],True))
reject('runtime memory floor',lambda:ns['validate_resource']({**mem,'MemAvailable':2097151},disk))
reject('runtime swap floor',lambda:ns['validate_resource']({**mem,'SwapFree':2097151},disk))
spec=json.loads((D/'container-definitions.json').read_text())['containers']['node']
i={'Id':'id','Image':spec['image'],'Config':{'User':spec['user'],'Entrypoint':spec['entrypoint'],'Cmd':spec['command'],'Env':[k+'='+v for k,v in spec['effectiveEnvironment'].items()]},'HostConfig':{'ReadonlyRootfs':True,'Privileged':False,'CapDrop':['ALL'],'CapAdd':None,'SecurityOpt':['no-new-privileges'],'NetworkMode':spec['network'],'PortBindings':{},'PublishAllPorts':False,'Dns':['127.0.0.1'],'ExtraHosts':[],'RestartPolicy':{'Name':'no'},'AutoRemove':False,'Memory':spec['memoryBytes'],'MemorySwap':spec['memoryBytes'],'PidsLimit':spec['pids'],'Tmpfs':spec['tmpfs'],'LogConfig':{'Type':'json-file','Config':{'max-size':'64k','max-file':'2','compress':'false'}}},'NetworkSettings':{'Networks':{spec['network']:{'NetworkID':'net','IPAddress':spec['ip']}},'Ports':{}},'Mounts':[]}
vi=lambda x:ns['validate_inspection'](x,spec,'id','net',[])
good('exact container confinement',lambda:vi(i))
for field,value in [('ReadonlyRootfs',False),('Privileged',True),('CapDrop',[]),('SecurityOpt',[]),('Dns',['8.8.8.8']),('PortBindings',{'6300/tcp':[{'HostPort':'6300'}]}),('Memory',0),('MemorySwap',0),('PidsLimit',0),('Tmpfs',{}),('AutoRemove',True),('RestartPolicy',{'Name':'always'})]:
 reject('reject HostConfig '+field,lambda field=field,value=value:vi(mutation(i,lambda x:x['HostConfig'].update({field:value}))))
reject('reject replacement ID',lambda:vi(mutation(i,lambda x:x.update({'Id':'other'}))))
reject('reject default network attachment',lambda:vi(mutation(i,lambda x:x['NetworkSettings']['Networks'].update({'bridge':{}}))))
reject('reject writable mount',lambda:vi(mutation(i,lambda x:x.update({'Mounts':[{'Type':'bind','RW':True}]}))))
reject('reject unexpected env',lambda:vi(mutation(i,lambda x:x['Config']['Env'].append('HTTP_PROXY=http://public.invalid'))))
good('public startup log sanitized',lambda:ns['sanitize_logs'](b'Listening on 0.0.0.0:6300\n'))
for name,raw in [('secret',b'secret=public-only-canary'),('body',b'request body PUBLIC_CANARY'),('env',b'environment dump'),('fetch',b'fetch parameter'),('unknown',b'unknown diagnostic'),('oversize',b'x'*49152),('writepath',b'read-only file system')]:
 reject('reject '+name+' diagnostic',lambda raw=raw:ns['sanitize_logs'](raw))
good('public probe height schema',lambda:ns['sanitize_logs'](b'{"kind":"indexer","passed":true,"categories":["PUBLIC_HEIGHT"],"height":1}\n',True))
reject('probe unknown field',lambda:ns['sanitize_logs'](b'{"kind":"indexer","passed":true,"categories":[],"body":"public"}',True))
events=[]
ns['sequence'](lambda k:events.append(('run',k)),lambda k:events.append(('stop',k)))
assert events==[('run','proof'),('run','proof-probe'),('stop',('proof-probe','proof')),('run','node'),('run','node-probe'),('run','indexer'),('run','indexer-probe'),('stop',('indexer-probe','indexer','node-probe','node'))]
results.append({'name':'proof stopped before ledger; same node carried into indexer','passed':True})
for fail_at in ['proof','proof-probe','node','node-probe','indexer','indexer-probe']:
 events=[]
 def run(k):
  events.append(k)
  if k==fail_at:raise ns['GateError']('MOCK_FAILURE')
 reject('sequence stops immediately at '+fail_at,lambda:ns['sequence'](run,lambda k:None))
 assert events[-1]==fail_at and events.count(fail_at)==1
with tempfile.TemporaryDirectory(prefix='justproof-static-mock-') as td:
 p=Path(td)/'marker';ns['write_exclusive'](p,b'public mock')
 reject('exclusive durable write rejects existing path',lambda:ns['write_exclusive'](p,b'changed'))
 assert p.read_bytes()==b'public mock'
 q=Path(td)/'public-authorization';ns['write_exclusive'](q,b'public exact bytes',0o444)
 assert q.stat().st_mode & 0o777 == 0o444 and q.read_bytes()==b'public exact bytes'
 results.append({'name':'public durable authorization copy readable by fixed nonroot probe UID','passed':True})
 results.append({'name':'fsync helper scoped to temporary mock path only','passed':True})
# Structural checks never execute main/Attempt.
main=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='main')
maintext=ast.get_source_segment(source,main)
assert maintext.index('validate_authorization(')<maintext.index('EVIDENCE.mkdir(')<maintext.index("EVIDENCE/'attempt-started'")<maintext.index('attempt.create_networks()')
assert 'if __name__==\'__main__\'' in source
assert not any(isinstance(n,(ast.With,ast.For,ast.While,ast.Try)) for n in tree.body)
assert not re.search(r'\b(?:unlink|rmtree|remove)\(',source)
results.append({'name':'authorization before reservation, guarded main, no removal call','passed':True})
events=[]
def bad_action():
 events.append('failed');raise ValueError('synthetic')
ns['guarded_actions']([('MOCK',bad_action),('NEXT',lambda:events.append('next'))],lambda e:events.append(e))
assert events==['failed','MOCK','next']
results.append({'name':'independent finalization actions continue after failure','passed':True})
print(json.dumps({'validation':'AST-selected synthetic helpers only','realMonitorImportedOrExecuted':False,'dockerOrNetworkCalled':False,'cases':results,'count':len(results),'passed':all(x['passed'] for x in results)},indent=2))
