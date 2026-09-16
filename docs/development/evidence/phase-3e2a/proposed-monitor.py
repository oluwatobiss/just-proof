"""REVIEW ONLY. Never run in Phase 3E2A. Requires separate user authorization JSON.
The authorization file is a procedural guard, not evidence of user consent by itself.
"""
from pathlib import Path
import argparse, hashlib, json, os, re, signal, subprocess, sys, time
import shutil
from urllib.parse import urlsplit

HERE = Path(__file__).resolve().parent

def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def fsync_directory(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)

def save(path, value):
    path = Path(path)
    temporary = path.with_suffix(path.suffix + '.next')
    with temporary.open('w') as f:
        json.dump(value, f, indent=2)
        f.write('\n')
        f.flush()
        os.fsync(f.fileno())
    temporary.replace(path)
    fsync_directory(path.parent)

def inventory(root):
    if not Path(root).is_dir():
        raise RuntimeError("inventory root absent: " + str(root))
    result = {}
    for p in sorted(Path(root).rglob('*')):
        if p.is_symlink():
            raise RuntimeError('symlink in artifact/cache inventory: ' + str(p))
        if p.is_file():
            result[str(p.relative_to(root))] = {'bytes': p.stat().st_size, 'sha256': sha(p)}
    return result

def memory():
    return {s.split(':')[0]: int(s.split()[1]) for s in Path('/proc/meminfo').read_text().splitlines()
            if s.split(':')[0] in ('MemTotal', 'MemAvailable', 'SwapTotal', 'SwapFree')}

REVIEWED_CGROUP_BASELINE = json.loads(r'''{"memberships":[{"hierarchyId":0,"controllers":[],"path":"/init.scope"},{"hierarchyId":1,"controllers":["cpuset"],"path":"/"},{"hierarchyId":2,"controllers":["cpu"],"path":"/"},{"hierarchyId":3,"controllers":["cpuacct"],"path":"/"},{"hierarchyId":4,"controllers":["blkio"],"path":"/"},{"hierarchyId":5,"controllers":["memory"],"path":"/init.scope"},{"hierarchyId":6,"controllers":["devices"],"path":"/init.scope"},{"hierarchyId":7,"controllers":["freezer"],"path":"/"},{"hierarchyId":8,"controllers":["net_cls"],"path":"/"},{"hierarchyId":9,"controllers":["perf_event"],"path":"/"},{"hierarchyId":10,"controllers":["net_prio"],"path":"/"},{"hierarchyId":11,"controllers":["hugetlb"],"path":"/"},{"hierarchyId":12,"controllers":["pids"],"path":"/init.scope"},{"hierarchyId":13,"controllers":["rdma"],"path":"/"},{"hierarchyId":14,"controllers":["misc"],"path":"/"},{"hierarchyId":15,"controllers":["name=systemd"],"path":"/init.scope"}],"mounts":[{"device":"0:70","root":"/","mountpoint":"/sys/fs/cgroup/blkio","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["blkio","rw"]},{"device":"0:61","root":"/","mountpoint":"/sys/fs/cgroup/cpu","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["cpu","rw"]},{"device":"0:62","root":"/","mountpoint":"/sys/fs/cgroup/cpuacct","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["cpuacct","rw"]},{"device":"0:60","root":"/","mountpoint":"/sys/fs/cgroup/cpuset","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["cpuset","rw"]},{"device":"0:72","root":"/","mountpoint":"/sys/fs/cgroup/devices","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["devices","rw"]},{"device":"0:73","root":"/","mountpoint":"/sys/fs/cgroup/freezer","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["freezer","rw"]},{"device":"0:77","root":"/","mountpoint":"/sys/fs/cgroup/hugetlb","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["hugetlb","rw"]},{"device":"0:71","root":"/","mountpoint":"/sys/fs/cgroup/memory","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["memory","rw"]},{"device":"0:80","root":"/","mountpoint":"/sys/fs/cgroup/misc","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["misc","rw"]},{"device":"0:74","root":"/","mountpoint":"/sys/fs/cgroup/net_cls","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["net_cls","rw"]},{"device":"0:76","root":"/","mountpoint":"/sys/fs/cgroup/net_prio","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["net_prio","rw"]},{"device":"0:75","root":"/","mountpoint":"/sys/fs/cgroup/perf_event","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["perf_event","rw"]},{"device":"0:78","root":"/","mountpoint":"/sys/fs/cgroup/pids","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["pids","rw"]},{"device":"0:79","root":"/","mountpoint":"/sys/fs/cgroup/rdma","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["rdma","rw"]},{"device":"0:84","root":"/","mountpoint":"/sys/fs/cgroup/systemd","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup","source":"cgroup","superOptions":["name=systemd","rw","xattr"]},{"device":"0:21","root":"/","mountpoint":"/sys/fs/cgroup/unified","mountOptions":["nodev","noexec","nosuid","relatime","ro"],"filesystem":"cgroup2","source":"cgroup2","superOptions":["rw"]}],"memory":{"/sys/fs/cgroup/memory":{"memory.limit_in_bytes":"9223372036854771712","memory.memsw.limit_in_bytes":"9223372036854771712","memory.use_hierarchy":1},"/sys/fs/cgroup/memory/init.scope":{"memory.limit_in_bytes":"9223372036854771712","memory.memsw.limit_in_bytes":"9223372036854771712","memory.use_hierarchy":1}},"cpu":{"membership":"/","controls":{"cpu.cfs_quota_us":-1,"cpu.cfs_period_us":100000,"cpu.shares":1024},"count":8,"affinity":[0,1,2,3,4,5,6,7],"allowedList":"0-7","cpusetMembership":"/","cpuset":{"cpuset.cpus":"0-7","cpuset.effective_cpus":"0-7","cpuset.mems":"0","cpuset.effective_mems":"0"}},"v2":{"/sys/fs/cgroup/unified":{"cgroup.controllers":{"present":true,"value":""},"cgroup.subtree_control":{"present":true,"value":""},"memory.max":{"present":false},"memory.current":{"present":false},"memory.swap.max":{"present":false},"memory.swap.current":{"present":false}},"/sys/fs/cgroup/unified/init.scope":{"cgroup.controllers":{"present":true,"value":""},"cgroup.subtree_control":{"present":true,"value":""},"memory.max":{"present":false},"memory.current":{"present":false},"memory.swap.max":{"present":false},"memory.swap.current":{"present":false}}}}''')

