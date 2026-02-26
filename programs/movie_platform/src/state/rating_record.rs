use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct RatingRecord {
    pub owner: Pubkey,
    pub score: u8,
    pub movie_id: [u8; 32],
    pub created_at: i64,
    pub bump: u8,
}
