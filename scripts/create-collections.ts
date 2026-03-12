import "dotenv/config";
import { Program, web3, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import type { MoviePlatform } from "../target/types/movie_platform";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import fs from "fs";
import path from "path";
import bs58 from "bs58";

type KeypairType =
  | "AdminKey"
  | "BronzeCollectionKey"
  | "SilverCollectionKey"
  | "GoldCollectionKey";

const PROGRAM_ID = new web3.PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ||
    "BfVwobP3jgmFAf5eP3qAmSY8QMwFLj3GDpoHEBq8V2Vi"
);

// ✅ Validate keypair path early with a clear error
const keypairPath = process.env.NEXT_KEYPAIR;
if (!keypairPath) {
  console.error("❌ NEXT_KEYPAIR is not set in .env file");
  process.exit(1);
}
if (!fs.existsSync(keypairPath)) {
  console.error(`❌ Keypair file not found: ${keypairPath}`);
  process.exit(1);
}

// ✅ Use relative paths from project root instead of hardcoded absolute paths
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const COLLECTION_URI_PATH = path.join(
  PROJECT_ROOT,
  "/movie_platform/nfts_json/collection_uri.json"
);
const COLLECTION_ADDRESS_PATH = path.join(
  PROJECT_ROOT,
  "/movie_platform/collection_address.json"
);

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
  console.log("\n=== Step 3: Create NFT Collections ===\n");

  const adminKeypair = getKeyPair("AdminKey");
  const bronzeCollectionKeypair = getKeyPair("BronzeCollectionKey");
  const silverCollectionKeypair = getKeyPair("SilverCollectionKey");
  const goldCollectionKeypair = getKeyPair("GoldCollectionKey");

  const connection = new web3.Connection(
    process.env.NEXT_PUBLIC_RPC_URL ||
      process.env.RPC_URL ||
      "http://localhost:8899"
  );
  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program<MoviePlatform>(IDL as any, provider); // ✅ typed program

  console.log("📝 Configuration:");
  console.log("   Admin:", adminKeypair.publicKey.toBase58());
  console.log("   Program ID:", PROGRAM_ID.toBase58());
  console.log("   MPL Core:", MPL_CORE_PROGRAM_ID);
  console.log("\n🔑 Collection Keypairs:");
  console.log("   Bronze:", bronzeCollectionKeypair.publicKey.toBase58());
  console.log("   Silver:", silverCollectionKeypair.publicKey.toBase58());
  console.log("   Gold:", goldCollectionKeypair.publicKey.toBase58());
  console.log();

  // ✅ Use relative path
  if (!fs.existsSync(COLLECTION_URI_PATH)) {
    console.error(`❌ Collection URI file not found: ${COLLECTION_URI_PATH}`);
    process.exit(1);
  }

  const collectionURIs: {
    bronze_uri: string;
    silver_uri: string;
    gold_uri: string;
  } = JSON.parse(fs.readFileSync(COLLECTION_URI_PATH, "utf-8"));

  console.log("✓ Collection URIs loaded:");
  console.log("   Bronze:", collectionURIs.bronze_uri);
  console.log("   Silver:", collectionURIs.silver_uri);
  console.log("   Gold:", collectionURIs.gold_uri);
  console.log();

  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );
  console.log("🔑 Platform Config PDA:", platformConfigPDA.toBase58());
  console.log();

  // ✅ Check each collection individually so partial failures can resume
  const collections = [
    {
      name: "Bronze",
      keypair: bronzeCollectionKeypair,
      uri: collectionURIs.bronze_uri,
      method: "createBronzeCollection" as const,
      accountKey: "bronzeCollection" as const,
    },
    {
      name: "Silver",
      keypair: silverCollectionKeypair,
      uri: collectionURIs.silver_uri,
      method: "createSilverCollection" as const,
      accountKey: "silverCollection" as const,
    },
    {
      name: "Gold",
      keypair: goldCollectionKeypair,
      uri: collectionURIs.gold_uri,
      method: "createGoldCollection" as const,
      accountKey: "goldCollection" as const,
    },
  ];

  for (const col of collections) {
    const existing = await connection.getAccountInfo(col.keypair.publicKey);

    if (existing) {
      console.log(`⚠️  ${col.name} Collection already exists, skipping...`);
      continue;
    }

    // ✅ Per-collection error handling so one failure doesn't block the others
    try {
      console.log(`🚀 Creating ${col.name} Collection...`);
      const tx = await program.methods[col.method](col.uri)
        .accounts({
          authority: adminKeypair.publicKey,
          platformConfig: platformConfigPDA,
          [col.accountKey]: col.keypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
        } as any) // ✅ bypass strict per-instruction type checking
        .signers([adminKeypair, col.keypair])
        .rpc();

      console.log(`✓ ${col.name} Collection created`);
      console.log(`  Transaction: ${tx}\n`);
    } catch (error: any) {
      console.error(
        `❌ Failed to create ${col.name} Collection:`,
        error.message
      );
      console.error("   Continuing with remaining collections...\n");
    }
  }

  // Fetch and display final config
  try {
    const config = await program.account.platformConfig.fetch(
      platformConfigPDA
    ); // ✅ no cast needed
    console.log("📊 Final Collection Addresses:");
    console.log("   Bronze:", (config as any).bronzeCollection.toBase58());
    console.log("   Silver:", (config as any).silverCollection.toBase58());
    console.log("   Gold:", (config as any).goldCollection.toBase58());
  } catch {
    console.warn("⚠️  Could not fetch platform config");
  }

  // ✅ Save using relative path
  const existingData = fs.existsSync(COLLECTION_ADDRESS_PATH)
    ? JSON.parse(fs.readFileSync(COLLECTION_ADDRESS_PATH, "utf-8"))
    : {};

  fs.writeFileSync(
    COLLECTION_ADDRESS_PATH,
    JSON.stringify(
      {
        ...existingData,
        BronzeCollectionAddress: bronzeCollectionKeypair.publicKey.toBase58(),
        SilverCollectionAddress: silverCollectionKeypair.publicKey.toBase58(),
        GoldCollectionAddress: goldCollectionKeypair.publicKey.toBase58(),
      },
      null,
      2
    )
  );

  console.log(`\n💾 Saved to: ${COLLECTION_ADDRESS_PATH}`);
  console.log("\n=== Done ===");
  console.log("👉 Next: Run 'npm run admin:open-mint'");
}

main().catch(console.error);
