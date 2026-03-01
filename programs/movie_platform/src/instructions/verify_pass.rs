use anchor_lang::prelude::*;

use crate::{error::PlatformError, state::MemberPass};

#[derive(Accounts)]
pub struct VerifyPass<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut,seeds=[b"member_pass",user.key().as_ref()],bump=member_pass.bump)]
    pub member_pass: Option<Account<'info, MemberPass>>,
}

pub fn handler(ctx: Context<VerifyPass>) -> Result<(u8)> {
    match &ctx.accounts.member_pass {
        Some(pass) => {
            let clock = Clock::get()?;
            require!(
                clock.unix_timestamp < pass.expires_at,
                PlatformError::PassExpired
            );
            require!(
                pass.owner.key() == ctx.accounts.user.key(),
                PlatformError::Unauthorized
            );
            Ok(pass.tier)
        }
        None => Err(PlatformError::PassNotFound.into()),
    }
}
