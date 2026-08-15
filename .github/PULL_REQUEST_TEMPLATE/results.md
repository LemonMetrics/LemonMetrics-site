---
name: Submit benchmark results
about: Add your benchmark measurements to the leaderboard
title: "Add results for [device-id]"
labels: results
---

## Device Information

- **Device ID**: `auto-XXXXXXXXX` (auto-generated)
- **CPU**: 
- **Memory**: 
- **OS**: 

## Runs Submitted

- **Model(s)**: 
- **Backend(s)**: 
- **Number of runs**: (should be 3 or more)
- **Power source**: AC (required) / Battery (not recommended)

## Benchmark Settings

- [ ] All runs on **AC power**
- [ ] `--runs 3` or more per model/backend
- [ ] Consistent thermal state (no heavy workloads during benchmark)
- [ ] Same model tested across backends for honest comparison

## Environment Context

<!-- Optional: Add any relevant context about your machine or benchmark conditions -->

- CPU Governor: 
- Thermal state: 
- Other running workloads: 

## Data Honesty Pledge

By submitting this PR, I confirm:

- [ ] All results were measured on AC power
- [ ] I ran `--runs 3` or more for each model/backend combination
- [ ] I am not cherry-picking runs; these are the actual results measured
- [ ] Power data is either authoritative or marked unavailable (not fabricated)
- [ ] Raw samples (`power.jsonl`, `baseline.jsonl`, `bench.json`) are included and unmodified

## Validation

- [ ] Local validation passes: `python3 scripts/validate_results.py data/results`
- [ ] All required files present: `report.json`, `power.jsonl`, `bench.json`, `summary.md`

---

**Submitting results?** Read [CONTRIBUTING.md](../../CONTRIBUTING.md#submitting-results) for full details and the data honesty pledge.

**CI will automatically validate your submission.** If validation fails, fix and push again.
