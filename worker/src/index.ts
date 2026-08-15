export interface VoteCounts {
  up: number;
  down: number;
}

export interface Env {
  VOTES: KVNamespace;
  FLAG_THRESHOLD?: string;
}

const DEFAULT_FLAG_THRESHOLD = 10;

const JSON_HEADERS = { "content-type": "application/json;charset=UTF-8" };

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = {
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
  }
  return headers;
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, ...JSON_HEADERS },
  });
}

function threshold(env: Env): number {
  const n = Number(env.FLAG_THRESHOLD);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : DEFAULT_FLAG_THRESHOLD;
}

async function readCounts(env: Env, key: string): Promise<VoteCounts> {
  const raw = await env.VOTES.get(`v:${key}`);
  if (!raw) return { up: 0, down: 0 };
  try {
    const parsed = JSON.parse(raw);
    return {
      up: Math.max(0, Number(parsed.up) || 0),
      down: Math.max(0, Number(parsed.down) || 0),
    };
  } catch {
    return { up: 0, down: 0 };
  }
}

async function applyVote(
  env: Env,
  key: string,
  identity: string,
  dir: number,
): Promise<{ counts: VoteCounts; locked: boolean }> {
  const voterKey = `voter:${identity}:${key}`;
  const curRaw = await env.VOTES.get(voterKey);
  const cur = curRaw ? Number(curRaw) : 0;

  const counts = await readCounts(env, key);

  // One vote per person per result: a repeat of the same vote is idempotent,
  // but a flip or a clear after the vote is cast is rejected.
  if (cur !== 0) {
    if (dir === cur) return { counts, locked: false };
    return { counts, locked: true };
  }
  if (dir === 0) return { counts, locked: false };

  await env.VOTES.put(voterKey, String(dir));
  if (dir === 1) counts.up += 1;
  else counts.down += 1;
  await env.VOTES.put(`v:${key}`, JSON.stringify(counts));
  return { counts, locked: false };
}

async function voterIdentity(req: Request, voterId: string): Promise<string> {
  const ip = req.headers.get("CF-Connecting-IP") ?? "unknown";
  const data = new TextEncoder().encode(`${ip}:${voterId}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const headers = corsHeaders(req);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (req.method === "GET" && url.pathname === "/votes") {
      const list = await env.VOTES.list({ prefix: "v:" });
      const votes: Record<string, VoteCounts> = {};
      for (const k of list.keys) {
        const raw = await env.VOTES.get(k.name);
        if (!raw) continue;
        try {
          votes[k.name.slice(2)] = JSON.parse(raw);
        } catch {
          // skip malformed entry
        }
      }
      return json({ votes, updatedAt: new Date().toISOString() }, 200, headers);
    }

    if (req.method === "POST" && url.pathname === "/vote") {
      let body: any;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid json" }, 400, headers);
      }
      const voteKey = String(body?.voteKey ?? "");
      const dir = Number(body?.dir);
      const voterId = String(body?.voterId ?? "");

      if (!voteKey || ![-1, 0, 1].includes(dir) || !voterId) {
        return json({ error: "voteKey, dir (-1|0|1) and voterId required" }, 400, headers);
      }
      if (voteKey.length > 200 || voterId.length > 200) {
        return json({ error: "payload too long" }, 400, headers);
      }

      const identity = await voterIdentity(req, voterId);
      const { counts, locked } = await applyVote(env, voteKey, identity, dir);
      const flagged = counts.up - counts.down <= -threshold(env);
      if (locked) {
        return json(
          { error: "one vote per result per person", votes: counts, flagged },
          409,
          headers,
        );
      }
      return json({ votes: counts, flagged }, 200, headers);
    }

    return json({ error: "not found" }, 404, headers);
  },
};
