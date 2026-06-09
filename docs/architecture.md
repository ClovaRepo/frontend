# Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              CLOVA SYSTEM                                    │
├──────────────────┬───────────────────────────┬──────────────────────────────┤
│   FRONTEND       │       BACKEND AGENT        │     BLOCKCHAIN (Base)         │
│   (Next.js)      │     (Node + TypeScript)    │                              │
│                  │                            │  ┌─────────────────────────┐ │
│  ┌────────────┐  │  ┌─────────────────────┐  │  │   ClovaSavingsPool      │ │
│  │  Onboarding│  │  │  Signal Collector   │  │  │   principalBaseline[]   │ │
│  │  EIP-7702  │  │  │  LI.FI Earn API     │  │  │   roundYieldPool        │ │
│  │  Upgrade   │──┼─▶│  + DeFiLlama fallbk │  │  │   Pyth Entropy VRF      │ │
│  └────────────┘  │  └─────────────────────┘  │  └─────────────────────────┘ │
│                  │            │               │              │               │
│  ┌────────────┐  │  ┌─────────▼───────────┐  │  ┌──────────▼──────────────┐ │
│  │  Delegation│  │  │  Venice AI Reasoner │  │  │   AaveAdapter           │ │
│  │  Signer    │  │  │  Web Search ON      │  │  │   CompoundAdapter       │ │
│  │  ERC-7710  │──┼─▶│  JSON output guard  │  │  │   MoonwellAdapter       │ │
│  └────────────┘  │  └─────────────────────┘  │  └─────────────────────────┘ │
│                  │            │               │                              │
│  ┌────────────┐  │  ┌─────────▼───────────┐  │  ┌─────────────────────────┐ │
│  │  Dashboard │  │  │  Guardrail Layer    │  │  │   User Smart Accounts   │ │
│  │  AI Panel  │◀─┼──│  TVL / RiskScore /  │  │  │   (EIP-7702 upgraded)   │ │
│  │  Win Chance│  │  │  APY delta checks   │  │  │   aTokens held here     │ │
│  └────────────┘  │  └─────────────────────┘  │  └─────────────────────────┘ │
│                  │            │               │                              │
│                  │  ┌─────────▼───────────┐  │                              │
│                  │  │  Executor           │──┼─▶  1Shot Relayer              │
│                  │  │  sweepYieldBatch()  │  │    relayer_send7710Tx         │
│                  │  │  rotateProtocol()   │  │    (EIP-7702 + ERC-7710)     │
│                  │  │  requestDraw()      │  │                              │
│                  │  └─────────────────────┘  │                              │
│                  │            │               │                              │
│                  │  ┌─────────▼───────────┐  │                              │
│                  │  │  x402 Payer         │──┼─▶  Venice API (paid/call)     │
│                  │  │  Treasury delegation│  │                              │
│                  │  └─────────────────────┘  │                              │
└──────────────────┴───────────────────────────┴──────────────────────────────┘
```

---

## Component Breakdown

### Frontend (Next.js + Wagmi + viem)

| Component | File | Responsibility |
|---|---|---|
| Landing Page | `web-landing.jsx` | Marketing, connect CTA |
| Onboarding Flow | `screens-ob.jsx` | EIP-7702 upgrade → delegation signing → deposit |
| Dashboard | `screens-dash.jsx` | Principal, yield, win%, AI panel, withdraw |
| Wallet Context | `wallet-context.jsx` | All on-chain reads/writes, delegation logic |
| Config | `lib/clova.js` | Addresses, ABIs, chain config from env vars |

**Key flows in wallet-context.jsx:**
- `connectWallet()` → MetaMask connect + chain switch
- `upgradeToSmartAccount()` → EIP-7702 authorization via MetaMask SDK
- `signDelegation()` → ERC-7715 `wallet_grantPermissions` → store in backend
- `deposit()` → approve USDC → Aave supply → record principal
- `withdraw()` → Aave withdraw → sync baseline via backend
- `fetchPoolData()` → multi-call: principal, yield, round state, participants

---

### Backend Agent (Node.js + TypeScript + Express)

| Module | File | Responsibility |
|---|---|---|
| API Server | `api.ts` | REST endpoints, webhooks, admin routes |
| Scheduler | `scheduler.ts` | Daily sweep cycle + weekly draw cycle |
| Signal Collector | `signals.ts` | LI.FI Earn API + DeFiLlama + on-chain utilization |
| Venice AI | `venice.ts` | AI reasoning, web search, auto top-up |
| Guardrail | `guardrail.ts` | Safety checks before executing AI recommendation |
| Executor | `executor.ts` | 1Shot relay calls, batch sweep, protocol rotation |
| x402 Payer | `x402.ts` | HTTP 402 payment flow for Venice API calls |
| Database | `db.ts` | JSON file store: decisions, delegations, txs |
| Config | `config.ts` | Env vars, addresses, ABIs, viem clients |

---

### Smart Contracts (Solidity + Foundry)

| Contract | Responsibility |
|---|---|
| `ClovaSavingsPool.sol` | Main pool: registration, yield sweep, draw, prize distribution |
| `AaveAdapter.sol` | Wraps Aave v3 supply/withdraw/valueOf |
| `CompoundAdapter.sol` | Wraps Compound Comet v3 supply/withdraw/valueOf |
| `MoonwellAdapter.sol` | Wraps Moonwell mToken supply/redeemUnderlying/valueOf |

---

## Data Flow: Daily Sweep Cycle

```
node-cron fires (ROUND_CRON)
    │
    ├─▶ collectSignals()
    │       LI.FI Earn API → APY, TVL per protocol
    │       DeFiLlama fallback if LI.FI fails
    │       On-chain RPC → utilization rates (Aave, Compound, Moonwell)
    │
    ├─▶ veniceReason(summary)  ← pays Venice via x402
    │       Venice AI + web search
    │       Returns: { recommendation, riskScore, reasoning, citations }
    │
    ├─▶ checkGuardrails(signals, decision)
    │       Emergency: Aave TVL < $10M → halt
    │       Block: riskScore ≥ 70 → stay
    │       Block: target TVL < $500K → stay
    │       Block: APY delta < 0.5% → stay
    │
    ├─▶ sweepYieldBatch(users, yields, delegations)
    │       Build withdrawExecutions per user (protocol-aware)
    │       1Shot: single relayer_send7710Transaction (all users, 1 tx)
    │       Wait confirm → approve USDC → depositYield per user
    │       Contract enforces I1: remaining ≥ baseline or REVERT
    │
    ├─▶ rotateProtocol() [if recommendation ≠ TETAP]
    │       For each user: withdraw from old → supply to new (via delegation)
    │       Call pool.rotateProtocol(newProtocol)
    │
    └─▶ saveDecision() → GET /decisions (AI transparency panel)

