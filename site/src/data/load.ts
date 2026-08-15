// Build-time loader: reads ../data/results/<device>/<run>/report.json and
// flattens each run into a normalized summary for the leaderboard.

import fs from "node:fs";
import path from "node:path";

export interface ScenarioSummary {
  name: string;
  category: string;
  inputTokens: number;
  outputTokens: number;
  tps: number | null;
  ttftMs: number | null;
  durationMs: number | null;
  memoryPeakGb: number | null;
  estimatedJoulesPerToken: number | null;
}

export interface RunSummary {
  deviceId: string;
  runId: string;
  generatedAt: string;
  deviceOs: string;
  cpuModel: string;
  gpu: string[];
  npu: string[];
  model: string;
  backend: string;
  recipe: string;
  command: string;
  powerAvailable: boolean;
  sampler: string;
  avgWatts: number | null;
  peakWatts: number | null;
  wallEnergyJoules: number | null;
  joulesPerToken: number | null;
  joulesPerOutputToken: number | null;
  tokensPerKwh: number | null;
  totalTokens: number | null;
  meanTps: number | null;
  meanTtftMs: number | null;
  memoryPeakGb: number | null;
  scenarios: ScenarioSummary[];
  report: unknown;
}

const RESULTS_DIR = path.resolve(import.meta.dirname, "../../../data/results");

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function mean(values: (number | null)[]): number | null {
  const clean = values.filter((v): v is number => v !== null);
  if (clean.length === 0) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function parseRun(deviceId: string, runId: string, filePath: string): RunSummary | null {
  let report: any;
  try {
    report = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error(`Failed to parse report at ${filePath}:`, err instanceof Error ? err.message : String(err));
    return null;
  }

  const models = report?.lemonade?.bench_output?.models ?? [];
  const firstModel = models[0];
  const firstResult = firstModel?.results?.[0];
  const scenarios = firstResult?.scenarios ?? [];

  const model = firstModel?.model ?? "unknown";
  const backend = firstResult?.backend ?? "unknown";
  const recipe = firstResult?.recipe ?? "unknown";
  const power = report?.power ?? {};
  const efficiency = report?.efficiency ?? {};
  const device = report?.device ?? {};

  const scenarioSummaries: ScenarioSummary[] = scenarios.map((s: any) => ({
    name: s?.name ?? "?",
    category: s?.category ?? "?",
    inputTokens: s?.input_tokens ?? 0,
    outputTokens: s?.output_tokens ?? 0,
    tps: num(s?.tps?.mean),
    ttftMs: num(s?.ttft_ms?.mean),
    durationMs: num(s?.duration_ms?.mean),
    memoryPeakGb: num(s?.memory_peak_gb),
    estimatedJoulesPerToken: num(
      efficiency?.by_scenario?.find((e: any) => e.name === s?.name)
        ?.estimated_joules_per_token,
    ),
  }));

  return {
    deviceId,
    runId,
    generatedAt: report?.generated_at ?? "",
    deviceOs: `${device?.os ?? ""} ${device?.os_release ?? ""}`.trim(),
    cpuModel: device?.cpu?.model ?? "unknown",
    gpu: device?.gpu ?? [],
    npu: device?.npu ?? [],
    model,
    backend,
    recipe,
    command: (report?.lemonade?.command ?? []).join(" "),
    powerAvailable: Boolean(power?.available),
    sampler: power?.sampler ?? "null",
    avgWatts: num(power?.avg_watts),
    peakWatts: num(power?.max_watts),
    wallEnergyJoules: num(power?.energy_joules),
    joulesPerToken: num(efficiency?.joules_per_token),
    joulesPerOutputToken: num(efficiency?.joules_per_output_token),
    tokensPerKwh: num(efficiency?.tokens_per_kwh),
    totalTokens: num(efficiency?.total_tokens),
    meanTps: mean(scenarioSummaries.map((s) => s.tps)),
    meanTtftMs: mean(scenarioSummaries.map((s) => s.ttftMs)),
    memoryPeakGb: mean(scenarioSummaries.map((s) => s.memoryPeakGb)),
    scenarios: scenarioSummaries,
    report,
  };
}

export function loadRuns(): RunSummary[] {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  const runs: RunSummary[] = [];
  for (const deviceId of fs.readdirSync(RESULTS_DIR, { withFileTypes: true })) {
    if (!deviceId.isDirectory() || deviceId.name.startsWith(".")) continue;
    const deviceDir = path.join(RESULTS_DIR, deviceId.name);
    for (const runEntry of fs.readdirSync(deviceDir, { withFileTypes: true })) {
      if (!runEntry.isDirectory()) continue;
      const reportPath = path.join(deviceDir, runEntry.name, "report.json");
      if (!fs.existsSync(reportPath)) continue;
      const run = parseRun(deviceId.name, runEntry.name, reportPath);
      if (run) runs.push(run);
    }
  }
  runs.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  return runs;
}

export function loadDevices(): string[] {
  return [...new Set(loadRuns().map((r) => r.deviceId))].sort();
}

export function voteKey(run: RunSummary): string {
  return `${run.deviceId}/${run.runId}`;
}

export function bestPerCombo(runs: RunSummary[]): RunSummary[] {
  const groups = new Map<string, RunSummary[]>();
  for (const r of runs) {
    const key = `${r.deviceId}\u0001${r.model}\u0001${r.backend}`;
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(r);
  }
  const out: RunSummary[] = [];
  for (const list of groups.values()) {
    const withPower = list.filter((r) => r.joulesPerToken != null);
    if (withPower.length > 0) {
      out.push(
        withPower.sort(
          (a, b) =>
            a.joulesPerToken! - b.joulesPerToken! ||
            (b.meanTps ?? 0) - (a.meanTps ?? 0),
        )[0],
      );
      continue;
    }
    const withTps = list.filter((r) => r.meanTps != null);
    out.push(withTps.length > 0 ? withTps.sort((a, b) => b.meanTps! - a.meanTps!)[0] : list[0]);
  }
  out.sort((a, b) => (a.joulesPerToken ?? Infinity) - (b.joulesPerToken ?? Infinity));
  return out;
}
