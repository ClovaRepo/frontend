"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  createWalletClient, createPublicClient, custom, http,
  parseUnits, formatUnits,
} from "viem";
import { erc7715ProviderActions } from "@metamask/smart-accounts-kit/actions";
import {
  CHAIN_ID, IS_MAINNET, ACTIVE_CHAIN, EIP7702_IMPL,
  USDC_ADDRESS, USDC_ABI, AAVE_POOL, AAVE_ABI, AUSDC_ADDRESS, MOONWELL_MUSDC_ADDRESS,
  POOL_ADDRESS, POOL_ABI, ADAPTER_ADDRESS, ADAPTER_ABI,
  AGENT_ADDRESS, ONESHOT_TARGET, BACKEND_URL, ROTATION_HELPER_ADDRESS,
} from "../lib/clova.js";

const WalletContext = createContext(null);

const CHAIN_HEX = "0x" + CHAIN_ID.toString(16);

async function switchToActiveChain() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }],
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: CHAIN_HEX,
          chainName: ACTIVE_CHAIN.name,
          nativeCurrency: ACTIVE_CHAIN.nativeCurrency,
          rpcUrls: ACTIVE_CHAIN.rpcUrls.default.http,
          blockExplorerUrls: [ACTIVE_CHAIN.blockExplorers.default.url],
        }],
      });
    } else throw err;
  }
}

