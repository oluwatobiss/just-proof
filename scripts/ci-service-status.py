"""Bounded public diagnostics only: never request container logs/configuration.

Executed by CI on failure, not by the application. No import-time operations.
"""
import json
import re
import subprocess

SERVICES = ("node", "indexer", "proof-server")
STATUSES = {"created", "running", "paused", "restarting", "removing", "exited", "dead"}


def bounded_command(args):
    # Commands select only IDs or four public status scalars, never raw service logs.
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                            timeout=5, check=False)
    if result.returncode != 0 or len(result.stdout) > 4096:
        raise ValueError("STATUS_UNAVAILABLE")
    return result.stdout.decode("ascii", errors="strict").strip()


def main():
    failed = False
    for service in SERVICES:
        record = {"service": service, "category": "STATUS_UNAVAILABLE"}
        try:
            ids = bounded_command(["docker", "compose", "ps", "--all", "--quiet", service]).split()
            if not ids:
                record["category"] = "ABSENT"
            elif len(ids) != 1 or not re.fullmatch(r"[0-9a-f]{12,64}", ids[0]):
                raise ValueError("STATUS_UNAVAILABLE")
            else:
                parts = bounded_command([
                    "docker", "inspect", "--format",
                    "{{.State.Status}} {{.State.ExitCode}} {{.State.OOMKilled}} {{.RestartCount}}",
                    ids[0],
                ]).split()
                if (len(parts) != 4 or parts[0] not in STATUSES or
                    not re.fullmatch(r"-?[0-9]{1,5}", parts[1]) or
                    parts[2] not in {"true", "false"} or
                    not re.fullmatch(r"[0-9]{1,8}", parts[3])):
                    raise ValueError("STATUS_UNAVAILABLE")
                record.update(category="PUBLIC_STATUS", status=parts[0], exitCode=int(parts[1]),
                              oomKilled=parts[2] == "true", restartCount=int(parts[3]))
        except (OSError, ValueError, subprocess.SubprocessError):
            failed = True
        # Fixed schema, three records, no subprocess output/errors or identifiers.
        print(json.dumps(record, sort_keys=True))
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
