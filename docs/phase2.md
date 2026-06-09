# Phase 2 Roadmap

> Phase 1 (current) is the hackathon MVP. Phase 2 is the production-ready evolution.

---

## Overview

```
Phase 1 (Done)      → Single asset (USDC), 3 protocols, proportional tickets, AI rotation
Phase 2 (Next)      → Multi-asset, split allocation, World ID, batching, UX polish
Phase 3 (Future)    → Cross-chain, DAO governance, strategy marketplace, mobile app
```

---

## Phase 2 Features

### 2.1 — Multi-Protocol Allocation (Split %)

**Current:** 100% of funds on one protocol at a time (winner-take-all rotation).

**Phase 2:** AI allocates across multiple protocols simultaneously:

```
Example allocation:
  Aave:     60% (stable, high TVL, baseline)
  Compound: 30% (higher yield, some risk)
  Moonwell: 10% (experimental, small exposure)
```

**Why:** Risk diversification. A single protocol exploit doesn't wipe the whole pool. Venice AI already receives APY + TVL + risk signals for all protocols — it can output allocation percentages instead of binary recommendations.

**Changes needed:**
- `ClovaSavingsPool`: track per-protocol balance per user
- `AaveAdapter`/etc: support partial positions
- `executor.ts`: build multi-step rotation (partial withdraw old → split supply new)
- Venice prompt: output `{"allocations": {"Aave": 60, "Compound": 30, "Moonwell": 10}}`
- Dashboard: show allocation breakdown per protocol

---

### 2.2 — World ID Anti-Sybil (On-Chain)

**Current:** Anti-Sybil is economic (proportional deposits). 1 person with 10 wallets = same weight as 1 wallet.

**Phase 2:** Add World ID verification for users who want a **"human bonus multiplier"** on their tickets:

```
Unverified user: tickets = principalBaseline (as today)
World ID verified: tickets = principalBaseline × 1.2 (20% bonus)
```

**Why:** Incentivizes real humans to verify without blocking unverified users. Creates a network effect for privacy-preserving identity.

**Implementation:**
```solidity
// In register():
IWorldID(WORLD_ID_ROUTER).verifyProof(
    root, groupId, signal, nullifierHash, externalNullifier, proof
);
nullifiers[nullifierHash] = true;  // prevent double-registration
```

**Frontend:** Add World ID verification step to onboarding (optional, after deposit).

---

### 2.3 — Cross-Chain Deposits via LI.FI

**Current:** Users must have USDC on Base to participate.

**Phase 2:** Accept deposits from any major chain — LI.FI bridges and supplies to Aave in one click.

```
User has USDC on Ethereum mainnet
  → LI.FI SDK: bridge Ethereum → Base + supply to Aave
  → Single transaction approval
  → User appears in Clova pool on Base
```

**Supported source chains:** Ethereum, Arbitrum, Polygon, Optimism, Avalanche.

**Frontend changes (screens-ob.jsx):**
```jsx
<ChainSelector chains={["ethereum", "arbitrum", "polygon", "base"]} />
// If not Base → show bridge fee estimate + time estimate
// Build LI.FI route → user approves single tx
```

**Note:** Bridge fee shown transparently in UI ("Bridge fee: ~$0.50, ETA: ~2 min").

---

### 2.4 — PostgreSQL Database

**Current:** JSON file storage (`data/*.json`) — works for demo, not production.

**Phase 2:** Migrate to PostgreSQL (Railway add-on):

| Table | Replaces |
|---|---|
| `decisions` | `data/decisions.json` |
| `delegations` | `data/delegations.json` |
| `transactions` | `data/transactions.json` |
| `x402_payments` | `data/x402payments.json` |

**Benefits:**
- Concurrent reads/writes safe
- Historical queries (e.g., "show all rounds where Compound was recommended")
- Backup and recovery
- Can scale to thousands of users

---

### 2.5 — Batch depositYield in Smart Contract

**Current:** After batch 1Shot sweep, agent calls `pool.depositYield(user, amount)` individually for each user (N on-chain transactions).

**Phase 2:** Add `batchDepositYield(address[] users, uint256[] amounts)` to the contract:

