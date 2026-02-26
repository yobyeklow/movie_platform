use anchor_lang::prelude::*;

declare_id!("AUDCmmdnbhWP9eaz3WFXVcLLkTQ7vLx7knj9xB2zQmU");
mod error;
mod instructions;
mod state;

use error::*;
use instructions::*;

#[program]
pub mod movie_platform {
    use super::*;

    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        bronze_price: u64,
        silver_price: u64,
        gold_price: u64,
    ) -> Result<()> {
        initialize_platform::handler(ctx, bronze_price, silver_price, gold_price)
    }

    pub fn initialize_nft_collections(
        ctx: Context<InitializeNftCollections>,
        bronze_uri: String,
        silver_uri: String,
        gold_uri: String,
    ) -> Result<()> {
        initialize_nft_collections::handler(ctx, bronze_uri, silver_uri, gold_uri)
    }

    pub fn open_mint(ctx: Context<OpenMint>, mint_open_timestamp: i64) -> Result<()> {
        open_mint::handler(ctx, mint_open_timestamp)
    }

    pub fn mint_pass(ctx: Context<MintPass>, tier: u8) -> Result<()> {
        mint_pass::handler(ctx, tier)
    }
}
