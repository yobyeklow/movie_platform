use crate::error::PlatformError;
use crate::state::PlatformConfig;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, MintTo, Token, TokenAccount},
};

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        constraint = platform_config.token_mint == token_mint.key()
            @ crate::error::PlatformError::InvalidTokenMint,
    )]
    pub token_mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = user,
        associated_token::token_program = token_program,
    )]
    pub user_ata: Account<'info, TokenAccount>,
    pub user: SystemAccount<'info>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
    let token_mint = &ctx.accounts.token_mint;

    msg!("=== Minting Tokens to User ===");
    msg!("Token Mint: {}", token_mint.key());
    msg!("Recipient (User): {}", ctx.accounts.user.key());
    msg!("Amount: {} tokens", amount);

    require!(
        token_mint.mint_authority.unwrap() == ctx.accounts.authority.key(),
        PlatformError::UnauthorizedMintAuthority
    );

    anchor_spl::token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: token_mint.to_account_info(),
                to: ctx.accounts.user_ata.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
        ),
        amount,
    )?;

    msg!("✅ Tokens minted successfully!");
    msg!("   From Token Mint: {}", token_mint.key());
    msg!("   To User: {}", ctx.accounts.user.key());
    msg!("   To User ATA: {}", ctx.accounts.user_ata.key());
    msg!("   Amount: {}", amount);

    Ok(())
}
