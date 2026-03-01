use anchor_lang::error_code;

#[error_code]
pub enum PlatformError {
    #[msg("Invalid tier, must be 0, 1 or 2")]
    InvalidTier,

    #[msg("Insufficient USDC balance")]
    InsufficientFunds,

    #[msg("Rating score must be between 1 and 5")]
    InvalidScore,

    #[msg("Invalid Collection")]
    InvalidCollection,

    #[msg("Pass already active, cannot re-mint")]
    PassAlreadyActive,

    #[msg("Member pass has expired!")]
    PassExpired,

    #[msg("Member Pass not found - user needs to mint")]
    PassNotFound,

    #[msg("Tier too low, Silver or Gold required")]
    TierTooLow,

    #[msg("Comment content exceeds 500 characters")]
    ContentTooLong,

    #[msg("The minting is not open yet")]
    MintingNotOpen,

    #[msg("Unauthorized: Only authority can perferm this action")]
    Unauthorized,

    #[msg("Overflow value!")]
    EditOverflow,
}
