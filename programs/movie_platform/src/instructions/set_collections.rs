use crate::state::PlatformConfig;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetCollections<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ crate::error::PlatformError::Unauthorized
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

pub fn handler(
    ctx: Context<SetCollections>,
    bronze_collection: Pubkey,
    silver_collection: Pubkey,
    gold_collection: Pubkey,
) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;
    config.bronze_collection = bronze_collection;
    config.silver_collection = silver_collection;
    config.gold_collection = gold_collection;

    msg!("Set Bronze Collection: {}", bronze_collection);
    msg!("Set Silver Collection: {}", silver_collection);
    msg!("Set Gold Collection: {}", gold_collection);

    Ok(())
}
