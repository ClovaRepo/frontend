# Overview

## What is Clova?

**Clova** is a no-loss prize-linked savings application on Base. A group of people deposit USDC. Their principal **never leaves their own smart account** and is never at risk. An AI agent (Venice) monitors DeFi protocols daily, rotates funds to the healthiest option, and sweeps the accumulated yield into a shared prize pool. Every week, a winner is picked by an **on-chain verifiable random function (Pyth Entropy)** — proportional to deposit size. Losers keep their principal, fully intact.

> *"Save, never lose your principal, and compete to win the combined yield of everyone — managed by AI that is technically impossible to steal from you."*

---

## The Problem

### Problem 1 — People Fear Giving AI Access to Their Money

Current AI agent frameworks require users to trust that the AI will not misbehave. There is no standard way to grant an AI agent:
- **Bounded** permissions (only yield, never principal)
- **Auditable** permissions (logged on-chain)
- **Revokable** permissions (exit anytime, instantly effective)

Without these, users rationally refuse to let AI touch their funds. The result: AI agents in DeFi are either custodial (platform holds your money) or theoretical.

**Clova's answer:** ERC-7710 delegation with on-chain enforced caveats. The agent's permission is not a promise — it is a mathematical constraint enforced by the smart contract.

### Problem 2 — DeFi Yield Management is Complex and Time-Consuming

To optimize yield, a user must:
- Track APY across multiple protocols daily
- Monitor TVL changes, utilization rates, audit news, governance proposals
- Manually move funds when a better or safer option appears
- Pay gas every time they rebalance

Most users don't do this. They deposit once, forget, and miss both better opportunities and early warning signs of protocol risk.

**Clova's answer:** Venice AI does this continuously — not just tracking numbers, but performing qualitative analysis via live web search and explaining every decision in plain language.

### Problem 3 — Individual Yields Are Too Small to Be Motivating

$1,000 at 5% APY = $50/year = $4.16/month. Not compelling enough to change saving behavior.

Prize-linked savings is a proven behavioral economics mechanism: pooling yield creates a lottery effect that dramatically increases saving motivation, even though the expected value is identical.

**Clova's answer:** Pool everyone's yield into a weekly prize. $50,000 in the pool at 5% APY = $2,500/week in prizes. One winner. Everyone else keeps their principal.

### Problem 4 — Prize Pools Require Trust in the Operator

Existing prize savings protocols either:
- Are custodial (operator holds all funds)
- Use off-chain randomness (not verifiable)
- Do not explain why funds moved between protocols
- Have no mechanism preventing operator manipulation of winner selection

**Clova's answer:** Non-custodial (ERC-7710), on-chain verifiable VRF (Pyth Entropy), transparent AI decision log, and mathematical principal protection.

---

## The Solution

### Layer 1 — Non-Custodial Principal Protection (ERC-7710 + EIP-7702)

Users upgrade their EOA to a smart account (EIP-7702) and sign a single bounded delegation. The agent receives exactly one capability:

```
Allowed targets : Aave Pool, Compound Comet, Moonwell mToken, Prize Pool, USDC
Allowed methods : supply, withdraw, transfer
Sweep limit     : current aToken balance − principalBaseline (enforced on-chain)
```

The delegation is enforced by MetaMask's DelegationManager contract — not by the agent's own code. If the agent tries to exceed these bounds, the transaction reverts before it executes. Users can revoke instantly from the dashboard, after which the agent has zero access.

### Layer 2 — AI That Hunts Opportunities, Not Just Monitors Risk

Venice AI is not a simple alert system. It actively evaluates whether there is a **better opportunity** available today:

**Signal collection (daily):**
- APY (spot, 7-day, 30-day average) via LI.FI Earn API (primary) + DeFiLlama (fallback)
- TVL and utilization rates per protocol (on-chain RPC + DeFiLlama)
- Live web search: recent audits, exploit reports, governance proposals, sentiment

**Venice's decision process:**
- Is the current protocol still safe and competitive?
- Is there an alternative with meaningfully better risk-adjusted yield?
- Are there signals (audit concerns, TVL drop, reward expiration) that suggest moving?
- What is the switching cost vs. the expected gain?

**Output:**
```json
{
  "recommendation": "Compound",
  "riskScore": 38,
  "reasoning": "Aave APY has compressed to 4.1% over 30 days as TVL grew. Compound's 6.2% APY is backed by 68% utilization (organic borrowing demand, not temporary incentives). No recent security disclosures. TVL at $12M is adequate for our pool size. Recommending rotation.",
  "citations": ["https://...", "https://..."]
}
```

This reasoning is displayed word-for-word in the AI Transparency Panel. Users see exactly what the AI was thinking.

**Guardrails block the AI when:**
- Risk score ≥ 70/100
- Target TVL < $500K
- APY improvement < 0.5% (not worth switching cost)
- Aave TVL drops below $10M (emergency halt)

### Layer 3 — Provably Fair Winner Selection (Pyth Entropy VRF)

Winner selection is not performed by the AI, the contract owner, or any off-chain randomness. Pyth Entropy generates a **verifiable random number on-chain** — the seed is committed before reveal, and anyone can verify on Basescan that the result was not manipulated.

