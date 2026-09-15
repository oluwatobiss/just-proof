# Content hashes only; no secret file contents are emitted. Does not modify tracked sources.
from pathlib import Path
import json,hashlib,subprocess,re,ast
base=Path('docs/development/evidence/phase-3c')
baseline=json.loads((base/'baseline.json').read_text())
old={x['path']:x for x in baseline['files']}
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
paths=set(subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z']).decode().strip('\0').split('\0'))
for root in ['contracts/managed','test/fixtures/managed']:
 paths.update(str(p) for p in Path(root).rglob('*') if p.is_file())
# Report-linked evidence is an explicit durability obligation, even if ignore rules regress.
report=Path('docs/development/phase-3c-revoke-credential-report.md')
links=sorted(set(re.findall(r'\]\((evidence/phase-3c/[^)#]+)(?:#[^)]*)?\)',report.read_text())))
linked_evidence=[]
for link in links:
 path=report.parent/link
 assert path.is_file(), 'missing linked evidence: '+str(path)
 assert subprocess.run(['git','check-ignore','--no-index','-q',str(path)]).returncode==1, 'linked evidence is ignored: '+str(path)
 validation='exists'
 if path.suffix=='.json':
  json.loads(path.read_text());validation='JSON parsed'
 elif path.suffix=='.jsonl':
  entries=path.read_text().splitlines()
  for line in entries:json.loads(line)
  validation='JSONL parsed: '+str(len(entries))+' records'
 elif path.suffix=='.py':
  ast.parse(path.read_text());validation='Python syntax parsed; not executed'
 elif path.suffix=='.mjs':
  subprocess.run(['node','--check',str(path)],check=True,capture_output=True);validation='JavaScript syntax checked; not executed'
 else:
  path.read_text();validation='UTF-8 text decoded'
 linked_evidence.append({'path':str(path),'validation':validation,'notIgnored':True})
 paths.add(str(path))
logs=[]
for name in ['build.log','compile-1.log','tests-all.log','typecheck.log']:
 path=base/name
 assert path.is_file()
 assert subprocess.run(['git','check-ignore','--no-index','-q',str(path)]).returncode==1, 'required log ignored: '+str(path)
 logs.append({'path':str(path),'bytes':path.stat().st_size,'sha256':sha(path)})
 paths.add(str(path))
paths.add(str(base/'integrity.json'))
changed=[{'path':f,'beforeSha256':old[f]['sha256'],'afterSha256':sha(f) if Path(f).is_file() else None} for f in sorted(old) if not Path(f).is_file() or sha(f)!=old[f]['sha256']]
created=sorted(paths-old.keys())
allowed={'.gitignore','contracts/just-proof.compact','docs/development/phase-3b-register-credential-report.md','docs/protocol/v2/04-revocation.md','docs/protocol/v2/07-witnesses-and-disclosures.md','docs/protocol/v2/10-specification.md','docs/protocol/v2/requirements.md','test/contract/v2-constructor.test.ts','test/contract/v3a-register-issuer.test.ts','test/contract/v3b-public-surface.test.ts','test/support/v3a-register-issuer.ts','test/support/v3b-register-credential.ts'}
managed={'contracts/managed/just-proof/'+f for f in ['compiler/contract-info.json','contract/index.js','contract/index.d.ts','contract/index.js.map','zkir/revokeCredentialV2.zkir']}
new_allowed={'docs/development/phase-3c-revoke-credential-report.md','test/support/v3c-revoke-credential.ts','test/contract/v3c-revoke-credential.test.ts','test/contract/v3c-public-surface.test.ts'}
unexpected=[x['path'] for x in changed if x['path'] not in allowed|managed]+[f for f in created if f not in new_allowed|managed and not f.startswith(str(base)+'/')]
frozen=[{'path':f,'sha256':sha(f),'unchanged':sha(f)==old[f]['sha256']} for f in sorted(old) if f in ['PROPOSAL.md','docs/USAGE.md'] or f.startswith('docs/protocol/') and not f.startswith('docs/protocol/v2/')]
previous_report=subprocess.check_output(['git','show',baseline['head']+':docs/development/phase-3b-register-credential-report.md'])
source=Path('contracts/just-proof.compact').read_text();previous_source=subprocess.check_output(['git','show',baseline['head']+':contracts/just-proof.compact'],text=True)
registration_bodies_unchanged=source[source.index('export circuit registerIssuerV2'):source.index('export circuit revokeCredentialV2')].strip()==previous_source[previous_source.index('export circuit registerIssuerV2'):].strip()
result={'baselineHead':baseline['head'],'currentHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceSha256':sha('contracts/just-proof.compact'),'changedBaselineFiles':changed,'createdFiles':created,'phaseOnlyFiles':sorted([x['path'] for x in changed]+created),'unexpectedFiles':unexpected,'frozenV1':frozen,'previousReportBodyPreserved':Path('docs/development/phase-3b-register-credential-report.md').read_bytes().startswith(previous_report),'registrationCircuitBodiesUnchanged':registration_bodies_unchanged,'historicalResourceRecordUnchanged':sha('docs/development/evidence/phase-3b/historical-resource-record.json')==old['docs/development/evidence/phase-3b/historical-resource-record.json']['sha256'],'gitStatusShort':subprocess.check_output(['git','status','--short'],text=True),'reportLinkedEvidence':linked_evidence,'durableLogs':logs,'notes':'New evidence files are inventoried by path to avoid self-referential integrity hashes; original baseline contains full pre-phase content hashes.'}
(base/'integrity.json').write_text(json.dumps(result,indent=2)+'\n')
assert not unexpected,unexpected
assert all(x['unchanged'] for x in frozen)
assert result['previousReportBodyPreserved'] and registration_bodies_unchanged and result['historicalResourceRecordUnchanged']
print('Integrity passed; phase-only files:',len(result['phaseOnlyFiles']))
