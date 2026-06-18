# StellarFlow

> Send, swap, and schedule XLM & USDC payments on Stellar. A Freighter-connected PWA with on-chain DEX swaps and recurring payment automation.

StellarFlow is an open-source, self-custodial Stellar wallet built as a mobile-first Progressive Web App. It extends what Freighter offers out of the box — adding DEX-powered asset swaps, shareable payment request links, and a recurring payments scheduler that Freighter has no native support for.

Built for the [Stellar Wave Program](https://www.drips.network/wave/stellar) on Drips.

---

## Features

### Wallet Dashboard
Connect your Freighter wallet and view all your Stellar balances in real-time. Balances auto-refresh every 15 seconds. Includes a direct link to Stellar Expert explorer for full transaction history.

### Send XLM & USDC
Send any supported asset to any Stellar address. Choose the asset, enter the destination, set an amount, and add an optional memo. Transactions are built, signed via Freighter, and submitted directly to Horizon.

### Swap via Stellar DEX
Swap XLM ↔ USDC using Stellar's native on-chain order book — no third-party AMM or bridge needed. StellarFlow queries Horizon's `strictSendPaths` endpoint to find the best route, shows you a live quote with the exchange rate and minimum received (1% slippage tolerance), then executes a `pathPaymentStrictSend` operation on-chain.

### Payment Request Links
Generate a shareable payment link pre-filled with your address, a requested amount, asset type, and optional memo. Anyone who opens the link sees a clean payment page and can pay you in one click — even without a StellarFlow account. Includes a QR code for in-person use.

### Recurring Payments *(Freighter doesn't have this)*
Schedule automatic XLM or USDC transfers on a daily, weekly, or monthly basis. Each schedule stores the destination, amount, asset, and frequency. When the app is open and a payment comes due, it executes automatically and prompts Freighter to sign. Every execution is logged with its transaction hash and status, and you can pause, resume, or delete any schedule at any time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v3 |
| Routing | React Router DOM v7 |
| Wallet integration | `@stellar/freighter-api` v6 |
| Blockchain SDK | `@stellar/stellar-sdk` v15 |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| Network | Stellar Testnet (mainnet-ready) |

---

## Project Structure

```
stellarflow/
├── src/
│   ├── App.tsx                        # Root router and layout
│   ├── main.tsx                       # React entry point
│   ├── index.css                      # Global styles + Tailwind
│   │
│   ├── context/
│   │   └── WalletContext.tsx          # Freighter wallet state (connect, sign, disconnect)
│   │
│   ├── hooks/
│   │   ├── useBalances.ts             # Fetches + auto-refreshes account balances
│   │   └── useScheduler.ts            # Polls for due recurring payments and executes them
│   │
│   ├── lib/
│   │   ├── stellar.ts                 # Core Stellar logic: build/submit txs, swap quotes, payment links
│   │   └── scheduler.ts               # localStorage CRUD for scheduled payments + time helpers
│   │
│   ├── components/
│   │   ├── AssetBadge.tsx             # XLM / USDC visual badge component
│   │   ├── BottomNav.tsx              # Mobile navigation bar (5 tabs)
│   │   └── ProtectedRoute.tsx         # Redirects to connect page if wallet not connected
│   │
│   ├── pages/
│   │   ├── ConnectPage.tsx            # Landing page — Freighter connect flow
│   │   ├── DashboardPage.tsx          # Portfolio overview + quick actions
│   │   ├── SendPage.tsx               # Send XLM or USDC
│   │   ├── SwapPage.tsx               # DEX swap with live quote + route display
│   │   ├── RequestPage.tsx            # Generate payment request link + QR code
│   │   ├── PayPage.tsx                # Handles incoming /pay?... links
│   │   ├── SchedulePage.tsx           # Recurring payments manager
│   │   └── QRCode.tsx                 # Canvas-based QR code renderer
│   │
│   └── types/
│       └── index.ts                   # Shared TypeScript interfaces
│
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- [Freighter Wallet](https://freighter.app) browser extension installed
- Freighter set to **Testnet** in its network settings

### Install and run

```bash
git clone https://github.com/YOUR_USERNAME/stellarflow.git
cd stellarflow
npm install
npm run dev
```

Open `http://localhost:5173` in your browser, then click **Connect Freighter**.

### Fund your testnet account

You need testnet XLM to pay transaction fees and test sends/swaps. Visit Friendbot to get free testnet XLM:

```
https://friendbot.stellar.org/?addr=YOUR_STELLAR_ADDRESS
```

To test USDC swaps, you also need a USDC trustline. Add it inside Freighter: **Settings → Add Asset → search USDC** and use the testnet issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.

---

## How the Swap Works

StellarFlow uses Stellar's built-in path payment operation — no external AMM protocol or bridge is required.

1. When you enter an amount, StellarFlow calls `horizon.strictSendPaths(sendAsset, amount, [destAsset])` to find the best route through the order book
2. The response includes the expected output amount and the intermediate path (e.g. XLM → USDC directly, or XLM → some anchor → USDC)
3. That exact path is embedded in a `pathPaymentStrictSend` operation
4. Freighter signs the transaction
5. The signed XDR is POSTed directly to `https://horizon-testnet.stellar.org/transactions`

The direct POST to Horizon (rather than going through the SDK's `submitTransaction` wrapper) avoids envelope re-parsing issues that can cause 404 errors with some SDK versions.

---

## How Recurring Payments Work

Schedules are stored in `localStorage` under the key `stellarflow:scheduled`. Each entry holds the destination, amount, asset, frequency, next run time, and an execution log.

The `useScheduler` hook runs on mount and polls every 60 seconds. When a payment is due (`nextRun <= now` and `enabled === true`), it builds and submits the transaction automatically, then updates `nextRun` to the next interval. The execution log stores the transaction hash and status for every run, viewable inline in the Recurring tab.

This feature does not exist in Freighter and has no equivalent in any other Stellar wallet extension.

---

## Switching to Mainnet

Three files need updating:

**`src/lib/stellar.ts`** — update Horizon URL, network passphrase, and USDC issuer:

```ts
const HORIZON_URL = 'https://horizon.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.PUBLIC;

export const USDC_ASSET = new StellarSdk.Asset(
  'USDC',
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' // Circle mainnet
);
```

**`src/context/WalletContext.tsx`** — update the signing passphrase:

```ts
networkPassphrase: 'Public Global Stellar Network ; September 2015',
```

**All explorer links** (DashboardPage, SendPage, SwapPage, PayPage) — swap `testnet` for `public`:

```ts
// from:
`https://stellar.expert/explorer/public/tx/${hash}`
// to:
`https://stellar.expert/explorer/public/tx/${hash}`
```

Also switch Freighter itself to **Mainnet** in its extension settings before testing.

---

## Contributing

This project is registered with the [Stellar Wave Program](https://www.drips.network/wave/stellar) on Drips. Issues tagged `Stellar Wave` are open for contributors and eligible for rewards funded by the Stellar Development Foundation.

### Good first issues

- Replace canvas QR with `qrcode.react` for proper scannable codes
- Add transaction history view (pull from Horizon `payments` endpoint)
- Add clipboard paste button on destination address fields
- Add PWA manifest and service worker for offline support
- Add Soroswap AMM as an alternative swap route
- Add support for additional Stellar anchors (BTC, ETH via SEP-24)
- Add dark/light theme toggle
- Add network switching UI (testnet ↔ mainnet) without code changes

### Running locally for development

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # ESLint check
```

---

## Architecture Notes

**No backend.** StellarFlow is entirely frontend. All blockchain interaction goes directly to Horizon. Wallet keys never leave Freighter. Scheduled payment data lives in the user's own `localStorage`.

**Self-custodial.** StellarFlow never holds, sees, or transmits your private keys. Signing always happens inside the Freighter extension.

**Submission flow.** After Freighter signs a transaction, StellarFlow receives the signed XDR string and POSTs it to Horizon's `/transactions` endpoint directly via `fetch`. This bypasses the SDK's `submitTransaction` wrapper which can re-parse the envelope and cause signature issues.

---

## License

MIT — free to use, fork, and contribute.