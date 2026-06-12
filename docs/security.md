# Security Model

## Core Philosophy

> "Safe not because you trust the AI, but because its reach is bounded and revocable on-chain."

Security in Clova is enforced at **multiple independent layers**. No single point of failure can result in user fund loss.

---

## Three On-Chain Invariants

### I1 — Principal Guarded On-Chain

```solidity
function depositYield(address user, uint256 amount) external onlyAgent {
    usdc.safeTransferFrom(msg.sender, address(this), amount);
    
    uint256 baseline = principalBaseline[user];
    uint256 remaining = yieldAdapter.valueOf(user); // live aToken balance
    
    if (remaining < baseline) {
        usdc.safeTransfer(msg.sender, amount); // refund
        revert AgentCannotTouchPrincipal(amount, remaining, baseline);
    }
    roundYieldPool += amount;
}
```

Even if:
- The agent is compromised
- Venice AI is hacked and returns malicious instructions
- The backend is fully controlled by an attacker

...the smart contract will **revert and refund** any yield deposit that would leave a user below `principalBaseline`. Combined with the 5 USDC delegation ceiling, the agent's reach into user funds is bounded to single-digit dollars — fully on-chain.

### I2 — Funds Only Exit to Winner or Treasury

No function in `ClovaSavingsPool` can transfer USDC to an arbitrary address. Prize USDC flows to:
- `winner` — selected by Pyth VRF (not AI), must be a registered participant
- `treasury` — fixed address set at deploy time, changeable only by admin multisig

### I3 — Agent Can Only Use Whitelisted Protocols

```solidity
mapping(address => bool) public approvedProtocols;

function setProtocolApproval(address protocol, bool approved)
    external onlyRole(DEFAULT_ADMIN_ROLE)  // ← admin only, not agent
```

The AI cannot route funds to a protocol it invented. Venice can only recommend protocols already in the whitelist by name ("Aave", "Compound", "Moonwell"). Guardrails validate the recommendation is in the whitelist before execution.

---

## Delegation Security Model

### Two-Layer Protection — Yield Sweep

User principal is protected by two independent layers. If either is bypassed, the other still enforces:

**Layer 1 — MetaMask ERC-7715 (delegation ceiling)**

User signs an `erc20-token-allowance` permission via MetaMask's `requestExecutionPermissions`. The ceiling is **5 USDC fixed** — MetaMask's enforcer rejects any transfer above this amount, regardless of how much aUSDC the user holds.

This ceiling is the agent's entire blast radius. No matter how large a user's deposit, a single permission can never move more than 5 USDC of aUSDC — enforced on-chain by MetaMask's DelegationManager, not by trust or policy. The permission is revocable in one click. (ERC-7715 enforces an *amount* cap, not a yield-only rule by itself — the precise yield-only bound is the job of Layer 2 below, and of the planned `YieldSweeper`.)

**Layer 2 — Contract-level guard (on-chain)**

`depositYield()` reads the live aToken balance after the agent's withdrawal and reverts if principal was touched:

```solidity
uint256 remaining = yieldAdapter.valueOf(user); // live aToken balance after withdrawal
if (remaining < baseline) {
    usdc.safeTransfer(msg.sender, amount); // refund
    revert AgentCannotTouchPrincipal(amount, remaining, baseline);
}
```

Layer 2 is the on-chain backstop: on every sweep the pool re-reads the user's live Aave balance and refuses to record any yield deposit that would leave them below their recorded principal — the funds are refunded and the transaction reverts. Combined with the small Layer 1 ceiling, the agent's room to misbehave is bounded to single-digit dollars, fully on-chain and revocable. The agent is powerful, but it is not privileged.

Users can revoke at any time via the "Cabut Izin" button → agent immediately loses all access.

> **Roadmap:** A future `YieldSweeper` contract will make the principal guard even tighter by enforcing the yield-only rule atomically at the contract level, removing the need for a static ceiling entirely. See [Phase 2 Roadmap](./phase2.md).

---

## Agent Self-Payment — x402 + ERC-7710

The agent funds its own Venice AI usage with no human in the loop, via two complementary mechanisms:

- **x402 (HTTP 402 micropayments)** — when Venice requires payment, the agent settles per call over the x402 protocol. The agent literally pays for its own intelligence.
- **Bounded ERC-7710 treasury delegation** — a treasury delegation signed off-line with a private key (not the browser) gives the agent a *capped* operational budget it can draw from autonomously:

```
Treasury wallet (private key — backend, not browser)
  → signDelegation (EIP-712)
  → scope: Erc20TransferAmount
  → token: USDC
  → maxAmount: 5 USDC
  → redeemed by agent via DelegationManager.redeemDelegations
```

The on-chain enforcer caps exposure at 5 USDC per signing — even if the agent server were fully compromised, the treasury cannot be drained beyond that bound. The agent holds no unlimited spending key.

