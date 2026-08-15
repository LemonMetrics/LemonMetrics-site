export interface VoteCounts {
  up: number;
  down: number;
}

export const FLAG_THRESHOLD = 10;

export const VOTES_API_URL: string =
  (import.meta.env.PUBLIC_VOTES_API as string | undefined) || "";

export function isFlagged(v: VoteCounts | null | undefined): boolean {
  if (!v) return false;
  return v.up - v.down <= -FLAG_THRESHOLD;
}
