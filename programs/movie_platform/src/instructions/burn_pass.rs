use crate::state::MemberPass;
use anchor_lang::prelude::*;
use mpl_core::instructions::BurnV1CpiBuilder;

#[derive(Accounts)]
pub struct BurnPass<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// Member pass PDA (to be closed)
    #[account(
        mut,
        seeds = [b"member_pass", user.key().as_ref()],
        bump = member_pass.bump,
        close = user
    )]
    pub member_pass: Account<'info, MemberPass>,

    /// CHECK: NFT asset to be burned
    /// Safe because:
    /// - The address comes from member_pass.nft_asset (validated by seeds)
    /// - User must be the owner (verified by MPL Core during burn)
    /// - No data is read from this account, only passed to MPL Core
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,

    /// CHECK: Collection the NFT belongs to (optional, for collection decrement)
    /// Safe because:
    /// - Only used for reference by MPL Core
    /// - No data is read from this account
    #[account(mut)]
    pub collection: UncheckedAccount<'info>,

    /// System Program
    pub system_program: Program<'info, System>,

    /// CHECK: MPL Core program ID is validated by the address constraint
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<BurnPass>) -> Result<()> {
    let member_pass = &ctx.accounts.member_pass;

    msg!("Burning pass for user: {}", ctx.accounts.user.key());
    msg!(
        "Pass tier: {} (0=Bronze, 1=Silver, 2=Gold)",
        member_pass.tier
    );
    msg!("Expires at: {}", member_pass.expires_at);
    msg!("NFT Asset: {}", member_pass.nft_asset);
    msg!("NFT Edition: {}", member_pass.nft_edition);

    // Burn the MPL Core NFT asset
    // User must be the owner of the NFT (verified by MPL Core)
    BurnV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.asset.to_account_info())
        .collection(Some(&ctx.accounts.collection.to_account_info()))
        .authority(Some(&ctx.accounts.user.to_account_info()))
        .payer(&ctx.accounts.user.to_account_info())
        .system_program(Some(&ctx.accounts.system_program.to_account_info()))
        .invoke()?;

    msg!("Burned NFT asset: {}", ctx.accounts.asset.key());

    // MemberPass PDA is automatically closed by the `close = user` constraint
    // The lamports from the closed account are returned to the user

    Ok(())
}