```solidity
function batchDepositYield(
    address[] calldata users,
    uint256[] calldata amounts
) external onlyRole(AGENT_ROLE) nonReentrant {
    uint256 total = 0;
    for (uint256 i = 0; i < amounts.length; i++) total += amounts[i];
    usdc.safeTransferFrom(msg.sender, address(this), total);

    for (uint256 i = 0; i < users.length; i++) {
        // I1 check per user
        uint256 remaining = yieldAdapter.valueOf(users[i]);
        if (remaining < principalBaseline[users[i]]) continue; // skip, don't revert
        roundYieldPool += amounts[i];
        emit YieldSwept(users[i], amounts[i], currentRound);
    }
}
```

**Result:** Entire sweep = 2 txs total (1 1Shot batch + 1 approve + 1 batchDepositYield), regardless of user count.

---

### 2.6 — Multiple Prize Tiers

**Current:** Single winner takes 90% of prize pool.

**Phase 2:** Multiple tiers:

```
1st place:  50% of pool
2nd place:  30% of pool
3rd place:  15% of pool
Treasury:    5% of pool
```

**Implementation:**
- `entropyCallback`: run 3 separate weighted random selections (different offsets of same random seed)
- Dedup: if same address selected twice, fall back to next candidate
- `distributePrize(address[] winners, uint256[] amounts)`

**User benefit:** More people win per round → better engagement → more deposits.

---

### 2.7 — Automated Emergency Exit

**Current:** On emergency (Aave TVL crash), agent halts. Users must manually withdraw from Aave.

**Phase 2:** On emergency, agent triggers auto-withdraw for all users:

```typescript
if (guardrail.emergency) {
    // Notify all users via on-chain event
    await pool.declareEmergency();  // emits EmergencyDeclared

    // For each user with delegation: withdraw from protocol → back to user wallet
    for (const user of participants) {
        await executeEmergencyWithdraw(user, delegation);
    }
}
```

**Requires:** New caveat allowing `withdraw → user's own address` (not just to agent). Frontend adds "Emergency: your funds are being returned" notification.

---

### 2.8 — Round History & Analytics

**Current:** Dashboard shows current round only.

**Phase 2:** Full history:
- Past winners per round
- APY achieved vs. market rate comparison
- Total yield generated by the pool
- User's personal history: rounds participated, prize won

**Frontend:** `/history` page with charts (Recharts or Chart.js).

**Backend:** `GET /rounds` endpoint returning historical round data from PostgreSQL.

---

### 2.9 — Mobile App (PWA)

**Current:** Responsive web app.

**Phase 2:** Progressive Web App with push notifications:
- "Round ends in 2 hours"
- "You won! 12.5 USDC claimed"
- "AI rotated to Compound — tap to see why"

MetaMask Mobile deep links for wallet actions.

---

### 2.10 — DAO Governance (Phase 3)

Long-term: protocol parameters governed by stakers:
- Platform fee (currently fixed at 10%)
- Whitelist protocol additions/removals
- Prize tier distribution
- Emergency threshold levels

Governance token: earned by participating in the pool (not pre-mined, not sold).

---

## Phase 2 Priority Order

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| P0 | PostgreSQL migration | Medium | High (production readiness) |
| P0 | batchDepositYield contract | Low | High (gas efficiency) |
| P1 | Multi-protocol allocation | High | High (core differentiation) |
| P1 | Cross-chain deposits (LI.FI) | Medium | High (accessibility) |
| P2 | Multiple prize tiers | Medium | Medium (engagement) |
| P2 | World ID integration | Medium | Medium (anti-Sybil) |
| P3 | Automated emergency exit | High | High (trust) |
| P3 | Round history & analytics | Medium | Medium (transparency) |
| P4 | Mobile PWA | High | Medium |
| P5 | DAO governance | Very High | High (decentralization) |

---

## Technical Debt (Post-Hackathon)

| Item | Current State | Fix |
|---|---|---|
| File-based DB | `data/*.json` race conditions under load | Migrate to PostgreSQL |
| `participants[]` array never shrinks | Inactive users iterated in draw | Add `removeParticipant()` or lazy cleanup |
| EIP-7702 re-auth on every sweep | Performance overhead | Cache signed authorization with nonce tracking |
| No retry logic for failed sweeps | Yield stays in Aave, not lost | Add sweep retry queue |
| Venice API single point of failure | If Venice down, round skipped | Fallback to rules-based allocation |
| No contract upgrade path | Deploy new contract = migrate users | Add proxy pattern (EIP-1967) |
