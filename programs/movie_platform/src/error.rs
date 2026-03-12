use anchor_lang::error_code;

#[error_code]
pub enum PlatformError {
    #[msg("Invalid tier, must be 0, 1 or 2")]
    InvalidTier,

    #[msg("Insufficient SOL balance")]
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

    #[msg("Unauthorized: Only authority can perform this action")]
    Unauthorized,

    #[msg("Unauthorized: Only token mint authority can mint tokens")]
    UnauthorizedMintAuthority,

    #[msg("Invalid timestamp: cannot be negative")]
    InvalidTimestamp,

    #[msg("Overflow value!")]
    EditOverflow,

    #[msg("Invalid account data or PDA")]
    InvalidAccount,

    #[msg("Invalid treasury account")]
    InvalidTreasury,

    #[msg("Invalid treasury owner")]
    InvalidTreasuryOwner,

    #[msg("Invalid token mint")]
    InvalidTokenMint,

    #[msg("Invalid token owner")]
    InvalidTokenOwner,

    #[msg("Invalid treasury ATA")]
    InvalidTreasuryATA,

    #[msg("Insufficient token balance")]
    InsufficientTokenBalance,
}
