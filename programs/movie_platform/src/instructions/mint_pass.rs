use crate::error::PlatformError;
use crate::state::{MemberPass, PlatformConfig};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};
use mpl_core::instructions::CreateV1CpiBuilder;
use mpl_core::types::{
    Creator, PermanentFreezeDelegate, Plugin, PluginAuthority, PluginAuthorityPair, Royalties,
    RuleSet,
};

#[derive(Accounts)]
pub struct MintPass<'info> {
    /// User wallet (signer, payer, authority)
    #[account(mut)]
    pub user: Signer<'info>,

    /// Platform configuration
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// Member pass PDA (to be created)
    /// This will fail if a pass already exists for this user
    #[account(
        init,
        payer = user,
        space = 8 + MemberPass::INIT_SPACE,
        seeds = [b"member_pass", user.key().as_ref()],
        bump
    )]
    pub member_pass: Account<'info, MemberPass>,

    /// CHECK: Token mint account is safe because:
    /// - The address is validated against platform_config.token_mint
    /// - No data is read from this account
    #[account(
        constraint = token_mint.key() == platform_config.token_mint
            @ PlatformError::InvalidTokenMint
    )]
    pub token_mint: UncheckedAccount<'info>,

    /// User's Associated Token Account (source of tokens)
    #[account(
        mut,
        constraint = user_ata.mint == platform_config.token_mint
            @ PlatformError::InvalidTokenMint,
        constraint = user_ata.owner == user.key()
            @ PlatformError::InvalidTokenOwner
    )]
    pub user_ata: Account<'info, TokenAccount>,

    /// Treasury's Associated Token Account (destination)
    #[account(
        mut,
        constraint = treasury_ata.mint == platform_config.token_mint
            @ PlatformError::InvalidTokenMint,
        constraint = treasury_ata.owner == platform_config.treasury
            @ PlatformError::InvalidTreasury
    )]
    pub treasury_ata: Account<'info, TokenAccount>,

    /// CHECK: NFT asset account is safe because:
    /// - User is the authority for CreateV1, so they can approve the operation
    /// - Asset account is written to, which creates the NFT
    /// - No manual owner checks needed, MPL Core handles it
    #[account(mut)]
    pub asset: UncheckedAccount<'info>,

    /// CHECK: NFT collection account is safe because:
    /// - The address is validated against platform_config collections
    /// - Only used as a reference for MPL Core CreateV1
    /// - Collection constraint ensures it's one of the valid collections
    #[account(
        mut,
        constraint = (
            collection.key() == platform_config.bronze_collection ||
            collection.key() == platform_config.silver_collection ||
            collection.key() == platform_config.gold_collection
        ) @ PlatformError::InvalidCollection
    )]
    pub collection: UncheckedAccount<'info>,

    /// SPL Token Program
    pub token_program: Program<'info, Token>,

    /// System Program
    pub system_program: Program<'info, System>,

    /// CHECK: MPL Core program ID is validated by the address constraint
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

fn get_next_edition_number(config: &PlatformConfig, tier: u8) -> Result<u64> {
    match tier {
        0 => Ok(config.bronze_next_edition),
        1 => Ok(config.silver_next_edition),
        2 => Ok(config.gold_next_edition),
        _ => Err(PlatformError::InvalidTier.into()),
    }
}

pub fn handler(ctx: Context<MintPass>, tier: u8) -> Result<()> {
    let clock = Clock::get()?;
    let platform_config = &ctx.accounts.platform_config;

    // Mint validation
    if clock.unix_timestamp < platform_config.mint_open_timestamp {
        return Err(PlatformError::MintingNotOpen.into());
    }

    // Validate collection
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

    // Get price
    let price = match tier {
        0 => platform_config.bronze_price,
        1 => platform_config.silver_price,
        2 => platform_config.gold_price,
        _ => return Err(PlatformError::InvalidTier.into()),
    };

    // Transfer SPL tokens from user to treasury using CPI
    // This is the manual approach - we use anchor-spl for the low-level CPI
    let transfer_accounts = Transfer {
        from: ctx.accounts.user_ata.to_account_info(),
        to: ctx.accounts.treasury_ata.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };

    let transfer_context = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        transfer_accounts,
    );

    // Execute the token transfer
    anchor_spl::token::transfer(transfer_context, price)?;

    msg!("Transferred {} tokens from user to treasury", price);

    // Compute edition info before mutable borrow
    let edition_number = get_next_edition_number(platform_config, tier)?;
    let tier_name = ["Bronze", "Silver", "Gold"][tier as usize];
    let edition_name = format!("{} #{}", tier_name, edition_number);
    let edition_uri = match tier {
        0 => platform_config.bronze_nft_uri.clone(),
        1 => platform_config.silver_nft_uri.clone(),
        2 => platform_config.gold_nft_uri.clone(),
        _ => return Err(PlatformError::InvalidTier.into()),
    };

    let royalties_plugin = PluginAuthorityPair {
        plugin: Plugin::Royalties(Royalties {
            basis_points: 10000,
            creators: vec![Creator {
                address: platform_config.authority,
                percentage: 100,
            }],
            rule_set: RuleSet::None,
        }),
        authority: None,
    };

    let permanent_freeze_plugin = PluginAuthorityPair {
        plugin: Plugin::PermanentFreezeDelegate(PermanentFreezeDelegate {
            frozen: true, // ✅ frozen at creation, can never be transferred
        }),
        authority: Some(PluginAuthority::UpdateAuthority), // platform controls it
    };

    // Create NFT with both Royalties and FreezeDelegate plugins
    // Note: CreateV1CpiBuilder.plugins() takes Vec directly, not Option<Vec>

    // Create NFT using MPL Core CreateV1
    // User is the authority and owner of the new asset
    let seeds = &[
        b"platform-config".as_ref(),
        &[ctx.accounts.platform_config.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    CreateV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .asset(&ctx.accounts.asset.to_account_info())
        .collection(Some(&ctx.accounts.collection.to_account_info()))
        .authority(Some(&ctx.accounts.platform_config.to_account_info())) // ✅ platform_config is update authority
        .owner(Some(&ctx.accounts.user.to_account_info())) // ✅ user owns the NFT
        .payer(&ctx.accounts.user.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name(edition_name.clone())
        .uri(edition_uri.clone())
        .plugins(vec![royalties_plugin, permanent_freeze_plugin])
        .invoke_signed(signer_seeds)?;

    // Update member pass
    let member_pass = &mut ctx.accounts.member_pass;
    member_pass.owner = ctx.accounts.user.key();
    member_pass.tier = tier;
    member_pass.minted_at = clock.unix_timestamp;
    member_pass.expires_at = clock.unix_timestamp + 30 * 24 * 60 * 60;
    member_pass.nft_edition = edition_number;
    member_pass.nft_asset = ctx.accounts.asset.key();
    member_pass.bump = ctx.bumps.member_pass;

    // Update edition counter
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
        "Minted {} pass for user: {} edition #{} (Soulbound - Non-Transferable)",
        tier_name,
        ctx.accounts.user.key(),
        edition_number
    );
    msg!("  Creator: {} (100% royalty)", platform_config.authority);
    msg!("  Freeze: Enabled (soulbound NFT)");

    Ok(())
}
