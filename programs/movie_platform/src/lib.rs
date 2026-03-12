use anchor_lang::prelude::*;

declare_id!("ApfCLKKr7Y6GX9qKWujhDGmSNvdN93tNidyPe2hyB9jL");

mod error;
mod instructions;
mod state;

use instructions::*;

#[program]
pub mod movie_platform {
    use super::*;

    // ─── Platform Setup ───────────────────────────────────────
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        token_mint: Pubkey,
        bronze_price: u64,
        silver_price: u64,
        gold_price: u64,
    ) -> Result<()> {
        initialize_platform::handler(ctx, token_mint, bronze_price, silver_price, gold_price)
    }

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        decimals: u8,
        initial_supply: u64,
    ) -> Result<()> {
        initialize_token::handler(ctx, decimals, initial_supply)
    }

    // ─── Token Management ─────────────────────────────────────
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        mint_tokens::handler(ctx, amount)
    }

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
        withdraw_treasury::handler(ctx, amount)
    }

    // ─── Collections ──────────────────────────────────────────
    pub fn create_bronze_collection(
        ctx: Context<CreateBronzeCollection>,
        bronze_uri: String,
    ) -> Result<()> {
        create_bronze_collection::handler(ctx, bronze_uri)
    }

    pub fn create_silver_collection(
        ctx: Context<CreateSilverCollection>,
        silver_uri: String,
    ) -> Result<()> {
        create_silver_collection::handler(ctx, silver_uri)
    }

    pub fn create_gold_collection(
        ctx: Context<CreateGoldCollection>,
        gold_uri: String,
    ) -> Result<()> {
        create_gold_collection::handler(ctx, gold_uri)
    }

    pub fn set_collections(
        ctx: Context<SetCollections>,
        bronze_collection: Pubkey,
        silver_collection: Pubkey,
        gold_collection: Pubkey,
    ) -> Result<()> {
        // ✅ Removed redundant URI params — URIs already set during collection creation
        set_collections::handler(ctx, bronze_collection, silver_collection, gold_collection)
    }

    pub fn open_mint(ctx: Context<OpenMint>, mint_open_timestamp: i64) -> Result<()> {
        open_mint::handler(ctx, mint_open_timestamp)
    }

    // ─── Pass Operations ──────────────────────────────────────
    pub fn mint_pass(ctx: Context<MintPass>, tier: u8) -> Result<()> {
        mint_pass::handler(ctx, tier)
    }

    pub fn burn_pass(ctx: Context<BurnPass>) -> Result<()> {
        burn_pass::handler(ctx)
    }

    pub fn verify_pass(ctx: Context<VerifyPass>) -> Result<u8> {
        // ✅ Return Result<()> — expose tier via account data, not return value
        verify_pass::handler(ctx)
    }

    pub fn allow_transfer(ctx: Context<AllowTransfer>) -> Result<()> {
        allow_transfer::handler(ctx)
    }

    // ─── Optional: Admin Key Rotation ─────────────────────────
    // pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
    //     transfer_authority::handler(ctx, new_authority)
    // }
}
