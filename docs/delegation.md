# Delegation — How Clova Uses ERC-7710 + EIP-7702

Delegation is the core primitive that makes Clova non-custodial. This document explains what delegation is, how it works in Clova, the two types used, and the full lifecycle from signing to revocation.

---

## Why Delegation?

Traditional DeFi agents face a dilemma:

- **Custodial:** User sends funds to the agent's wallet → agent acts freely → user trusts the agent not to steal
- **Non-custodial without delegation:** Agent has no access → user must manually approve every action

Clova uses a third option: **bounded delegation**. The user signs a permission that gives the agent exactly the access it needs — no more, no less — enforced by the blockchain itself.

> "Safe not because you trust the AI, but because the code makes it impossible for it to exceed its bounds."

---

## Two Technologies Working Together

### EIP-7702 — Upgrade EOA to Smart Account

An ordinary Ethereum wallet (EOA) cannot enforce delegation logic — it has no code. EIP-7702 solves this by pointing the EOA's code slot to a smart contract implementation (MetaMask's `EIP7702StatelessDeleGator`).

After upgrade:
- The wallet address stays the same
- The wallet gains smart account capabilities (delegation enforcement, batching)
- The user's private key still controls it

```
Before 7702:  0xUserAddress → EOA (no code)
After  7702:  0xUserAddress → EIP7702StatelessDeleGator (smart account logic)
```

### ERC-7710 — Signed Delegation with Caveats

ERC-7710 is the delegation standard used by MetaMask Smart Accounts Kit. A delegation is a signed message that says:

> "I (user) authorize you (agent) to act on my behalf, but only within these specific constraints (caveats)."

The constraints are enforced on-chain by MetaMask's `DelegationManager` contract — not by the agent's own code. If the agent tries to exceed the caveats, the transaction reverts before executing.

---

## Type 1 — User Delegation (Yield Sweep + Protocol Rotation)

This is the main delegation. Every user who joins Clova signs exactly one delegation to the agent.

### What it grants

```typescript
createDelegation({
  from: userSmartAccount.address,   // delegator: the user
  to:   AGENT_ADDRESS,              // delegate: the AI agent
  caveats: [
    caveat("allowedTargets", [
      AAVE_POOL,       // Aave v3 Pool on Base
      COMPOUND_COMET,  // Compound v3 Comet on Base
      MOONWELL_MUSDC,  // Moonwell mUSDC on Base
      PRIZE_POOL,      // ClovaSavingsPool contract
      USDC_ADDRESS,    // USDC token (for transfer step in Compound/Moonwell)
    ]),
    caveat("allowedMethods", [
      "supply(address,uint256,address,uint16)",   // Aave supply
      "withdraw(address,uint256,address)",         // Aave withdraw
      "withdraw(address,uint256)",                 // Compound withdraw
      "redeemUnderlying(uint256)",                 // Moonwell redeem
      "transfer(address,uint256)",                 // USDC transfer to agent
    ]),
  ],
})
```

### What it does NOT grant

- Cannot call any contract outside the whitelist (no arbitrary targets)
- Cannot call any method outside the list (no `transfer` to random addresses)
- Cannot touch principal — enforced by an additional on-chain check in `depositYield()`
- Cannot be used after revocation

### How the user signs it (Frontend Flow)

```
1. User clicks "Mulai Nabung" in onboarding
2. Frontend calls wallet_grantPermissions (ERC-7715) via MetaMask SDK
   → MetaMask shows popup: "Clova agent requests the following permissions..."
   → User sees plain-language caveat descriptions
   → User clicks Approve
3. MetaMask returns permissionContext (signed delegation proof)
4. Frontend sends permissionContext to backend: POST /delegation
5. Backend stores it — used every sweep cycle
```

The user never signs a raw transaction for sweep/rotation. They sign **once**, and the delegation covers all future sweep and rotation operations.

---

## Type 2 — Treasury Delegation (x402 Payments)

A separate, more restricted delegation covers the agent's self-funding via x402.

```typescript
createDelegation({
  from: TREASURY_ADDRESS,           // delegator: protocol treasury
  to:   AGENT_ADDRESS,              // delegate: AI agent
  caveats: [
    caveat("allowedTargets", [
      X402_FACILITATOR_ADDRESS,     // only the Venice payment facilitator
    ]),
    caveat("allowedMethods", [
      "transfer(address,uint256)",  // USDC transfer only
    ]),
    caveat("erc20TransferAmount", {
      token: USDC_ADDRESS,
      maxAmount: DAILY_LIMIT,       // e.g., 1 USDC per day maximum
    }),
  ],
})
```

This delegation allows the agent to pay for Venice API calls, but:
- Only to the x402 facilitator address — not to any arbitrary address
- Only USDC transfer — cannot call any other function
- Capped at a daily limit — cannot drain the treasury

---

## How the Agent Redeems a Delegation

When the sweep cycle runs, the agent does not send transactions directly. It **redeems** the user's delegation via 1Shot relayer:

