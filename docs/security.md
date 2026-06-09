# Security Model

## Core Philosophy

> "Safe not because you trust the AI, but because the code makes it impossible."

Security in Clova is enforced at **multiple independent layers**. No single point of failure can result in user fund loss.

---

## Three On-Chain Invariants

### I1 — Agent Cannot Touch Principal

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

...the smart contract will **revert** any attempt to sweep more than `aTokenBalance − principalBaseline`. Principal is mathematically unreachable.

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

## ERC-7710 Delegation Bounds

User's signed delegation explicitly constrains what the agent can call:

```typescript
caveats: [
  caveat("allowedTargets", [
    AAVE_POOL,
    COMPOUND_COMET,
    MOONWELL_MUSDC,
    PRIZE_POOL,
    USDC_ADDRESS,  // for transfer to agent in Compound/Moonwell flow
  ]),
  caveat("allowedMethods", [
    "supply(address,uint256,address,uint16)",
    "withdraw(address,uint256,address)",
    "withdraw(address,uint256)",
    "redeemUnderlying(uint256)",
    "transfer(address,uint256)",
  ]),
]
```

The delegation enforcer (MetaMask DelegationManager) rejects any transaction that calls a method or target not in these caveats. **On-chain enforcement, not just policy.**

Users can revoke at any time via the "Cabut Izin" button → agent immediately loses all access.

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

## Threat Model

| Threat | Impact | Mitigation |
|---|---|---|
| Agent wallet compromised | Could trigger early draw, spam sweep | Rate limits, I1 prevents principal loss, draw just picks winner early |
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
