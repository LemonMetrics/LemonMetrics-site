import { isFlagged, VOTES_API_URL, type VoteCounts } from "./config";

export { isFlagged, VOTES_API_URL };
export type { VoteCounts };

const VOTER_KEY = "lemonmetrics.voterId";
const MY_VOTE_PREFIX = "lemonmetrics.vote.";

export type VoteDir = -1 | 0 | 1;

export function getVoterId(): string {
  if (typeof localStorage === "undefined") return "";
  let id = localStorage.getItem(VOTER_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

export function myVote(voteKey: string): VoteDir {
  if (typeof localStorage === "undefined") return 0;
  return (Number(localStorage.getItem(MY_VOTE_PREFIX + voteKey)) || 0) as VoteDir;
}

export function setMyVote(voteKey: string, dir: VoteDir): void {
  if (typeof localStorage === "undefined") return;
  if (dir === 0) localStorage.removeItem(MY_VOTE_PREFIX + voteKey);
  else localStorage.setItem(MY_VOTE_PREFIX + voteKey, String(dir));
}

export async function fetchLiveVotes(): Promise<Record<string, VoteCounts>> {
  if (!VOTES_API_URL) return {};
  try {
    const res = await fetch(`${VOTES_API_URL}/votes`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.votes ?? {};
  } catch {
    return {};
  }
}

export async function castVote(
  voteKey: string,
  dir: VoteDir,
): Promise<{ votes: VoteCounts; flagged: boolean } | null> {
  if (!VOTES_API_URL) return null;
  try {
    const res = await fetch(`${VOTES_API_URL}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voteKey, dir, voterId: getVoterId() }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function highlightMyVotes(): void {
  document.querySelectorAll<HTMLElement>("[data-vote-key]").forEach((el) => {
    const key = el.dataset.voteKey!;
    const my = myVote(key);
    el.querySelectorAll<HTMLButtonElement>("[data-vote-dir]").forEach((b) => {
      const active = my !== 0 && Number(b.dataset.voteDir) === my;
      b.classList.toggle("active", active);
      b.disabled = my !== 0;
    });
  });
}

export function bindVoteWidget(): void {
  if ((window as any).__lmVotesBound) return;
  (window as any).__lmVotesBound = true;

  function rootFor(key: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-vote-key="${CSS.escape(key)}"]`);
  }

  function render(key: string, v: VoteCounts): void {
    const root = rootFor(key);
    if (!root) return;
    const upEl = root.querySelector<HTMLElement>("[data-vote-count='up']");
    const downEl = root.querySelector<HTMLElement>("[data-vote-count='down']");
    if (upEl) upEl.textContent = String(v.up);
    if (downEl) downEl.textContent = String(v.down);
    const flagged = isFlagged(v);
    root.classList.toggle("flagged", flagged);
    const badge = root.querySelector<HTMLElement>("[data-flag-badge]");
    if (badge) badge.style.display = flagged ? "" : "none";
    root.dispatchEvent(
      new CustomEvent("lm:votes", { detail: { key, votes: v, flagged } }),
    );
  }

  document.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-vote-dir]");
    if (!btn) return;
    const root = btn.closest<HTMLElement>("[data-vote-key]");
    if (!root) return;
    const key = root.dataset.voteKey!;
    const dir = Number(btn.dataset.voteDir) as 1 | -1;

    // One vote per result per person: once cast, it is locked.
    if (myVote(key) !== 0) return;

    btn.disabled = true;
    try {
      const res = await castVote(key, dir);
      if (res) {
        setMyVote(key, dir);
        render(key, res.votes);
        highlightMyVotes();
      } else {
        btn.disabled = false;
      }
    } catch {
      btn.disabled = false;
    }
  });

  highlightMyVotes();

  if (VOTES_API_URL) {
    fetchLiveVotes().then((votes) => {
      for (const [key, v] of Object.entries(votes)) {
        if (rootFor(key)) render(key, v);
      }
    });
  }
}
