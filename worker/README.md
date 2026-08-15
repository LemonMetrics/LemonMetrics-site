# Lemon Metrics votes API (Cloudflare Worker)

A tiny Cloudflare Worker + KV namespace that powers the community voting on [LemonMetrics.github.io](https://LemonMetrics.github.io). Anyone can up-vote a result they trust or down-vote one that looks wrong. When a run's net score drops to `-FLAG_THRESHOLD` (default 10), it is marked **flagged for verification** and is hidden from the leaderboard until a maintainer re-checks the raw data.

Voting is **one vote per result per person**: once you cast a vote it is locked and cannot be flipped or cleared. Combined with the IP+VoterId identity hash below, a single person can never stack multiple down-votes on a result to game the leaderboard.

## API

- `GET /votes` → `{ "votes": { "<deviceId>/<runId>": { "up": n, "down": n } } }`
- `POST /vote` with JSON body `{ "voteKey": "<deviceId>/<runId>", "dir": 1|-1, "voterId": "<uuid>" }`
  - `dir: 1` up-vote, `dir: -1` down-vote.
  - `voterId` is a UUID generated once per browser (kept in `localStorage`).
  - Identity is hardened server-side by hashing `CF-Connecting-IP + voterId`.
  - Voting the same direction again is a no-op (200 with current counts).
  - Trying to flip, clear, or re-vote after casting returns `409 Conflict` — the vote is locked.
  - Response: `{ "votes": { "up": n, "down": n }, "flagged": boolean }`
- `OPTIONS` preflight is handled for CORS.

Counts live in KV under `v:<voteKey>`; per-voter records live under `voter:<hash>:<voteKey>`.

## Deploy

1. Install dependencies:

   ```sh
   cd worker
   npm install
   ```

2. Create a KV namespace and copy its id into `wrangler.toml`:

   ```sh
   npx wrangler kv namespace create VOTES
   ```

   Paste the returned `id` into the `[[kv_namespaces]]` block.

3. Deploy:

   ```sh
   npx wrangler deploy
   ```

   You'll get a `https://lemonmetrics-votes.<subdomain>.workers.dev` URL.

4. Point the site at it. Either set `PUBLIC_VOTES_API` in the site's
   build environment (GitHub Pages workflow / local `.env`), or set it for your local dev server:

   ```sh
   echo 'PUBLIC_VOTES_API=https://lemonmetrics-votes.<subdomain>.workers.dev' > ../site/.env
   ```

## Notes

- KV is eventually consistent, so a vote may take a few seconds to appear in `GET /votes`. This is fine for community moderation.
- `FLAG_THRESHOLD` is configurable via the `[vars]` block in `wrangler.toml`.
- Votes are an overlay on the static results dataset; the deploy workflow periodically snapshots `GET /votes` into `votes.json` so the static site has vote data even before the browser finishes a live fetch.