def parse_cgroup_memberships(raw):
    """Pure parser: retain every hierarchy/controller/path; reject malformed entries."""
    if not isinstance(raw, str) or not raw:
        raise ValueError('missing cgroup membership text')
    rows = []
    ids = set()
    controllers_seen = set()
    for line in raw.splitlines():
        fields = line.split(':', 2)
        if len(fields) != 3:
            raise ValueError('malformed cgroup entry')
        ident, names, path = fields
        if not ident.isdecimal() or ident != str(int(ident)) or int(ident) in ids:
            raise ValueError('invalid/duplicate hierarchy ID')
        controllers = names.split(',') if names else []
        if len(controllers) != len(set(controllers)) or any(
                not re.fullmatch(r'[A-Za-z0-9_=.-]+', n) for n in controllers):
            raise ValueError('invalid/duplicate controller')
        if (int(ident) == 0) != (not controllers):
            raise ValueError('invalid unified hierarchy')
        if controllers_seen.intersection(controllers):
            raise ValueError('controller appears in multiple hierarchies')
        if not path.startswith('/') or (path != '/' and any(
                part in ('', '.', '..') for part in path[1:].split('/'))):
            raise ValueError('invalid membership path')
        ids.add(int(ident))
        controllers_seen.update(controllers)
        rows.append({'hierarchyId': int(ident), 'controllers': sorted(controllers), 'path': path})
    return sorted(rows, key=lambda row: row['hierarchyId'])


def parse_cgroup_mounts(raw):
    """Pure parser for relevant mountinfo records; runtime IDs/propagation IDs are not limits."""
    if not isinstance(raw, str):
        raise ValueError('missing mountinfo')
    rows = []
    seen = set()
    for line in raw.splitlines():
        parts = line.split(' - ')
        if len(parts) != 2:
            raise ValueError('malformed mountinfo separator')
        left, right = parts[0].split(), parts[1].split()
        if len(left) < 6 or len(right) != 3:
            raise ValueError('malformed mountinfo fields')
        if right[0] not in ('cgroup', 'cgroup2'):
            continue
        if not left[0].isdecimal() or not left[1].isdecimal() or not re.fullmatch(r'[0-9]+:[0-9]+', left[2]):
            raise ValueError('invalid mount identity')
        if len(left[5].split(',')) != len(set(left[5].split(','))) or len(right[2].split(',')) != len(set(right[2].split(','))):
            raise ValueError('duplicate mount options')
        if left[4] in seen:
            raise ValueError('duplicate cgroup mountpoint')
        seen.add(left[4])
        rows.append({'device': left[2], 'root': left[3], 'mountpoint': left[4],
                     'mountOptions': sorted(left[5].split(',')), 'filesystem': right[0],
                     'source': right[1], 'superOptions': sorted(right[2].split(','))})
    return sorted(rows, key=lambda row: row['mountpoint'])


