use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub bronze_collection: Pubkey,
    pub silver_collection: Pubkey,
    pub gold_collection: Pubkey,
    pub treasury: Pubkey,
    pub bronze_price: u64,
    pub silver_price: u64,
    pub gold_price: u64,
    #[max_len(256)]
    pub bronze_nft_uri: String,
    #[max_len(256)]
    pub silver_nft_uri: String,
    #[max_len(256)]
    pub gold_nft_uri: String,
    pub bronze_next_edition: u64,
    pub silver_next_edition: u64,
    pub gold_next_edition: u64,
    pub mint_open_timestamp: i64,
    pub first_edition_timestamp: i64,
    pub bump: u8,
}
