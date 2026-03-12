import { NextRequest, NextResponse } from "next/server";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import * as anchor from "@coral-xyz/anchor";
import IDL from "../../idl/movie_platform.json";
import { getMemberPassPDA, getPlatformConfigPDA } from "@/hooks/pda";
const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8899",
  { commitment: "confirmed", confirmTransactionInitialTimeout: 120000 }
);

const MINT_PASS_DISCRIMINATOR = Buffer.from([
  142, 56, 26, 197, 227, 241, 84, 174,
]);
const TIER_NAMES = ["Bronze", "Silver", "Gold"];

function log(
  userKey: string,
  tier: number,
  success: boolean,
  signature?: string,
  error?: string
) {
  console.log(
    `[${new Date().toISOString()}] MINT_PASS - ${userKey} - Tier ${tier} - ${
      success ? "SUCCESS" : "FAILED"
    }${signature ? ` - ${signature}` : ""}${error ? ` - ${error}` : ""}`
  );
}

function fail(status: number, message: string, extra?: object) {
  return NextResponse.json({ success: false, message, ...extra }, { status });
}
function getProgram() {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async (tx: Transaction) => tx,
    signAllTransactions: async (txs: Transaction[]) => txs,
  };
  const provider = new anchor.AnchorProvider(connection, dummyWallet as any, {
    commitment: "confirmed",
  });
  return new anchor.Program(IDL as anchor.Idl, provider);
}
export async function POST(request: NextRequest) {
  const program = getProgram();
  let userKey: PublicKey | null = null;
  let tier = 0;

  try {
    const { transaction } = await request.json();

    // ─── Layer 1: Deserialize ────────────────────────────────────────
    let signedTx: Transaction;
    try {
      signedTx = Transaction.from(Buffer.from(transaction, "base64"));
    } catch {
      return fail(400, "Invalid transaction format");
    }

    if (!signedTx.feePayer) return fail(400, "Missing fee payer");
    if (!signedTx.recentBlockhash) return fail(400, "Missing blockhash");
    if (signedTx.instructions.length === 0)
      return fail(400, "No instructions in transaction");

    userKey = signedTx.feePayer;
    console.log("User:", userKey.toBase58());

    // ─── Layer 2: Find mint_pass instruction ─────────────────────────
    const ix = signedTx.instructions.find((i) =>
      i.programId.equals(program.programId)
    );

    if (!ix) {
      log(
        userKey.toBase58(),
        tier,
        false,
        undefined,
        "mint_pass instruction not found"
      );
      return fail(400, "mint_pass instruction not found");
    }

    // ─── Layer 3: Validate discriminator + tier ───────────────────────
    if (!ix.data.slice(0, 8).equals(MINT_PASS_DISCRIMINATOR)) {
      log(userKey.toBase58(), tier, false, undefined, "Invalid discriminator");
      return fail(400, "Invalid instruction");
    }

    tier = ix.data[8];
    if (tier < 0 || tier > 2) {
      log(userKey.toBase58(), tier, false, undefined, "Invalid tier");
      return fail(400, "Invalid tier. Must be 0, 1, or 2");
    }

    console.log("Tier:", tier, `(${TIER_NAMES[tier]})`);

    // ─── Layer 4: Fetch platform config ──────────────────────────────
    const [platformConfigPDA] = getPlatformConfigPDA();
    let platformConfig: any;

    try {
      platformConfig = await (program as any).account.platformConfig.fetch(
        platformConfigPDA
      );
    } catch {
      log(
        userKey.toBase58(),
        tier,
        false,
        undefined,
        "Platform config not found"
      );
      return fail(503, "Platform not initialized. Contact admin.");
    }

    console.log("Platform config fetched:");
    console.log("  Treasury:", platformConfig.treasury.toBase58());
    console.log("  Token Mint:", platformConfig.tokenMint.toBase58());

    // ─── Layer 5: Derive and validate expected accounts ───────────────
    const [memberPassPDA] = getMemberPassPDA(userKey);
    const expectedTreasuryATA = await getAssociatedTokenAddress(
      platformConfig.tokenMint,
      platformConfig.treasury,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const expectedCollection =
      tier === 0
        ? platformConfig.bronzeCollection
        : tier === 1
        ? platformConfig.silverCollection
        : platformConfig.goldCollection;

    const accountMap = Object.fromEntries(
      ix.keys.map((k) => [k.pubkey.toBase58(), k])
    );
    const hasAccount = (expected: PublicKey) =>
      !!accountMap[expected.toBase58()];

    const accountChecks: [PublicKey, string][] = [
      [userKey, "User account missing"],
      [platformConfigPDA, "Invalid platform_config account"],
      [memberPassPDA, "Invalid member_pass account"],
      [platformConfig.tokenMint, "Invalid token mint"],
      [expectedTreasuryATA, "Invalid treasury ATA"],
      [expectedCollection, "Invalid collection for tier"],
      [TOKEN_PROGRAM_ID, "Invalid token program"],
      [MPL_CORE_PROGRAM_ID, "Invalid MPL Core program"],
    ];

    for (const [pubkey, message] of accountChecks) {
      if (!hasAccount(pubkey)) {
        log(userKey.toBase58(), tier, false, undefined, message);
        return fail(400, message);
      }
    }

    console.log("✅ All accounts validated");

    // ─── Layer 6: Check mint is open ──────────────────────────────────
    const currentTime = Math.floor(Date.now() / 1000);
    const mintOpenAt = platformConfig.mintOpenTimestamp.toNumber();

    if (mintOpenAt > currentTime) {
      log(userKey.toBase58(), tier, false, undefined, "Minting not open");
      return fail(400, "Minting is not open yet", { opensAt: mintOpenAt });
    }

    console.log("✅ Minting is open");

    // ─── Layer 7: Verify signatures ───────────────────────────────────
    const userSig = signedTx.signatures.find((s) =>
      s.publicKey.equals(userKey!)
    );
    if (!userSig?.signature) {
      log(userKey.toBase58(), tier, false, undefined, "Missing user signature");
      return fail(400, "Missing user signature");
    }

    console.log("✅ User signature present");
    console.log(
      "Signatures:",
      signedTx.signatures.map((s) => ({
        key: s.publicKey.toBase58(),
        signed: !!s.signature,
      }))
    );

    // ─── Layer 8: Broadcast ───────────────────────────────────────────
    console.log("Broadcasting transaction...");

    const signature = await connection.sendRawTransaction(
      signedTx.serialize(),
      { skipPreflight: false, preflightCommitment: "confirmed" }
    );

    console.log("Sent:", signature);

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    if (confirmation.value.err) {
      log(
        userKey.toBase58(),
        tier,
        false,
        signature,
        JSON.stringify(confirmation.value.err)
      );
      return fail(500, "Transaction failed on-chain", {
        details: JSON.stringify(confirmation.value.err),
        signature,
      });
    }

    log(userKey.toBase58(), tier, true, signature);
    console.log("=== Mint Successful ===");

    return NextResponse.json({
      success: true,
      message: `${TIER_NAMES[tier]} pass minted successfully`,
      signature,
      tier,
      tierName: TIER_NAMES[tier],
    });
  } catch (error: any) {
    console.error("Complete mint error:", error);
    log(
      userKey?.toBase58() ?? "unknown",
      tier,
      false,
      undefined,
      error.message
    );

    const message = error.message?.includes(
      "TransactionExpiredBlockheightExceeded"
    )
      ? "Transaction expired, please try again"
      : error.message?.includes("insufficient funds")
      ? "Insufficient SOL for transaction fees"
      : error.message?.includes("blockhash not found")
      ? "Blockhash expired, please try again"
      : error.message?.includes("Signature verification failed")
      ? "Invalid or incomplete signatures"
      : error.message?.includes("already in use")
      ? "Member pass already exists for this wallet"
      : "Failed to complete mint";

    return fail(500, message, { details: error.message });
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Use POST method", allowedMethods: ["POST"] },
    { status: 405 }
  );
}
