"use client";

import { usePollar, WalletButton } from "@pollar/react";
import { useState } from "react";

export default function Home() {
  const { isAuthenticated, walletAddress, logout, signAndSubmitTx, transaction } = usePollar();
  const [xdr, setXdr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleInitialize() {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    setXdr(null);
    try {
      const res = await fetch("/api/trustless-work/initialize-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer: walletAddress, amount: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setXdr(data.unsignedTransaction);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSign() {
    if (!xdr) return;
    setError(null);
    try {
      await signAndSubmitTx(xdr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signing failed");
    }
  }

  return (
    <main className="min-h-screen p-10 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Pollar × Trustless Work Spike</h1>
        {isAuthenticated ? (
          <button onClick={logout} className="bg-white text-black px-4 py-2 text-sm">
            Sign out
          </button>
        ) : (
          <WalletButton />
        )}
      </header>

      <section className="border p-6 flex flex-col gap-2 text-sm">
        <h2 className="font-semibold text-base">Session</h2>
        <p><span className="font-medium">Status:</span> {isAuthenticated ? "Authenticated" : "Not authenticated"}</p>
        <p className="break-all"><span className="font-medium">Wallet address:</span> {walletAddress ?? "Not available"}</p>
      </section>

      <section className="border p-6 flex flex-col gap-4 text-sm">
        <h2 className="font-semibold text-base">Initialize Escrow</h2>
        <button
          onClick={handleInitialize}
          disabled={!isAuthenticated || loading}
          className="bg-white text-black px-4 py-2 text-sm disabled:opacity-50 w-fit"
        >
          {loading ? "Initializing..." : "Initialize escrow"}
        </button>

        {error && <p className="text-red-500">{error}</p>}

        {xdr && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-400 mb-1">Unsigned XDR</p>
              <code className="font-mono text-xs break-all border p-3 block leading-relaxed">{xdr}</code>
            </div>

            <button
              onClick={handleSign}
              disabled={transaction?.step === "signing" || transaction?.step === "building"}
              className="bg-white text-black px-4 py-2 text-sm disabled:opacity-50 w-fit"
            >
              {transaction?.step === "signing" ? "Signing…" : "Sign & submit"}
            </button>

            {transaction?.step === "success" && transaction.hash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${transaction.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline text-sm break-all"
              >
                View on Stellar Expert → {transaction.hash}
              </a>
            )}

            {transaction?.step === "error" && (
              <p className="text-red-500">
                {typeof transaction.details === "string" ? transaction.details : "Transaction failed"}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
