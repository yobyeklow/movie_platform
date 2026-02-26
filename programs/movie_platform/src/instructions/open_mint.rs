use crate::error::PlatformError;
use crate::state::PlatformConfig;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct OpenMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut,seeds=[b"platform-config"],bump=platform_config.bump,constraint = platform_config.authority == authority.key() @ PlatformError::Unauthorized)]
    pub platform_config: Account<'info, PlatformConfig>,
}

pub fn handler(ctx: Context<OpenMint>, mint_open_timestamp: i64) -> Result<()> {
    let config = &mut ctx.accounts.platform_config;

    require!(
        ctx.accounts.authority.key() == config.authority,
        PlatformError::Unauthorized
    );
    config.mint_open_timestamp = mint_open_timestamp;
    config.first_edition_timestamp = mint_open_timestamp;
    msg!("Minting opened at timestamp: {}", mint_open_timestamp);
    Ok(())
}
