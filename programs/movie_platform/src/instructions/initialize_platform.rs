use crate::state::PlatformConfig;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    /// Platform authority (admin) who can manage the platform
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Platform configuration PDA
    #[account(
        init,
        payer=authority,
        space=8+PlatformConfig::INIT_SPACE,
        seeds=[b"platform-config"],
        bump
    )]
    pub config: Account<'info, PlatformConfig>,

    /// CHECK: Treasury PDA derived from ["treasury"]
    /// This is a PDA that will own the treasury's ATA
    /// No data needed - just used as an owner address for ATA
    #[account(
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializePlatform>,
    token_mint: Pubkey,
    bronze_price: u64,
    silver_price: u64,
    gold_price: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;

    msg!("=== Initializing Platform ===");
    msg!("Authority: {}", ctx.accounts.authority.key());
    msg!("Token Mint: {}", token_mint);
    msg!("Treasury PDA: {}", ctx.accounts.treasury.key());

    // Store configuration
    config.authority = ctx.accounts.authority.key();
    config.treasury = ctx.accounts.treasury.key(); // Treasury is now a PDA!
    config.token_mint = token_mint;

    // Set tier prices (in token base units, e.g., 6 decimals)
    config.bronze_price = bronze_price;
    config.silver_price = silver_price;
    config.gold_price = gold_price;

    // Initialize with empty collections
    config.bronze_collection = Pubkey::default();
    config.silver_collection = Pubkey::default();
    config.gold_collection = Pubkey::default();

    // Initialize NFT URIs
    config.bronze_nft_uri = String::new();
    config.silver_nft_uri = String::new();
    config.gold_nft_uri = String::new();

    // Initialize edition counters
    config.bronze_next_edition = 0;
    config.silver_next_edition = 0;
    config.gold_next_edition = 0;

    // Set to far future (year 2999) so minting is BLOCKED by default
    // open_mint instruction will override this with actual timestamp
    // This timestamp is within JavaScript's safe integer range (MAX_SAFE_INTEGER: 9,007,199,254,740,991)
    config.mint_open_timestamp = 32503680000; // January 1, 3000 UTC
    config.first_edition_timestamp = 0;

    // Store the bump
    config.bump = ctx.bumps.config;

    msg!("✅ Platform initialized successfully!");
    msg!("   Authority: {}", config.authority);
    msg!("   Treasury: {} (PDA)", config.treasury);
    msg!("   Token Mint: {}", config.token_mint);
    msg!("   Bronze Price: {} ({:.2} tokens)", config.bronze_price, config.bronze_price as f64 / 1_000_000.0);
    msg!("   Silver Price: {} ({:.2} tokens)", config.silver_price, config.silver_price as f64 / 1_000_000.0);
    msg!("   Gold Price: {} ({:.2} tokens)", config.gold_price, config.gold_price as f64 / 1_000_000.0);
    msg!("📝 Next steps:");
    msg!("   1. Initialize token mint (initialize_token)");
    msg!("   2. Initialize collections (initialize_nft_collections)");
    msg!("   3. Create Treasury ATA for the PDA to receive payments");
    msg!("   4. Open mint (open_mint)");
    msg!("   5. Withdraw funds via withdraw_treasury when needed");

    Ok(())
}
