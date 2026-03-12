use crate::state::PlatformConfig;
use anchor_lang::prelude::*;
use mpl_core::instructions::CreateCollectionV1CpiBuilder;
use mpl_core::types::{Creator, Plugin, PluginAuthorityPair, Royalties, RuleSet};

#[derive(Accounts)]
pub struct CreateBronzeCollection<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(mut)]
    pub bronze_collection: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: MPL Core program ID is validated by address constraint
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<CreateBronzeCollection>, bronze_uri: String) -> Result<()> {
    let authority = ctx.accounts.platform_config.authority;
    let bronze_collection_key = ctx.accounts.bronze_collection.key();

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
        .collection(&ctx.accounts.bronze_collection.to_account_info())
        .update_authority(Some(&ctx.accounts.platform_config.to_account_info()))
        .payer(&ctx.accounts.authority.to_account_info())
        .system_program(&ctx.accounts.system_program.to_account_info())
        .name("Movie Bronze Pass".to_string())
        .uri(bronze_uri.clone())
        .plugins(vec![royalties_plugin])
        .invoke()?;

    let config = &mut ctx.accounts.platform_config;
    config.bronze_collection = bronze_collection_key;
    config.bronze_nft_uri = bronze_uri.clone();

    msg!("Created Bronze Collection: {}", config.bronze_collection);
    msg!("  Update Authority: {} (platform_config PDA)", config.key());
    msg!("  URI: {}", bronze_uri);

    Ok(())
}
