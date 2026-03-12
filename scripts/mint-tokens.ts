import "dotenv/config";
import { Program, web3, BN, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"; // ✅ static import
import fs from "fs";
import path from "path";
import bs58 from "bs58";

const keypairPath = process.env.NEXT_KEYPAIR;
if (!keypairPath) {
  console.error("❌ NEXT_KEYPAIR is not set in .env file");
  process.exit(1);
}
if (!fs.existsSync(keypairPath)) {
  console.error(`❌ Keypair file not found: ${keypairPath}`);
  process.exit(1);
}

// ✅ Use relative path
const PROJECT_ROOT = path.resolve(__dirname, "../../");
const TOKEN_CONFIG_PATH = path.join(
  PROJECT_ROOT,
  "/movie_platform/token_config.json"
);
const KEYPAIR_CONFIG_PATH = path.join(
  PROJECT_ROOT,
  "/movie_platform/" + keypairPath
);
const AUTHORITY_KEY = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
const adminKeypair = web3.Keypair.fromSecretKey(
  bs58.decode(AUTHORITY_KEY.AdminKey)
);

async function main() {
  console.log("\n=== Mint Tokens to User ===\n");

  // Parse arguments
  const args = process.argv.slice(2);
  const toIndex = args.indexOf("--to");
  const amountIndex = args.indexOf("--amount");

  const recipientAddress =
    toIndex !== -1
      ? new web3.PublicKey(args[toIndex + 1]) // ✅ use web3.PublicKey, no duplicate import
      : adminKeypair.publicKey;

  const amount =
    amountIndex !== -1 ? BigInt(args[amountIndex + 1]) : BigInt(10_000_000); // 10 tokens

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
  console.log("   Admin (Mint Authority):", adminKeypair.publicKey.toBase58());
  console.log("   Recipient:", recipientAddress.toBase58());
  console.log(
    "   Amount:",
    amount.toString(),
    `(${(Number(amount) / 10 ** 6).toFixed(2)} tokens)`
  );
  console.log();

  // ✅ Use relative path
  if (!fs.existsSync(TOKEN_CONFIG_PATH)) {
    console.error(`❌ Token config not found at: ${TOKEN_CONFIG_PATH}`);
    console.error("   Run 'npm run admin:init:token' first");
    process.exit(1);
  }

  const tokenConfig = JSON.parse(fs.readFileSync(TOKEN_CONFIG_PATH, "utf-8"));
  const tokenMint = new web3.PublicKey(tokenConfig.tokenMint);

  console.log("🔑 Accounts:");
  console.log("   Token Mint:", tokenMint.toBase58());
  console.log("   Recipient:", recipientAddress.toBase58());
  console.log();

  console.log("🪙 Minting tokens...");

  const tx = await program.methods
    .mintTokens(new BN(amount.toString()))
    .accounts({
      authority: adminKeypair.publicKey,
      // ✅ platformConfig removed — auto-resolved by Anchor from IDL seeds
      tokenMint: tokenMint,
      user: recipientAddress,
      // ✅ associatedTokenProgram, tokenProgram, systemProgram likely auto-resolved too
      // Add them back only if Anchor throws "account not provided" error
    })
    .signers([adminKeypair])
    .rpc();

  console.log("✅ Tokens minted!");
  console.log("   Transaction:", tx);
  console.log();

  // Check new balance
  const recipientATA = await getAssociatedTokenAddress(
    tokenMint,
    recipientAddress
  );

  try {
    const ataInfo = await getAccount(connection, recipientATA);
    const balance = ataInfo.amount;
    console.log("📊 New Balance:");
    console.log("   Recipient:", recipientAddress.toBase58());
    console.log(
      "   Balance:",
      balance.toString(),
      `(${(Number(balance) / 10 ** 6).toFixed(2)} tokens)`
    );
  } catch {
    console.warn("⚠️  Could not fetch token balance (ATA may not exist yet)");
  }

  console.log("\n=== Mint Complete ===");
  console.log("💡 User can now mint passes with their tokens!");
}

main().catch(console.error);
