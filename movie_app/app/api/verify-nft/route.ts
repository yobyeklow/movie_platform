import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import IDL from "../../idl/movie_platform.json";
import { Transaction } from "@metaplex-foundation/umi";

const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8899",
  { commitment: "confirmed" }
);

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
const TIER_NAMES = ["Bronze", "Silver", "Gold"];

function getProgram() {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction) => txs,
  };
  const provider = new anchor.AnchorProvider(
    connection,
    dummyWallet as any,
    {}
  );
  return new anchor.Program(IDL as any, provider);
}

export async function GET(request: NextRequest) {
  // ─── Internal secret guard ────────────────────────────────────────
  const secret = request.headers.get("x-internal-secret");
  if (secret !== (process.env.INTERNAL_SECRET || "")) {
    return NextResponse.json(
      { valid: false, reason: "unauthorized" },
      { status: 401 }
    );
  }

  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json(
      { valid: false, reason: "missing_wallet" },
      { status: 400 }
    );
  }

  let userPubkey: PublicKey;
  try {
    userPubkey = new PublicKey(wallet);
  } catch {
    return NextResponse.json(
      { valid: false, reason: "invalid_wallet" },
      { status: 400 }
    );
  }

  try {
    const program = getProgram();

    // Derive member_pass PDA
    const [memberPassPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("member_pass"), userPubkey.toBuffer()],
      PROGRAM_ID
    );

    // Fetch member pass account
    let memberPass: any;
    try {
      memberPass = await (program as any).account.memberPass.fetch(
        memberPassPDA
      );
    } catch {
      return NextResponse.json({
        valid: false,
        reason: "no_nft",
        message: "No member pass found for this wallet",
      });
    }

    // ─── Check expiry ─────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = memberPass.expiresAt.toNumber();
    const isExpired = expiresAt < now;

    if (isExpired) {
      return NextResponse.json({
        valid: false,
        reason: "expired",
        message: "Member pass has expired",
        expiresAt,
        expiredAgo: now - expiresAt,
      });
    }

    // ─── Valid NFT ────────────────────────────────────────────────
    const tier = memberPass.tier;
    return NextResponse.json({
      valid: true,
      tier,
      tierName: TIER_NAMES[tier] || "Unknown",
      expiresAt,
      expiresIn: expiresAt - now, // seconds remaining
      nftAsset: memberPass.nftAsset.toBase58(),
      nftEdition: memberPass.nftEdition.toString(),
      mintedAt: memberPass.mintedAt.toNumber(),
    });
  } catch (error: any) {
    console.error("verify-nft error:", error);
    return NextResponse.json(
      { valid: false, reason: "server_error", message: error.message },
      { status: 500 }
    );
  }
}
