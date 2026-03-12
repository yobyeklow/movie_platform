/**
 * Step 2: Initialize Platform
 *
 * Initializes the platform configuration with:
 * - Token mint address (from Step 1)
 * - Treasury PDA (program-controlled, no private key!)
 * - Tier prices (Bronze, Silver, Gold)
 *
 * Usage:
 *   npm run admin:init:platform
 *   npm run admin:init:platform -- --bronze 1000000 --silver 2500000 --gold 5000000
 */

import "dotenv/config";
import { Program, web3, BN, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import fs from "fs";
import bs58 from "bs58";

type KeypairType = "AdminKey" | "TreasuryKey";

const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "BfVwobP3jgmFAf5eP3qAmSY8QMwFLj3GDpoHEBq8V2Vi"
);

const keypairPath = process.env.NEXT_KEYPAIR;

if (!fs.existsSync(keypairPath)) {
  console.error(`❌ Keypair file not found: ${keypairPath}`);
  console.error(`   Make sure NEXT_KEYPAIR is set in .env file`);
  process.exit(1);
}

function getKeyPair(title: KeypairType): web3.Keypair {
  const AUTHORITY_KEY = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const secretKey = AUTHORITY_KEY[title];

  if (!secretKey) {
    console.error(`❌ ${title} not found in keypair file`);
    process.exit(1);
  }

  return web3.Keypair.fromSecretKey(bs58.decode(secretKey));
}

async function main() {
  console.log("\n=== Step 2: Initialize Platform ===\n");

  // Parse command line arguments
  const args = process.argv.slice(2);
  const bronzePriceArg = args.indexOf("--bronze");
  const silverPriceArg = args.indexOf("--silver");
  const goldPriceArg = args.indexOf("--gold");

  // Default prices (in token base units, assuming 6 decimals)
  const BRONZE_PRICE = bronzePriceArg !== -1
    ? parseInt(args[bronzePriceArg + 1], 10)
    : 1000000; // 1 token
  const SILVER_PRICE = silverPriceArg !== -1
    ? parseInt(args[silverPriceArg + 1], 10)
    : 2500000; // 2.5 tokens
  const GOLD_PRICE = goldPriceArg !== -1
    ? parseInt(args[goldPriceArg + 1], 10)
    : 5000000; // 5 tokens

  // Get keypairs
  const adminKeypair = getKeyPair("AdminKey");
  // TreasuryKey is kept for reference, but we now use Treasury PDA

  const connection = new web3.Connection(
    process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.RPC_URL ||
      "http://localhost:8899"
  );

  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  const program = new Program(IDL, provider);

  console.log("📝 Configuration:");
  console.log("   Admin:", adminKeypair.publicKey.toBase58());
  console.log("   Program ID:", PROGRAM_ID.toBase58());
  console.log();

  // Get token mint from config file
  let tokenMint: web3.PublicKey;

  if (fs.existsSync("/home/oxnen/movie_platform/token_config.json")) {
    const tokenConfig = JSON.parse(fs.readFileSync("/home/oxnen/movie_platform/token_config.json", "utf-8"));
    tokenMint = new web3.PublicKey(tokenConfig.tokenMint);
    console.log("✓ Token mint loaded from config:", tokenMint.toBase58());
  } else {
    console.error("❌ Token config not found!");
    console.error("   Please run Step 1: 'npm run admin:init:token'");
    process.exit(1);
  }

  console.log();

  // Get PDAs
  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );

  // Treasury PDA - derived from ["treasury"]
  const [treasuryPDA, treasuryBump] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID
  );

  console.log("🔑 Platform Config PDA:", platformConfigPDA.toBase58());
  console.log("🔑 Treasury PDA:", treasuryPDA.toBase58());
  console.log("   Note: Treasury is a PDA (no private key) for security!");
  console.log();

  // Check if platform already initialized
  const configAccount = await connection.getAccountInfo(platformConfigPDA);
  if (configAccount) {
    console.log("⚠️  Platform already initialized!");
    console.log("   Skipping platform initialization...");
    console.log();

    try {
      const config = await (program as any).account.platformConfig.fetch(platformConfigPDA);
      console.log("📊 Current Platform Config:");
      console.log("   Authority:", config.authority.toBase58());
      console.log("   Token Mint:", config.tokenMint.toBase58());
      console.log("   Treasury:", config.treasury.toBase58());
      console.log("   Bronze Price:", config.bronzePrice.toString());
      console.log("   Silver Price:", config.silverPrice.toString());
      console.log("   Gold Price:", config.goldPrice.toString());
      console.log("   Mint Open:", config.mintOpenTimestamp.toNumber());
    } catch (error) {
      console.log("   (Failed to fetch config details)");
    }

    console.log();
    console.log("👉 Next: Run 'npm run admin:init:collections'");
    return;
  }

  console.log("🚀 Initializing platform with Treasury PDA...");

  const tx = await program.methods
    .initializePlatform(
      tokenMint,
      new BN(BRONZE_PRICE),
      new BN(SILVER_PRICE),
      new BN(GOLD_PRICE)
    )
    .accounts({
      authority: adminKeypair.publicKey,
      config: platformConfigPDA,
      treasury: treasuryPDA, // Treasury PDA (no keypair needed!)
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([adminKeypair])
    .rpc();

  console.log("✅ Platform initialized!");
  console.log("📝 Transaction:", tx);
  console.log();

  // Fetch and display config
  const config = await (program as any).account.platformConfig.fetch(platformConfigPDA);

  console.log("📊 Platform Config:");
  console.log("   Authority:", config.authority.toBase58());
  console.log("   Token Mint:", config.tokenMint.toBase58());
  console.log("   Treasury (PDA):", config.treasury.toBase58());
  console.log();
  console.log("💰 Prices (in tokens):");
  console.log("   Bronze:", config.bronzePrice.toString(), `(${(config.bronzePrice.toNumber() / 10 ** 6).toFixed(2)} tokens)`);
  console.log("   Silver:", config.silverPrice.toString(), `(${(config.silverPrice.toNumber() / 10 ** 6).toFixed(2)} tokens)`);
  console.log("   Gold:", config.goldPrice.toString(), `(${(config.goldPrice.toNumber() / 10 ** 6).toFixed(2)} tokens)`);
  console.log();

  console.log("=== Platform Initialized ===\n");
  console.log("🔐 Security Note:");
  console.log("   Treasury is a PDA - no private key exists");
  console.log("   Withdrawals must go through withdraw_treasury instruction");
  console.log();
  console.log("👉 Next: Run 'npm run admin:init:collections'");
}

main().catch(console.error);
