# CLOVA — Documentation

> **No-loss prize-linked savings, autonomously managed by AI. Non-custodial. Built on Base.**

---

## What Makes Clova Different

Most DeFi savings tools are passive. You deposit, you earn, you withdraw. Clova is different in four fundamental ways:

### 1. AI That Hunts for Yield — and Explains Why

Venice AI doesn't just monitor whether your current protocol is safe. It actively **searches for better opportunities** across multiple DeFi protocols using live web search — scanning audit reports, governance proposals, liquidity trends, and market sentiment in real time. Every day, it asks: *"Should we stay, or is there a better option right now?"*

When it recommends staying on Aave even though Compound offers 1.6% higher APY, it tells you exactly why:

> *"Compound's higher yield is currently driven by incentive rewards that expire in 14 days. TVL has dropped 23% this month and a recent governance proposal introduces parameter uncertainty. Staying on Aave."*

This is the core difference from rule-based yield optimizers — **qualitative judgment with human-readable reasoning**, not just APY comparison.

### 2. Technically Impossible to Steal Your Principal

The AI agent never holds your money. Your USDC stays staked in Aave inside **your own smart account**. The agent holds a single, mathematically-bounded permission: it can only sweep the difference between your current balance and your recorded principal. If it tries to touch even one wei of principal, the smart contract **reverts on-chain** — not because of policy, but because of math.

Even if the AI is hacked, the backend is compromised, or Venice returns malicious instructions — your principal is unreachable.

### 3. Provably Fair Winner Selection via On-Chain Verifiable Randomness

Winners are not chosen by the AI, the contract owner, or any off-chain process. Clova uses **Pyth Entropy VRF** — a verifiable random function where the randomness is generated and verified entirely on-chain. Anyone can verify on Basescan that the winning number was not manipulated.

Tickets are **proportional to deposit size** (bigger deposit = more chances). Splitting $1,000 across 10 wallets gives the same total weight as one wallet with $1,000 — making Sybil attacks economically pointless.

### 4. The Agent Pays for Itself

The AI agent is self-funded. It pays for every Venice API call using **x402 micropayments** — on-chain USDC transfers authorized by a treasury delegation. The delegation is bounded: the agent can only pay up to a fixed daily limit, only to the Venice payment facilitator. It cannot drain the treasury.

This creates a genuinely autonomous agent: it earns (via treasury fee), spends (via x402), and operates entirely without human intervention.

---

## How It Compares to PoolTogether

| | PoolTogether | Clova |
|---|---|---|
| Custody | Custodial (funds pooled) | Non-custodial (funds in your wallet) |
| Yield strategy | Fixed (single protocol) | AI-managed rotation across protocols |
| Winner selection | VRF | VRF (Pyth Entropy, on-chain verifiable) |
| Ticket fairness | Deposit-weighted | Deposit-weighted (anti-Sybil economic) |
| AI transparency | None | Full — every decision logged & shown in UI |
| Agent autonomy | None | Self-funded via x402, runs on cron |
| Permission model | Trust the contract | Bounded delegation (ERC-7710) — math, not trust |

---

## Table of Contents

| Doc | Description |
|---|---|
| [Overview](./overview.md) | Problem, solution, round flow, hackathon fit |
| [Architecture](./architecture.md) | Full technical architecture & component map |
| [Smart Contracts](./smart-contracts.md) | Contract reference, ABIs, deployed addresses |
| [AI Agent](./ai-agent.md) | Venice AI reasoning, guardrails, x402 payments |
| [API Reference](./api-reference.md) | All backend endpoints |
| [Security Model](./security.md) | Invariants, caveats, threat model |
| [Deployment](./deployment.md) | How to deploy end-to-end |
| [Phase 2 Roadmap](./phase2.md) | Upcoming features & improvements |

---

## Quick Facts

| | |
|---|---|
| **Chain** | Base Mainnet (8453) |
| **Asset** | USDC |
| **Model** | Non-custodial — principal stays in user's own smart account |
| **Yield protocols** | Aave v3 · Compound v3 · Moonwell |
| **AI** | Venice AI (web search enabled, privacy-preserving) |
| **Randomness** | Pyth Entropy VRF (on-chain verifiable) |
| **Gas** | 1Shot relayer (USDC-paid, no ETH needed from users) |
| **Permissions** | ERC-7710 delegation + EIP-7702 smart accounts |

---

## Deployed Contracts (Base Mainnet)

| Contract | Address |
|---|---|
| **ClovaSavingsPool** | `0x7A02E6c648d569C17EF6966C4Db80c569B597235` |
| **AaveAdapter** | `0x7b4305AB9B3463bb243e7b3a65AbEf484e7ae598` |
| **CompoundAdapter** | `0x0b1c84649999CE5c03E267087D5fDfD446471641` |
| **MoonwellAdapter** | `0x6e52d7803A5466F3b7a0Ec940a26d349110cd6D3` |

[View on Basescan →](https://basescan.org/address/0x7A02E6c648d569C17EF6966C4Db80c569B597235)

---

## Hackathon Tracks

Built for **MetaMask Smart Accounts Kit × 1Shot API × Venice AI Dev Cook-Off** (HackQuest).

| Track | Prize | How Clova qualifies |
|---|---|---|
| **Best Agent** | $3,000 | Fully autonomous: signal → AI → guard → execute → draw, every day |
| **Best x402 + ERC-7710** | $3,000 | Agent pays Venice via x402 funded by ERC-7710 treasury delegation |
| **Best Use of Venice** | $3,000 | Venice is the brain of every round — web search, qualitative analysis, plain-language reasoning |
| **Best Use of 1Shot** | $1,000 | All user-facing execution via 1Shot relayer (7702 + USDC gas, batch sweep) |
