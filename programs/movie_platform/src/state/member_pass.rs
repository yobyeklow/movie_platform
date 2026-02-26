use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct MemberPass {
    pub owner: Pubkey,
    pub tier: u8,
    pub minted_at: i64,
    pub expires_at: i64,
    pub nft_edition: u64,
    pub nft_asset: Pubkey,
    pub bump: u8,
}
