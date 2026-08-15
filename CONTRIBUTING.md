# Contributing to Lemon Metrics Results

This repository holds benchmark results and the results website. To **submit benchmark results**, see the [Results Submission Workflow](#results-submission-workflow) below.

To contribute to the **website code or validation logic**, see [Code Contributions](#code-contributions).

---

## Results Submission Workflow

### Overview

1. Run the [Lemon Metrics harness](https://github.com/lemonmetrics/lemonmetrics)
2. Validate locally
3. Fork this repo and commit your `data/results/` directory
4. Open a PR with the **Results** template
5. CI validates automatically; maintainers merge

### Prerequisites

You'll need to have run the [Lemon Metrics harness](https://github.com/lemonmetrics/lemonmetrics) first. See its [CONTRIBUTING.md](https://github.com/lemonmetrics/lemonmetrics/blob/main/CONTRIBUTING.md#running-the-harness-benchmark-results) for harness installation and usage.

### Step 1: Run the Harness

```bash
# Install the harness (in a separate directory)
git clone https://github.com/lemonmetrics/lemonmetrics.git
cd lemonmetrics
python3 -m pip install -e ".[dev]"

# Run benchmarks (AC power required)
lemonmetrics probe  # See what your machine can measure

lemonmetrics run --model Qwen3-0.6B-GGUF --backend cpu --runs 3
lemonmetrics run --model Qwen3-0.6B-GGUF --backend vulkan --runs 3
lemonmetrics run --model Qwen3-0.6B-GGUF --backend flm_npu --runs 3
```

Each run produces a `data/results/<device_id>/<run_id>/` directory with:
- `report.json` — Full normalized report
- `power.jsonl` — Raw power samples (one JSON per line)
- `baseline.jsonl` — Raw idle baseline samples
- `bench.json` — Raw lemonade bench output
- `summary.md` — Human-readable summary

### Step 2: Validate Locally

```bash
# In your lemonmetrics directory, validate before committing
python3 scripts/validate_results.py data/results

# Output should show:
# ok   data/results/auto-XXXXXXXXX/2026-08-10T05-33-07+00-00/report.json
# 1 report(s) validated, 0 failed
```

If validation fails, review the error message and re-run the harness if needed.

### Step 3: Fork & Commit

```bash
# Fork lemonmetrics-site on GitHub, then:
git clone https://github.com/YOUR_USERNAME/lemonmetrics-site.git
cd lemonmetrics-site

# Copy your results from the lemonmetrics directory
cp -r /path/to/lemonmetrics/data/results/<device_id> data/results/

# Commit
git add data/results/<device_id>
git commit -m "Add benchmark results for <device_id>"
git push origin main
```

### Step 4: Open a PR

1. Go to [lemonmetrics/lemonmetrics-site](https://github.com/lemonmetrics/lemonmetrics-site)
2. Click "New Pull Request"
3. Select your fork and branch
4. **Use the Results PR template** (GitHub will suggest it)
5. Fill in the device info and confirm the honesty pledge
6. Submit

### Step 5: Wait for CI

CI automatically runs `scripts/validate_results.py` on your results:
- ✅ **Pass**: Maintainers will merge your results to the leaderboard
- ❌ **Fail**: Review the error, fix, and push again (same PR)

---

## Data Honesty Pledge

Please read and commit to these principles before submitting:

✅ **Always run on AC power** — Battery results aren't comparable.

✅ **Use `--runs 3` or more** — Single runs are too noisy.

✅ **Same model, multiple backends** — Honest comparisons on one machine (CPU vs iGPU vs NPU).

✅ **Don't cherry-pick runs** — Submit what you actually measured.

✅ **Keep raw data** — power.jsonl, baseline.jsonl, and bench.json are what make results verifiable.

✅ **Report unavailable data honestly** — If power isn't available (Windows), leave it marked unavailable. Never invent power numbers.

---

## Example PR Description (Results)

```markdown
## Device

- **Device ID**: `auto-7831edf654a6`
- **CPU**: Intel i7-9750H (6P + 6E)
- **Memory**: 32 GB DDR4
- **OS**: macOS 25.5.0
- **GPU**: Intel UHD 630 + AMD Radeon Pro 5300M

## Runs

- **Model**: Qwen3-0.6B-GGUF
- **Backends**: cpu, vulkan, flm_npu
- **Runs per backend**: 3
- **Power source**: AC only

## Environment Context

- CPU governor: performance
- Thermal state: Stable (~45°C)
- Background workloads: None
- Lemonade server: Native on macOS

## Notes

Power metrics unavailable (Intel Mac, server in Docker).
Performance metrics are authoritative.
All runs completed successfully; no failed scenarios.
```

---

## Code Contributions

Contributions to the website code, validation logic, or scripts are welcome!

### Development Setup

```bash
git clone https://github.com/lemonmetrics/lemonmetrics-site.git
cd lemonmetrics-site

# Build the website
cd site
npm install
npm run build

# Validate scripts
cd ../scripts
python3 -m pip install -e .
python3 validate_results.py ../data/results
```

### Common Contributions

#### Website Changes (Astro components, styling)
- Modify files in `site/src/`
- Test locally: `npm run dev`
- Open a PR with the standard template

#### Validation Script Changes
- Modify `scripts/validate_results.py`
- Ensure backward compatibility with existing reports
- Add tests if you add new validation rules

#### Worker Changes (Voting API)
- Modify `worker/src/index.ts`
- Test locally with Wrangler: `wrangler dev`
- Document environment variables (e.g., `FLAG_THRESHOLD`)

### PR Checklist (Code)

- [ ] Local build passes: `npm run build` (website) or tests pass (scripts)
- [ ] No breaking changes to schema or API
- [ ] Docstrings/comments added for new logic
- [ ] Changes documented in PR description

---

## Questions?

- **How do I run the harness?** → See [lemonmetrics/CONTRIBUTING.md](https://github.com/lemonmetrics/lemonmetrics/blob/main/CONTRIBUTING.md#running-the-harness-benchmark-results)
- **What should a valid report look like?** → See [lemonmetrics/CONTRIBUTING.md](https://github.com/lemonmetrics/lemonmetrics/blob/main/CONTRIBUTING.md#expected-report-structure)
- **Results validation failed** → Check error message; re-run harness if needed
- **Website bug or feature?** → Open an [Issue](https://github.com/lemonmetrics/lemonmetrics-site/issues)

---

## License

By contributing results or code, you agree that your contributions will be licensed under the [MIT License](LICENSE).

Thank you for contributing to the Lemon Metrics leaderboard! 🍋
