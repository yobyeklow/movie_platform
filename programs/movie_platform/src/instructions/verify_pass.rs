use anchor_lang::prelude::*;

use crate::{error::PlatformError, state::MemberPass};

#[derive(Accounts)]
pub struct VerifyPass<'info> {
    pub user: Signer<'info>,
    /// CHECK: Account will be validated in handler
    /// If provided, we'll verify it's a valid member pass
    pub member_pass: Option<UncheckedAccount<'info>>,
}

pub fn handler(ctx: Context<VerifyPass>) -> Result<u8> {
    // If no member pass account provided, return error
    let pass_info = match &ctx.accounts.member_pass {
        Some(account) => account.to_account_info(),
        None => return Err(PlatformError::PassNotFound.into()),
    };

    // Try to load and validate the member pass
    let pass = MemberPass::try_deserialize(&mut &pass_info.data.borrow()[..])?;

    let clock = Clock::get()?;

    // Check if pass is expired
    require!(
        clock.unix_timestamp < pass.expires_at,
        PlatformError::PassExpired
    );

    // Verify the pass belongs to the user
    require!(
        pass.owner == ctx.accounts.user.key(),
        PlatformError::Unauthorized
    );

    // Verify the PDA seeds are correct (security check)
    let (_, expected_bump) = Pubkey::find_program_address(
        &[b"member_pass", ctx.accounts.user.key().as_ref()],
        &crate::ID,
    );
    require!(
        expected_bump == pass.bump,
        PlatformError::InvalidAccount
    );

    // Return the tier (0=Bronze, 1=Silver, 2=Gold)
    Ok(pass.tier)
}
