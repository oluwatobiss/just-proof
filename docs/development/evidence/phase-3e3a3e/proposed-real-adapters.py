"""Inert real-adapter proposal; NEVER instantiated or executed during static validation.
Docker CLI attach ordering remains an explicit pre-reservation blocker.
"""
import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import selectors
import signal
import stat
import subprocess
import time
from decimal import Decimal

class RealAdapters:
    def __init__(self,domain,definitions,authorization,auth_bytes,bindings):
        self.m=domain;self.d=definitions;self.authorization=authorization;self.auth_bytes=auth_bytes
        self.expected_bindings=bindings;self.ids={};self.network_ids={};self.capture={};self.signal_queue=[]
        self.root=Path.cwd();self.e=domain.EVIDENCE;self.out=domain.OUTPUT;self.token=hashlib.sha256(auth_bytes).hexdigest()
        self.baseline=None;self.owns_evidence=False
    def now(self):return time.monotonic()
    def sleep(self,seconds):time.sleep(seconds)
    def need(self,ok,code):self.m.need(ok,code)
    def cmd(self,args,timeout=.75,limit=262144):
        env={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':str(Path.home()),'DOCKER_HOST':'unix:///var/run/docker.sock'}
        p=subprocess.Popen(args,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,start_new_session=True)
        buffers={p.stdout:bytearray(),p.stderr:bytearray()};s=selectors.DefaultSelector()
        for f in buffers:s.register(f,selectors.EVENT_READ)
        deadline=self.now()+timeout
        try:
            while s.get_map():
                self.need(self.now()<deadline,'DOCKER_COMMAND_TIMEOUT')
                for key,_ in s.select(.02):
                    b=os.read(key.fileobj.fileno(),65536)
                    if b:buffers[key.fileobj].extend(b);self.need(sum(map(len,buffers.values()))<=limit,'COMMAND_OUTPUT_LIMIT')
                    else:s.unregister(key.fileobj)
            self.need(p.wait(timeout=max(.01,deadline-self.now()))==0,'COMMAND_FAILED')
            return bytes(buffers[p.stdout])
        finally:
            if p.poll() is None:os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=1)
            s.close();p.stdout.close();p.stderr.close()
    def dj(self,*args):return json.loads(self.cmd(['docker',*args]))
    def names(self,kind):return set(self.cmd(['docker',*(('ps','-a') if kind=='container' else ('network','ls')),'--format','{{.Names}}' if kind=='container' else '{{.Name}}']).decode().splitlines())
    def tree(self,root):
        root=self.m.canonical_parents(root);self.need(stat.S_ISDIR(root.lstat().st_mode),'ROOT_TYPE');result={}
        for p in sorted(root.rglob('*')):
            mode=p.lstat().st_mode
            if stat.S_ISDIR(mode):self.m.canonical_parents(p);continue
            result[str(p.relative_to(root))]=self.m.identity(p)
        return result
    def final_bindings(self):
        files=binding_paths(self.m)
        actual={k:self.m.identity(p)['sha256'] for k,p in files.items()}
        self.need(actual==self.expected_bindings,'BINDINGS_CHANGED');return actual
    def preservation(self):
        b=self.baseline or json.loads((self.m.BASE/'preservation-baseline.json').read_text())
        for p,v in b.items():self.need(self.m.identity(p)==v,'PRESERVATION_CHANGED')
        return {'entries':len(b),'matched':True}
    def managed(self):
        expected=json.loads(Path('docs/development/evidence/phase-3e3a3d/managed-artifact-manifest.json').read_text())
        expected={k:{'type':'regular',**v} for k,v in expected.items()}
        actual=self.tree('contracts/managed/just-proof');self.need(actual==expected and len(actual)==20,'MANAGED_CHANGED');return actual
    def cache(self):
        expected=json.loads(Path('docs/development/evidence/phase-3e3a3d/parameter-allowlist.json').read_text())['candidateOnly']
        expected={x['filename']:{'type':'regular','bytes':x['bytes'],'sha256':x['sha256']} for x in expected}
        actual=self.tree('/home/oluwatobiss/.cache/midnight/zk-params');self.need(actual==expected and len(actual)==7,'CACHE_CHANGED');return actual
    def read(self):
        mem={}
        for line in Path('/proc/meminfo').read_text().splitlines():
            key,value=line.split(':',1)
            if key in ('MemTotal','MemAvailable','SwapTotal','SwapFree'):mem[key]=int(value.split()[0])
        disk=[os.statvfs(p).f_bavail*os.statvfs(p).f_frsize for p in (self.root,Path('/tmp'),Path('/home/oluwatobiss/.cache/midnight/zk-params'))]
        # WSL process's controls only. Never infer Docker-VM /proc visibility.
        raw=Path('/proc/self/cgroup').read_text().splitlines();entries=[]
        for line in raw:
            parts=line.split(':',2);self.need(len(parts)==3 and parts[0].isdigit() and parts[2].startswith('/') and '..' not in Path(parts[2]).parts,'CGROUP_PARSE')
            entries.append({'hierarchy':int(parts[0]),'controllers':sorted(filter(None,parts[1].split(','))),'path':parts[2]})
        cg={'membership':raw,'parsed':entries,'interfaces':{}}
        roots=[(Path('/sys/fs/cgroup/memory'),('memory.limit_in_bytes','memory.memsw.limit_in_bytes','memory.usage_in_bytes','memory.memsw.usage_in_bytes','memory.use_hierarchy'),'memory'),
               (Path('/sys/fs/cgroup/cpu'),('cpu.cfs_quota_us','cpu.cfs_period_us','cpu.shares'),'cpu'),
               (Path('/sys/fs/cgroup'),('cgroup.controllers','cgroup.subtree_control','memory.max','memory.current','memory.swap.max','memory.swap.current','cpu.max','cpuset.cpus.effective'),None),
               (Path('/sys/fs/cgroup/unified'),('cgroup.controllers','cgroup.subtree_control','memory.max','memory.current','memory.swap.max','memory.swap.current','cpu.max','cpuset.cpus.effective'),None)]
        for root,names,controller in roots:
            groups={root}
            for entry in entries:
                if controller in entry['controllers'] or (controller is None and not entry['controllers']):groups.add(root/entry['path'].lstrip('/'))
            for group in sorted(groups):
                for name in names:
                    p=group/name;cg['interfaces'][str(p)]=p.read_text().strip() if p.exists() else None
        return {'memKiB':mem,'diskBytes':disk,'cpuCount':os.cpu_count(),'affinity':sorted(os.sched_getaffinity(0)),
                'wslCgroup':cg,'containerCgroupFilesystem':'UNOBSERVABLE_FROM_UBUNTU_NOT_CLAIMED'}
    def check(self,authorization,final=False):
        self.need('microsoft' in Path('/proc/sys/kernel/osrelease').read_text().lower(),'WSL_ONLY')
        root=Path(self.cmd(['git','rev-parse','--show-toplevel']).decode().strip())
        self.need(root.resolve()==self.root.resolve() and self.root==self.root.resolve(),'ROOT')
        head=self.cmd(['git','rev-parse','HEAD']).decode().strip()
        self.need(not self.cmd(['git','status','--porcelain=v1']).strip(),'DIRTY_TREE')
        ai=self.m.identity(self.m.AUTH);st=self.m.AUTH.lstat()
        self.need(st.st_uid==os.getuid() and stat.S_IMODE(st.st_mode)==0o600,'AUTH_PERMISSIONS')
        self.need(ai['sha256']==hashlib.sha256(self.auth_bytes).hexdigest() and self.m.AUTH.read_bytes()==self.auth_bytes,'AUTH_CHANGED')
        self.m.validate_authorization(authorization,head,self.final_bindings(),self.d['imageIds'])
        for p in binding_paths(self.m).values():
            st=p.lstat();self.need(not st.st_mode & 0o022,'BOUND_PERMISSION')
        self.need(not any('proxy' in k.lower() or k in ('DOCKER_HOST','DOCKER_CONTEXT') for k in os.environ),'ENV_OVERRIDE')
        for p in (self.e,self.e/'attempt-started',self.out):
            self.m.canonical_parents(p.parent if not p.parent.exists() else p)
            self.need(not os.path.lexists(p),'ATTEMPT_PRESENT')
        self.need(not self.names('container').intersection(v['name'] for v in self.d['containers'].values()),'CONTAINER_PRESENT')
        nn=self.names('network');self.need(not nn.intersection(self.d['networks']),'NETWORK_PRESENT')
        proposed=[ipaddress.ip_network(v['subnet']) for v in self.d['networks'].values()]
        existing=[]
        if nn:
            for n in self.dj('network','inspect',*sorted(nn)):
                for x in n.get('IPAM',{}).get('Config') or []:
                    if x.get('Subnet'):existing.append(ipaddress.ip_network(x['Subnet']))
        routes=json.loads(self.cmd(['ip','-j','route','show','table','all']))
        for x in routes:
            if x.get('dst') not in (None,'default'):existing.append(ipaddress.ip_network(x['dst'],strict=False))
        self.need(not any(a.version==b.version and a.overlaps(b) for a in proposed for b in existing),'SUBNET_OVERLAP')
        for image in self.d['imageIds'].values():
            i=self.dj('image','inspect',image)[0]
            self.need(i['Id']==image and i['Os']=='linux' and i['Architecture']=='amd64' and not i['Config'].get('Volumes'),'IMAGE_CHANGED')
        self.baseline=json.loads((self.m.BASE/'preservation-baseline.json').read_text());self.preservation();self.managed();self.cache()
        row=self.read();self.m.validate_resource(row['memKiB'],row['diskBytes'],True)
        plan=json.loads((self.m.BASE/'proposed-plan.json').read_text())
        # Not a flag bypass: blocked even if someone supplies enabled authorization.
        self.need(plan.get('captureOrderingEstablished') is True,'ATTACH_ORDERING_UNVERIFIED')
    def fsync_parent(self,p):
        fd=os.open(p,os.O_RDONLY|os.O_DIRECTORY)
        try:os.fsync(fd)
        finally:os.close(fd)
    def put(self,path,value,raw=False,mode=0o600):
        data=value if raw else (json.dumps(value,sort_keys=True)+'\n').encode()
        fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,mode)
        os.fchmod(fd,mode)
        with os.fdopen(fd,'wb') as f:f.write(data);f.flush();os.fsync(f.fileno())
        self.fsync_parent(path.parent)
    def reserve(self,authorization):
        self.e.mkdir(mode=0o700,exist_ok=False);self.owns_evidence=True;self.fsync_parent(self.e.parent)
        self.put(self.e/'attempt-started',{'phase':'3E3A4A','authorizationSha256':self.token,'bindings':self.expected_bindings,'baselineCommit':authorization['baselineCommit']})
        self.put(self.e/'authorization.json',self.auth_bytes,raw=True,mode=0o444)
        self.out.mkdir(mode=0o700,exist_ok=False);self.fsync_parent(self.out.parent)
        signal.signal(signal.SIGINT,lambda *_:self.signal_queue.append('SIGINT'))
        signal.signal(signal.SIGTERM,lambda *_:self.signal_queue.append('SIGTERM'))
    def reserved(self):return self.owns_evidence
    def pending(self):q=self.signal_queue[:];self.signal_queue.clear();return q
    def create_network(self,n,d):
        nid=self.cmd(['docker','network','create','--internal','--driver','bridge','--subnet',d['subnet'],'--label','justproof.authorization='+self.token,n]).decode().strip()
        self.network_ids[n]=nid;return nid
    def mounts(self,k):return [(str((self.m.BASE/'proposed-public-probes.mjs').resolve()),'/proposal/public-probes.mjs'),(str((self.e/'authorization.json').resolve()),'/authorization/authorization.json')] if k.endswith('-probe') else []
    def create(self,k,s):
        args=['docker','container','create','--pull','never','--name',s['name'],'--label','justproof.authorization='+self.token,'--network',s['network'],'--ip',s['ip'],'--dns','127.0.0.1','--read-only','--user',s['user'],'--cap-drop','ALL','--security-opt','no-new-privileges','--restart','no','--memory',str(s['memoryBytes']),'--memory-swap',str(s['memoryBytes']),'--pids-limit',str(s['pids']),'--log-driver','none']
        for p,v in s['tmpfs'].items():args+=['--tmpfs',p+':'+v]
        for n,v in s['environment'].items():args+=['--env',n+'='+v]
        for src,dst in self.mounts(k):args+=['--mount','type=bind,src='+src+',dst='+dst+',readonly']
        args+=['--entrypoint',s['entrypoint'][0],s['image'],*s['entrypoint'][1:],*s['command']]
        cid=self.cmd(args).decode().strip();self.ids[k]=cid;return cid
    def inspect_created(self,k,cid):
        i=self.dj('inspect',cid)[0];self.m.validate_inspection(i,self.d['containers'][k],cid,self.network_ids[self.d['containers'][k]['network']],self.mounts(k));return i
    def start_attached(self,k,cid):
        # Candidate transport: single CLI start+attach, no snapshot or logging driver.
        p=subprocess.Popen(['docker','start','--attach',cid],stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,start_new_session=True,
                           env={'PATH':'/usr/local/bin:/usr/bin:/bin','HOME':str(Path.home()),'DOCKER_HOST':'unix:///var/run/docker.sock'})
        sel=selectors.DefaultSelector()
        for name,f in [('stdout',p.stdout),('stderr',p.stderr)]:os.set_blocking(f.fileno(),False);sel.register(f,selectors.EVENT_READ,name)
        self.capture[k]=(p,sel,set())
    def inspect_all(self,ids):
        rows={}
        for k,cid in ids.items():
            i=self.inspect_created(k,cid);s=i['State']
            rows[k]={'id':i['Id'],'running':s['Running'],'rootPid':s['Pid'],'exit':s['ExitCode'],'oom':s['OOMKilled'],'cgroupConfig':{x:i['HostConfig'].get(x) for x in ('CgroupParent','CgroupnsMode','CpuQuota','CpuPeriod','CpuShares','CpusetCpus','Memory','MemorySwap','PidsLimit')}}
        return rows
    def networks(self,nets,ids):
        result={}
        for name,nid in nets.items():
            n=self.dj('network','inspect',nid)[0]
            self.need(n['Id']==nid and n['Name']==name and n['Driver']=='bridge' and n['Internal'] is True and not n.get('EnableIPv6'),'NETWORK_CHANGED')
            self.need(n['IPAM']['Config'][0]['Subnet']==self.d['networks'][name]['subnet'],'NETWORK_CHANGED')
            self.need(set(n.get('Containers') or {})<=set(ids.values()),'FOREIGN_NETWORK_MEMBER');result[name]={'id':nid,'internal':True}
        return result
    def processes(self,ids,status):
        out={}
        for k,cid in ids.items():
            if not status[k]['running']:continue
            j=self.dj('top',cid,'-eo','pid,ppid,rss,pcpu')
            self.need([x.lower().replace('%','') for x in j['Titles']]==['pid','ppid','rss','cpu'],'TOP_SCHEMA')
            out[k]=[{'pid':int(r[0]),'ppid':int(r[1]),'rssBytes':int(r[2])*1024,'cpuPercent':float(Decimal(r[3]))} for r in j['Processes']]
        return out
    def quantity(self,s):
        match=re.fullmatch(r'([0-9]+(?:\.[0-9]+)?)\s*(B|kB|MB|GB|TB|KiB|MiB|GiB|TiB)',s.strip());self.need(match is not None,'STATS_UNIT')
        unit={'B':1,'kB':1000,'MB':1000**2,'GB':1000**3,'TB':1000**4,'KiB':1024,'MiB':1024**2,'GiB':1024**3,'TiB':1024**4}[match[2]]
        return int(Decimal(match[1])*unit)
    def statistics(self,ids,status):
        running={k:cid for k,cid in ids.items() if status[k]['running']}
        if not running:return {}
        rows=[json.loads(x) for x in self.cmd(['docker','stats','--no-stream','--format','{{json .}}',*running.values()],timeout=1.5).decode().splitlines()]
        result={}
        for j in rows:
            matches=[k for k,cid in running.items() if cid.startswith(j['ID'])]
            self.need(len(matches)==1,'STATS_ID');k=matches[0];self.need(k not in result,'STATS_DUPLICATE')
            mem=[self.quantity(x) for x in j['MemUsage'].split('/')];net=[self.quantity(x) for x in j['NetIO'].split('/')];block=[self.quantity(x) for x in j['BlockIO'].split('/')]
            result[k]={'memoryBytes':mem[0],'memoryLimitBytes':mem[1],'cpuPercent':float(Decimal(j['CPUPerc'].rstrip('%'))),'pids':int(j['PIDs']),
                       'networkRxBytes':net[0],'networkTxBytes':net[1],'blockReadBytes':block[0],'blockWriteBytes':block[1],
                       'precision':'Docker CLI rounded display converted to normalized values; not exact byte counters',
                       'cgroupMembership':None,'cgroupLimitsObservedViaInspect':{'memoryBytes':self.d['containers'][k]['memoryBytes'],'memorySwapBytes':self.d['containers'][k]['memoryBytes'],'pids':self.d['containers'][k]['pids']},
                       'containerCgroupFiles':'UNOBSERVABLE_WITHOUT_SEPARATE_DOCKER_VM_ACCESS'}
        return result
    def capture_poll(self,k):
        p,sel,closed=self.capture[k];chunks=[]
        for key,_ in sel.select(0):
            b=os.read(key.fileobj.fileno(),4096)
            if b:chunks.append((key.data,b))
            else:closed.add(key.data);sel.unregister(key.fileobj)
        return {'checkedAt':self.now(),'chunks':chunks,'closed':sorted(closed),'processExited':p.poll() is not None,'exitCode':p.poll()}
    def signal(self,k,sig):self.cmd(['docker','kill','--signal',sig,self.ids[k]])
    def discover_owned(self,created):
        names=self.names('container');result={}
        for k,s in self.d['containers'].items():
            if s['name'] in names:
                i=self.dj('inspect',s['name'])[0]
                self.need(i['Config'].get('Labels',{}).get('justproof.authorization')==self.token,'OWNERSHIP_AMBIGUITY');result[k]=i['Id']
        self.need(result==created,'CREATE_OUTCOME_AMBIGUITY');return result
    def final_status(self,created):
        rows=self.inspect_all(created);self.need(all(not s['running'] for s in rows.values()),'STILL_RUNNING');return rows
    def close_captures(self,created):
        failures=[]
        for k,(p,sel,closed) in self.capture.items():
            if p.poll() is None:
                failures.append(k);os.killpg(p.pid,signal.SIGKILL);p.wait(timeout=1)
            sel.close();p.stdout.close();p.stderr.close()
        self.need(not failures,'CAPTURE_NOT_REAPED');return {'allCaptureProcessesReaped':True}
    def root_diff(self,created):
        for cid in created.values():self.need(not self.cmd(['docker','diff',cid]).strip(),'ROOT_DIFF')
        return {'imageLayerChanges':[],'tmpfsContentsNotInspected':True}
    def append_failure(self,j):
        fd=os.open(self.e/'failure-journal.jsonl',os.O_WRONLY|os.O_CREAT|os.O_APPEND|os.O_NOFOLLOW,0o600)
        with os.fdopen(fd,'ab') as f:f.write((json.dumps(j)+'\n').encode());f.flush();os.fsync(f.fileno())
    def append(self,name,row):
        fd=os.open(self.e/name,os.O_WRONLY|os.O_CREAT|os.O_APPEND|os.O_NOFOLLOW,0o600)
        with os.fdopen(fd,'ab') as f:f.write((json.dumps(row)+'\n').encode());f.flush();os.fsync(f.fileno())
    def event(self,k,events):self.append('sanitized-diagnostics.jsonl',{'component':k,'events':events})
    def sample(self,row):self.append('observations.jsonl',row)
    def final(self,name,value):self.put(self.e/(name+'.json'),value)
    def result(self,value):self.put(self.e/'result.json',value)

def binding_paths(m):
    return {'planSha256':m.BASE/'proposed-plan.json','monitorSha256':m.BASE/'proposed-component-monitor.py',
            'realAdaptersSha256':m.BASE/'proposed-real-adapters.py','definitionsSha256':m.BASE/'container-definitions.json',
            'probeSha256':m.BASE/'proposed-public-probes.mjs','preservationSha256':m.BASE/'preservation-baseline.json',
            'sourceSha256':Path('contracts/just-proof.compact'),'managedManifestSha256':Path('docs/development/evidence/phase-3e3a3d/managed-artifact-manifest.json'),
            'parameterCandidatesSha256':Path('docs/development/evidence/phase-3e3a3d/parameter-allowlist.json')}
