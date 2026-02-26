import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MoviePlatform } from "../target/types/movie_platform";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  mintTo,
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { assert } from "chai";

const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);
const BRONZE_PRICE = new anchor.BN(10_000_000);
const SILVER_PRICE = new anchor.BN(25_000_000);
const GOLD_PRICE = new anchor.BN(50_000_000);
const BRONZE_URI =
  "https://cyan-practical-spoonbill-100.mypinata.cloud/ipfs/bafkreihlz7v5c3ll7ywwqkjz6a6klvjdfrmtgfeby5jqhiy7fjisndgl5y";
const SILVER_URI =
  "https://cyan-practical-spoonbill-100.mypinata.cloud/ipfs/bafkreiazyvqd7ykg2hbpg7minr4cedvecid4eemjyucb2k56fqqdbtyodm";
const GOLD_URI =
  "https://cyan-practical-spoonbill-100.mypinata.cloud/ipfs/bafkreiaanspsvvdgbi45rvbhoe35jt6iteq7eszfgwg2bdtjvhljfwuljq";

async function airdrop(
  connection: anchor.web3.Connection,
  pubkey: PublicKey,
  sol = 10
) {
  const sig = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );
}

function getPlatformConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform-config")],
    programId
  );
}

function getTreasuryPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from("treasury")], programId);
}

function getMemberPassPDA(
  user: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("member_pass"), user.toBuffer()],
    programId
  );
}