def validate_cgroup_snapshot(snapshot):
    """Pure compatibility check against immutable, monitor-hash-bound prospective constants."""
    reviewed = REVIEWED_CGROUP_BASELINE
    memberships = parse_cgroup_memberships(snapshot['rawMembership'])
    if memberships != reviewed['memberships']:
        raise ValueError('unreviewed hierarchy/controller/membership change')
    parsed_mounts = parse_cgroup_mounts(snapshot['rawMountinfo'])
    normalized = []
    nsdelegate = False
    for row in parsed_mounts:
        normalized_row = dict(row)
        options = list(row['superOptions'])
        if row['filesystem'] == 'cgroup2' and row['mountpoint'] == '/sys/fs/cgroup/unified':
            nsdelegate = 'nsdelegate' in options
            options = [o for o in options if o != 'nsdelegate']
        normalized_row['superOptions'] = options
        normalized.append(normalized_row)
    if normalized != reviewed['mounts']:
        raise ValueError('unreviewed cgroup mount structure/options/controller binding')
    memory_groups = snapshot['memoryGroups']
    if set(memory_groups) != set(reviewed['memory']):
        raise ValueError('missing/unrecognized applicable memory group')
    usage_fields = {'memory.usage_in_bytes', 'memory.memsw.usage_in_bytes'}
    for path, limits in reviewed['memory'].items():
        actual = memory_groups[path]
        if set(actual) != set(limits) | usage_fields:
            raise ValueError('missing/unrecognized memory interface')
        for name in ('memory.limit_in_bytes', 'memory.memsw.limit_in_bytes'):
            value = actual[name]
            if type(value) is not str or re.fullmatch(r'(?:0|[1-9][0-9]*)', value) is None:
                raise ValueError('memory limits must be canonical decimal strings')
            if value != limits[name]:
                raise ValueError('memory limit/memsw changed')
        if type(actual['memory.use_hierarchy']) is not int or actual['memory.use_hierarchy'] != 1:
            raise ValueError('memory hierarchy must be integer 1')
        if any(type(actual[k]) is not int or actual[k] < 0 for k in usage_fields):
            raise ValueError('memory usage must be nonnegative integers')
    cpu = snapshot['cpu']
    if cpu != reviewed['cpu']:
        raise ValueError('CPU membership/quota/period/shares/count/affinity/cpuset changed')
    if type(cpu['count']) is not int or any(type(v) is not int for v in cpu['controls'].values()):
        raise ValueError('invalid CPU control types')
    if any(type(v) is not int for v in cpu['affinity']):
        raise ValueError('invalid affinity types')
    # Exact empty controller/subtree sets and absent memory/swap files are mandatory.
    if snapshot['v2'] != reviewed['v2']:
        raise ValueError('unreviewed v2 controllers/subtree/memory/swap interface')
    return {'rawMembership': snapshot['rawMembership'], 'parsedMembership': memberships,
            'rawMountRecords': [line for line in snapshot['rawMountinfo'].splitlines()
                                if line.split(' - ')[1].split()[0] in ('cgroup', 'cgroup2')],
            'parsedMounts': parsed_mounts, 'normalizedMounts': normalized,
            'mountCompatibility': {'matchesReviewedStructure': True, 'nsdelegatePresent': nsdelegate},
            'applicablePaths': {'memoryRoot': '/sys/fs/cgroup/memory',
                                'memoryMembership': '/sys/fs/cgroup/memory/init.scope',
                                'cpu': '/sys/fs/cgroup/cpu', 'cpuset': '/sys/fs/cgroup/cpuset',
                                'v2Root': '/sys/fs/cgroup/unified',
                                'v2Membership': '/sys/fs/cgroup/unified/init.scope'},
            'memoryGroups': memory_groups, 'cpu': cpu, 'v2': snapshot['v2'],
            'historicalCpuEquivalenceAsserted': False}


