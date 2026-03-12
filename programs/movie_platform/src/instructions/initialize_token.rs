use {
    crate::state::PlatformConfig,
    anchor_lang::prelude::*,
    anchor_spl::{
        metadata::{
            create_metadata_accounts_v3, mpl_token_metadata::types::DataV2,
            CreateMetadataAccountsV3, Metadata,
        },
        token::Token,
    },
};

#[derive(Accounts)]
#[instruction(decimals: u8)]
pub struct InitializeToken<'info> {
    /// Authority that can mint and freeze the token
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Platform configuration - must be initialized first
    #[account(
        mut,
        seeds = [b"platform-config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    /// Token mint PDA - created from "token-mint" seed
    #[account(
        init,
        payer = authority,
        mint::decimals = decimals,
        mint::authority = authority,
        mint::freeze_authority = authority,
        seeds = [b"token-mint"],
        bump
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    /// Token metadata PDA
    /// CHECK: Account is validated by seeds and the token_metadata_program
    #[account(
        mut,
        seeds = [
            b"metadata",
            token_metadata_program.key().as_ref(),
            token_mint.key().as_ref(),
        ],
        bump,
        seeds::program = token_metadata_program.key(),
    )]
    pub metadata_account: UncheckedAccount<'info>,

    /// Token metadata program
    pub token_metadata_program: Program<'info, Metadata>,

    /// SPL Token program
    pub token_program: Program<'info, Token>,

    /// System program
    pub system_program: Program<'info, System>,

    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<InitializeToken>,
    decimals: u8,
    _initial_supply: u64,
) -> Result<()> {
    let authority = &ctx.accounts.authority;
    let token_mint = &ctx.accounts.token_mint;

    msg!("Initializing fake USDC token mint...");
    msg!("Token mint: {}", token_mint.key());
    msg!("Decimals: {}", decimals);

    // Create token metadata for fake USDC
    msg!("Creating token metadata...");

    create_metadata_accounts_v3(
        CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata_account.to_account_info(),
                mint: token_mint.to_account_info(),
                mint_authority: authority.to_account_info(),
                update_authority: authority.to_account_info(),
                payer: authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        ),
        DataV2 {
            name: "Fake USDC".to_string(),
            symbol: "fUSDC".to_string(),
            uri: "https://example.com/fake-usdc-metadata.json".to_string(),
            seller_fee_basis_points: 0,
            creators: None,
            collection: None,
            uses: None,
        },
        false, // is_mutable
        true,  // update_authority_is_signer
        None,  // collection_details
    )?;

    msg!("Token metadata created successfully");

    // Update platform config with the token mint address
    let config = &mut ctx.accounts.platform_config;
    config.token_mint = token_mint.key();

    msg!(
        "Platform config updated with token mint: {}",
        token_mint.key()
    );
    msg!("Fake USDC token initialized successfully!");
    msg!("Note: No initial supply minted - tokens will be minted on-demand via admin or mint_pass instruction");

    Ok(())
}
