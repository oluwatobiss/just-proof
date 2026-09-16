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

def cgroup():
    # Intentionally specific to inspected hybrid/v1 hierarchy; different layout needs review.
    baseline = json.loads((HERE / 'readiness.json').read_text())
    if Path('/proc/self/cgroup').read_text() != baseline['cgroupMembership']:
        raise RuntimeError('changed cgroup membership requires review')
    result = {}
    for root in ('/sys/fs/cgroup/memory', '/sys/fs/cgroup/memory/init.scope'):
        for name in ('memory.limit_in_bytes', 'memory.memsw.limit_in_bytes',
                     'memory.usage_in_bytes', 'memory.memsw.usage_in_bytes'):
            p = root + '/' + name
            result[p] = int(Path(p).read_text())
            if 'limit' in name and str(result[p]) != baseline['cgroupObservations'][p].strip():
                raise RuntimeError('changed cgroup limit requires review')
    for root in ('/sys/fs/cgroup/unified', '/sys/fs/cgroup/unified/init.scope'):
        if Path(root + '/cgroup.controllers').read_text().strip():
            raise RuntimeError('new v2 controller requires review')
    return result

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
        if not Path('/proc/' + str(parent)).exists() or now - state['heartbeat'] > 2:
            term_at = term_at or now
        if term_at is not None:
            terminate(group, state['known'], signal.SIGTERM)
            if now - term_at >= 5:
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
    if (a.get('authorized') is not True or a.get('phase') != '3E2B'
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
                       'heartbeat': time.monotonic(), 'known': known, 'done': done})

    def core_result(complete=False):
        return {'provenance': provenance, 'compilerLaunched': child is not None,
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
        cgroup()
        if m['MemAvailable'] < p['launchMemAvailableKiB'] or m['SwapFree'] < p['launchSwapFreeKiB']:
            raise RuntimeError('launch resource floor changed during preflight')
        if a.get('avoidableDockerWorkloadsStopped') is not True:
            raise RuntimeError('future operator must confirm Compose/proof-server and avoidable Docker workloads stopped')
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
                text = (evidence / 'build.txt').read_text(errors='replace')
                urls = re.findall(r'https?://[^\s<>"\']+', text)
                if any(urlsplit(u).hostname != p['expectedHost'] or urlsplit(u).scheme != 'https'
                       or urlsplit(u).port not in (None, 443) or urlsplit(u).username is not None for u in urls):
                    reason = reason or 'unexpected reported origin'
                names = set(re.findall(r'bls_midnight_[A-Za-z0-9_-]+', text))
                requested |= names - before.keys()
                current = {}
                for f in cache.rglob('*'):
                    if f.is_symlink():
                        raise RuntimeError('unexpected cache symlink')
                    if f.is_file():
                        st = f.stat()
                        current[str(f.relative_to(cache))] = (st.st_size, st.st_mtime_ns, st.st_ino)
                added = current.keys() - stats.keys()
                if any(current.get(name) != st for name, st in stats.items()):
                    reason = reason or 'existing cache entry changed or disappeared'
                if added - requested or any(not re.fullmatch(r'bls_midnight_2p[0-9]+', n) for n in requested):
                    reason = reason or 'unexplained cache change or parameter name'
                if len(requested) > p['maximumMissingParameters']:
                    reason = reason or 'second missing parameter'
                for name in requested:
                    if not any(name in u and urlsplit(u).hostname == p['expectedHost'] for u in urls):
                        reason = reason or 'missing parameter provenance not observable in compiler log'
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
                guard.wait(timeout=2)
            except BaseException as exc:
                error('watchdog wait', exc)
                guarded('watchdog terminate', guard.terminate)
                try:
                    guard.wait(timeout=p['termToKillSeconds'])
                except BaseException as kill_exc:
                    error('watchdog wait after terminate', kill_exc)
                    guarded('watchdog kill', guard.kill)
                    guarded('watchdog wait after kill', lambda: guard.wait(timeout=2))
            if guard.returncode not in (None, 0):
                error('watchdog exit', RuntimeError('nonzero watchdog exit: ' + str(guard.returncode)))
        if log is not None:
            guarded('compiler log closure', log.close)
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
    # Even exit 0 is a candidate only; this code never sets keyGenerationSuccess to true.

if __name__ == '__main__':
    if len(sys.argv) == 5 and sys.argv[1] == '--watchdog':
        watchdog(sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
    else:
        parser = argparse.ArgumentParser(description=__doc__)
        parser.add_argument('--authorization-file', required=True)
        main(parser.parse_args().authorization_file)
