# Dylan's HQ

Personal command center: a single-page React app that tracks the iPhone arbitrage hustle, BMT-prep fitness, life timeline, and finances. Built with **React + Vite + Tailwind CSS**, charts via **Recharts**, icons via **Lucide**, dates via **date-fns**.

## Modules

1. **Arbitrage Tracker** — dashboard, cycle log, privacy cards, projector
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

All data is stored client-side in `localStorage` under keys prefixed with `dylan_`. A "Reset all data" button is available in Settings.