export function WalletProvider({ children }) {
  const [account, setAccount]             = useState(null);
  const [isUpgraded, setIsUpgraded]       = useState(false);
  const [hasDelegation, setHasDelegation] = useState(false);
  const [principalUsdc, setPrincipalUsdc] = useState(0n);
  const [usdcBalance, setUsdcBalance]     = useState(0n);

  const publicClient = useRef(
    createPublicClient({ chain: ACTIVE_CHAIN, transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || ACTIVE_CHAIN.rpcUrls.default.http[0]) })
  ).current;

  // Sync when MetaMask account/disconnect changes externally
  React.useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected from MetaMask
        setAccount(null);
        setIsUpgraded(false);
        setHasDelegation(false);
        setPrincipalUsdc(0n);
        setUsdcBalance(0n);
      } else {
        setAccount(accounts[0]);
      }
    };
    window.ethereum.on("accountsChanged", onAccountsChanged);
    return () => window.ethereum.removeListener("accountsChanged", onAccountsChanged);
  }, []);

  // ── Refresh USDC balance ─────────────────────────────────────────────────
  const refreshBalance = useCallback(async (addr) => {
    const target = addr || account;
    if (!target) return;
    const bal = await publicClient.readContract({
      address: USDC_ADDRESS, abi: USDC_ABI, functionName: "balanceOf", args: [target],
    }).catch(() => 0n);
    setUsdcBalance(bal);
    return bal;
  }, [account, publicClient]);

  // ── OB1: Connect wallet ──────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    await switchToActiveChain();
    const addr = accounts[0];
    setAccount(addr);

    // Read on-chain state + check backend for valid delegation
    const [bal, principal, participant, delegationRes] = await Promise.all([
      publicClient.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "balanceOf", args: [addr] }),
      publicClient.readContract({ address: POOL_ADDRESS, abi: POOL_ABI, functionName: "principalBaseline", args: [addr] }).catch(() => 0n),
      publicClient.readContract({ address: POOL_ADDRESS, abi: POOL_ABI, functionName: "isParticipant", args: [addr] }).catch(() => false),
      fetch(`${BACKEND_URL}/delegation/${addr}`).then(r => r.ok).catch(() => false),
    ]);
    setUsdcBalance(bal);
    setPrincipalUsdc(principal);
    // isUpgraded jika sudah ada principal on-chain; hasDelegation hanya jika backend juga punya delegasi
    if (principal > 0n) setIsUpgraded(true);
    if (principal > 0n && delegationRes) setHasDelegation(true);

    return addr;
  }, [publicClient]);

  // ── OB3: EIP-7702 upgrade EOA → Smart Account ───────────────────────────
  // MetaMask JSON-RPC accounts can't use viem's signAuthorization directly.
  // We use eth_signAuthorization (MetaMask's native EIP-7702 RPC) then
  // send the self-tx via eth_sendTransaction with authorizationList.
  const upgradeToSmartAccount = useCallback(async () => {
    if (!account) throw new Error("Connect wallet first");

    // 1. Ask MetaMask to sign the EIP-7702 authorization
    const nonce = await publicClient.getTransactionCount({ address: account });
    const authPayload = {
      contractAddress: EIP7702_IMPL,
      chainId: "0x" + CHAIN_ID.toString(16),
      nonce: "0x" + nonce.toString(16),
    };

    try {
      // MetaMask v12.8+ supports eth_signAuthorization
      const sig = await window.ethereum.request({
        method: "eth_signAuthorization",
        params: [authPayload],
      });

      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{
          from: account,
          to: account,
          value: "0x0",
          data: "0x",
          authorizationList: [{ ...authPayload, ...sig }],
        }],
      });
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (err) {
      if (err.code === -32601 || err.code === 4200) {
        // Method not supported — older MetaMask. Mark as upgraded anyway so
        // user can proceed to OB4 (delegation signing is the key feature).
        console.warn("[7702] eth_signAuthorization not supported, skipping upgrade. Delegation signing still works.");
      } else {
        throw err;
      }
    }

    setIsUpgraded(true);
    return null;
  }, [account, publicClient]);

  // ── OB4: Request permissions via ERC-7715 (MetaMask Smart Accounts Kit) ──
  //
  // Requests 2 permissions:
  //   1. aUSDC (Aave) — yield sweep when on Aave, and full-balance pull for rotation
  //   2. mUSDC (Moonwell) — yield sweep when on Moonwell (only on mainnet where Moonwell exists)
  //
  // 1Shot relay fee is paid by the agent from its own USDC (agent is EIP-7702 upgraded).
  // Requires MetaMask >= v13.23.0 (or Flask >= v13.5.0) for erc20-token-periodic.
  const signAndStoreDelegation = useCallback(async () => {
    if (!account) throw new Error("Connect wallet first");

    const walletClient = createWalletClient({
      transport: custom(window.ethereum),
    }).extend(erc7715ProviderActions());

    const expiry = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

    // Permission 1: aUSDC — Aave yield sweep + rotation pull (needs full principal coverage)
    const aavePermission = {
      chainId: CHAIN_ID,
      expiry,
      to: ONESHOT_TARGET,
      permission: {
        type: "erc20-token-periodic",
        isAdjustmentAllowed: false,
        data: {
          tokenAddress: AUSDC_ADDRESS,
          periodAmount: parseUnits("10000", 6),
          periodDuration: 604800,
          justification: "CLOVA agent sweeps aUSDC yield dan pull untuk rotasi protokol (≤10,000/week)",
        },
      },
    };

    // Request aUSDC permission (popup 1)
    let grantedAave;
    try {
      grantedAave = await walletClient.requestExecutionPermissions([aavePermission]);
    } catch (err) {
      if (err.code === -32601 || err.code === 4200) {
        throw new Error("MetaMask versi terlalu lama. Upgrade ke MetaMask ≥ v13.23.0 atau gunakan MetaMask Flask ≥ v13.5.0.");
      }
      throw err;
    }

    const { context: permissionContext, delegationManager } = grantedAave[0];

    // Request mUSDC permission (popup 2) — terpisah karena MetaMask tidak support batch
    // Moonwell hanya tersedia di mainnet; skip di testnet
    let mUsdcPermissionContext;
    if (MOONWELL_MUSDC_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const moonwellPermission = {
          chainId: CHAIN_ID,
          expiry,
          to: ONESHOT_TARGET,
          permission: {
            type: "erc20-token-periodic",
            isAdjustmentAllowed: false,
            data: {
              tokenAddress: MOONWELL_MUSDC_ADDRESS,
              periodAmount: parseUnits("200", 6),
              periodDuration: 604800,
              justification: "CLOVA agent sweeps mUSDC yield (≤200/week) saat aktif di Moonwell",
            },
          },
        };
        const grantedMoonwell = await walletClient.requestExecutionPermissions([moonwellPermission]);
        mUsdcPermissionContext = grantedMoonwell[0]?.context;
        console.log("[delegation] mUsdcPermissionContext:", mUsdcPermissionContext ? "✅ ada" : "❌ kosong");
      } catch (err) {
        // mUSDC permission opsional — sweep Moonwell tidak tersedia tapi rotasi tetap bisa
        console.warn("[delegation] mUSDC permission skipped:", err.message);
      }
    }

    const res = await fetch(`${BACKEND_URL}/delegation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAddress: account,
        permissionContext,
        mUsdcPermissionContext,
        delegationManager,
      }),
    });
    if (!res.ok) throw new Error(`Failed to store delegation: ${await res.text()}`);
    setHasDelegation(true);
    return { permissionContext, mUsdcPermissionContext, delegationManager };
  }, [account]);

  // ── Helper: re-authorize + create walletClient ───────────────────────────
  // MetaMask revokes site authorization when user disconnects. Re-calling
  // eth_requestAccounts re-establishes the session before any write call.
  const getAuthorizedWalletClient = useCallback(async () => {
    await switchToActiveChain();
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const addr = accounts[0];
    if (!addr) throw new Error("No account authorized");
    if (addr.toLowerCase() !== account?.toLowerCase()) {
      // Account changed — update state so UI stays in sync
      setAccount(addr);
    }
    return {
      addr,
      walletClient: createWalletClient({
        account: addr,
        chain: ACTIVE_CHAIN,
        transport: custom(window.ethereum),
      }),
    };
  }, [account]);

  // ── OB5: Approve USDC → supply to Aave → register on pool ───────────────
  const deposit = useCallback(async (amountUsdc) => {
    if (!account) throw new Error("Connect wallet first");
    const { addr, walletClient } = await getAuthorizedWalletClient();

    const amount = parseUnits(String(amountUsdc), 6);

    // 1. Approve USDC to Aave — only if current allowance < amount
    const allowance = await publicClient.readContract({
      address: USDC_ADDRESS, abi: USDC_ABI, functionName: "allowance", args: [addr, AAVE_POOL],
    }).catch(() => 0n);

    if (allowance < amount) {
      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [AAVE_POOL, amount],
        gas: 100000n,
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });
    }

    // 2. Supply to Aave (user's wallet → user's aToken balance)
    const supplyTx = await walletClient.writeContract({
      address: AAVE_POOL,
      abi: AAVE_ABI,
      functionName: "supply",
      args: [USDC_ADDRESS, amount, addr, 0],
      gas: 300000n,
    });
    await publicClient.waitForTransactionReceipt({ hash: supplyTx });

    // 3. One-time approve aUSDC + mUSDC → RotationHelper (enables autonomous rotation)
    //    Agent calls RotationHelper which uses transferFrom — needs user approval once.
    if (ROTATION_HELPER_ADDRESS && ROTATION_HELPER_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      const ERC20_ABI = [{ name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }] }, { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }] }];
      const MAX = 2n ** 256n - 1n;

      const aUsdcAllowance = await publicClient.readContract({
        address: AUSDC_ADDRESS, abi: ERC20_ABI, functionName: "allowance",
        args: [addr, ROTATION_HELPER_ADDRESS],
      }).catch(() => 0n);
      if (aUsdcAllowance < amount * 1000n) {
        const tx = await walletClient.writeContract({
          address: AUSDC_ADDRESS, abi: ERC20_ABI,
          functionName: "approve", args: [ROTATION_HELPER_ADDRESS, MAX], gas: 100000n,
        });
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }

      if (MOONWELL_MUSDC_ADDRESS && MOONWELL_MUSDC_ADDRESS !== "0x0000000000000000000000000000000000000000") {
        const mUsdcAllowance = await publicClient.readContract({
          address: MOONWELL_MUSDC_ADDRESS, abi: ERC20_ABI, functionName: "allowance",
          args: [addr, ROTATION_HELPER_ADDRESS],
        }).catch(() => 0n);
        if (mUsdcAllowance === 0n) {
          const tx = await walletClient.writeContract({
            address: MOONWELL_MUSDC_ADDRESS, abi: ERC20_ABI,
            functionName: "approve", args: [ROTATION_HELPER_ADDRESS, MAX], gas: 100000n,
          });
          await publicClient.waitForTransactionReceipt({ hash: tx });
        }
      }
    }

    // 4. Register user on pool (permissionless — no worldId for MVP)
    const isParticipant = await publicClient.readContract({
      address: POOL_ADDRESS, abi: POOL_ABI, functionName: "isParticipant", args: [addr],
    }).catch(() => false);

    if (!isParticipant) {
      const regTx = await walletClient.writeContract({
        address: POOL_ADDRESS,
        abi: POOL_ABI,
        functionName: "register",
        args: [addr, "0x"],
        gas: 150000n,
      });
      await publicClient.waitForTransactionReceipt({ hash: regTx });
    }

    // 5. Notify backend to call recordPrincipal (agent-only function)
    await fetch(`${BACKEND_URL}/record-principal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: addr, amount: amount.toString() }),
    }).catch((e) => console.warn("record-principal failed:", e));

    // Update local state
    const newBal = await publicClient.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "balanceOf", args: [addr] });
    const newPrincipal = await publicClient.readContract({ address: POOL_ADDRESS, abi: POOL_ABI, functionName: "principalBaseline", args: [addr] }).catch(() => amount);
    setUsdcBalance(newBal);
    setPrincipalUsdc(newPrincipal);
    return supplyTx;
  }, [account, publicClient, getAuthorizedWalletClient]);

  // ── Withdraw from Aave ────────────────────────────────────────────────────
  const withdraw = useCallback(async (amountUsdc) => {
    if (!account) throw new Error("Connect wallet first");
    const { addr, walletClient } = await getAuthorizedWalletClient();
    const amount = amountUsdc ? parseUnits(String(amountUsdc), 6) : (2n ** 256n - 1n);

    const tx = await walletClient.writeContract({
      address: AAVE_POOL, abi: AAVE_ABI, functionName: "withdraw",
      args: [USDC_ADDRESS, amount, addr],
      gas: 300000n,
    });
    await publicClient.waitForTransactionReceipt({ hash: tx });

    // Refresh principal and balance after withdraw
    const [newBal, newPrincipal] = await Promise.all([
      publicClient.readContract({ address: USDC_ADDRESS, abi: USDC_ABI, functionName: "balanceOf", args: [addr] }).catch(() => 0n),
      publicClient.readContract({ address: POOL_ADDRESS, abi: POOL_ABI, functionName: "principalBaseline", args: [addr] }).catch(() => 0n),
    ]);
    setUsdcBalance(newBal);
    setPrincipalUsdc(newPrincipal);

    await fetch(`${BACKEND_URL}/sync-withdrawal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress: addr, amount: amount.toString() }),
    }).catch(() => {});

    return tx;
  }, [account, publicClient, getAuthorizedWalletClient]);

  // ── Revoke delegation ──────────────────────────────────────────────────────
  const revokeDelegation = useCallback(async () => {
    if (!account) return;
    await fetch(`${BACKEND_URL}/delegation/${account}`, { method: "DELETE" }).catch(() => {});
    setHasDelegation(false);
  }, [account]);

  // ── Read live pool data — via backend /status to avoid RPC rate limits ────
  const fetchPoolData = useCallback(async () => {
    if (!account) return null;
    try {
      const res = await fetch(`${BACKEND_URL}/status?user=${account}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const d = await res.json();
      return {
        principalUsdc:    Number(d.user?.principalUsdc ?? 0),
        userYieldUsdc:    Number(d.user?.userYieldUsdc ?? 0),
        currentRound:     d.currentRound ?? 0,
        poolYieldUsdc:    Number(d.roundYieldPool ?? 0),
        participantCount: d.participantCount ?? 0,
        chancePct:        d.user?.chancePct ?? 0,
        activeProtocol:   d.activeProtocol ?? "Aave v3",
      };
    } catch {
      return null;
    }
  }, [account]);

  const value = {
    account,
    isUpgraded,
    hasDelegation,
    principalUsdc,
    usdcBalance,
    connect,
    upgradeToSmartAccount,
    signAndStoreDelegation,
    deposit,
    withdraw,
    revokeDelegation,
    fetchPoolData,
    refreshBalance,
    publicClient,
    formatUsdc: (b) => Number(formatUnits(b, 6)).toFixed(2),
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
