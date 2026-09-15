# Non-secret evidence inventory. No compilation, tests, key generation or network access.
from pathlib import Path
import subprocess,json,hashlib,re,ast
base=Path('docs/development/evidence/phase-3d')
baseline=json.loads((base/'baseline.json').read_text());old={x['path']:x for x in baseline['files']}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
paths=set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z']).decode().strip('\0').split('\0'))
for root in ['contracts/managed','test/fixtures/managed']:
 paths.update(str(p) for p in Path(root).rglob('*') if p.is_file())
paths.add(str(base/'integrity.json'))
changed=[dict(path=f,beforeSha256=x['sha256'],afterSha256=sha(f) if Path(f).is_file() else None) for f,x in old.items() if not Path(f).is_file() or sha(f)!=x['sha256']]
created=sorted(paths-old.keys())
allowed={'contracts/just-proof.compact','docs/development/phase-3c-revoke-credential-report.md','docs/protocol/v2/07-witnesses-and-disclosures.md','docs/protocol/v2/08-proofs.md','docs/protocol/v2/10-specification.md','docs/protocol/v2/requirements.md','test/contract/v2-constructor.test.ts','test/contract/v3a-register-issuer.test.ts','test/contract/v3b-public-surface.test.ts','test/contract/v3c-public-surface.test.ts','test/contract/v3c-revoke-credential.test.ts','test/support/v3a-register-issuer.ts','test/support/v3b-register-credential.ts','test/support/v3c-revoke-credential.ts'}
managed={'contracts/managed/just-proof/'+x for x in ['compiler/contract-info.json','contract/index.js','contract/index.d.ts','contract/index.js.map','zkir/proveQualificationV2.zkir']}
new={'docs/development/phase-3d-prove-qualification-report.md','test/contract/v3d-prove-qualification.test.ts','test/contract/v3d-public-surface.test.ts','test/support/v3d-prove-qualification.ts'}
unexpected=[x['path'] for x in changed if x['path'] not in allowed|managed]+[f for f in created if f not in new|managed and not f.startswith(str(base)+'/')]
frozen=[dict(path=f,sha256=sha(f),unchanged=sha(f)==x['sha256'])for f,x in old.items()if f in ['PROPOSAL.md','docs/USAGE.md']or f.startswith('docs/protocol/')and not f.startswith('docs/protocol/v2/')]
historical=[f for f in old if f.startswith('docs/development/')and f!='docs/development/phase-3c-revoke-credential-report.md']
assert all(sha(f)==old[f]['sha256'] for f in historical),'historical evidence changed'
previous=subprocess.check_output(['git','show',baseline['head']+':contracts/just-proof.compact'],text=True);current=Path('contracts/just-proof.compact').read_text()
assert current[current.index('constructor('):current.index('export circuit proveQualificationV2')].strip()==previous[previous.index('constructor('):].strip()
previous_report=subprocess.check_output(['git','show',baseline['head']+':docs/development/phase-3c-revoke-credential-report.md']);assert Path('docs/development/phase-3c-revoke-credential-report.md').read_bytes().startswith(previous_report)
for name in ['registerIssuerV2','registerCredentialV2','revokeCredentialV2']:
 f='contracts/managed/just-proof/zkir/'+name+'.zkir';assert sha(f)==old[f]['sha256']
report=Path('docs/development/phase-3d-prove-qualification-report.md');links=sorted(set(re.findall(r'\]\((evidence/phase-3d/[^)#]+)(?:#[^)]*)?\)',report.read_text())))
linked=[]
for link in links:
 p=report.parent/link
 if p==base/'integrity.json':continue
 assert p.is_file(),str(p)
 assert subprocess.run(['git','check-ignore','--no-index','-q',str(p)]).returncode==1,'ignored linked evidence: '+str(p)
 validation='UTF-8 text';p.read_text()
 if p.suffix=='.json':json.loads(p.read_text());validation='JSON parsed'
 if p.suffix=='.py':ast.parse(p.read_text());validation='Python syntax parsed, not executed'
 linked.append(dict(path=str(p),bytes=p.stat().st_size,sha256=sha(p),validation=validation,notIgnored=True))
assert not unexpected,unexpected
assert all(x['unchanged']for x in frozen)
result=dict(baselineHead=baseline['head'],currentHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),sourceSha256=sha('contracts/just-proof.compact'),changedBaselineFiles=changed,createdFiles=created,phaseOnlyFiles=sorted([x['path']for x in changed]+created),unexpectedFiles=unexpected,frozenV1=frozen,historicalEvidenceUnchanged=True,priorReportBodyPreserved=True,constructorAndEarlierLifecycleBodiesUnchanged=True,earlierZkirUnchanged=True,reportLinkedEvidence=linked,gitStatusShort=subprocess.check_output(['git','status','--short'],text=True),notes='Integrity file is validated after serialization; its own hash is excluded to avoid recursion. New phase paths include every nonignored evidence file.')
(base/'integrity.json').write_text(json.dumps(result,indent=2)+'\n');json.loads((base/'integrity.json').read_text());assert subprocess.run(['git','check-ignore','--no-index','-q',str(base/'integrity.json')]).returncode==1
print('Integrity passed;',len(result['phaseOnlyFiles']),'phase files;',len(linked)+1,'linked evidence files; no unexpected changes')
