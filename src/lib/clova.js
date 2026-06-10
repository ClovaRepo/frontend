"use client";

// ── Chain detection ────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_CHAIN_ID=8453 untuk mainnet, 84532 untuk Sepolia (default dev)
const CHAIN_ID_ENV = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 84532);
export const CHAIN_ID = CHAIN_ID_ENV;
export const IS_MAINNET = CHAIN_ID === 8453;

// ── Contract addresses ─────────────────────────────────────────────────────────
export const POOL_ADDRESS = (
  process.env.NEXT_PUBLIC_POOL_ADDRESS ||
  (IS_MAINNET ? "" : "0xca1c274d99195a9c1bB3Cb087b175aE60Ec7DA25")
);

export const ADAPTER_ADDRESS = (
  process.env.NEXT_PUBLIC_ADAPTER_ADDRESS ||
  (IS_MAINNET ? "" : "0x8da30606f5fe5Af648E6903Fc35bFdE3C3383535")
);

export const USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  (IS_MAINNET
    ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"   // USDC Base mainnet
    : "0x036CbD53842c5426634e7929541eC2318f3dCF7e")   // USDC Base Sepolia
);

export const AAVE_POOL = IS_MAINNET
  ? "0xA238Dd80C259a72e81d7e4664a9801593F98d1c5"     // Aave v3 Base mainnet
  : "0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27";    // Aave v3 Base Sepolia

// aUSDC — Aave interest-bearing USDC (what user holds after depositing to Aave)
// User delegates THIS token for Aave yield sweep + Aave→Moonwell rotation pull.
// ERC20 transfer() only — enforcer rejects Aave.withdraw().
export const AUSDC_ADDRESS = IS_MAINNET
  ? "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB"   // aBasUSDC Base mainnet
  : "0x96B8980C5c484d3e0345Dc77D92c3d2F36Af6a1a";  // aBasUSDC Base Sepolia

// mUSDC — Moonwell interest-bearing USDC (Compound v2 mToken, transferable ERC20)
// User delegates THIS token for Moonwell yield sweep.
// Base Sepolia has no Moonwell → zero address (rotation disabled on testnet).
export const MOONWELL_MUSDC_ADDRESS = IS_MAINNET
  ? "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22"   // mUSDC Base mainnet
  : "0x0000000000000000000000000000000000000000";   // not deployed on Sepolia

export const AGENT_ADDRESS = (
  process.env.NEXT_PUBLIC_AGENT_ADDRESS || "0x817E6370fdacA82DEcdD05AD8f464981d05935d3"
);

// RotationHelper: user must approve aUSDC to this address for Aave→Moonwell rotation
export const ROTATION_HELPER_ADDRESS = (
  process.env.NEXT_PUBLIC_ROTATION_HELPER_ADDRESS ||
  (IS_MAINNET ? "0xEa448dF1052212F1E7463628F98e836893DD23E2" : "0x0000000000000000000000000000000000000000")
);

// 1Shot relayer target wallet — delegation delegate MUST be this address for 1Shot to execute
export const ONESHOT_TARGET = "0x26a529124f0bbf9af9d8f9f84a43efe47cf1199a";

export const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001"
);

// EIP-7702 StatelessDeleGator — same address on all chains (MetaMask delegation-toolkit)
export const EIP7702_IMPL = "0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B";

// ── Chain config for viem ──────────────────────────────────────────────────────
export const BASE_MAINNET = {
  id: 8453,
  name: "Base",
  network: "base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] }, public: { http: ["https://mainnet.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
  testnet: false,
};

export const BASE_SEPOLIA = {
  id: 84532,
  name: "Base Sepolia",
  network: "base-sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] }, public: { http: ["https://sepolia.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://sepolia.basescan.org" } },
  testnet: true,
};

// Active chain — used everywhere in the app
export const ACTIVE_CHAIN = IS_MAINNET ? BASE_MAINNET : BASE_SEPOLIA;

// ── ABIs ───────────────────────────────────────────────────────────────────────
export const USDC_ABI = [
  { name: "approve",   type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view",       inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view",       inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "decimals",  type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint8" }] },
];

export const AAVE_ABI = [
  { name: "supply",   type: "function", stateMutability: "nonpayable", inputs: [{ name: "asset", type: "address" }, { name: "amount", type: "uint256" }, { name: "onBehalfOf", type: "address" }, { name: "referralCode", type: "uint16" }], outputs: [] },
  { name: "withdraw", type: "function", stateMutability: "nonpayable", inputs: [{ name: "asset", type: "address" }, { name: "amount", type: "uint256" }, { name: "to", type: "address" }], outputs: [{ type: "uint256" }] },
];

export const ADAPTER_ABI = [
  { name: "valueOf", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
];

export const POOL_ABI = [
  { name: "register",            type: "function", stateMutability: "nonpayable", inputs: [{ name: "user", type: "address" }, { name: "worldIdProof", type: "bytes" }], outputs: [] },
  { name: "principalBaseline",   type: "function", stateMutability: "view",       inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "currentRound",        type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint256" }] },
  { name: "roundYieldPool",      type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getParticipants",     type: "function", stateMutability: "view",       inputs: [], outputs: [{ name: "", type: "address[]" }] },
  { name: "pendingYield",        type: "function", stateMutability: "view",       inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { name: "isParticipant",       type: "function", stateMutability: "view",       inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }] },
  { name: "activeProtocol",      type: "function", stateMutability: "view",       inputs: [], outputs: [{ type: "string" }] },
];