def cgroup():
    # Live capture called only by a separately authorized attempt. The compatibility helpers above
    # are pure and do not load a mutable baseline file; their constants are bound by monitor hash.
    raw = Path('/proc/self/cgroup').read_text()
    membership = parse_cgroup_memberships(raw)
    if membership != REVIEWED_CGROUP_BASELINE['memberships']:
        raise ValueError('unreviewed memberships before interface reads')
    groups = {}
    for root in REVIEWED_CGROUP_BASELINE['memory']:
        groups[root] = {name: Path(root, name).read_text(encoding='ascii').strip() for name in (
            'memory.limit_in_bytes', 'memory.memsw.limit_in_bytes')}
        groups[root].update({name: int(Path(root, name).read_text()) for name in (
            'memory.use_hierarchy', 'memory.usage_in_bytes', 'memory.memsw.usage_in_bytes')})
    controls = {name: int(Path('/sys/fs/cgroup/cpu', name).read_text()) for name in (
        'cpu.cfs_quota_us', 'cpu.cfs_period_us', 'cpu.shares')}
    allowed_lines = [line.split(':', 1)[1].strip() for line in Path('/proc/self/status').read_text().splitlines()
                     if line.startswith('Cpus_allowed_list:')]
    if len(allowed_lines) != 1:
        raise ValueError('missing/duplicate allowed CPU list')
    cpu = {'membership': '/', 'controls': controls, 'count': os.cpu_count(),
           'affinity': sorted(os.sched_getaffinity(0)), 'allowedList': allowed_lines[0],
           'cpusetMembership': '/', 'cpuset': {
               name: Path('/sys/fs/cgroup/cpuset', name).read_text().strip() for name in (
                   'cpuset.cpus', 'cpuset.effective_cpus', 'cpuset.mems', 'cpuset.effective_mems')}}
    unified = {}
    for root in REVIEWED_CGROUP_BASELINE['v2']:
        unified[root] = {}
        for name in ('cgroup.controllers', 'cgroup.subtree_control'):
            unified[root][name] = {'present': True, 'value': Path(root, name).read_text().strip()}
        for name in ('memory.max', 'memory.current', 'memory.swap.max', 'memory.swap.current'):
            unified[root][name] = {'present': os.path.lexists(Path(root, name))}
    return validate_cgroup_snapshot({'rawMembership': raw,
        'rawMountinfo': Path('/proc/self/mountinfo').read_text(),
        'memoryGroups': groups, 'cpu': cpu, 'v2': unified})

def process(pid):
    p = Path('/proc') / str(pid)
    s = (p / 'stat').read_text()
    fields = s[s.rfind(')') + 2:].split()
    status = (p / 'status').read_text().splitlines()
    sizes = {s.split(':')[0]: int(s.split()[1]) for s in status if s.startswith(('VmRSS:', 'VmHWM:'))}
    return {'pid': pid, 'ppid': int(fields[1]), 'pgrp': int(fields[2]),
            'startTicks': int(fields[19]), 'state': fields[0],
            'rssKiB': sizes.get('VmRSS', 0), 'hwmKiB': sizes.get('VmHWM', 0)}

def tree(root, known):
    rows = {}
    for path in Path('/proc').iterdir():
        if not path.name.isdigit():
            continue
        try:
            rows[int(path.name)] = process(int(path.name))
        except (FileNotFoundError, ProcessLookupError):
            continue  # normal exit race; permission/parse failures must stop the attempt
    selected = {pid for pid, r in rows.items() if pid == root or r['pgrp'] == root
                or known.get(str(pid)) == r['startTicks']}
    while True:
        more = {pid for pid, r in rows.items() if r['ppid'] in selected}
        if more <= selected:
            break
        selected |= more
    for pid in selected:
        known[str(pid)] = rows[pid]['startTicks']
    return [rows[pid] for pid in sorted(selected)]

def terminate(group, known, sig):
    try:
        os.killpg(group, sig)
    except ProcessLookupError:
        pass
    for pid, start in known.items():
        try:
            if process(int(pid))['startTicks'] == start:
                os.kill(int(pid), sig)
        except (FileNotFoundError, ProcessLookupError):
            pass

