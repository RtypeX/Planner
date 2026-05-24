# Dylan's HQ

Personal command center: a single-page React app that tracks the iPhone arbitrage hustle, BMT-prep fitness, life timeline, and finances. Built with **React + Vite + Tailwind CSS**, charts via **Recharts**, icons via **Lucide**, dates via **date-fns**.

## Modules

1. **Arbitrage Tracker** — dashboard, cycle log with UPS shipment tracking, privacy cards, projector
2. **Fitness Tracker** — BMT standards, workout log, progress charts, streak heatmap
3. **Life Timeline** — milestones, ASVAB prep
4. **Finance Overview** — balances, goals, profit/net-worth charts

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Storage

All data is stored client-side in `localStorage` under keys prefixed with `dylan_`. A "Reset all data" button is available in Settings. Backups can be exported/imported as JSON.

## UPS / shipment tracking

Each cycle has an optional **tracking number + carrier** field. The carrier is auto-detected from the tracking number format (1Z… = UPS, etc.).

- The **Track** button always works — it opens the public UPS/USPS/FedEx tracking page in a new tab. No setup needed.
- The **Refresh** button fetches live status (description, last update, delivered timestamp) and auto-bumps the cycle from `Ordered` → `Shipped`. This requires a small proxy because browsers can't call the UPS API directly (CORS + OAuth secret).

A ready-to-deploy Cloudflare Worker proxy is included in [`worker/`](./worker). Setup is ~5 minutes:

1. Get UPS API credentials at <https://developer.ups.com/>.
2. `cd worker && npm install`.
3. `npx wrangler secret put UPS_CLIENT_ID` and `UPS_CLIENT_SECRET`.
4. `npm run deploy` and copy the URL.
5. Paste it into **Settings → Tracking API → Proxy URL** in the app.

See [`worker/README.md`](./worker/README.md) for full instructions, including locking down CORS to your app's origin.
