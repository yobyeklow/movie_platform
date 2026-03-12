/**
 * Step 6: Allow Transfer (Unfreeze NFT)
 *
 * Removes the FreezeDelegate plugin from an NFT, making it transferable.
 * This implements Option A for the unfreeze feature.
 *
 * Only platform authority can call this instruction.
 *
 * Usage:
 *   npm run admin:allow-transfer -- <ASSET_ADDRESS>
 *   npm run admin:allow-transfer -- <ASSET_ADDRESS> <COLLECTION_ADDRESS>
 *
 * Examples:
 *   npm run admin:allow-transfer -- 5sH3h1...
 *   npm run admin:allow-transfer -- 5sH3h1... 7xK9y2...
 */

import "dotenv/config";
import { Program, web3, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import fs from "fs";
import bs58 from "bs58";

type KeypairType = "AdminKey";

const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "BfVwobP3jgmFAf5eP3qAmSY8QMwFLj3GDpoHEBq8V2Vi"
);

const MPL_CORE_ID = new web3.PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

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
  console.log("\n=== Step 6: Allow Transfer (Unfreeze NFT) ===\n");

  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log("Usage: npm run admin:allow-transfer -- <ASSET_ADDRESS> [COLLECTION_ADDRESS]\n");
    console.log("Arguments:");
    console.log("  ASSET_ADDRESS       NFT asset address to unfreeze");
    console.log("  COLLECTION_ADDRESS  Collection address (optional, auto-detect if not provided)\n");
    console.log("Examples:");
    console.log("  npm run admin:allow-transfer -- 5sH3h1...");
    console.log("  npm run admin:allow-transfer -- 5sH3h1... 7xK9y2...\n");
    console.log("Note: Only platform authority can unfreeze NFTs.");
    console.log();
    process.exit(0);
  }

  const assetAddress = args[0];
  const collectionAddress = args.length > 1 ? args[1] : undefined;

  // Get admin keypair
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

  const program = new Program(IDL, provider);

  console.log("📝 Configuration:");
  console.log("   Admin:", adminKeypair.publicKey.toBase58());
  console.log("   Program ID:", PROGRAM_ID.toBase58());
  console.log();

  // Parse asset address
  let assetPubkey: web3.PublicKey;
  try {
    assetPubkey = new web3.PublicKey(assetAddress);
    console.log("✓ Asset:", assetPubkey.toBase58());
  } catch (error) {
    console.error("❌ Invalid asset address!");
    console.error("   Please provide a valid Solana address");
    process.exit(1);
  }

  // Get platform config
  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );

  let config;
  try {
    config = await (program as any).account.platformConfig.fetch(platformConfigPDA);
    console.log("✓ Platform config loaded");
    console.log("   Platform authority:", config.authority.toBase58());
  } catch (error) {
    console.error("❌ Failed to fetch platform config!");
    console.error("   Please run Step 2: 'npm run admin:init:platform'");
    process.exit(1);
  }

  // Verify admin is authority
  if (adminKeypair.publicKey.toBase58() !== config.authority.toBase58()) {
    console.error("❌ You are not the platform authority!");
    console.error(`   Expected: ${config.authority.toBase58()}`);
    console.error(`   Got: ${adminKeypair.publicKey.toBase58()}`);
    process.exit(1);
  }

  // Determine collection address
  let collectionPubkey: web3.PublicKey;

  if (collectionAddress) {
    try {
      collectionPubkey = new web3.PublicKey(collectionAddress);
      console.log("✓ Collection (provided):", collectionPubkey.toBase58());
    } catch (error) {
      console.error("❌ Invalid collection address!");
      console.error("   Please provide a valid Solana address");
      process.exit(1);
    }
  } else {
    // Auto-detect collection from platform config
    console.log("⚠️  Collection address not provided, auto-detecting...");

    // Try each collection
    const collections = [
      { name: "Bronze", address: config.bronzeCollection },
      { name: "Silver", address: config.silverCollection },
      { name: "Gold", address: config.goldCollection },
    ];

    // Check if asset belongs to any collection
    for (const collection of collections) {
      try {
        const nftAccount = await connection.getAccountInfo(assetPubkey);
        if (!nftAccount) {
          console.error("❌ Asset account does not exist!");
          process.exit(1);
        }

        // For now, we can't easily check collection membership without MPL Core SDK
        // We'll use the first collection and let the transaction fail if wrong
        console.log(`   Using ${collection.name} collection:`, collection.address.toBase58());
        collectionPubkey = collection.address;
        break;
      } catch (error) {
        // Try next collection
      }
    }
  }

  console.log();

  // Check if asset exists
  const assetAccount = await connection.getAccountInfo(assetPubkey);
  if (!assetAccount) {
    console.error("❌ Asset account does not exist!");
    console.error("   Please provide a valid NFT asset address");
    process.exit(1);
  }

  console.log("✓ Asset account exists");
  console.log();

  // Unfreeze NFT
  console.log("🚀 Unfreezing NFT (allowing transfer)...");
  console.log("   This will remove the FreezeDelegate plugin.");
  console.log("   After unfreezing, the NFT will be transferable.");
  console.log();

  try {
    const tx = await program.methods
      .allowTransfer()
      .accounts({
        authority: adminKeypair.publicKey,
        platformConfig: platformConfigPDA,
        asset: assetPubkey,
        collection: collectionPubkey,
        systemProgram: web3.SystemProgram.programId,
        mplCoreProgram: MPL_CORE_ID,
      })
      .signers([adminKeypair])
      .rpc();

    console.log("✅ NFT unfrozen successfully!");
    console.log("📝 Transaction:", tx);
    console.log();

    console.log("📊 Summary:");
    console.log("   Asset:", assetPubkey.toBase58());
    console.log("   Collection:", collectionPubkey.toBase58());
    console.log("   Status: Transferable");
    console.log();

    console.log("=== NFT Unfrozen ===\n");
    console.log("✅ The NFT is now transferable!");
    console.log("👉 The owner can now:");
    console.log("   - Transfer the NFT to another wallet");
    console.log("   - Sell the NFT on marketplaces");
    console.log("   - Gift the NFT to others");
    console.log("   - The platform still receives 100% royalties on secondary sales");

  } catch (error) {
    console.error("❌ Failed to unfreeze NFT!");
    console.error("   Error:", error.toString());
    console.error();

    if (error.toString().includes("Unauthorized")) {
      console.error("   Possible reasons:");
      console.error("   - You are not the platform authority");
      console.error("   - The asset doesn't belong to the specified collection");
    } else if (error.toString().includes("not found")) {
      console.error("   Possible reasons:");
      console.error("   - Asset does not exist");
      console.error("   - Collection does not exist");
    }

    process.exit(1);
  }
}

main().catch(console.error);
