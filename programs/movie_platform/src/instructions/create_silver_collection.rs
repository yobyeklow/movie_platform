use crate::state::PlatformConfig;
use anchor_lang::prelude::*;
use mpl_core::instructions::CreateCollectionV1CpiBuilder;
use mpl_core::types::{Creator, Plugin, PluginAuthorityPair, Royalties, RuleSet};

#[derive(Accounts)]
pub struct CreateSilverCollection<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub silver_collection: Signer<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: MPL Core program ID is validated by address constraint
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<CreateSilverCollection>, silver_uri: String) -> Result<()> {
    let authority = ctx.accounts.platform_config.authority;
    let gold_collection_key = ctx.accounts.silver_collection.key();

    let royalties_plugin = PluginAuthorityPair {
        plugin: Plugin::Royalties(Royalties {
            basis_points: 10000,
            creators: vec![Creator {
                address: authority,
                percentage: 100,
            }],
            rule_set: RuleSet::None,
        }),
        authority: None,
    };
    CreateCollectionV1CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
        .collection(&ctx.accounts.silver_collection.to_account_info())
        .payer(&ctx.accounts.authority.to_account_info())
        .update_authority(Some(&ctx.accounts.authority.to_account_info()))
        .name("Movie Silver Pass".to_string())
        .plugins(vec![royalties_plugin])
        .uri(silver_uri.clone())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .invoke()?;

    // Update platform config
    let config = &mut ctx.accounts.platform_config;
    config.silver_collection = gold_collection_key;
    config.silver_nft_uri = silver_uri.clone();

    msg!("Created Silver Collection: {}", config.silver_collection);
    msg!("  Creator: {} (100% royalty)", config.authority);
    msg!("  URI: {}", silver_uri);

    Ok(())
}