### Step 1 — Build the execution

```typescript
// Example: withdraw yield from Aave to agent
const execution = {
  target:   AAVE_POOL,
  value:    0n,
  callData: encodeFunctionData({
    abi:          aaveAbi,
    functionName: "withdraw",
    args:         [USDC_ADDRESS, yieldAmount, AGENT_ADDRESS],
  }),
};
```

### Step 2 — Wrap in delegation redemption

```typescript
const redeemCalldata = encodeRedeemDelegations({
  delegations: [[signedDelegation]],  // the user's stored permissionContext
  executions:  [[execution]],
});
```

### Step 3 — Send via 1Shot relayer

```typescript
await rpc("relayer_send7710Transaction", [{
  chainId:           "8453",
  authorizationList: [agentEIP7702Auth],  // 7702: agent is smart account
  transactions: [
    {
      permissionContext: userA_delegation,
      executions: [withdrawYieldFromAave_userA],
    },
    {
      permissionContext: userB_delegation,
      executions: [withdrawYieldFromAave_userB],
    },
    // ... all active users in one batch
  ],
  feeToken:        USDC_ADDRESS,
  destinationUrl:  WEBHOOK_URL,
}]);
```

1Shot pays the gas in USDC (deducted from the agent's USDC balance). Users need zero ETH.

### What happens on-chain

```
1. 1Shot relayer submits transaction
2. DelegationManager.redeemDelegation() verifies:
   - Signature is valid (user signed this)
   - Target (Aave Pool) is in allowedTargets
   - Method (withdraw) is in allowedMethods
   → If any check fails: REVERT
3. If all checks pass: executes withdraw(USDC, yield, agentAddress)
4. USDC arrives in agent wallet
5. Agent calls pool.depositYield(user, amount)
6. Pool contract checks: aToken balance − baseline ≥ 0
   → If principal touched: REVERT
   → If yield only: roundYieldPool += amount
```

The agent never "has" the user's funds in the sense of owning them — the withdrawal target is always either the agent (for yield handoff) or the user themselves (emergency exit). The agent cannot redirect the withdrawal to any other address.

---

## Protocol-Specific Execution Differences

Different protocols return withdrawn tokens differently:

| Protocol | Withdraw behavior | Executions needed |
|---|---|---|
| **Aave** | `withdraw(asset, amount, to)` — sends directly to `to` address | 1 execution |
| **Compound** | `withdraw(asset, amount)` — sends to `msg.sender` (user's wallet) | 2 executions: withdraw + `usdc.transfer(agent, amount)` |
| **Moonwell** | `redeemUnderlying(amount)` — sends to `msg.sender` (user's wallet) | 2 executions: redeem + `usdc.transfer(agent, amount)` |

For Compound and Moonwell, the second execution (transfer to agent) is also within the delegation's `allowedMethods` — `transfer(address,uint256)` is listed as allowed, but the caveat on `allowedTargets` limits it to the USDC contract only. The agent cannot redirect these transfers.

---

## Revocation

Users can revoke their delegation at any time by clicking **"Cabut Izin"** in the dashboard.

```
1. Frontend calls backend: DELETE /delegation/:userAddress
2. Backend removes stored permissionContext
3. Agent can no longer build a valid redeemDelegation call for this user
4. On next sweep cycle: user is skipped (no delegation found)
```

Revocation is **immediate** — the agent cannot perform any further actions on the user's account. The user's principal remains in Aave and can be withdrawn directly by the user via the dashboard's "Tarik" button (direct transaction, no delegation needed).

---

## Delegation Lifecycle Summary

```
USER SIDE                                    AGENT SIDE

[Onboarding]
  ↓
wallet_grantPermissions()
  → permissionContext signed
  → stored in backend
                                             [Daily sweep cycle]
                                               ↓
                                             Load permissionContext per user
                                               ↓
                                             Build executions (withdraw yield)
                                               ↓
                                             encodeRedeemDelegations()
                                               ↓
                                             relayer_send7710Transaction (1Shot)
                                               ↓
                                             DelegationManager verifies caveats
                                               ↓
                                             Execute on-chain (withdraw + depositYield)

[Revoke]
  ↓
DELETE /delegation/:address
                                             [Next cycle]
                                               ↓
                                             User not in delegation store → skipped
```

---

## Why This Matters for the Hackathon

MetaMask Smart Accounts Kit's core value proposition is **permission sharing** — the ability to delegate bounded, revokable, auditable permissions to other agents. Clova is a complete production demonstration of this:

- **Bounded:** caveats limit targets, methods, and amounts — enforced on-chain
- **Auditable:** every delegation is stored and every redemption is a traceable on-chain transaction
- **Revokable:** single click, instant effect
- **Agentic:** the agent autonomously acts within its delegation every day without user interaction

This is not a toy example. The delegation powers real yield sweeps, real protocol rotations, and real prize pool deposits — on Base mainnet.
