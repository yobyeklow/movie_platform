use crate::state::PlatformConfig;
use anchor_lang::prelude::*;

use mpl_core::instructions::CreateCollectionV1CpiBuilder;

#[derive(Accounts)]
pub struct InitializeNftCollections<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, seeds = [b"platform-config"], bump = platform_config.bump)]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub bronze_collection: Signer<'info>,
    #[account(mut)]
    pub silver_collection: Signer<'info>,
    #[account(mut)]
    pub gold_collection: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Verified by address constraint to mpl_core::ID
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn handler(
    ctx: Context<InitializeNftCollections>,
    bronze_uri: String,
    silver_uri: String,
    gold_uri: String,
) -> Result<()> {
    CreateCollectionV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .collection(&ctx.accounts.bronze_collection.to_account_info())
        .payer(&ctx.accounts.authority.to_account_info())
        .update_authority(Some(&ctx.accounts.authority.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("Movie Bronze Pass".to_string())
        .uri(bronze_uri.clone())
        .invoke()?;

    CreateCollectionV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .collection(&ctx.accounts.silver_collection.to_account_info())
        .payer(&ctx.accounts.authority.to_account_info())
        .update_authority(Some(&ctx.accounts.authority.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("Movie Silver Pass".to_string())
        .uri(silver_uri.clone())
        .invoke()?;

    CreateCollectionV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .collection(&ctx.accounts.gold_collection.to_account_info())
        .payer(&ctx.accounts.authority.to_account_info())
        .update_authority(Some(&ctx.accounts.authority.to_account_info()))
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("Movie Gold Pass".to_string())
        .uri(gold_uri.clone())
        .invoke()?;

    let config = &mut ctx.accounts.platform_config;
    config.bronze_collection = ctx.accounts.bronze_collection.key();
    config.silver_collection = ctx.accounts.silver_collection.key();
    config.gold_collection = ctx.accounts.gold_collection.key();
    config.bronze_nft_uri = bronze_uri;
    config.silver_nft_uri = silver_uri;
    config.gold_nft_uri = gold_uri;

    msg!("Created Bronze Collection: {}", config.bronze_collection);
    msg!("Created Silver Collection: {}", config.silver_collection);
    msg!("Created Gold Collection: {}", config.gold_collection);

    Ok(())
}