def scan_provenance(log_path, cache, before, stats, requested, plan):
    """Full log/cache scan, shared by sampling and post-reap finalization."""
    if before is None or stats is None:
        raise RuntimeError('log/cache scan lacks initial inventory')
    text = Path(log_path).read_text(errors='replace')
    urls = re.findall(r'https?://[^\s<>"\']+', text)
    names = set(re.findall(r'bls_midnight_[A-Za-z0-9_-]+', text))
    requested.update(names - before.keys())
    current = {}
    for f in cache.rglob('*'):
        if f.is_symlink():
            raise RuntimeError('unexpected cache symlink')
        if f.is_file():
            st = f.stat()
            current[str(f.relative_to(cache))] = (st.st_size, st.st_mtime_ns, st.st_ino)
    if any(urlsplit(u).hostname != plan['expectedHost'] or urlsplit(u).scheme != 'https'
           or urlsplit(u).port not in (None, 443) or urlsplit(u).username is not None for u in urls):
        raise RuntimeError('unexpected reported origin')
    added = current.keys() - stats.keys()
    if any(current.get(name) != st for name, st in stats.items()):
        raise RuntimeError('existing cache entry changed or disappeared')
    if added - requested or any(not re.fullmatch(r'bls_midnight_2p[0-9]+', n) for n in requested):
        raise RuntimeError('unexplained cache change or parameter name')
    if len(requested) > plan['maximumMissingParameters'] or len(added) > plan['maximumMissingParameters']:
        raise RuntimeError('second missing parameter/cache entry')
    for name in requested:
        if not any(name in u and urlsplit(u).hostname == plan['expectedHost'] for u in urls):
            raise RuntimeError('missing parameter provenance not observable in compiler log')
    return {'reportedUrls': urls, 'reportedParameterNames': sorted(names),
            'requestedMissingParameters': sorted(requested), 'cacheNames': sorted(current),
            'newCacheNames': sorted(added), 'completeLogBytes': Path(log_path).stat().st_size}

def watchdog(control, group, parent):
    # Separate interpreter: deadlines/heartbeat survive a blocked monitor loop.
    initial = json.loads(Path(control).read_text())
    hard_at = initial['started'] + initial['hardSeconds']
    term_at = None
    while True:
        now = time.monotonic()
        try:
            state = json.loads(Path(control).read_text())
        except Exception:
            state = initial
            term_at = term_at or now
        if state.get('done'):
            return
        if now >= hard_at:
            terminate(group, state['known'], signal.SIGKILL)
            return
        if not Path('/proc/' + str(parent)).exists() or now - state['heartbeat'] > initial['maximumSampleGapSeconds']:
            term_at = term_at or now
        if term_at is not None:
            terminate(group, state['known'], signal.SIGTERM)
            if now - term_at >= initial['termToKillSeconds']:
                terminate(group, state['known'], signal.SIGKILL)
                return
        time.sleep(0.1)

