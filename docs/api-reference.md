# API Reference

Base URL: `https://your-backend.railway.app` (or `http://localhost:3001` locally)

---

## Public Endpoints

### `GET /decisions`
Returns AI decision log for the transparency panel.

**Query params:**
| Param | Default | Description |
|---|---|---|
| `limit` | `20` | Number of entries to return (max 100) |

**Response:**
```json
[
  {
    "id": "uuid",
    "timestamp": 1749456000000,
    "round": 5,
    "recommendation": "TETAP",
    "riskScore": 32,
    "reasoning": "Aave maintains strong TVL at $128M with 74% utilization indicating organic borrowing demand. Compound's higher APY (6.8% vs 5.2%) does not justify rotation — TVL gap is significant and recent governance proposal introduces parameter uncertainty. Staying on Aave.",
    "citations": ["https://...", "https://..."],
    "yieldSweptUsdc": "1.234567",
    "participantCount": 5,
    "guardRailTriggered": false
  }
]
```

---

### `GET /status`
Live pool state for dashboard polling.

**Response:**
```json
{
  "poolAddress": "0x7A02...",
  "currentRound": 5,
  "roundYieldPool": "3.456789",
  "participantCount": 5,
  "activeProtocol": "Aave",
  "agentAddress": "0x817E...",
  "emergencyMode": false
}
```

---

### `GET /transactions`
Recent 1Shot relay transactions (proof of 1Shot usage).

**Response:**
```json
[
  {
    "taskId": "0xabc...",
    "timestamp": 1749456000000,
    "type": "sweep",
    "yieldAmountUsdc": "1.234567",
    "txHash": "0xdef...",
    "status": "confirmed",
    "basescanUrl": "https://basescan.org/tx/0xdef..."
  }
]
```

---

### `GET /x402-payments`
Venice payment receipts (proof of x402 usage).

**Response:**
```json
[
  {
    "id": "uuid",
    "timestamp": 1749456000000,
    "txHash": "0x123...",
    "amountUsdc": "0.001000",
    "payTo": "0x92F9...",
    "resource": "/x402/venice",
    "basescanUrl": "https://basescan.org/tx/0x123..."
  }
]
```

---

## User Endpoints

### `POST /delegation`
Store a user's signed delegation (called from frontend after `wallet_grantPermissions`).

**Body:**
```json
{
  "userAddress": "0xUserAddress",
  "permissionContext": "0x...",
  "delegationManager": "0xDelegationManagerAddress"
}
```

**Response:**
```json
{ "ok": true }
```

---

### `DELETE /delegation/:address`
Revoke delegation (called when user clicks "Cabut Izin" in dashboard).

**Response:**
```json
{ "ok": true }
```

---

### `POST /record-principal`
Records user's Aave deposit as their principal baseline. Called after user supplies USDC to Aave.

**Body:**
```json
{
  "userAddress": "0xUserAddress"
}
```

> Backend reads actual aToken balance on-chain — does not trust user-provided amount. This prevents pre-existing Aave positions from being incorrectly swept as yield.

**Response:**
```json
{
  "ok": true,
  "baseline": "1000000000"
}
```

---

### `POST /sync-withdrawal`
Updates principal baseline after user withdraws from Aave.

**Body:**
```json
{
  "userAddress": "0xUserAddress",
  "amount": "500000000"
}
```

**Response:**
```json
{ "ok": true }
```

---

### `POST /webhook/1shot`
Webhook called by 1Shot relayer when a transaction confirms or fails.

**Body (from 1Shot):**
```json
{
  "taskId": "0xabc...",
  "status": 200,
  "hash": "0xdef...",
  "message": "confirmed"
}
```

Status codes: `100` = queued, `110` = submitted, `200` = confirmed, `400` = failed, `500` = reverted.

---

## Admin Endpoints

All admin endpoints require auth. Two methods:

**Method A — Static secret (for scripts/curl):**
```
Header: x-admin-secret: YOUR_ADMIN_SECRET
```

**Method B — Wallet signature (for frontend admin panel):**
```
POST /admin/draw-signed  { address, signature: sign("clova-admin-draw") }
```
Signature must be from `DEPLOYER_ADDRESS`. Rate limited: 1x/hour.

---

### `POST /admin/run-cycle`
Trigger sweep cycle manually (Venice + sweep yield, no draw).
Rate limited: 1x/hour.

**Response:**
```json
{ "ok": true, "message": "Sweep cycle started." }
```

---

### `POST /admin/draw`
Trigger draw cycle manually (Pyth VRF → winner selection).
Rate limited: 1x/hour.

**Response:**
```json
{ "ok": true, "message": "Draw cycle started." }
```

---

### `POST /admin/draw-signed`
Trigger draw via deployer wallet signature (no static secret needed in frontend).

**Body:**
```json
{
  "address": "0xDeployerAddress",
  "signature": "0x..."
}
```
Signature message: `"clova-admin-draw"`

**Response:**
```json
{ "ok": true, "message": "Draw started. Winner picked by Pyth VRF." }
```

---

### `POST /admin/test-venice`
Test Venice AI connection and reasoning.

**Response:**
```json
{
  "ok": true,
  "recommendation": "TETAP",
  "riskScore": 32,
  "reasoning": "..."
}
```

---

### `GET /admin/agent-balance`
Check agent wallet ETH + USDC balance.

**Response:**
```json
{
  "address": "0x817E...",
  "ethBalance": "0.000999",
  "usdcBalance": "1.979824"
}
```

---

## x402 Proxy

### `POST /x402/venice`
Internal endpoint used by the agent to pay for Venice calls via x402.

**Step 1 — Discover payment requirements (no header):**
```
Response 402:
{
  "x402Version": 1,
  "accepts": [{
    "scheme": "exact",
    "network": "base",
    "maxAmountRequired": "1000",
    "payTo": "0x92F9...",
    "asset": "0x8335...",
    "extra": { "name": "USDC", "version": "2" }
  }]
}
```

**Step 2 — Pay and retry (with X-402-Payment header):**
```
Header: X-402-Payment: base64(paymentProof)
→ Proxied to Venice API
→ Returns Venice AI response
```
