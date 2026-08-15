# Lemon Metrics — results site

Public results and verification data for [LemonMetrics.github.io](https://LemonMetrics.github.io) — the community energy-per-token leaderboard for [Lemonade](https://github.com/lemonade-sdk/lemonade) local AI servers.

This repository is the **results platform**. It holds:

- `data/results/` — community-submitted benchmark runs, each containing `report.json` (normalized schema v1), raw `power.jsonl` and `baseline.jsonl` samples, raw `bench.json`, and `summary.md`. The raw power samples are the point: every number on the site is independently verifiable.
- `site/` — the static leaderboard (Astro → GitHub Pages).
- `worker/` — the Cloudflare Worker that powers community voting.
- `scripts/validate_results.py` — the CI validator every submission must pass.

The measurement harness itself lives in the separate [lemonmetrics](https://github.com/lemonmetrics/lemonmetrics) repository.

## Submitting a result

1. Install and run the harness ([docs](https://github.com/lemonmetrics/lemonmetrics/blob/main/docs/run-it-yourself.md)). Each run writes a `data/results/<device>/<run>/` directory with `report.json`, `power.jsonl`, and friends.
2. **Fork this repository** and add your `data/results/...` directory (you can do this entirely in the GitHub web UI — no clone needed).
3. **Open a pull request.** CI runs `scripts/validate_results.py` against the results directory; the schema must pass and power samples must look sane.
4. Once merged, the site rebuilds and your run appears on the leaderboard.

### Honesty rules

- Benchmark on **AC power** with `--runs 3` or more.
- Run the same model on one machine across backends for honest comparisons.
- Don't cherry-pick runs; submit what you measured. Methodology and energy math are documented in the [harness docs](https://github.com/lemonmetrics/lemonmetrics/blob/main/docs/methodology.md).

## Local development

```bash
# Validate the submitted results dataset
python3 scripts/validate_results.py data/results

# Build the static site (requires Node 22)
cd site && npm install && npm run build
```

The site build reads `data/results/` at build time and outputs static pages to `site/dist/` ready for GitHub Pages.

## CI / deploy

- `ci.yml` — validates submitted results on every PR.
- `deploy-site.yml` — builds the site and deploys to GitHub Pages on `main`.

## License

MIT — see [LICENSE](LICENSE).

## Support

Running the public site has costs. [Buy me a coffee](https://buymeacoffee.com/austincasteel) if the leaderboard helps you — it goes toward hosting and the domain.