Together these satisfy the **x402 + ERC-7710** track: the agent pays for itself (x402) inside a cryptographically bounded budget (ERC-7710), with zero user interaction.

---

## Phase 2 — YieldSweeper Contract

The fundamental limitation of yield sweep via delegation is that the ceiling is **static** (set at signing time), while yield is **dynamic** (accumulates every second). A 5 USDC ceiling is a safe approximation, but not a mathematically precise yield-only bound.

**Planned fix (post-hackathon):**

Deploy a `YieldSweeper` contract — same pattern as `RotationHelper`:

```
User approves: aUSDC.approve(yieldSweeper, type(uint256).max)  (one-time)

Agent calls:   yieldSweeper.sweep(user)
  → reads principalBaseline[user] from ClovaSavingsPool (live, on-chain)
  → reads aUSDC.balanceOf(user)
  → computes yield = balance - baseline
  → transfers ONLY yield to prize pool
  → reverts if balance < baseline (atomic — user keeps everything on failure)
```

This makes the principal guard move from the pool contract to the sweep contract itself, and removes the need for a delegation ceiling entirely. The agent's approval is controlled by the `onlyRole(AGENT_ROLE)` modifier on YieldSweeper.

---

## Anti-Sybil

Ticket weights are proportional to `principalBaseline[user]`. Splitting across 10 wallets produces the same total weight as 1 wallet. Economic anti-Sybil — no identity verification needed for fairness.

Users with `principalBaseline = 0` (fully withdrawn) get weight 0 and cannot win. The draw code uses `min(actualAaveBalance, principalBaseline)` — so even if a user bypasses `recordWithdrawal`, their actual Aave balance of 0 results in 0 weight.

---

## Anti-Sniping

```solidity
if (principalBaseline[user] == 0) {
    eligibleFromRound[user] = currentRound + 1;
}
```

New depositors are only eligible for the **next** round, not the current one. Prevents last-minute deposits to win yield they didn't contribute.

---

## Guardrail Layer

AI recommendations are validated before execution:

| Check | Threshold | Action on trigger |
|---|---|---|
| Aave TVL crash | < $10M | Emergency halt entire round |
| Venice API failure | No data | Emergency halt |
| Risk score | ≥ 70/100 | Block rotation, stay on current |
| Target TVL | < $500K | Block rotation, stay on current |
| APY improvement | < 0.5% | Block rotation, not worth it |

---

## Admin Endpoint Security

| Threat | Protection |
|---|---|
| Brute force ADMIN_SECRET | 64-char hex (256-bit entropy) + rate limit 1x/hour |
| Unauthorized draw trigger | Deployer wallet signature required (`/admin/draw-signed`) |
| Spam sweep (gas drain) | Rate limit 1x/hour per endpoint |
| Principal theft via sweep spam | I1 on-chain invariant — second sweep finds yield=0, no-op |
| Draw double-trigger | `isRequestPending` flag — second call reverts `DrawAlreadyPending` |

---

## Operational Key Security

Treasury and agent keys are held server-side. The treasury ERC-7710 delegation limits what the agent can do with treasury funds to a maximum of 5 USDC per signing, enforced on-chain by MetaMask's `Erc20TransferAmountEnforcer` — even if the server is fully compromised, the treasury cannot be drained beyond that bound. The agent key controls only AGENT_ROLE on the pool contract: it can trigger sweeps and draws, but cannot modify the whitelist, change fee parameters, or move principal.

---

## Threat Model

| Threat | Impact | Mitigation |
|---|---|---|
| Agent wallet compromised | Could trigger early draw, spam sweep | Rate limits, I1 on-chain guard, draw just picks winner early |
| Treasury key compromised | Treasury funds at risk | ERC-7710 delegation caps exposure to 5 USDC per signing |
| Venice AI returns malicious recommendation | Tries to move to rogue protocol | I3 whitelist, guardrails block, on-chain protocol approval |
| Backend database wiped | Delegations lost, agent can't sweep | Users can re-sign delegations, principal still safe in Aave |
| Aave exploit | User principal at risk | Not in Clova's control — whitelist + TVL guardrail halts agent |
| Gas price spike | Sweep/draw fails, yields accumulate | 1Shot handles gas, yields safe in pool until next round |
| Railway server down | Cron doesn't run | Yields accumulate, no loss — manual trigger available |

---

## What Clova Cannot Protect Against

- **Smart contract bugs in Aave/Compound/Moonwell** — Clova uses audited external protocols but cannot guarantee their security.
- **Base L2 risk** — Sequencer downtime, reorg risk (minimal on Base).
- **USDC depeg** — If USDC depegs, all USDC-denominated values are affected equally.
- **Oracle manipulation** — Pyth Entropy is verifiable on-chain; LI.FI/DeFiLlama APY data could theoretically be manipulated but only affects AI recommendation, not fund safety.

> Disclaimer: "no-loss" refers to principal protection within Clova's design. It does not guarantee against risks inherent to Base L2, USDC, or underlying DeFi protocols.
