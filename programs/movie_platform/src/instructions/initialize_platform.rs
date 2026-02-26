use crate::state::PlatformConfig;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer=authority, space=8+PlatformConfig::INIT_SPACE, seeds=[b"platform-config"], bump)]
    pub config: Account<'info, PlatformConfig>,
    #[account(init,payer=authority, token::mint = usdc_mint, token::authority = authority,seeds=[b"treasury"],bump)]
    pub treasury: Account<'info, TokenAccount>,
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<InitializePlatform>,
    bronze_price: u64,
    silver_price: u64,
    gold_price: u64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.treasury = ctx.accounts.treasury.key();

    config.bronze_price = bronze_price;
    config.silver_price = silver_price;
    config.gold_price = gold_price;

    //Initialize with empty values.
    config.bronze_collection = Pubkey::default();
    config.silver_collection = Pubkey::default();
    config.gold_collection = Pubkey::default();
    // Set to far future (year 2999) so minting is BLOCKED by default
    // This timestamp is within JavaScript's safe integer range (MAX_SAFE_INTEGER: 9,007,199,254,740,991)
    // open_mint will override this with actual timestamp
    config.mint_open_timestamp = 32503680000; // January 1, 3000 UTC
    config.first_edition_timestamp = 0;
    config.bump = ctx.bumps.config;
    Ok(())
}
