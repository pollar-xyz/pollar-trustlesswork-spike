import { NextResponse } from "next/server";

const TOKEN_SYMBOL = "USDC";
const TOKEN_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export async function POST(request: Request) {
  const apiKey = process.env.TRUSTLESS_WORK_API_KEY;
  const baseUrl = process.env.TRUSTLESS_WORK_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: "Missing environment variables." }, { status: 500 });
  }

  const body = await request.json() as { signer?: string; amount?: number };
  const signer = body.signer?.trim();
  const amount = Number(body.amount ?? 1);

  if (!signer) {
    return NextResponse.json({ error: "Missing signer." }, { status: 400 });
  }

  const payload = {
    signer,
    engagementId: `spike-${Date.now()}`,
    title: "Pollar TW Spike Escrow",
    description: "Single-release escrow from Pollar spike",
    roles: {
      approver: signer,
      serviceProvider: signer,
      platformAddress: signer,
      releaseSigner: signer,
      disputeResolver: signer,
      receiver: signer,
    },
    amount,
    platformFee: 1,
    milestones: [{ description: "Initial milestone" }],
    trustline: {
      address: TOKEN_ISSUER,
      symbol: TOKEN_SYMBOL,
    },
  };

  const response = await fetch(`${baseUrl}/deployer/single-release`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json({ error: data?.message ?? "TW request failed.", details: data }, { status: response.status });
  }

  return NextResponse.json(data);
}