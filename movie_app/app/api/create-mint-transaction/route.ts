import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import * as anchor from "@coral-xyz/anchor";
import IDL from "../../idl/movie_platform.json";

const connection = new Connection(
  process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8899",
  { commitment: "confirmed" }
);

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "BfVwobP3jgmFAf5eP3qAmSY8QMwFLj3GDpoHEBq8V2Vi"
);

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
  try {
    const { tier, userPublicKey } = await request.json();

    if (typeof tier !== "number" || tier < 0 || tier > 2) {
      return NextResponse.json(
        { success: false, message: "Invalid tier. Must be 0, 1, or 2" },
        { status: 400 }
      );
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(userPublicKey);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid user public key" },
        { status: 400 }
      );
    }

    const program = getProgram();

    // ─── Fetch platform config to get on-chain values ───────────────
    const [platformConfigPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("platform-config")],
      PROGRAM_ID
    );

    const platformConfig = await (program as any).account.platformConfig.fetch(
      platformConfigPDA
    );

    const tokenMint: PublicKey = platformConfig.tokenMint;
    const treasuryPDA: PublicKey = platformConfig.treasury;

    // ─── Resolve collection based on tier ───────────────────────────
    const collection: PublicKey = [
      platformConfig.bronzeCollection,
      platformConfig.silverCollection,
      platformConfig.goldCollection,
    ][tier];

    const tierName = ["Bronze", "Silver", "Gold"][tier];
    const price: bigint = [
      platformConfig.bronzePrice,
      platformConfig.silverPrice,
      platformConfig.goldPrice,
    ][tier];

    // ─── Derive ATAs ─────────────────────────────────────────────────
    const userATA = await getAssociatedTokenAddress(tokenMint, userPubkey);
    const treasuryATA = await getAssociatedTokenAddress(
      tokenMint,
      treasuryPDA,
      true
    );

    // ─── Generate fresh asset keypair ────────────────────────────────
    const assetKeypair = Keypair.generate();

    console.log("Accounts resolved:");
    console.log("  platformConfig:", platformConfigPDA.toBase58());
    console.log("  tokenMint:", tokenMint.toBase58());
    console.log("  collection:", collection.toBase58());
    console.log("  userATA:", userATA.toBase58());
    console.log("  treasuryATA:", treasuryATA.toBase58());
    console.log("  asset:", assetKeypair.publicKey.toBase58());

    // ─── Build transaction (no .rpc(), use .transaction()) ───────────
    const tx = await program.methods
      .mintPass(tier)
      .accounts({
        user: userPubkey,
        // platformConfig — auto-resolved by Anchor
        // memberPass — auto-resolved by Anchor (PDA with seeds)
        tokenMint: tokenMint,
        userAta: userATA,
        treasuryAta: treasuryATA,
        asset: assetKeypair.publicKey,
        collection: collection,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
      })
      .transaction();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    tx.feePayer = userPubkey;
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;

    // ─── Asset must partially sign server-side ───────────────────────
    tx.partialSign(assetKeypair);

    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    return NextResponse.json({
      success: true,
      transaction: serialized.toString("base64"),
      assetPublicKey: assetKeypair.publicKey.toBase58(),
      tierName,
      price: price.toString(),
      accounts: {
        platformConfig: platformConfigPDA.toBase58(),
        collection: collection.toBase58(),
        userATA: userATA.toBase58(),
        treasuryATA: treasuryATA.toBase58(),
      },
    });
  } catch (error: any) {
    console.error("Create mint transaction error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create transaction",
      },
      { status: 500 }
    );
  }
}
