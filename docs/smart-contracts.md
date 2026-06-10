# Smart Contracts

## Deployed Addresses (Base Mainnet — Chain ID 8453)

> Semua kontrak di-deploy ulang pada Juni 2026 dengan pola **UUPS upgradeable proxy** (ERC1967). `ClovaSavingsPool` adalah proxy — implementasinya terpisah dan bisa di-upgrade oleh admin tanpa mengubah alamat proxy.

| Contract | Address | Basescan |
|---|---|---|
| **ClovaSavingsPool** (proxy) | `0x96246c2d585D423931c00703Fa74589458B6050b` | [View](https://basescan.org/address/0x96246c2d585D423931c00703Fa74589458B6050b) |
| **AaveAdapter** | `0xac8AA12d6E0Fd04D6A9A726A68af0D1109122557` | [View](https://basescan.org/address/0xac8AA12d6E0Fd04D6A9A726A68af0D1109122557) |
| **CompoundAdapter** | `0x727B2c11A70d1C215b7A7455245731694e70AFb9` | [View](https://basescan.org/address/0x727B2c11A70d1C215b7A7455245731694e70AFb9) |
| **MoonwellAdapter** | `0xc7D3b8cda22fcD1B0d3d651326E04C46b2A37ba9` | [View](https://basescan.org/address/0xc7D3b8cda22fcD1B0d3d651326E04C46b2A37ba9) |
| **RotationHelper** | `0xEa448dF1052212F1E7463628F98e836893DD23E2` | [View](https://basescan.org/address/0xEa448dF1052212F1E7463628F98e836893DD23E2) |

**External contracts used:**
| Contract | Address |
|---|---|
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Aave v3 Pool | `0xA238Dd80C259a72e81d7e4664a9801593F98d1c5` |
| Aave aUSDC | `0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB` |
| Compound Comet | `0xb125E6687d4313864e53df431d5425969c15Eb2F` |
| Moonwell mUSDC | `0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22` |
| Pyth Entropy | `0x6E7D74FA7d5c90FEF9F0512987605a6d546181Bb` |

---

## RotationHelper

Kontrak helper untuk rotasi protokol yang **atomic** — seluruh perpindahan dana terjadi dalam 1 transaksi EVM. Jika ada langkah yang gagal, EVM otomatis revert dan user tetap memegang token aslinya.

### Alur Aave → Moonwell

```
1. RotationHelper.transferFrom(user, self, aUSDC amount)   — tarik aUSDC dari user
2. aave.withdraw(USDC, amount, self)                       — tukar aUSDC → USDC
3. usdc.approve(moonwell, amount)
4. moonwell.mint(amount)                                   — deposit USDC → mUSDC
5. mUSDC.transfer(user, mUsdcReceived)                     — kirim mUSDC ke user
```

### Alur Moonwell → Aave

```
1. RotationHelper.transferFrom(user, self, mUSDC amount)   — tarik mUSDC dari user
2. moonwell.redeemUnderlying(usdcAmount)                   — tukar mUSDC → USDC
3. usdc.approve(aave, usdcAmount)
4. aave.supply(USDC, usdcAmount, user, 0)                  — deposit langsung ke nama user
```

### Prasyarat (sekali saat onboarding)

User harus approve dua token ke RotationHelper:
- `aUSDC.approve(ROTATION_HELPER, type(uint256).max)` — untuk rotasi Aave→Moonwell
- `mUSDC.approve(ROTATION_HELPER, type(uint256).max)` — untuk rotasi Moonwell→Aave

Approval ini dilakukan satu kali saat onboarding. Setelah itu, agent bisa merotasi dana user kapan saja secara otonom.

```solidity
function rotateAaveToMoonwell(address user, uint256 usdcAmount) external;
function rotateMoonwellToAave(address user, uint256 mUsdcAmount) external;
```

---

## ClovaSavingsPool

### State Variables

```solidity
// Participant state
mapping(address => uint256) public principalBaseline;  // user's recorded deposit
mapping(address => uint256) public eligibleFromRound;  // anti-sniping: eligible from round N+1
mapping(address => bool)    public isVerifiedHuman;
mapping(address => bool)    public isParticipant;
address[]                   public participants;

// Protocol management
mapping(string => IYieldAdapter) public registeredAdapters;
string public activeProtocol;
IYieldAdapter public yieldAdapter;

// Round state
uint256 public currentRound;
uint256 public roundYieldPool;

// Config
address public treasury;
uint256 public platformFeeBps;  // 1000 = 10%
IEntropyV2 public entropy;      // Pyth Entropy
```

### Key Functions

#### `register(address user, bytes calldata worldIdProof)`
Registers a user as a participant. Sets `isParticipant[user] = true`.
- Phase 2: World ID proof verified on-chain.

#### `recordPrincipal(address user, uint256 amount)`
Records user's initial deposit baseline. Called by agent after user supplies to Aave.
- Sets `eligibleFromRound[user] = currentRound + 1` on first deposit (anti-sniping).
- `principalBaseline[user] += amount`

#### `recordWithdrawal(address user, uint256 amount)`
Decreases baseline when user withdraws principal. Keeps I1 invariant valid.

#### `depositYield(address user, uint256 amount)`
Core security function. Agent sweeps yield here.
```solidity
// Pull USDC from agent
usdc.safeTransferFrom(msg.sender, address(this), amount);

// INVARIANT I1: after withdrawal, user's aToken balance >= baseline
uint256 remaining = yieldAdapter.valueOf(user);
if (remaining < baseline) {
    usdc.safeTransfer(msg.sender, amount); // refund
    revert AgentCannotTouchPrincipal(amount, remaining, baseline);
}
roundYieldPool += amount;
```

#### `requestDraw()`
Requests randomness from Pyth Entropy. Only callable by `AGENT_ROLE`.
Requires ETH in pool contract to pay Pyth fee.

#### `entropyCallback(uint64, address, bytes32 randomNumber)`
Called by Pyth after randomness is fulfilled. Selects winner proportionally:
```solidity
// Weight = min(actual aToken balance, principalBaseline)
// Users who withdrew from Aave directly get weight = 0 automatically
uint256 w = actual < baseline ? actual : baseline;
```
Winner selected via cumulative weighted random. Fee → treasury, prize → winner.

#### `rotateProtocol(string calldata newProtocol)`
Changes active yield adapter. Only callable by `AGENT_ROLE`. Adapter must be pre-registered by admin.

---

## Security Invariants

Three hard invariants enforced entirely on-chain:

### I1 — Agent Cannot Touch Principal
```
After yield sweep: aToken balance of user ≥ principalBaseline[user]
```
Enforced in `depositYield()`. If violated → revert + refund. No exceptions.

### I2 — Funds Only Exit to Winner or Treasury
```
Prize USDC only flows to: winner (verified participant) or treasury address
```
Enforced in `entropyCallback()`. No arbitrary transfer function exists.

### I3 — Agent Can Only Use Whitelisted Protocols
```
All protocol addresses must be in approvedProtocols[] mapping
```
Enforced via `requireApprovedProtocol()`. Only admin (not agent, not AI) can modify whitelist.

---

## IYieldAdapter Interface

All yield protocol adapters implement this interface:

```solidity
interface IYieldAdapter {
    function supplyFor(address user, uint256 amount) external;
    function withdrawFor(address user, uint256 amount, address to) external;
    function valueOf(address user) external view returns (uint256);
    function protocol() external view returns (address);
    function underlying() external view returns (address);
}
```

### AaveAdapter
- `valueOf(user)` → `IERC20(aUSDC).balanceOf(user)` (aToken balance = principal + accrued interest)
- `supplyFor` → `aave.supply(USDC, amount, user, 0)`
- `withdrawFor` → `aave.withdraw(USDC, amount, to)`

### CompoundAdapter
- `valueOf(user)` → reads user's balance from Comet contract
- `withdrawFor` → `comet.withdraw(USDC, amount)` → sends to user → user transfers to agent

### MoonwellAdapter
- `valueOf(user)` → `mToken.balanceOfUnderlying(user)`
- `withdrawFor` → `mToken.redeemUnderlying(amount)` → sends to user → user transfers to agent

---

## Roles

| Role | Address | Capabilities |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | Deployer (`0x92F9...`) | setYieldAdapter, registerAdapter, setProtocolApproval, pause |
| `AGENT_ROLE` | Agent wallet (`0x817E...`) | recordPrincipal, recordWithdrawal, depositYield, requestDraw, rotateProtocol |

---

## Events

```solidity
event UserRegistered(address indexed user, uint256 indexed round);
event PrincipalRecorded(address indexed user, uint256 amount, uint256 indexed round);
event PrincipalWithdrawn(address indexed user, uint256 amount, uint256 newBaseline, uint256 indexed round);
event YieldSwept(address indexed user, uint256 amount, uint256 indexed round);
event WinnerPicked(address indexed winner, uint256 prize, uint256 fee, uint256 indexed round);
event DrawRequested(uint256 indexed round, uint256 requestId);
event RoundStarted(uint256 indexed round);
event ProtocolRotated(string fromProtocol, string toProtocol, uint256 indexed round);
```

---

## Test Coverage

87 tests across 4 test suites:

| Suite | Tests | Focus |
|---|---|---|
| `ClovaSavingsPoolTest` | 49 | Core pool logic, enrollment, yield sweep, draw |
| `ProtocolRotationTest` | 23 | Multi-adapter rotation, edge cases |
| `MoonwellAdapterTest` | 12 | Moonwell-specific behavior |
| `ClovaInvariantTest` | 3 | Fuzz invariants I1/I2/I3 |

Critical tests:
- `test_AgentCannotTouchPrincipal()` → agent sweep of principal reverts ✅
- `test_AgentCanSweepYieldOnly()` → legitimate yield sweep succeeds ✅
- `test_DrawProportional()` → winner selection weighted by principalBaseline ✅
- `test_RevokedDelegation_AgentLumpuh()` → revoke cuts off agent ✅