node-cron fires (DRAW_CRON — weekly)
    │
    └─▶ requestDraw()
            pool.requestDraw() → Pyth Entropy request
            → entropyCallback(randomBytes32)
            → weighted selection (proportional to principalBaseline)
            → fee to treasury, prize to winner
            → _startNewRound()
```

---

## Data Flow: User Onboarding

```
User opens Clova
    │
    ├─▶ Connect MetaMask
    │       wallet_requestAccounts
    │       Switch to Base Mainnet (chain 8453)
    │
    ├─▶ Upgrade to Smart Account (EIP-7702)
    │       walletClient.signAuthorization({ contractAddress: EIP7702_IMPL })
    │       MetaMask signs 7702 authorization → agent EOA becomes smart account
    │
    ├─▶ Sign Delegation (ERC-7710)
    │       erc7715ProviderActions → wallet_grantPermissions
    │       Caveat: allowedTargets [AAVE_POOL, COMPOUND_COMET, MOONWELL, PRIZE_POOL]
    │       Caveat: allowedMethods [supply, withdraw, transfer, depositYield]
    │       → permissionContext stored in backend via POST /delegation
    │
    ├─▶ Approve USDC
    │       usdc.approve(AAVE_POOL, amount)
    │
    ├─▶ Supply to Aave
    │       aave.supply(USDC, amount, userAddress, 0)
    │       User receives aUSDC in their own wallet
    │
    └─▶ Record Principal
            POST /record-principal → backend reads aToken balance on-chain
            pool.recordPrincipal(user, actualBalance) via agent wallet
            eligibleFromRound = currentRound + 1 (anti-sniping)
```

---

## Cron Schedule

| Cron | Default | Action |
|---|---|---|
| `ROUND_CRON` | `0 0 * * *` (daily midnight) | Venice analysis + yield sweep |
| `DRAW_CRON` | `0 0 * * 0` (Sunday midnight) | Prize draw via Pyth VRF |

Both configurable via env vars. Manual triggers available via `/admin/run-cycle` and `/admin/draw` (deployer wallet signature required).

---

## Storage

Backend uses JSON file storage (`backend/data/`):

| File | Contents |
|---|---|
| `decisions.json` | Venice AI decision log (last 100 rounds) |
| `delegations.json` | User permissionContexts keyed by address |
| `transactions.json` | 1Shot relay transaction log |
| `x402payments.json` | Venice payment receipts |

> Phase 2: migrate to PostgreSQL for production scale.
