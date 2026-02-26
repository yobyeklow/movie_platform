use crate::error::PlatformError;
use crate::state::{MemberPass, PlatformConfig};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use mpl_core::instructions::CreateV1CpiBuilder;

#[derive(Accounts)]
pub struct MintPass<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init,
        payer = user,
        space = 8 + MemberPass::INIT_SPACE,
        seeds = [b"member_pass", user.key().as_ref()],
        bump
    )]
    pub member_pass: Account<'info, MemberPass>,

    #[account(mut)]
    pub usdc_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = user_usdc_account.mint == usdc_mint.key(),
        constraint = user_usdc_account.owner == user.key()
    )]
    pub user_usdc_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = treasury_usdc_account.mint == usdc_mint.key(),
        constraint = treasury_usdc_account.owner == platform_config.treasury
    )]
    pub treasury_usdc_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub asset: Signer<'info>,

    /// CHECK: Verified by constraint to match one of the platform's collections
    #[account(
        mut,
        constraint = (
            collection.key() == platform_config.bronze_collection ||
            collection.key() == platform_config.silver_collection ||
            collection.key() == platform_config.gold_collection
        ) @ PlatformError::InvalidCollection
    )]
    pub collection: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,

    /// CHECK: Verified by address constraint to mpl_core::ID
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

fn get_next_edition_number(config: &PlatformConfig, tier: u8) -> Result<u64> {
    let next_edition = match tier {
        0 => config.bronze_next_edition,
        1 => config.silver_next_edition,
        2 => config.gold_next_edition,
        _ => return Err(PlatformError::InvalidTier.into()),
    };

    msg!("Calculated edition #{} for tier {}", next_edition, tier);
    Ok(next_edition)
}

pub fn handler(ctx: Context<MintPass>, tier: u8) -> Result<()> {
    let clock = Clock::get()?;
    let platform_config = &ctx.accounts.platform_config;

    if clock.unix_timestamp < platform_config.mint_open_timestamp {
        return Err(PlatformError::MintingNotOpen.into());
    }

    let expected_collection = match tier {
        0 => platform_config.bronze_collection,
        1 => platform_config.silver_collection,
        2 => platform_config.gold_collection,
        _ => return Err(PlatformError::InvalidTier.into()),
    };

    require_keys_eq!(
        ctx.accounts.collection.key(),
        expected_collection,
        PlatformError::InvalidCollection
    );

    let price = {
        let platform_config = &ctx.accounts.platform_config;
        match tier {
            0 => platform_config.bronze_price,
            1 => platform_config.silver_price,
            2 => platform_config.gold_price,
            _ => return Err(PlatformError::InvalidTier.into()),
        }
    };

    let transfer_ix = Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.treasury_usdc_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_ix);
    token::transfer(cpi_ctx, price)?;

    // Compute edition info before mutable borrow
    let edition_number = get_next_edition_number(&ctx.accounts.platform_config, tier)?;
    let tier_name = ["Bronze", "Silver", "Gold"][tier as usize];
    let edition_name = format!("{} #{}", tier_name, edition_number);
    let edition_uri = {
        let platform_config = &ctx.accounts.platform_config;
        match tier {
            0 => platform_config.bronze_nft_uri.clone(),
            1 => platform_config.silver_nft_uri.clone(),
            2 => platform_config.gold_nft_uri.clone(),
            _ => return Err(PlatformError::InvalidTier.into()),
        }
    };

    CreateV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.asset.to_account_info())
        .collection(Some(&ctx.accounts.collection.to_account_info()))
        .authority(Some(&ctx.accounts.authority.to_account_info()))
        .owner(Some(&ctx.accounts.user.to_account_info()))
        .payer(&ctx.accounts.user.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name(edition_name.clone())
        .uri(edition_uri)
        .invoke()?;

    let member_pass = &mut ctx.accounts.member_pass;
    member_pass.owner = ctx.accounts.user.key();
    member_pass.tier = tier;
    member_pass.minted_at = clock.unix_timestamp;
    member_pass.expires_at = clock.unix_timestamp + 30 * 24 * 60 * 60;
    member_pass.nft_edition = edition_number;
    member_pass.nft_asset = ctx.accounts.asset.key();
    member_pass.bump = ctx.bumps.member_pass;

    let platform_config = &mut ctx.accounts.platform_config;
    let next_edition = match tier {
        0 => &mut platform_config.bronze_next_edition,
        1 => &mut platform_config.silver_next_edition,
        2 => &mut platform_config.gold_next_edition,
        _ => return Err(PlatformError::InvalidTier.into()),
    };
    *next_edition = next_edition
        .checked_add(1)
        .ok_or(PlatformError::EditOverflow)?;

    msg!(
        "Minted {} pass for user: {} edition #{}",
        tier_name,
        ctx.accounts.user.key(),
        edition_number
    );

    Ok(())
}
