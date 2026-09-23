"""Inert refusal-stage proposal, NOT a completed service monitor.
No reservation/launch is implemented while mandatory static gates are unresolved.
Never import/execute for this phase; AST inspection only.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys

REQUIRED = ('planSha256','monitorSha256','composeSha256','guardSha256',
            'idleRuntimeSha256','healthProbeSha256','parameterAllowlistSha256',
            'sourceSha256','managedArtifactManifestSha256','imageConfigurationSha256')
IMAGES = (
 'sha256:801bbc0340e9e96f16735f77b523f23c7459e3359842f7c79c2c53f4e994d531',
 'sha256:ede01da35e982b6a4b85461ad8492ae2753ef14246fba33c8039b782aa8e39fb',
 'sha256:03afd079b00bcd229df29a24771439c5e7695c339cd89216d0763ce40731cc4b',
 'sha256:e2833f0160c095894cfccd33cd48980cd524ed96e553bebb1bc388c9702354ec')

def digest(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def validate_authorization(a, current_head, current_hashes, clean):
    if not clean or a.get('authorized') is not True or a.get('validForExecution') is not True:
        raise ValueError('AUTHORIZATION_REJECTED')
    if a.get('phase') != '3E3A4' or a.get('baselineCommit') != current_head:
        raise ValueError('BASELINE_REJECTED')
    b = a.get('bindings', {})
    if set(b) != set(REQUIRED) or any(not isinstance(b[k], str) or b[k] != current_hashes[k] for k in REQUIRED):
        raise ValueError('BINDING_REJECTED')
    if a.get('imageIds') != list(IMAGES) or a.get('unresolved'):
        raise ValueError('INCOMPLETE_AUTHORIZATION')
    required_permissions = {'autonomousEmptyBlocks': True, 'wallet': False,
       'funding': False, 'proofRequests': False, 'checkRequests': False,
       'deployment': False, 'contractCalls': False, 'userTransactions': False,
       'downloads': False, 'imagePulls': False, 'cacheMutation': False}
    if a.get('permissions') != required_permissions:
        raise ValueError('PERMISSIONS_REJECTED')

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--separately-authorized-a4-service-preflight', action='store_true')
    parser.add_argument('--authorization-file', required=True)
    args = parser.parse_args()
    if not args.separately_authorized_a4_service_preflight:
        raise ValueError('FLAG_REQUIRED')
    root = pathlib.Path.cwd().resolve()
    top = pathlib.Path(subprocess.check_output(['git','rev-parse','--show-toplevel'], text=True).strip()).resolve()
    if root != top:
        raise ValueError('ROOT_REJECTED')
    base = pathlib.Path(__file__).resolve().parent
    plan = json.loads((base/'proposed-plan.json').read_text())
    authorization_path = pathlib.Path(args.authorization_file)
    if authorization_path.is_symlink() or not authorization_path.is_file():
        raise ValueError('AUTHORIZATION_REJECTED')
    a = json.loads(authorization_path.read_bytes())
    hashes = {key: digest(root/path) for key,path in plan['bindingFiles'].items()}
    head = subprocess.check_output(['git','rev-parse','HEAD'], text=True).strip()
    clean = not subprocess.check_output(['git','status','--porcelain'])
    validate_authorization(a, head, hashes, clean)
    # Permanent refusal until a separately reviewed complete service monitor exists.
    # Neither a true flag nor altered plan can enable service launch in this proposal.
    raise ValueError('STATIC_FULL_STACK_GATE_UNRESOLVED')

if __name__ == '__main__':
    try:
        main()
    except BaseException:
        sys.stderr.write('A4_NOT_EXECUTED_STATIC_GATE\n')
        sys.exit(2)
