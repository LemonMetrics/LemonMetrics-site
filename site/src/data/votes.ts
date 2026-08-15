import fs from "node:fs";
import path from "node:path";
import { isFlagged, type VoteCounts } from "../lib/config";

export interface StaticVotes {
  updatedAt: string;
  votes: Record<string, VoteCounts>;
}

const VOTES_PATH = path.resolve(import.meta.dirname, "../../../votes.json");

export function loadStaticVotes(): StaticVotes {
  try {
    const raw = JSON.parse(fs.readFileSync(VOTES_PATH, "utf-8"));
    return {
      updatedAt: raw?.updatedAt ?? "",
      votes: raw?.votes ?? {},
    };
  } catch {
    return { updatedAt: "", votes: {} };
  }
}

export { isFlagged };
