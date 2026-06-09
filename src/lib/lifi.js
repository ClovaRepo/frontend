"use client";
import { createClient, getQuote, getStatus } from "@lifi/sdk";
import { parseUnits, createPublicClient, http, parseAbi } from "viem";

// ── Client (singleton, no wallet provider — we use MetaMask directly) ─────────
let _client = null;
function client() {
  if (!_client) {
    _client = createClient({
      integrator: "clova",
      ...(process.env.NEXT_PUBLIC_LIFI_API_KEY
        ? { apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY }
        : {}),
    });
  }
  return _client;
}

// ── Supported source chains ────────────────────────────────────────────────────
export const BRIDGE_CHAINS = [
  {
    id: 8453,  name: "Base",     symbol: "USDC", decimals: 6,
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    rpc: "https://mainnet.base.org", native: true,
  },
  {
    id: 1,     name: "Ethereum", symbol: "USDC", decimals: 6,
    token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    rpc: "https://eth.llamarpc.com",
  },
  {
    id: 42161, name: "Arbitrum", symbol: "USDC", decimals: 6,
    token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    rpc: "https://arb1.arbitrum.io/rpc",
  },
  {
    id: 137,   name: "Polygon",  symbol: "USDC", decimals: 6,
    token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    rpc: "https://polygon-rpc.com",
  },
  {
    id: 56,    name: "BSC",      symbol: "BNB",  decimals: 18,
    token: "0x0000000000000000000000000000000000000000", // native BNB
    rpc: "https://bsc-dataseed.binance.org",
  },
];

const BASE_CHAIN = 8453;
const BASE_USDC  = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const NATIVE     = "0x0000000000000000000000000000000000000000";
const ERC20_ABI  = parseAbi([
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// ── Get a LI.FI quote ─────────────────────────────────────────────────────────
export async function fetchLifiQuote(fromChainId, fromTokenAddress, amountHuman, decimals, fromAddress) {
  const fromAmount = parseUnits(String(amountHuman), decimals).toString();
  return getQuote(client(), {
    fromChain:   fromChainId,
    toChain:     BASE_CHAIN,
    fromToken:   fromTokenAddress,
    toToken:     BASE_USDC,
    fromAmount,
    fromAddress,
    toAddress:   fromAddress,
    slippage:    0.005,
    order:       "RECOMMENDED",
  });
}

// ── Check & send ERC-20 approval if needed ────────────────────────────────────
export async function ensureApproval(chainInfo, fromAmount, approvalAddress, userAddress) {
  if (chainInfo.token === NATIVE) return null; // native — no approval needed

  const pub = createPublicClient({ transport: http(chainInfo.rpc) });
  const allowance = await pub.readContract({
    address: chainInfo.token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [userAddress, approvalAddress],
  }).catch(() => 0n);

  const needed = parseUnits(String(fromAmount), chainInfo.decimals);
  if (allowance >= needed) return null; // already approved

  // Switch MetaMask to source chain then approve
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x" + chainInfo.id.toString(16) }],
  });

  const approveTx = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [{
      from:  userAddress,
      to:    chainInfo.token,
      data:  encodeFunctionDataApprove(approvalAddress),
    }],
  });
  return approveTx; // hash of approve tx (user waits via MetaMask)
}

// Encode ERC-20 approve(spender, type(uint256).max)
function encodeFunctionDataApprove(spender) {
  // approve(address,uint256) selector = 0x095ea7b3
  const sel  = "095ea7b3";
  const addr = spender.replace("0x", "").padStart(64, "0");
  const max  = "f".repeat(64);
  return "0x" + sel + addr + max;
}

// ── Send the bridge transaction via MetaMask ──────────────────────────────────
export async function sendBridgeTx(chainInfo, quote, userAddress) {
  // Ensure MetaMask is on source chain
  await window.ethereum.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: "0x" + chainInfo.id.toString(16) }],
  });

  const tx = quote.transactionRequest;
  if (!tx) throw new Error("No transactionRequest in quote");

  const value = tx.value
    ? "0x" + BigInt(tx.value).toString(16)
    : "0x0";

  const txHash = await window.ethereum.request({
    method: "eth_sendTransaction",
    params: [{
      from:     userAddress,
      to:       tx.to,
      data:     tx.data,
      value,
      gasLimit: tx.gasLimit ? "0x" + BigInt(tx.gasLimit).toString(16) : undefined,
    }],
  });
  return txHash;
}

// ── Poll LI.FI status until DONE or FAILED ────────────────────────────────────
export async function pollBridgeStatus(txHash, quote, fromChainId, onUpdate) {
  const bridge = quote.tool;
  let attempt = 0;
  while (true) {
    await new Promise(r => setTimeout(r, attempt === 0 ? 5000 : 12000));
    attempt++;
    try {
      const status = await getStatus(client(), {
        txHash,
        bridge,
        fromChain: fromChainId,
        toChain:   BASE_CHAIN,
      });
      onUpdate?.(status);
      if (status.status === "DONE")   return status;
      if (status.status === "FAILED") throw new Error("Bridge failed: " + (status.substatusMessage ?? ""));
    } catch (e) {
      if (e.message?.startsWith("Bridge failed")) throw e;
      // network error — keep polling
    }
  }
}

// ── Estimate display helpers ──────────────────────────────────────────────────
export function quoteEstimate(quote) {
  const received = quote?.estimate?.toAmount
    ? (Number(quote.estimate.toAmount) / 1e6).toFixed(2)
    : "—";
  const feeCosts = quote?.estimate?.feeCosts ?? [];
  const totalFeeUsd = feeCosts.reduce((s, f) => s + Number(f.amountUSD ?? 0), 0);
  const tool = quote?.toolDetails?.name ?? quote?.tool ?? "bridge";
  return { received, totalFeeUsd: totalFeeUsd.toFixed(2), tool };
}
