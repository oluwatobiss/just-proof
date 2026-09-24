import sys
sys.dont_write_bytecode=True
import importlib.util
import json
import os
from pathlib import Path
import threading

D=Path(__file__).parent
paths=[Path('docs/development/evidence/phase-3e3a4a'),Path('/tmp/justproof-phase3e3a4a-public-components-attempt1'),Path('/tmp/justproof-phase3e3a4a-authorization.json')]
assert all(not os.path.lexists(p) for p in paths)
def fdset():
 out={}
 for p in Path('/proc/self/fd').iterdir():
  try:out[p.name]=os.readlink(p)
  except FileNotFoundError:pass
 return out
before=fdset();children=Path('/proc/self/task/'+str(os.getpid())+'/children').read_text();threads=[t.ident for t in threading.enumerate()];files=sorted(str(p) for p in D.rglob('*'))
sys.argv=['not_the_module.py','--separately-authorized-phase3e3a4a-public-components','--authorization-file','/tmp/justproof-phase3e3a4a-authorization.json']
for filename in ['proposed-component-monitor.py','proposed-real-adapters.py']:
 spec=importlib.util.spec_from_file_location('inert_'+filename.replace('-','_'),D/filename);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
assert fdset()==before
assert Path('/proc/self/task/'+str(os.getpid())+'/children').read_text()==children
assert [t.ident for t in threading.enumerate()]==threads
assert files==sorted(str(p) for p in D.rglob('*'))
assert all(not os.path.lexists(p) for p in paths)
print(json.dumps({'monitorAndAdapterModulesImportedInertly':True,'mainExecuted':False,'realAdaptersConstructed':False,'flagPresent':True,'bytecodeDisabled':True,'fileDescriptorsUnchanged':True,'childrenUnchanged':True,'threadsUnchanged':True,'filesUnchanged':True,'attemptPathsAbsent':True}))
