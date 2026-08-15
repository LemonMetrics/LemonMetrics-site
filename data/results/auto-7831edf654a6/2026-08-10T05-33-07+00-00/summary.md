# Lemon Metrics Report

- **generated_at**: 2026-08-10T05:35:00+00:00
- **lemonmetrics**: 0.1.0 (schema 1.0)
- **wall duration**: 111.4s

## Device

- **device_id**: `auto-7831edf654a6`
- **fingerprint**: `7831edf654a6`
- **OS**: Darwin 25.5.0
- **CPU**: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
- **cores**: 6 physical / 12 logical
- **memory**: 32.0 GB
- **GPU**: Intel UHD Graphics 630, AMD Radeon Pro 5300M

## Environment

- **power source**: ac
- **battery**: 79%

## Power

- **sampler**: powermetrics
- **samples**: 83
- **avg**: 25.392 W
- **min / peak**: 7.66 / 70.97 W
- **energy (wall)**: 2810.43 J
- **baseline (idle)**: 6.934 W over 8.914s

## Energy Efficiency

- **J/token** (all): 2.4124
- **J/output token**: 4.983
- **tokens/kWh**: 1492294.43
- **total tokens**: 1165
- **J/token (incremental)**: 1.7536
- **tokens/kWh (incremental)**: 2052895.23

## Per-Scenario

| scenario | category | in tok | out tok | tps | ttft ms | est. J/token |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| chat-short | chat | 27 | 20 | 48.3 | 103.6 | 0.2890 |
| chat-long-output | chat | 44 | 256 | 41.3 | 186.0 | 0.5415 |
| code-short | coding | 34 | 60 | 46.8 | 159.6 | 0.3940 |
| code-explain | coding | 166 | 128 | 40.3 | 608.5 | 0.3279 |
| code-debug | coding | 330 | 100 | 38.0 | 1253.0 | 0.2305 |

> per-scenario energy is avg power x scenario duration and excludes model-load overhead; incremental metrics subtract the idle baseline (6.934 W) and are estimates

## Lemonade Bench Hardware

- **cpu**: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz
- **ram**: 15.69 GB
- **os**: linux
- **backends**: {'llamacpp/cpu': 'b10241'}

## Command

```
bench Qwen3-0.6B-GGUF --backend cpu --runs 3 --json --output /tmp/lemonmetrics-bench.json
```
