"""Validate submitted results under data/results/.

Checks each report.json has the expected schema, required fields, and
self-consistent numbers. Run locally or in CI on every PR that touches results.

Usage: python3 scripts/validate_results.py [data/results]
"""

from __future__ import annotations

import json
import os
import sys

REQUIRED = [
    "schema_version",
    "lemonmetrics_version",
    "generated_at",
    "device",
    "lemonade",
    "power",
]


def validate_report(path: str) -> list[str]:
    errors: list[str] = []
    try:
        with open(path, encoding="utf-8") as fh:
            report = json.load(fh)
    except (OSError, json.JSONDecodeError) as exc:
        return [f"invalid JSON: {exc}"]

    for field in REQUIRED:
        if field not in report:
            errors.append(f"missing top-level field '{field}'")

    if "device" in report:
        device = report["device"]
        if "device_id" not in device or "fingerprint" not in device:
            errors.append("device missing device_id/fingerprint")

    if "power" in report:
        power = report["power"]
        if "available" not in power or "sampler" not in power:
            errors.append("power missing available/sampler")
        if power.get("available") and "samples_raw" in power:
            samples = power["samples_raw"]
            if not isinstance(samples, list) or not all(
                isinstance(s, dict) and {"ts", "watts"} <= set(s) for s in samples
            ):
                errors.append("samples_raw must be a list of {ts, watts}")
        baseline = power.get("baseline")
        if baseline is not None:
            if not isinstance(baseline, dict) or "avg_watts" not in baseline:
                errors.append("power.baseline missing avg_watts")
            elif baseline.get("avg_watts") is not None and baseline["avg_watts"] < 0:
                errors.append("negative power.baseline.avg_watts")

    if "lemonade" in report and "command" in report["lemonade"]:
        cmd = report["lemonade"]["command"]
        if not cmd or cmd[0] != "bench":
            errors.append("lemonade.command must be a 'bench' invocation")

    if "efficiency" in report:
        eff = report["efficiency"]
        if eff.get("available") and eff.get("joules_per_token") is not None:
            if eff["joules_per_token"] < 0:
                errors.append("negative joules_per_token")
        for field in (
            "incremental_watts",
            "incremental_energy_joules",
            "incremental_joules_per_token",
            "incremental_joules_per_output_token",
        ):
            value = eff.get(field)
            if value is not None and value < 0:
                errors.append(f"negative {field}")

    return errors


def main(root: str) -> int:
    found = 0
    failed = 0
    for dirpath, _, filenames in os.walk(root):
        if "report.json" not in filenames:
            continue
        found += 1
        path = os.path.join(dirpath, "report.json")
        errors = validate_report(path)
        if errors:
            failed += 1
            print(f"FAIL {path}")
            for err in errors:
                print(f"     - {err}")
        else:
            print(f"ok   {path}")
    print(f"{found} report(s) validated, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    root = sys.argv[1] if len(sys.argv) > 1 else "data/results"
    if not os.path.isdir(root):
        print(f"no results directory at {root}; nothing to validate")
        sys.exit(0)
    sys.exit(main(root))
