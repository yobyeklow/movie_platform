use crate::error::PlatformError;
use crate::state::PlatformConfig;
use anchor_lang::prelude::*;

use mpl_core::instructions::RemovePluginV1CpiBuilder;
use mpl_core::types::PluginType;

#[derive(Accounts)]
pub struct AllowTransfer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Platform configuration - to verify authority
    #[account(
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// CHECK: NFT asset to make transferable
    /// Safe because:
    /// - Only platform authority can call this (verified below)
    /// - Plugin removal is handled by MPL Core
    /// - No data is read from this account
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,

    /// CHECK: Collection that the NFT belongs to (for reference)
    /// Safe because:
    /// - Only used as reference by MPL Core
    /// - No data is read from this account
    #[account(mut)]
    pub collection: UncheckedAccount<'info>,

    /// System Program
    pub system_program: Program<'info, System>,

    /// CHECK: MPL Core program ID is validated by the address constraint
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<AllowTransfer>) -> Result<()> {
    let platform_config = &ctx.accounts.platform_config;

    // Verify the caller is the platform authority
    require_keys_eq!(
        ctx.accounts.authority.key(),
        platform_config.authority,
        PlatformError::Unauthorized
    );

    msg!("Allowing transfer for NFT: {}", ctx.accounts.asset.key());
    msg!("  Authorized by: {}", platform_config.authority);
    msg!("  Removing FreezeDelegate plugin");

    // Remove the FreezeDelegate plugin from the NFT
    // This makes the NFT transferable again
    RemovePluginV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.asset.to_account_info())
        .collection(Some(&ctx.accounts.collection.to_account_info()))
        .authority(Some(&ctx.accounts.authority.to_account_info()))
        .payer(&ctx.accounts.authority.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .plugin_type(PluginType::FreezeDelegate)
        .invoke()?;

    msg!("Successfully removed FreezeDelegate - NFT is now transferable");

    Ok(())
}
