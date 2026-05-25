# Dylan's HQ — multi-carrier tracking proxy

A small Cloudflare Worker that talks to **TrackingMore** so the web app can
show live UPS / USPS / FedEx (and 1,200+ other carriers) status. TrackingMore
handles all the carrier-specific scraping under one API key.

```
GET /health                              -> { ok: true, version }
GET /track?number=1Z...&carrier=UPS      -> normalized tracking JSON
```

The web app calls these directly. Your TrackingMore key never leaves the Worker.

---

## 1. Get a TrackingMore API key

1. Sign up at <https://www.trackingmore.com/> — there's a 14-day trial that
   covers ~100 trackings; afterward, the free **Forever Free** plan covers
   100 trackings/month for personal use.
2. In the dashboard go to **API Settings → API Key** and copy your key.

A "tracking" is one tracking number being monitored — refreshing the same
number multiple times doesn't add to the count. Most personal arbitrage
volume fits comfortably in the free tier.

## 2. Install the Cloudflare CLI

```bash
npm install        # installs wrangler locally inside ./worker
```

If this is your first time using Wrangler:

```bash
npx wrangler login
```

## 3. Set the secret

```bash
npx wrangler secret put TRACKINGMORE_API_KEY
# paste your key when prompted
```

(Optional, recommended once you're past local testing)

```bash
# Lock CORS down to just the deployed app:
npx wrangler secret put ALLOWED_ORIGIN
# e.g. https://your-app.example.com
```

## 4. Run locally

Create `worker/.dev.vars` with:

```
TRACKINGMORE_API_KEY=your_key_here
```

Then:

```bash
npm run dev
# Worker boots on http://localhost:8787
# Test it (TrackingMore doesn't have a public test number — use a real one):
curl 'http://localhost:8787/health'
curl 'http://localhost:8787/track?number=1Z999AA10123456784&carrier=UPS'
```

## 5. Deploy

```bash
npm run deploy
# Wrangler prints the public URL, e.g.
# https://dylans-hq-tracking.your-name.workers.dev
```

## 6. Wire it into Dylan's HQ

1. Open the app, click the gear (Settings).
2. Paste the Worker URL into **Tracking API → Proxy URL**.
3. Click **Test** to verify, then **Save**.
4. The Refresh buttons in the cycle log are now live.

---

## How it works

The worker has two endpoints. `/track` does this:

1. Looks up an existing TrackingMore record for the tracking number
   (`GET /v4/trackings/get?tracking_numbers=...`). If we've already created
   one, return it. This is free — doesn't count against your quota.
2. If none exists, creates one (`POST /v4/trackings/create`). This is the
   "real-time" v4 endpoint which creates + scrapes + returns in a single call.
   Counts as one tracking against your quota.
3. Translates TrackingMore's `delivery_status` enum into the same short codes
   the React app uses (`D` delivered, `O` out for delivery, `I` in transit,
   `X` exception, etc.).

The first call for a brand-new tracking number can return `Pending` or
`Notfound` for a few minutes while TrackingMore queues a scrape. Refresh
again later to get real status.

## Costs

- Cloudflare Workers free tier: 100k requests/day.
- TrackingMore Forever Free: 100 trackings/month after the trial.
  Higher tiers start at $9/month for 250 trackings.

## Carrier codes

Pass `&carrier=ups` (lowercase) for best results. TrackingMore tries to
auto-detect when omitted but it's faster and more reliable to be explicit.
The web app sends the carrier automatically based on the tracking number
format. Common codes: `ups`, `usps`, `fedex`, `dhl`. Full list in the
TrackingMore docs.

## Security notes

- Never commit `.dev.vars` or anything with your API key.
- Set `ALLOWED_ORIGIN` to the exact deployed app origin once you're past
  local testing — otherwise anyone who finds your Worker URL can use your
  TrackingMore quota.
- The Worker only forwards GET requests. It doesn't read or store anything.

## Troubleshooting

- **`TrackingMore auth failed (401)`** — wrong API key. Re-run
  `wrangler secret put TRACKINGMORE_API_KEY`.
- **`Notfound` on a real package** — TrackingMore couldn't match the carrier.
  Make sure you pass the right `carrier` (e.g. `ups`, not `UPS`). The web app
  does this for you, but it's worth checking the cycle's Carrier field.
- **Quota exceeded** — you've used your monthly trackings. Existing tracked
  numbers keep refreshing for free; only new ones count.
- **`wrangler` not found** — you didn't `cd worker` first. Wrangler is
  installed locally to `worker/node_modules/`, not globally.
