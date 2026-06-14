# Architecture

## System Overview

```mermaid
flowchart LR
  subgraph FE["Frontend · Next.js"]
    OB["Onboarding<br/>EIP-7702 upgrade"]
    DS["Delegation signer<br/>ERC-7710"]
    DB["Dashboard +<br/>AI Transparency Panel"]
  end

  subgraph BE["Backend Agent · Node + TS"]
    SIG["Signal Collector<br/>LI.FI + DeFiLlama"]
    VEN["Venice Reasoner<br/>web search"]
    GR["Guardrail Layer"]
    EX["Executor<br/>sweep · rotate · draw"]
    X4["x402 Payer"]
  end

  subgraph CH["Base Mainnet"]
    POOL["ClovaSavingsPool<br/>baseline · yield pool · VRF"]
    ADP["Aave / Compound /<br/>Moonwell adapters"]
    SA["User Smart Accounts<br/>hold aTokens"]
  end

  ONE["1Shot Relayer<br/>7702 + 7710"]
  VAPI["Venice API"]
  PYTH["Pyth Entropy VRF"]

  OB --> SA
  DS --> EX
  SIG --> VEN --> GR --> EX
  EX --> ONE --> POOL
  POOL --> ADP --> SA
  X4 --> VAPI
  VEN -. paid per call .-> X4
  POOL --> PYTH
  EX --> DB
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
| `ClovaSavingsPool.sol` | Main pool: registration, yield sweep, draw, prize distribution. UUPS upgradeable proxy. |
| `AaveAdapter.sol` | Wraps Aave v3 supply/withdraw/valueOf |
| `CompoundAdapter.sol` | Wraps Compound Comet v3 supply/withdraw/valueOf |
| `MoonwellAdapter.sol` | Wraps Moonwell mToken supply/redeemUnderlying/valueOf |
| `RotationHelper.sol` | Atomic protocol rotation: pull aUSDC/mUSDC → swap protocol → return new tokens, 1 tx |

---

## Data Flow: Daily Sweep Cycle

```mermaid
sequenceDiagram
  autonumber
  participant Cron as node-cron
  participant Agent
  participant Venice
  participant Guard as Guardrail
  participant 1Shot
  participant Pool as ClovaSavingsPool

  Cron->>Agent: ROUND_CRON fires (daily)
  Agent->>Agent: collectSignals() · LI.FI + DeFiLlama + RPC
  Agent->>Venice: veniceReason(summary) — paid via x402
  Venice-->>Agent: { recommendation, riskScore, reasoning, citations }
  Agent->>Guard: checkGuardrails(signals, decision)
  Note over Guard: halt if Aave TVL < $10M<br/>stay if risk ≥ 70 / TVL < $500K / Δapy < 0.5%
  loop all users (batched in 1 tx)
    Agent->>1Shot: relayer_send7710Transaction (sweep executions)
    1Shot->>Pool: withdraw yield → depositYield(user, amount)
    Pool-->>Pool: require remaining ≥ baseline (I1) else REVERT
  end
  opt recommendation ≠ STAY
    Agent->>1Shot: RotationHelper.rotate (atomic, per user)
  end
  Agent->>Agent: saveDecision() → GET /decisions
```

```mermaid
sequenceDiagram
  autonumber
  participant Cron as node-cron
  participant Pool as ClovaSavingsPool
  participant Pyth as Pyth Entropy

  Cron->>Pool: DRAW_CRON fires (weekly) · requestDraw()
  Pool->>Pyth: request randomness
  Pyth-->>Pool: entropyCallback(randomBytes32)
  Pool->>Pool: weighted winner (∝ principalBaseline)
  Pool->>Pool: 10% → treasury, 90% → winner, _startNewRound()
```

---

## Data Flow: User Onboarding

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Frontend
  participant MM as MetaMask
  participant BE as Backend
  participant Aave
  participant Pool as ClovaSavingsPool

  U->>FE: open Clova → Connect wallet
  FE->>MM: wallet_requestAccounts + switch to Base (8453)
  FE->>MM: signAuthorization (EIP-7702 → EIP7702_IMPL)
  MM-->>FE: EOA upgraded to smart account
  FE->>MM: requestExecutionPermissions (ERC-7715)
  Note over MM: erc20-token-allowance on aUSDC<br/>5 USDC ceiling · delegate = 1Shot relayer
  MM-->>FE: permissionContext
  FE->>BE: POST /delegation (store permissionContext)
  U->>FE: approve USDC + aUSDC/mUSDC to RotationHelper
  FE->>Aave: supply(USDC, amount, user, 0) → user holds aUSDC
  FE->>BE: POST /record-principal
  BE->>Pool: recordPrincipal(user, onchainBalance)
  Note over Pool: eligibleFromRound = currentRound + 1 (anti-sniping)
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
