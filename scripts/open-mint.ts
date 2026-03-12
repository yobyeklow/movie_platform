/**
 * Step 4: Open Mint
 *
 * Opens the mint window at the specified timestamp.
 * Users can only mint after this timestamp.
 *
 * Usage:
 *   npm run admin:open-mint                    // Open now
 *   npm run admin:open-mint -- now              // Open now (explicit)
 *   npm run admin:open-mint -- "3/11/2026 10:30" // Open at specific time
 *   npm run admin:open-mint -- "3/11/2026 10:30PM"
 */

import "dotenv/config";
import { Program, web3, BN, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import IDL from "../target/idl/movie_platform.json";
import fs from "fs";
import bs58 from "bs58";

type KeypairType = "AdminKey";

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

function parseCustomTimestamp(dateString: string): number {
  /**
   * Format: "M/D/YYYY H:MMAM" or "M/D/YYYY H:MM"
   * Examples: "3/11/2026 10:30PM", "3/11/2026 10:30", "3/11/2026 10:30am"
   *
   * Input is interpreted as LOCAL time (user's timezone), converted to UTC for storage
   */
  const normalized = dateString.toLowerCase();

  const dateMatch = normalized.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{1,2})(?:\s*(am|pm))?$/i
  );

  if (!dateMatch) {
    throw new Error(
      `Invalid date format: ${dateString}. Expected format: "M/D/YYYY H:MM" or "M/D/YYYY H:MMAM"`
    );
  }

  const [, month, day, year, hour, minute, meridiem] = dateMatch;
  const adjustedMonth = parseInt(month) - 1;
  let adjustedHour = parseInt(hour);

  // Adjust for AM/PM
  if (meridiem === "pm" && adjustedHour !== 12) {
    adjustedHour += 12;
  } else if (meridiem === "am" && adjustedHour === 12) {
    adjustedHour = 0;
  }

  // Create Date object - Input is treated as LOCAL time
  const date = new Date(
    parseInt(year),
    adjustedMonth,
    parseInt(day),
    adjustedHour,
    parseInt(minute),
    0,
    0
  );

  return Math.floor(date.getTime() / 1000);
}

async function main() {
  console.log("\n=== Step 4: Open Mint ===\n");

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

  // Parse timestamp argument
  const timestampArg = process.argv[2];
  let mintOpenTimestamp: number;

  if (!timestampArg) {
    // Default: Current time
    mintOpenTimestamp = Math.floor(Date.now() / 1000);
    console.log("⏰ No timestamp provided, using current time...");
  } else if (timestampArg === "now") {
    // Explicit "now": Current time
    mintOpenTimestamp = Math.floor(Date.now() / 1000);
    console.log("⏰ Using current timestamp...");
  } else {
    // Custom timestamp
    try {
      mintOpenTimestamp = parseCustomTimestamp(timestampArg);
      const dateObj = new Date(mintOpenTimestamp * 1000);
      console.log("⏰ Opening mint at:", timestampArg);
      console.log("   Unix timestamp:", mintOpenTimestamp);

      const hours = dateObj.getUTCHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;

      const display = `${dateObj.getUTCDate()}/${dateObj.getUTCMonth() + 1}/${dateObj.getUTCFullYear()} ${hours12}:${String(dateObj.getUTCMinutes()).padStart(2, "0")} ${ampm} UTC`;
      console.log("   UTC time:", dateObj.toISOString(), `(${display})`);
    } catch (error) {
      console.error(`❌ Error parsing timestamp: ${error.message}`);
      process.exit(1);
    }
  }

  console.log();

  // Get PDAs
  const [platformConfigPDA] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    PROGRAM_ID
  );

  console.log("🔑 Platform Config PDA:", platformConfigPDA.toBase58());
  console.log();

  // Check current mint status
  try {
    const config = await (program as any).account.platformConfig.fetch(platformConfigPDA);

    if (config.mintOpenTimestamp.toNumber() > 0) {
      const existingDate = new Date(config.mintOpenTimestamp.toNumber() * 1000);
      console.log("⚠️  Mint window already open!");
      console.log("   Current mint open timestamp:", config.mintOpenTimestamp.toNumber());
      console.log("   Current mint open time:", existingDate.toISOString());
      console.log();

      const hours = existingDate.getUTCHours();
      const ampm = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      const minutes = String(existingDate.getUTCMinutes()).padStart(2, "0");
      const month = existingDate.getUTCMonth() + 1;
      const day = existingDate.getUTCDate();
      const year = existingDate.getUTCFullYear();

      const displayString = `${day}/${month}/${year} ${hours12}:${minutes} ${ampm} UTC`;
      console.log("   Readable time:", displayString);
      console.log();

      // Ask to override
      console.log("ℹ️  You can override with a new timestamp if needed.");
      console.log("   This will update the mint open timestamp.");
      console.log();
    }
  } catch (error) {
    console.log("ℹ️  Platform config not initialized yet or cannot fetch.");
  }

  console.log("🚀 Setting mint open timestamp...");

  const tx = await program.methods
    .openMint(new BN(mintOpenTimestamp))
    .accounts({
      authority: adminKeypair.publicKey,
      config: platformConfigPDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .signers([adminKeypair])
    .rpc();

  console.log("✅ Mint window opened!");
  console.log("📝 Transaction:", tx);
  console.log();

  // Fetch and display config
  const config = await (program as any).account.platformConfig.fetch(platformConfigPDA);

  const mintDate = new Date(config.mintOpenTimestamp.toNumber() * 1000);
  const isoString = mintDate.toISOString();

  const hours = mintDate.getUTCHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  const minutes = String(mintDate.getUTCMinutes()).padStart(2, "0");
  const month = mintDate.getUTCMonth() + 1;
  const day = mintDate.getUTCDate();
  const year = mintDate.getUTCFullYear();

  const displayString = `${day}/${month}/${year} ${hours12}:${minutes} ${ampm} UTC`;

  console.log("📊 Mint Window:");
  console.log("   Unix timestamp:", config.mintOpenTimestamp.toNumber());
  console.log("   ISO format:", isoString);
  console.log("   Readable time:", displayString);
  console.log();

  console.log("=== Mint Window Opened ===\n");
  console.log("✅ Platform setup complete!");
  console.log("👉 Next: Mint tokens to users");
  console.log("   npm run admin:mint-tokens -- <WALLET_ADDRESS> <AMOUNT>");
}

// Help text
if (process.argv.length === 2 || process.argv[2] === "--help" || process.argv[2] === "-h") {
  console.log("\nUsage: npm run admin:open-mint [TIMESTAMP]\n");
  console.log("Options:");
  console.log("  (no argument)    Open mint now");
  console.log("  now              Open mint now (explicit)");
  console.log("  \"M/D/YYYY H:MM\"  Open at specific time (e.g., \"3/11/2026 10:30\")");
  console.log("  \"M/D/YYYY H:MMAM\" Open at specific time with AM/PM (e.g., \"3/11/2026 10:30PM\")");
  console.log();
  process.exit(0);
}

main().catch(console.error);
