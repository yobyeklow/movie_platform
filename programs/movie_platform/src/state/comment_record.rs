use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct CommentRecord {
    pub authority: Pubkey,
    pub movie_id: [u8; 32],
    #[max_len(400)]
    pub content: String,
    pub created_at: i64,
    pub bump: u8,
}