def main(authorization_path):
    plan_path = HERE / 'proposed-plan.json'
    postcheck_path = HERE / 'proposed-key-format-check.mjs'
    plan_bytes = plan_path.read_bytes()
    authorization_bytes = Path(authorization_path).read_bytes()
    p = json.loads(plan_bytes)
    a = json.loads(authorization_bytes)
    hashes = {'planSha256': hashlib.sha256(plan_bytes).hexdigest(),
              'monitorSha256': sha(__file__), 'postcheckSha256': sha(postcheck_path),
              'authorizationSha256': hashlib.sha256(authorization_bytes).hexdigest()}
    if (a.get('authorized') is not True or a.get('phase') != '3E2B' or a.get('avoidableDockerWorkloadsStopped') is not True
            or any(a.get(k) != hashes[k] for k in ('planSha256', 'monitorSha256', 'postcheckSha256'))):
        raise RuntimeError('missing separately approved exact plan/monitor/postcheck authorization')
    head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    if a.get('baselineHead') != head or subprocess.check_output(['git', 'status', '--porcelain']).strip():
        raise RuntimeError('execution baseline must be separately approved and clean')
    out, marker, evidence, cache = map(Path, (p['output'], p['marker'], p['evidence'], p['cache']))
    if marker != evidence / 'attempt-started':
        raise RuntimeError('authoritative marker must be in durable evidence directory')
    if any(os.path.lexists(q) for q in (out, marker, evidence)):
        raise RuntimeError('attempt output/evidence/marker already exists; never retry')
    threshold_keys = ('minimumMemTotalKiB', 'minimumSwapTotalKiB', 'launchMemAvailableKiB',
                      'launchSwapFreeKiB', 'runtimeMemAvailableKiB', 'runtimeSwapFreeKiB',
                      'sampleSeconds', 'maximumSampleGapSeconds', 'termToKillSeconds',
                      'gracefulTimeoutSeconds', 'hardTimeoutSeconds', 'minimumDiskFreeBytes',
                      'rayonThreads', 'maximumMissingParameters')
    provenance = {'authorizedBaselineHead': head, 'sourceSha256': sha('contracts/just-proof.compact'),
                  **hashes, 'command': p['command'], 'environmentOverrides': p['environmentOverrides'],
                  'resourceThresholds': {k: p[k] for k in threshold_keys}, 'expectedHost': p['expectedHost']}
    # Reserve before version/resource/cache checks. Any subsequent pre-launch failure consumes
    # this reservation. Even marker-creation failure leaves the exclusive directory in place.
    evidence.mkdir(exist_ok=False)
    child = None
    guard = None
    log = None
    before = None
    stats = None
    cg = None
    output_created = False
    known = {}
    reason = None
    term_at = None
    code = None
    started = None
    compiler_elapsed = None
    requested = set()
    control = evidence / 'watchdog.json'
    peak = 0
    minimum_available = None
    minimum_swap = None
    max_gap = 0
    errors = []

    def error(stage, exc):
        errors.append({'stage': stage, 'type': type(exc).__name__, 'message': str(exc)})

    def guarded(stage, operation):
        try:
            return operation()
        except BaseException as exc:
            error(stage, exc)
            return None

    def control_update(done=False):
        save(control, {'started': started, 'hardSeconds': p['hardTimeoutSeconds'],
                       'heartbeat': time.monotonic(), 'known': known, 'done': done,
                       'maximumSampleGapSeconds': p['maximumSampleGapSeconds'],
                       'termToKillSeconds': p['termToKillSeconds']})

    def core_result(complete=False):
        return {'provenance': provenance, 'compilerLaunched': child is not None,
                'lastCgroupObservation': cg,
                'compilerExit': code, 'stopReason': reason or ('finalization error' if errors else None),
                'finalizationErrors': list(errors), 'finalizationComplete': complete and not errors,
                'successPermanentlyBlocked': bool(errors or reason or code != 0 or child is None),
                'compilerWaitElapsedSeconds': compiler_elapsed,
                'elapsedSecondsIncludingCleanup': None if started is None else time.monotonic() - started,
                'sampledPeakAggregateRssKiB': peak, 'minimumMemAvailableKiB': minimum_available,
                'minimumSwapFreeKiB': minimum_swap, 'maximumSampleGapSeconds': max_gap,
                'requestedMissingParameters': sorted(requested), 'keyGenerationSuccess': False,
                'note': 'No success promotion here. Requires separate artifact/format/resource review; no proof operation.'}

    try:
        fsync_directory(evidence.parent)
        with marker.open('x') as f:
            json.dump(provenance, f, indent=2)
            f.write('\n')
            f.flush()
            os.fsync(f.fileno())
        fsync_directory(evidence)
        save(evidence / 'preflight.json', {'provenance': provenance, 'preflightComplete': False})
        if 'microsoft' not in os.uname().release.lower():
            raise RuntimeError('WSL required')
        if sha('contracts/just-proof.compact') != p['sourceSha256']:
            raise RuntimeError('source changed')
        baseline = json.loads((HERE / 'readiness.json').read_text())
        for item in baseline['fingerprints']:
            if sha(item['path']) != item['sha256']:
                raise RuntimeError('source or managed ZKIR changed')
        expected = [('compact', '--version'), ('compact', 'compile', '+0.31.1', '--version'),
                    ('compact', 'compile', '+0.31.1', '--language-version'),
                    ('compact', 'compile', '+0.31.1', '--runtime-version'), ('node', '--version'), ('npm', '--version')]
        for cmd, value in zip(expected, ('compact 0.5.2', '0.31.1', '0.23.0', '0.16.0', 'v24.18.0', '11.16.0')):
            if subprocess.check_output(cmd, text=True).strip() != value:
                raise RuntimeError('version mismatch')
        if json.loads(Path('node_modules/@midnight-ntwrk/compact-runtime/package.json').read_text())['version'] != '0.16.0':
            raise RuntimeError('installed runtime mismatch')
        m = memory()
        if (m['MemTotal'] < p['minimumMemTotalKiB'] or m['SwapTotal'] < p['minimumSwapTotalKiB']
                or m['MemAvailable'] < p['launchMemAvailableKiB'] or m['SwapFree'] < p['launchSwapFreeKiB']):
            raise RuntimeError('launch resource floor failed')
        cg = cgroup()
        if min(shutil.disk_usage(q).free for q in (Path.cwd(), Path('/tmp'), cache)) < p['minimumDiskFreeBytes']:
            raise RuntimeError('launch free disk floor failed')
        before = inventory(cache)
        if before != {Path(i['path']).name: {'bytes': i['bytes'], 'sha256': i['sha256']} for i in baseline['cache']}:
            raise RuntimeError('cache differs from reviewed preflight; review required')
        stats = {str(f.relative_to(cache)): (f.stat().st_size, f.stat().st_mtime_ns, f.stat().st_ino)
                 for f in cache.rglob('*') if f.is_file()}
        m = memory()  # Recheck after cache hashing, immediately before allocating attempt state.
        cg = cgroup()
        if m['MemAvailable'] < p['launchMemAvailableKiB'] or m['SwapFree'] < p['launchSwapFreeKiB']:
            raise RuntimeError('launch resource floor changed during preflight')
        # Catch changes after authorization/preflight hashing without logging authorization content.
        paths = {'planSha256': plan_path, 'monitorSha256': Path(__file__),
                 'postcheckSha256': postcheck_path, 'authorizationSha256': Path(authorization_path)}
        if any(sha(path) != hashes[key] for key, path in paths.items()):
            raise RuntimeError('execution provenance changed during preflight')
        if sha('contracts/just-proof.compact') != provenance['sourceSha256']:
            raise RuntimeError('source changed during preflight')
        out.mkdir(exist_ok=False)
        output_created = True
        save(evidence / 'cache-before.json', before)
        save(evidence / 'preflight.json', {'provenance': provenance, 'preflightComplete': True,
                                         'memoryKiB': m, 'cgroups': cg})
        log = (evidence / 'build.txt').open('x')
        env = os.environ.copy()
        env.update(p['environmentOverrides'])  # Only these overrides are recorded; never dump env.
        started = time.monotonic()
        last = started
        minimum_available = m['MemAvailable']
        minimum_swap = m['SwapFree']
        child = subprocess.Popen(p['command'], env=env, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        control_update()
        guard = subprocess.Popen([sys.executable, __file__, '--watchdog', str(control), str(child.pid), str(os.getpid())])
        with (evidence / 'memory.jsonl').open('w') as samples:
            while True:
                now = time.monotonic()
                elapsed = now - started
                gap = now - last
                last = now
                max_gap = max(max_gap, gap)
                m = memory()
                cg = cgroup()
                rows = tree(child.pid, known)
                rss = sum(row['rssKiB'] for row in rows)
                peak = max(peak, rss)
                minimum_available = min(minimum_available, m['MemAvailable'])
                minimum_swap = min(minimum_swap, m['SwapFree'])
                samples.write(json.dumps({'elapsedSeconds': elapsed, 'aggregateRssKiB': rss,
                                         'processes': rows, 'systemKiB': m, 'cgroups': cg}) + '\n')
                samples.flush()
                control_update()
                scan_provenance(evidence / 'build.txt', cache, before, stats, requested, p)
                if gap > p['maximumSampleGapSeconds'] or guard.poll() is not None:
                    reason = reason or 'monitor/watchdog failure'
                if m['MemAvailable'] < p['runtimeMemAvailableKiB'] or m['SwapFree'] < p['runtimeSwapFreeKiB']:
                    reason = reason or 'runtime memory floor'
                if elapsed >= p['gracefulTimeoutSeconds']:
                    reason = reason or 'graceful timeout'
                if reason and term_at is None:
                    term_at = now
                    terminate(child.pid, known, signal.SIGTERM)
                if term_at is not None and now - term_at >= p['termToKillSeconds']:
                    terminate(child.pid, known, signal.SIGKILL)
                if child.poll() is not None:
                    if any(row['state'] != 'Z' and row['pid'] != child.pid for row in rows):
                        reason = reason or 'compiler exited leaving descendants'
                        terminate(child.pid, known, signal.SIGTERM)
                    break
                time.sleep(p['sampleSeconds'])
        code = child.wait()
        compiler_elapsed = time.monotonic() - started
    except BaseException as exc:
        reason = reason or ('preflight/monitor failure: ' + type(exc).__name__ + ': ' + str(exc))
        error('preflight/monitor', exc)
    finally:
        # Each cleanup action is independent: none may suppress core evidence finalization.
        if child is not None:
            guarded('compiler SIGTERM', lambda: terminate(child.pid, known, signal.SIGTERM))
            if reason:
                guarded('compiler grace interval', lambda: time.sleep(p['termToKillSeconds']))
            guarded('compiler SIGKILL', lambda: terminate(child.pid, known, signal.SIGKILL))
            waited = guarded('compiler bounded wait', lambda: child.wait(timeout=p['termToKillSeconds']))
            if waited is not None:
                code = waited
            if compiler_elapsed is None:
                compiler_elapsed = time.monotonic() - started
        if guarded('watchdog control existence', control.exists):
            guarded('watchdog completion signal', lambda: control_update(True))
        if guard is not None:
            try:
                guard.wait(timeout=p['maximumSampleGapSeconds'])
            except BaseException as exc:
                error('watchdog wait', exc)
                guarded('watchdog terminate', guard.terminate)
                try:
                    guard.wait(timeout=p['termToKillSeconds'])
                except BaseException as kill_exc:
                    error('watchdog wait after terminate', kill_exc)
                    guarded('watchdog kill', guard.kill)
                    guarded('watchdog wait after kill', lambda: guard.wait(timeout=p['maximumSampleGapSeconds']))
            if guard.returncode not in (None, 0):
                error('watchdog exit', RuntimeError('nonzero watchdog exit: ' + str(guard.returncode)))
        def ensure_reaped():
            if child is None:
                return True
            deadline = time.monotonic() + p['termToKillSeconds']
            while tree(child.pid, known):
                if time.monotonic() >= deadline:
                    raise RuntimeError('compiler/descendant process identities not reaped after cleanup')
                time.sleep(p['sampleSeconds'])
            return True
        reaped = guarded('compiler/descendant reaping confirmation', ensure_reaped)
        if log is not None:
            guarded('compiler log closure', log.close)
        # Re-read the complete log and cache after cleanup; late compiler writes cannot
        # bypass the sampled scan. Cleanup/scan errors independently block eligibility.
        if child is not None:
            def final_scan():
                if reaped is not True:
                    raise RuntimeError('final provenance scan requires confirmed process reaping')
                if log is None or not log.closed:
                    raise RuntimeError('final provenance scan requires safely closed compiler log')
                scan = scan_provenance(evidence / 'build.txt', cache, before, stats, requested, p)
                save(evidence / 'final-provenance-scan.json', scan)
            guarded('final compiler-log/cache provenance scan', final_scan)
        # Preliminary result survives a later hashing/inventory failure wherever storage permits.
        guarded('preliminary result write', lambda: save(evidence / 'result.json', core_result()))
        artifacts = guarded('artifact inventory', lambda: inventory(out) if output_created else None)
        if output_created and artifacts is not None:
            guarded('artifact manifest write', lambda: save(evidence / 'artifact-manifest.json', artifacts))
        elif not output_created:
            guarded('artifact absence record', lambda: save(evidence / 'artifact-manifest.json',
                    {'outputCreated': False, 'artifacts': {}, 'reason': 'compiler not launched/output not allocated'}))
        after = guarded('cache inventory', lambda: inventory(cache))
        if after is not None:
            guarded('cache inventory write', lambda: save(evidence / 'cache-after.json', after))

        def compare_cache():
            if before is None or after is None:
                raise RuntimeError('cache comparison unavailable; before/after inventory incomplete')
            changed = [n for n, v in before.items() if after.get(n) != v]
            added = sorted(after.keys() - before.keys())
            comparison = {'changedExisting': changed, 'newNames': added, 'localHashesNotOfficialChecksums': True}
            save(evidence / 'cache-comparison.json', comparison)
            if changed or set(added) - requested or len(added) > p['maximumMissingParameters']:
                raise RuntimeError('post-run cache comparison failed')
        guarded('cache comparison', compare_cache)
        guarded('final result write', lambda: save(evidence / 'result.json', core_result(complete=True)))
        if errors:
            # Independent fallback channels; never delete reservation or promote a success.
            guarded('finalization error journal', lambda: save(evidence / 'finalization-errors.json', errors))
            guarded('blocked result rewrite', lambda: save(evidence / 'result.json', core_result()))
            print(json.dumps({'stopReason': reason, 'finalizationErrors': errors,
                              'keyGenerationSuccess': False}), file=sys.stderr)
    final = core_result(complete=True)
    eligible = (final['compilerLaunched'] is True and final['compilerExit'] == 0
                and final['stopReason'] is None and final['finalizationComplete'] is True
                and not final['finalizationErrors'] and final['successPermanentlyBlocked'] is False)
    print(json.dumps({'eligibleForSeparatePostcheck': eligible, 'compilerExit': code,
                      'stopReason': final['stopReason'], 'finalizationErrorCount': len(errors),
                      'keyGenerationSuccess': False}))
    # Zero means postcheck eligibility only, never key-generation acceptance.
    return 0 if eligible else 1

if __name__ == '__main__':
    if len(sys.argv) == 5 and sys.argv[1] == '--watchdog':
        watchdog(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
    else:
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument('--authorization-file', required=True)
        arguments = parser.parse_args()
        try:
            status = main(arguments.authorization_file)
        except Exception as exc:
            print(json.dumps({'eligibleForSeparatePostcheck': False, 'keyGenerationSuccess': False,
                              'error': type(exc).__name__ + ': ' + str(exc)}), file=sys.stderr)
            status = 1
        raise SystemExit(status)
