import "dotenv/config";
import { Program, web3, BN, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import IDL from "../target/idl/movie_platform.json";
import fs from "fs";
import path from "path";
import bs58 from "bs58";

type KeypairType = "AdminKey";

const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "ApfCLKKr7Y6GX9qKWujhDGmSNvdN93tNidyPe2hyB9jL"
);

const keypairPath = process.env.NEXT_KEYPAIR;
if (!keypairPath) {
  console.error("❌ NEXT_KEYPAIR is not set in .env");
  process.exit(1);
}
if (!fs.existsSync(keypairPath)) {
  console.error(`❌ Keypair file not found: ${keypairPath}`);
  process.exit(1);
}

const PROJECT_ROOT = path.resolve(__dirname, "../../");
const TOKEN_CONFIG_PATH = path.join(PROJECT_ROOT, "token_config.json");

function getKeyPair(title: KeypairType): web3.Keypair {
  const AUTHORITY_KEY = JSON.parse(fs.readFileSync(keypairPath!, "utf-8"));
  const secretKey = AUTHORITY_KEY[title];
  if (!secretKey) {
    console.error(`❌ ${title} not found in keypair file`);
    process.exit(1);
  }
  return web3.Keypair.fromSecretKey(bs58.decode(secretKey));
}

async function main() {
  console.log("\n=== Step 1: Initialize Custom Token Mint ===\n");

  const adminKeypair = getKeyPair("AdminKey");
  const connection = new web3.Connection(
    process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.RPC_URL ||
      "http://localhost:8899"
  );

  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program(IDL as any, provider);

  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );
  const [tokenMintPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("token-mint")],
    PROGRAM_ID
  );
  const [treasuryPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID
  );

  console.log("📝 Configuration:");
  console.log("   Admin:", adminKeypair.publicKey.toBase58());
  console.log("   Program ID:", PROGRAM_ID.toBase58());
  console.log("🔑 PDAs:");
  console.log("   Platform Config:", platformConfigPDA.toBase58());
  console.log("   Token Mint:", tokenMintPDA.toBase58());
  console.log("   Treasury:", treasuryPDA.toBase58());
  console.log();

  const platformConfigAccount = await connection.getAccountInfo(
    platformConfigPDA
  );
  const tokenMintAccount = await connection.getAccountInfo(tokenMintPDA);

  if (platformConfigAccount && tokenMintAccount) {
    console.log("⚠️  Platform and token mint already exist, skipping init...");
  } else {
    if (!platformConfigAccount) {
      console.log("🚀 Initializing platform config...");
      const initPlatformTx = await program.methods
        .initializePlatform(
          tokenMintPDA,
          new BN(1_000_000),
          new BN(2_500_000),
          new BN(5_000_000)
        )
        .accounts({
          authority: adminKeypair.publicKey,
          config: platformConfigPDA,
          treasury: treasuryPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("✅ Platform initialized:", initPlatformTx);
      console.log();
    }

    // ─── Step 2: Initialize token mint ────────────────────────────
    if (!tokenMintAccount) {
      console.log("🚀 Creating token mint...");
      const initTokenTx = await program.methods
        .initializeToken(6, new BN(0))
        .accounts({
          authority: adminKeypair.publicKey,
          platformConfig: platformConfigPDA,
          tokenMint: tokenMintPDA,
          tokenMetadataProgram: new PublicKey(
            "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
          ),
          tokenProgram: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ),
          systemProgram: SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([adminKeypair])
        .rpc();

      console.log("✅ Token mint created:", initTokenTx);
      console.log();
    }
  }

  // ─── Step 3: Create treasury ATA ────────────────────────────────
  // ✅ Always runs — even if platform/mint already existed
  console.log("🚀 Setting up treasury ATA...");
  const treasuryInfo = await connection.getAccountInfo(treasuryPDA);
  if (!treasuryInfo) {
    console.log("⚠️  Treasury PDA has no SOL, funding...");
    const sig = await connection.requestAirdrop(
      treasuryPDA,
      0.1 * web3.LAMPORTS_PER_SOL // small amount just to initialize it
    );
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
    console.log("✅ Treasury PDA funded");
  }
  const treasuryATA = await getAssociatedTokenAddress(
    tokenMintPDA,
    treasuryPDA,
    true, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID, // ✅ explicit
    ASSOCIATED_TOKEN_PROGRAM_ID // ✅ explicit
  );

  console.log("   Treasury ATA:", treasuryATA.toBase58());

  try {
    const ataInfo = await getAccount(connection, treasuryATA);
    console.log("✅ Treasury ATA already exists");
    console.log("   Balance:", ataInfo.amount.toString());
  } catch {
    // ATA doesn't exist — create it
    console.log("   Creating treasury ATA...");

    const createATAIx = createAssociatedTokenAccountInstruction(
      adminKeypair.publicKey, // payer
      treasuryATA, // ATA address
      treasuryPDA, // owner
      tokenMintPDA, // mint
      TOKEN_PROGRAM_ID, // ✅ explicit
      ASSOCIATED_TOKEN_PROGRAM_ID // ✅ explicit
    );

    const tx = new web3.Transaction().add(createATAIx);
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = adminKeypair.publicKey;
    tx.sign(adminKeypair);

    const ataSig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(
      { signature: ataSig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    console.log("✅ Treasury ATA created:", ataSig);
  }

  // ─── Save config ─────────────────────────────────────────────────
  const tokenData = {
    tokenMint: tokenMintPDA.toBase58(),
    treasuryPDA: treasuryPDA.toBase58(),
    treasuryATA: treasuryATA.toBase58(), // ✅ also save ATA address
  };

  fs.writeFileSync(TOKEN_CONFIG_PATH, JSON.stringify(tokenData, null, 2));

  console.log("\n💾 Token config saved to:", TOKEN_CONFIG_PATH);
  console.log("\n📊 Summary:");
  console.log("   Token Mint:", tokenMintPDA.toBase58());
  console.log("   Treasury PDA:", treasuryPDA.toBase58());
  console.log("   Treasury ATA:", treasuryATA.toBase58()); // ✅
  console.log("   Decimals: 6");
  console.log("\n👉 Next: Run 'npm run admin:init:collections'");
}

main().catch(console.error);