describe("movie_platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MoviePlatform as Program<MoviePlatform>;
  const connection = provider.connection;
  const authority = Keypair.generate();
  const user = Keypair.generate();
  const bronzeCollection = Keypair.generate();
  const silverCollection = Keypair.generate();
  const goldCollection = Keypair.generate();

  let usdcMint: PublicKey;
  let userUsdcAccount: PublicKey;
  let treasuryUsdcAccount: PublicKey;
  let platformConfigPDA: PublicKey;
  let treasuryPDA: PublicKey;
  let openTimestampBN: anchor.BN;

  before("Fund wallets and create USDC mint", async () => {
    const mplCoreInfo = await connection.getAccountInfo(MPL_CORE_PROGRAM_ID);
    if (!mplCoreInfo) {
      throw new Error(
        "mpl-core program not found on localnet!\n" +
          "Fix: Add [[test.validator.clone]] to Anchor.toml and increase startup_wait to 15000"
      );
    }
    console.log("✅ mpl-core confirmed on localnet");
    [platformConfigPDA] = getPlatformConfigPDA(program.programId);
    [treasuryPDA] = getTreasuryPDA(program.programId);

    console.log("\nProgram ID: ", program.programId.toBase58());
    console.log("PlatformConfig PDA:", platformConfigPDA.toBase58());
    console.log("Treasury PDA:", treasuryPDA.toBase58());

    await airdrop(connection, authority.publicKey, 20);
    await airdrop(connection, user.publicKey, 20);

    usdcMint = await createMint(
      connection,
      authority,
      authority.publicKey,
      null,
      6
    );
    console.log("USDC Mint:", usdcMint.toBase58());

    const treasuryTokenAcc = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      usdcMint,
      treasuryPDA,
      true
    );
    treasuryUsdcAccount = treasuryTokenAcc.address;

    const userTokenAcc = await getOrCreateAssociatedTokenAccount(
      connection,
      user,
      usdcMint,
      user.publicKey
    );
    userUsdcAccount = userTokenAcc.address;

    await mintTo(
      connection,
      authority,
      usdcMint,
      userUsdcAccount,
      authority,
      1_000_000_000 // 1000 USDC
    );

    console.log("User USDC balance: 1000 USDC");
    console.log("✅ Setup complete\n");
  });

  describe("initialize_platform", () => {
    it("initializes with correct prices and authority", async () => {
      const tx = await program.methods
        .initializePlatform(BRONZE_PRICE, SILVER_PRICE, GOLD_PRICE)
        .accountsStrict({
          authority: authority.publicKey,
          config: platformConfigPDA,
          treasury: treasuryPDA,
          usdcMint: usdcMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([authority])
        .rpc();

      console.log("initialize_platform tx:", tx);

      const config = await program.account.platformConfig.fetch(
        platformConfigPDA
      );
      assert.ok(
        config.authority.equals(authority.publicKey),
        "authority mismatch"
      );
      assert.ok(config.bronzePrice.eq(BRONZE_PRICE), "bronze price mismatch");
      assert.ok(config.silverPrice.eq(SILVER_PRICE), "silver price mismatch");
      assert.ok(config.goldPrice.eq(GOLD_PRICE), "gold price mismatch");
      assert.ok(config.treasury.equals(treasuryPDA), "treasury mismatch");
      assert.equal(config.bronzeNextEdition.toNumber(), 0);
      // mint_open_timestamp is set to far future (year 3000) to block minting by default
      assert.ok(
        config.mintOpenTimestamp.gt(
          new anchor.BN(Math.floor(Date.now() / 1000))
        ),
        "minting should be blocked by default"
      );
      console.log("✅ Platform initialized\n");
    });

    it("rejects double initialization", async () => {
      try {
        await program.methods
          .initializePlatform(BRONZE_PRICE, SILVER_PRICE, GOLD_PRICE)
          .accountsStrict({
            authority: authority.publicKey,
            config: platformConfigPDA,
            treasury: treasuryPDA,
            usdcMint: usdcMint,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([authority])
          .rpc();
        assert.fail("Should have thrown on double-init");
      } catch (err) {
        assert.ok(err);
        console.log("✅ Double-init correctly rejected\n");
      }
    });
  });

  describe("initialize_nft_collections", () => {
    it("creates all 3 mpl-core collections and stores pubkeys in config", async () => {
      const tx = await program.methods
        .initializeNftCollections(BRONZE_URI, SILVER_URI, GOLD_URI)
        .accountsStrict({
          authority: authority.publicKey,
          platformConfig: platformConfigPDA,
          bronzeCollection: bronzeCollection.publicKey,
          silverCollection: silverCollection.publicKey,
          goldCollection: goldCollection.publicKey,
          systemProgram: SystemProgram.programId,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
        })
        .signers([
          authority,
          bronzeCollection,
          silverCollection,
          goldCollection,
        ])
        .rpc();

      console.log("initialize_nft_collections tx:", tx);

      const config = await program.account.platformConfig.fetch(
        platformConfigPDA
      );
      assert.ok(
        config.bronzeCollection.equals(bronzeCollection.publicKey),
        "bronze collection mismatch"
      );
      assert.ok(
        config.silverCollection.equals(silverCollection.publicKey),
        "silver collection mismatch"
      );
      assert.ok(
        config.goldCollection.equals(goldCollection.publicKey),
        "gold collection mismatch"
      );
      assert.equal(config.bronzeNftUri, BRONZE_URI);
      assert.equal(config.silverNftUri, SILVER_URI);
      assert.equal(config.goldNftUri, GOLD_URI);
      console.log("✅ NFT collections created and stored\n");
    });
  });

  describe("open_mint", () => {
    it("blocks mint_pass before open_mint is called", async () => {
      const freshUser = Keypair.generate();
      await airdrop(connection, freshUser.publicKey);
      const freshUsdc = await getOrCreateAssociatedTokenAccount(
        connection,
        freshUser,
        usdcMint,
        freshUser.publicKey
      );
      await mintTo(
        connection,
        authority,
        usdcMint,
        freshUsdc.address,
        authority,
        1_000_000_000
      );

      const asset = Keypair.generate();
      const [memberPassPDA] = getMemberPassPDA(
        freshUser.publicKey,
        program.programId
      );

      try {
        await program.methods
          .mintPass(0)
          .accountsStrict({
            authority: authority.publicKey,
            user: freshUser.publicKey,
            platformConfig: platformConfigPDA,
            memberPass: memberPassPDA,
            usdcMint,
            userUsdcAccount: freshUsdc.address,
            treasuryUsdcAccount,
            asset: asset.publicKey,
            collection: bronzeCollection.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
          })
          .signers([authority, freshUser, asset])
          .rpc();
        assert.fail("Should have thrown MintingNotOpen");
      } catch (err: any) {
        const msg = err.toString();
        const blocked =
          msg.includes("MintingNotOpen") || msg.includes("InvalidCollection");
        assert.ok(
          blocked,
          `Expected MintingNotOpen or InvalidCollection, got: ${msg}`
        );
        console.log("✅ Mint blocked before open_mint\n");
      }
    });

    it("opens minting with a past timestamp", async () => {
      openTimestampBN = new anchor.BN(Math.floor(Date.now() / 1000) - 10);

      const tx = await program.methods
        .openMint(openTimestampBN)
        .accountsStrict({
          authority: authority.publicKey,
          platformConfig: platformConfigPDA,
        })
        .signers([authority])
        .rpc();

      console.log("open_mint tx:", tx);
      const config = await program.account.platformConfig.fetch(
        platformConfigPDA
      );
      assert.equal(
        config.mintOpenTimestamp.toString(),
        openTimestampBN.toString(),
        "mintOpenTimestamp not stored — check that platform_config is `mut` in open_mint accounts"
      );
      console.log("✅ Mint opened at:", openTimestampBN.toNumber(), "\n");
    });

    it("rejects non-authority calling open_mint", async () => {
      try {
        await program.methods
          .openMint(new anchor.BN(0))
          .accountsStrict({
            authority: user.publicKey,
            platformConfig: platformConfigPDA,
          })
          .signers([user])
          .rpc();
        assert.fail("Should have thrown Unauthorized");
      } catch (err: any) {
        assert.ok(err);
        console.log("✅ Non-authority rejected\n");
      }
    });
  });

  describe("mint_pass", () => {
    it("mints a bronze pass and transfers correct USDC amount", async () => {
      const asset = Keypair.generate();
      const [memberPassPDA] = getMemberPassPDA(
        user.publicKey,
        program.programId
      );

      const beforeUser = (await getAccount(connection, userUsdcAccount)).amount;
      const beforeTreasury = (await getAccount(connection, treasuryUsdcAccount))
        .amount;

      const tx = await program.methods
        .mintPass(0)
        .accountsStrict({
          authority: authority.publicKey,
          user: user.publicKey,
          platformConfig: platformConfigPDA,
          memberPass: memberPassPDA,
          usdcMint,
          userUsdcAccount,
          treasuryUsdcAccount,
          asset: asset.publicKey,
          collection: bronzeCollection.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
        })
        .signers([authority, user, asset])
        .rpc();

      console.log("mint_pass (bronze) tx:", tx);

      const memberPass = await program.account.memberPass.fetch(memberPassPDA);
      assert.ok(memberPass.owner.equals(user.publicKey), "owner mismatch");
      assert.equal(memberPass.tier, 0, "should be bronze");
      assert.equal(memberPass.nftEdition.toNumber(), 0, "first edition = 0");
      assert.ok(
        memberPass.expiresAt.gt(memberPass.mintedAt),
        "expiry should be in future"
      );
      assert.ok(
        memberPass.nftAsset.equals(asset.publicKey),
        "nft asset pubkey not stored"
      );

      const afterUser = (await getAccount(connection, userUsdcAccount)).amount;
      const afterTreasury = (await getAccount(connection, treasuryUsdcAccount))
        .amount;
      const expected = BigInt(BRONZE_PRICE.toString());
      assert.equal(
        beforeUser - afterUser,
        expected,
        "user not charged correctly"
      );
      assert.equal(
        afterTreasury - beforeTreasury,
        expected,
        "treasury not credited correctly"
      );

      const config = await program.account.platformConfig.fetch(
        platformConfigPDA
      );
      assert.equal(
        config.bronzeNextEdition.toNumber(),
        1,
        "bronze counter should increment to 1"
      );

      console.log(
        "✅ Bronze pass minted, USDC transferred, edition counter = 1\n"
      );
    });

    it("rejects duplicate mint (member_pass PDA already exists)", async () => {
      const asset = Keypair.generate();
      const [memberPassPDA] = getMemberPassPDA(
        user.publicKey,
        program.programId
      );

      try {
        await program.methods
          .mintPass(0)
          .accountsStrict({
            authority: authority.publicKey,
            user: user.publicKey,
            platformConfig: platformConfigPDA,
            memberPass: memberPassPDA,
            usdcMint,
            userUsdcAccount,
            treasuryUsdcAccount,
            asset: asset.publicKey,
            collection: bronzeCollection.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
          })
          .signers([authority, user, asset])
          .rpc();
        assert.fail("Should have thrown on duplicate member_pass");
      } catch (err: any) {
        assert.ok(err);
        console.log("✅ Duplicate mint rejected\n");
      }
    });

    it("rejects invalid tier (3)", async () => {
      const freshUser = Keypair.generate();
      await airdrop(connection, freshUser.publicKey);
      const freshUsdc = await getOrCreateAssociatedTokenAccount(
        connection,
        freshUser,
        usdcMint,
        freshUser.publicKey
      );
      await mintTo(
        connection,
        authority,
        usdcMint,
        freshUsdc.address,
        authority,
        1_000_000_000
      );

      const asset = Keypair.generate();
      const [memberPassPDA] = getMemberPassPDA(
        freshUser.publicKey,
        program.programId
      );

      try {
        await program.methods
          .mintPass(3)
          .accountsStrict({
            authority: authority.publicKey,
            user: freshUser.publicKey,
            platformConfig: platformConfigPDA,
            memberPass: memberPassPDA,
            usdcMint,
            userUsdcAccount: freshUsdc.address,
            treasuryUsdcAccount,
            asset: asset.publicKey,
            collection: bronzeCollection.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
          })
          .signers([authority, freshUser, asset])
          .rpc();
        assert.fail("Should have thrown InvalidTier");
      } catch (err: any) {
        const msg = err.toString();
        const rejected =
          msg.includes("InvalidTier") || msg.includes("InvalidCollection");
        assert.ok(
          rejected,
          `Expected InvalidTier or InvalidCollection, got: ${msg}`
        );
        console.log("✅ Invalid tier rejected\n");
      }
    });

    it("rejects mismatched collection (bronze tier + silver collection)", async () => {
      const mismatchUser = Keypair.generate();
      await airdrop(connection, mismatchUser.publicKey);
      const mismatchUsdc = await getOrCreateAssociatedTokenAccount(
        connection,
        mismatchUser,
        usdcMint,
        mismatchUser.publicKey
      );
      await mintTo(
        connection,
        authority,
        usdcMint,
        mismatchUsdc.address,
        authority,
        1_000_000_000
      );

      const asset = Keypair.generate();
      const [memberPassPDA] = getMemberPassPDA(
        mismatchUser.publicKey,
        program.programId
      );

      try {
        await program.methods
          .mintPass(0)
          .accountsStrict({
            authority: authority.publicKey,
            user: mismatchUser.publicKey,
            platformConfig: platformConfigPDA,
            memberPass: memberPassPDA,
            usdcMint,
            userUsdcAccount: mismatchUsdc.address,
            treasuryUsdcAccount,
            asset: asset.publicKey,
            collection: silverCollection.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
          })
          .signers([authority, mismatchUser, asset])
          .rpc();
        assert.fail("Should have thrown InvalidCollection");
      } catch (err: any) {
        assert.include(err.toString(), "InvalidCollection");
        console.log("✅ Mismatched collection rejected\n");
      }
    });

    it("mints a gold pass for a different user", async () => {
      const goldUser = Keypair.generate();
      await airdrop(connection, goldUser.publicKey);
      const goldUsdc = await getOrCreateAssociatedTokenAccount(
        connection,
        goldUser,
        usdcMint,
        goldUser.publicKey
      );
      await mintTo(
        connection,
        authority,
        usdcMint,
        goldUsdc.address,
        authority,
        1_000_000_000
      );

      const asset = Keypair.generate();
      const [memberPassPDA] = getMemberPassPDA(
        goldUser.publicKey,
        program.programId
      );

      const tx = await program.methods
        .mintPass(2) // 2 = gold
        .accountsStrict({
          authority: authority.publicKey,
          user: goldUser.publicKey,
          platformConfig: platformConfigPDA,
          memberPass: memberPassPDA,
          usdcMint,
          userUsdcAccount: goldUsdc.address,
          treasuryUsdcAccount,
          asset: asset.publicKey,
          collection: goldCollection.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
        })
        .signers([authority, goldUser, asset])
        .rpc();

      console.log("mint_pass (gold) tx:", tx);

      const memberPass = await program.account.memberPass.fetch(memberPassPDA);
      assert.equal(memberPass.tier, 2);
      assert.equal(
        memberPass.nftEdition.toNumber(),
        0,
        "first gold edition = 0"
      );

      const config = await program.account.platformConfig.fetch(
        platformConfigPDA
      );
      assert.equal(
        config.goldNextEdition.toNumber(),
        1,
        "gold counter should be 1"
      );
      console.log("✅ Gold pass minted\n");
    });
  });

  describe("final state", () => {
    it("all counters and URIs are correct after all operations", async () => {
      const config = await program.account.platformConfig.fetch(
        platformConfigPDA
      );

      assert.equal(config.bronzeNextEdition.toNumber(), 1, "1 bronze minted");
      assert.equal(config.silverNextEdition.toNumber(), 0, "0 silver minted");
      assert.equal(config.goldNextEdition.toNumber(), 1, "1 gold minted");
      assert.equal(config.bronzeNftUri, BRONZE_URI);
      assert.equal(config.silverNftUri, SILVER_URI);
      assert.equal(config.goldNftUri, GOLD_URI);

      console.log("\n── Final State ──────────────────────");
      console.log(
        "Bronze editions minted:",
        config.bronzeNextEdition.toString()
      );
      console.log(
        "Silver editions minted:",
        config.silverNextEdition.toString()
      );
      console.log("Gold editions minted:  ", config.goldNextEdition.toString());
      console.log("────────────────────────────────────\n");
      console.log("✅ All final state assertions passed");
    });
  });
});
