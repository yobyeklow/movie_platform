import "dotenv/config";
import { Program, web3, BN, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import fs from "fs";
import bs58 from "bs58";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
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

const AUTHORITY_KEY = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
const adminKeypair = web3.Keypair.fromSecretKey(
  bs58.decode(AUTHORITY_KEY.AdminKey)
);

async function main() {
  console.log("\n=== Withdraw Treasury ===\n");

  // Parse amount from command line
  const args = process.argv.slice(2);
  const amountArg = args.indexOf("--amount");
  const amount =
    amountArg !== -1 ? BigInt(args[amountArg + 1]) : BigInt(1000000); // Default: 1 token

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
  console.log(
    "   Withdraw Amount:",
    amount.toString(),
    `(${(Number(amount) / 10 ** 6).toFixed(2)} tokens)`
  );
  console.log();

  // Get PDAs
  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );

  const [treasuryPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID
  );

  // Get token mint from config
  let tokenMint: web3.PublicKey;
  if (fs.existsSync("/home/oxnen/movie_platform/token_config.json")) {
    const tokenConfig = JSON.parse(
      fs.readFileSync("/home/oxnen/movie_platform/token_config.json", "utf-8")
    );
    tokenMint = new web3.PublicKey(tokenConfig.tokenMint);
  } else {
    console.error(
      "❌ Token config not found! Run 'npm run admin:init:token' first"
    );
    process.exit(1);
  }

  // Import SPL Token functions
  const {
    getAssociatedTokenAddress,
    getAccount,
    createAssociatedTokenAccount,
    createMintToInstruction,
  } = await import("@solana/spl-token");

  // Get Treasury ATA
  const treasuryATA = await getAssociatedTokenAddress(
    tokenMint,
    treasuryPDA,
    true,
    TOKEN_PROGRAM_ID
  );

  // Get Admin ATA
  const adminATA = await getAssociatedTokenAddress(
    tokenMint,
    adminKeypair.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  console.log("🔑 Accounts:");
  console.log("   Platform Config PDA:", platformConfigPDA.toBase58());
  console.log("   Treasury PDA:", treasuryPDA.toBase58());
  console.log("   Treasury ATA:", treasuryATA.toBase58());
  console.log("   Admin ATA:", adminATA.toBase58());
  console.log();

  // Check if Treasury ATA exists, if not create it
  const treasuryATAAccount = await connection.getAccountInfo(treasuryATA);
  if (!treasuryATAAccount) {
    console.log("   Creating Treasury ATA for the PDA...");
    await createAssociatedTokenAccount(
      connection,
      adminKeypair,
      treasuryPDA,
      tokenMint
    );
    console.log("   ✓ Treasury ATA created");
    console.log();
  }

  // Check if Admin ATA exists, if not create it
  const adminATAAccount = await connection.getAccountInfo(adminATA);
  if (!adminATAAccount) {
    console.log("   Creating Admin ATA...");
    await createAssociatedTokenAccount(
      connection,
      adminKeypair,
      adminKeypair.publicKey,
      tokenMint
    );
    console.log("   ✓ Admin ATA created");
    console.log();
  }

  // Check treasury balance
  let treasuryBalance = BigInt(0);
  const treasuryATAInfo = await getAccount(connection, treasuryATA);
  if (treasuryATAInfo) {
    const amountData = treasuryATAInfo.amount;
    treasuryBalance = amountData;
  }

  console.log(
    "💰 Treasury Balance:",
    treasuryBalance.toString(),
    `(${(Number(treasuryBalance) / 10 ** 6).toFixed(2)} tokens)`
  );
  console.log(
    "   Requested Amount:",
    amount.toString(),
    `(${(Number(amount) / 10 ** 6).toFixed(2)} tokens)`
  );
  console.log();

  if (treasuryBalance < amount) {
    console.error("❌ Insufficient treasury balance!");
    process.exit(1);
  }

  console.log("🚀 Executing withdrawal...");
  console.log();

  const tx = await program.methods
    .withdrawTreasury(new BN(amount.toString()))
    .accounts({
      authority: adminKeypair.publicKey,
      platformConfig: platformConfigPDA,
      treasury: treasuryPDA,
      treasuryAta: treasuryATA,
      adminAta: adminATA,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([adminKeypair])
    .rpc();

  console.log("✅ Withdrawal successful!");
  console.log("📝 Transaction:", tx);
  console.log();

  // Fetch new balances
  const newTreasuryATAInfo = await getAccount(connection, treasuryATA);
  const newAdminATAInfo = await getAccount(connection, adminATA);

  const newTreasuryBalance = newTreasuryATAInfo?.amount || BigInt(0);
  const newAdminBalance = newAdminATAInfo?.amount || BigInt(0);

  console.log("📊 New Balances:");
  console.log(
    "   Treasury:",
    newTreasuryBalance.toString(),
    `(${(Number(newTreasuryBalance) / 10 ** 6).toFixed(2)} tokens)`
  );
  console.log(
    "   Admin:",
    newAdminBalance.toString(),
    `(${(Number(newAdminBalance) / 10 ** 6).toFixed(2)} tokens)`
  );
  console.log();

  console.log("=== Withdrawal Complete ===\n");
}

main().catch(console.error);
