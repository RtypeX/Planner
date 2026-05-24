# Dylan's HQ — UPS tracking proxy

A 100-line Cloudflare Worker that holds your UPS API credentials and exposes
two endpoints to the Dylan's HQ web app:

```
GET /health                              -> { ok: true, version }
GET /track?number=1Z...&carrier=UPS      -> normalized tracking JSON
```

The web app calls these directly. Your client ID/secret never leave the Worker.

---

## 1. Get UPS API credentials

1. Sign up at <https://developer.ups.com/>.
2. Create an app and request access to the **Tracking** product.
3. Copy your **Client ID** and **Client Secret**.

You can use the UPS sandbox (no real shipments) by setting `UPS_ENV=test`.

## 2. Install the Cloudflare CLI

```bash
npm install        # installs wrangler locally inside ./worker
# or globally:
npm install -g wrangler
```

If this is your first time using Wrangler:

```bash
npx wrangler login
```

## 3. Set the secrets

```bash
npx wrangler secret put UPS_CLIENT_ID
npx wrangler secret put UPS_CLIENT_SECRET
```

(Optional, recommended in production)

```bash
# Lock CORS down to just the deployed app:
npx wrangler secret put ALLOWED_ORIGIN          # e.g. https://your-app.example.com
# Use UPS sandbox while testing:
npx wrangler secret put UPS_ENV                 # "test" or "prod"
```

## 4. Run locally

```bash
npm run dev
# Worker boots on http://localhost:8787
# Test it:
curl 'http://localhost:8787/health'
curl 'http://localhost:8787/track?number=1Z999AA10123456784'
```

## 5. Deploy

```bash
npm run deploy
# Wrangler prints the public URL, e.g. https://dylans-hq-tracking.your-name.workers.dev
```

## 6. Wire it into Dylan's HQ

1. Open the app, click the gear (Settings).
2. Paste the Worker URL into **Tracking API → Proxy URL**.
3. Click **Test** to verify, then **Save**.
4. The Refresh buttons in the cycle log are now live.

---

## Costs

The Cloudflare Workers free tier gives you 100k requests/day. UPS rate limits
production tracking calls — check the dashboard. With under a few hundred
shipments/month, both are essentially free.

## Customizing

- The `/track` endpoint currently supports UPS only. To add USPS or FedEx,
  branch on `carrier` in `src/index.js` and add a similar `fetch...` helper.
- The response shape is intentionally minimal so the React client can stay
  simple. `events` returns the most recent 25 scans with timestamps in ISO 8601.

## Security notes

- Never commit `.dev.vars` or anything with your client secret.
- Set `ALLOWED_ORIGIN` to the exact deployed app origin once you're past
  local testing — otherwise anyone who finds your Worker URL can use your
  UPS quota.
- The Worker only forwards GET requests. It doesn't read or store anything.