Winner selection algorithm:
```
totalWeight = sum of principalBaseline for all active participants
winnerPoint  = randomNumber % totalWeight
cumulative   = 0
for each participant (sorted by address):
    cumulative += principalBaseline[participant]
    if cumulative >= winnerPoint → this participant wins
```

**Why proportional tickets?**

Bigger deposits contribute more yield to the prize pool, so they deserve proportionally more chances. This is contribution-weighted fairness — the same mechanism used by Tramplin on Solana.

**Anti-Sybil:** Splitting $1,000 across 10 wallets ($100 each) gives the same total weight as one wallet with $1,000. There is no advantage to splitting — economically, Sybil attacks are pointless.

### Layer 4 — Self-Funded Agent (x402 + ERC-7710)

The agent pays for every Venice API call using **x402 micropayments**:

```
Agent → POST /x402/venice (no payment header)
      ← 402 Payment Required (USDC amount, address)
Agent → sends USDC on-chain to treasury
Agent → POST /x402/venice (X-402-Payment header with proof)
      ← Venice AI response
```

The USDC comes from a separate treasury delegation — bounded to a daily maximum, payable only to the Venice facilitator address. The agent cannot drain the treasury.

This makes Clova's agent genuinely autonomous: it earns revenue (10% protocol fee from yield), spends it on intelligence (x402 → Venice), and operates entirely without human top-ups.

---

## Round Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOVA ROUND FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

  1. ONBOARD (one time)
     Connect MetaMask → upgrade EOA to Smart Account (EIP-7702)
     → sign ONE bounded delegation (ERC-7710) → deposit USDC into Aave

  2. ACCUMULATE (continuous)
     aTokens accrue yield directly in user's own smart account wallet
     User can deposit more or withdraw principal anytime

  3. AI ANALYSIS (daily — Venice + web search)
     Venice evaluates: APY, TVL, utilization, audits, sentiment, switching cost
     → "TETAP" (stay) or "PINDAH ke [Protocol]" (rotate to better option)
     Every decision logged with full reasoning + citations

  4. SWEEP YIELD (daily — batch via 1Shot relayer)
     Agent computes yield = aToken balance − principalBaseline per user
     → Withdraws yield via ERC-7710 delegation → deposits into prize pool
     On-chain guard: if remaining < baseline → REVERT (principal protected)
     All users swept in ONE on-chain transaction (1Shot batch)

  5. ROTATE (if AI recommends — same day as sweep)
     Agent moves all user positions from current protocol to recommended one
     Delegation caveats limit targets to whitelist (Aave/Compound/Moonwell)
     Gas paid in USDC via 1Shot — users need no ETH

  6. DRAW (weekly — Pyth Entropy VRF)
     Smart contract requests randomness from Pyth Entropy
     On-chain callback selects winner proportional to principalBaseline
     10% of prize → treasury. 90% → winner. Loser: principal intact.

  ↻ Repeat from step 3
```

---

## Hackathon Fit

Clova is built specifically for the MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off. Every sponsor technology is used at the core of the main demo flow — not as an afterthought.

### MetaMask Smart Accounts Kit (ERC-7710 + EIP-7702)
The entire non-custodial security model is built on MetaMask delegation. Without ERC-7710, the agent would need to be custodial. The hackathon's core theme — *permission sharing* — is the foundational primitive of Clova's trust model.

Demo moment: user signs one delegation in MetaMask, agent tries to exceed its bounds → **on-chain revert**.

### Venice AI
Venice is the brain of every round. It is called once per daily cycle, uses web search to gather live intelligence, and its full reasoning is shown to users. Venice is not a backend helper — it makes the central decision the entire protocol depends on.

Demo moment: Venice declines a rotation because web search found an audit concern on Compound → AI Transparency Panel shows the exact reasoning.

### 1Shot API (EIP-7702 + USDC gas)
All user-facing on-chain execution goes through 1Shot. The agent uses 1Shot's `relayer_send7710Transaction` with `authorizationList` (7702) to batch all users' sweep executions into a single transaction, paying gas in USDC.

Demo moment: sweep cycle runs → one 1Shot transaction covers all users → webhook confirms.

### x402 + ERC-7710
The agent pays Venice per API call via x402, authorized by a bounded treasury delegation (ERC-7710). This satisfies the x402 + ERC-7710 combined track — the first production example of an AI agent autonomously paying for its own intelligence using delegated on-chain micropayments.

Demo moment: x402 payment panel shows on-chain USDC transfers to Venice facilitator — agent funded itself.

---

## Key Differentiators (Summary)

| Feature | Why it matters |
|---|---|
| **Non-custodial principal** | Users never give up ownership of their money |
| **Bounded delegation (ERC-7710)** | Agent's power is enforced by math, not promises |
| **AI seeks opportunities, not just risks** | Actively rotates to better yield, not just away from bad |
| **Plain-language AI reasoning** | Full transparency — users understand every decision |
| **On-chain VRF (Pyth Entropy)** | Winner selection is publicly verifiable, not trusting operator |
| **Proportional + anti-Sybil tickets** | Fair by contribution, immune to wallet-splitting |
| **Self-funded agent (x402)** | Agent pays for its own intelligence, sustainable by design |
| **Batch execution (1Shot)** | All users swept in one tx — scales without proportional gas cost |
