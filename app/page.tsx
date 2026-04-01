"use client";

import { usePollar, WalletButton } from "@pollar/react";
import { useEffect, useState } from "react";

interface EscrowForm {
  title: string;
  description: string;
  amount: number;
  serviceProvider: string;
  approver: string;
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  id: keyof EscrowForm;
  value: string | number;
  onChange: (id: keyof EscrowForm, value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(id, e.target.value)}
        className="border bg-transparent px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-white"
      />
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, walletAddress, logout, signAndSubmitTx, transaction, network } = usePollar();
  const [xdr, setXdr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EscrowForm>({
    title: "Pollar TW Spike Escrow",
    description: "Single-release escrow from Pollar spike",
    amount: 1,
    serviceProvider: "",
    approver: "",
  });

  useEffect(() => {
    if (walletAddress) {
      setForm((f) => ({
        ...f,
        serviceProvider: f.serviceProvider || walletAddress,
        approver: f.approver || walletAddress,
      }));
    }
  }, [walletAddress]);

  function handleField(id: keyof EscrowForm, value: string) {
    setForm((f) => ({ ...f, [id]: id === "amount" ? Number(value) : value }));
  }

  async function handleInitialize() {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    setXdr(null);
    try {
      const res = await fetch("/api/trustless-work/initialize-escrow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signer: walletAddress, ...form }),
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

      {isAuthenticated && <section className="border p-6 flex flex-col gap-4 text-sm">
        <h2 className="font-semibold text-base">Initialize Escrow</h2>

        <div className="flex flex-col gap-3">
          <Field label="Title" id="title" value={form.title} onChange={handleField} />
          <Field label="Description" id="description" value={form.description} onChange={handleField} />
          <Field label="Amount (USDC)" id="amount" value={form.amount} onChange={handleField} type="number" />
          <Field label="Service Provider" id="serviceProvider" value={form.serviceProvider} onChange={handleField} />
          <Field label="Approver" id="approver" value={form.approver} onChange={handleField} />
        </div>

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
                href={`https://stellar.expert/explorer/${network}/tx/${transaction.hash}`}
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
      </section>}
    </main>
  );
}
