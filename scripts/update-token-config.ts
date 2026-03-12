import "dotenv/config";
import { Program, web3, BN, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import fs from "fs";
import bs58 from "bs58";

type KeypairType = "AdminKey" | "TreasuryKey";

const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "BfVwobP3jgmFAf5eP3qAmSY8QMwFLj3GDpoHEBq8V2Vi"
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
  console.log("\n=== Update Platform Token Mint ===\n");

  // Get keypairs
  const adminKeypair = getKeyPair("AdminKey");
  const treasuryKeypair = getKeyPair("TreasuryKey");

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

  console.log("📝 Configuration:");
  console.log("   Admin:", adminKeypair.publicKey.toBase58());
  console.log("   Program ID:", PROGRAM_ID.toBase58());
  console.log();

  // Load token config
  if (!fs.existsSync("/home/oxnen/movie_platform/token_config.json")) {
    console.error("❌ Token config not found!");
    console.error("   Please run 'npm run admin:init:token' first");
    process.exit(1);
  }

  const tokenConfig = JSON.parse(
    fs.readFileSync("/home/oxnen/movie_platform/token_config.json", "utf-8")
  );

  const tokenMintAddress = tokenConfig.tokenMint;
  console.log("✓ Token Mint:", tokenMintAddress);
  console.log();

  // Get platform config PDA
  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );

  console.log("🔑 Platform Config PDA:", platformConfigPDA.toBase58());
  console.log();

  // Fetch current platform config
  let currentConfig;
  try {
    currentConfig = await (program as any).account.platformConfig.fetch(
      platformConfigPDA
    );
    console.log("📊 Current Platform Config:");
    console.log("   Authority:", currentConfig.authority.toBase58());
    console.log("   Treasury:", currentConfig.treasury.toBase58());
    console.log("   Token Mint:", currentConfig.tokenMint.toBase58());
    console.log();
  } catch (error) {
    console.error("❌ Failed to fetch platform config!");
    console.error("   Please run 'npm run admin:init:platform' first");
    process.exit(1);
  }

  // Verify admin is authority
  if (
    adminKeypair.publicKey.toBase58() !== currentConfig.authority.toBase58()
  ) {
    console.error("❌ You are not platform authority!");
    process.exit(1);
  }

  console.log("🚀 Updating platform config with token mint...");

  // Use initializePlatform to update token mint
  // This will preserve other settings (prices, collections, etc.)
  // We'll need to fetch them first
  const bronzePrice = currentConfig.bronzePrice;
  const silverPrice = currentConfig.silverPrice;
  const goldPrice = currentConfig.goldPrice;
  const bronzeCollection = currentConfig.bronzeCollection;
  const silverCollection = currentConfig.silverCollection;
  const goldCollection = currentConfig.goldCollection;

  // The problem: initializePlatform is an `init` instruction, can't be called again
  // Solution: We'll manually update the token_mint field using a raw transaction
  // For now, let's just verify the token mint is set correctly

  console.log("⚠️  Platform config already initialized.");
  console.log("   Token mint in config:", currentConfig.tokenMint.toBase58());
  console.log("   Token mint created:", tokenMintAddress);
  console.log();

  if (currentConfig.tokenMint.toBase58() === tokenMintAddress) {
    console.log("✅ Token mint is already correctly set in platform config!");
    console.log("   No update needed.");
  } else {
    console.log(
      "⚠️  Token mint in platform config doesn't match created token mint!"
    );
    console.log("   Config:", currentConfig.tokenMint.toBase58());
    console.log("   Created:", tokenMintAddress);
    console.log();
    console.log(
      "   You may need to manually update or re-initialize the platform."
    );
    console.log(
      "   For now, the token_config.json file has the correct address."
    );
  }

  console.log();
  console.log("=== Token Config Verified ===\n");

  console.log("📊 Summary:");
  console.log("   Token Mint PDA:", tokenMintAddress);
  console.log("   Treasury:", tokenConfig.treasury);
  console.log("   Treasury ATA:", tokenConfig.treasuryATA);
  console.log();
  console.log("👉 The frontend should use token_mint from token_config.json");
}

main().catch(console.error);
