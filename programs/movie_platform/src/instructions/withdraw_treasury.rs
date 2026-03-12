use crate::error::PlatformError;
use crate::state::PlatformConfig;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use anchor_spl::token::transfer as token_transfer;

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct WithdrawTreasury<'info> {
    /// Platform authority (admin) - only they can withdraw
    #[account(
        mut,
        constraint = platform_config.authority == authority.key() @ crate::error::PlatformError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// Platform configuration - contains treasury address
    #[account(
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// Treasury PDA - derived from ["treasury"]
    /// CHECK: Account is validated by seeds constraint
    #[account(
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    /// Treasury's ATA - contains collected tokens from mint_pass
    /// Must be owned by the Treasury PDA
    #[account(
        mut,
        constraint = treasury_ata.mint == platform_config.token_mint @ crate::error::PlatformError::InvalidTokenMint,
        constraint = treasury_ata.owner == treasury.key() @ crate::error::PlatformError::InvalidTreasuryOwner,
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    /// Admin's ATA - receives the withdrawn tokens
    #[account(
        mut,
        constraint = admin_ata.mint == platform_config.token_mint @ crate::error::PlatformError::InvalidTokenMint,
        constraint = admin_ata.owner == authority.key() @ crate::error::PlatformError::InvalidTokenOwner,
    )]
    pub admin_ata: Account<'info, TokenAccount>,

    /// SPL Token program
    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<WithdrawTreasury>, amount: u64) -> Result<()> {
    let treasury_ata = &ctx.accounts.treasury_ata;

    // Check sufficient balance
    require!(
        treasury_ata.amount >= amount,
        PlatformError::InsufficientTokenBalance
    );

    msg!("=== Treasury Withdrawal ===");
    msg!("Withdrawer (Admin): {}", ctx.accounts.authority.key());
    msg!("Amount: {} tokens", amount);
    msg!("From Treasury ATA: {}", ctx.accounts.treasury_ata.key());
    msg!("To Admin ATA: {}", ctx.accounts.admin_ata.key());
    msg!("Treasury PDA: {}", ctx.accounts.treasury.key());

    // Transfer tokens from treasury ATA to admin ATA
    // The treasury PDA is the owner of treasury_ata, so it must sign
    // Since PDA can't sign directly, we use CPI with the treasury account
    let transfer_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.treasury_ata.to_account_info(),
        to: ctx.accounts.admin_ata.to_account_info(),
        authority: ctx.accounts.treasury.to_account_info(),
    };

    let transfer_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts,
    );

    token_transfer(transfer_context, amount)?;

    msg!("✅ Withdrawal successful!");
    msg!("Treasury balance before: {}", treasury_ata.amount);
    msg!("Treasury balance after: {}", treasury_ata.amount.checked_sub(amount).unwrap_or(0));
    msg!("💡 Note: Treasury PDA (no private key) is used as owner for security");

    Ok(())
}
