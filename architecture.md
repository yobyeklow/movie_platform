# 🎬 Movie Platform — Data Architecture & Workflow

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                               │
│                       (Next.js Frontend)                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
             ┌───────────────▼───────────────┐
             │        Wallet Connect          │  (Phantom / Solflare)
             │        Sign Message            │
             └───────────────┬───────────────┘
                             │
            ┌────────────────▼────────────────┐
            │        Node.js Backend           │  (Express API)
            │   - Verify wallet signature      │
            │   - Check NFT + tier via RPC     │
            │   - Check expiry                 │
            │   - Issue JWT access token       │
            │   - Sync on-chain data to DB     │
            └───┬──────────────┬──────────────┘
                │              │
   ┌────────────▼───┐   ┌──────▼──────────────────────────────┐
   │   MongoDB      │   │            Solana                    │
   │  - users       │   │  - MemberPass PDA     (auth)         │
   │  - movies      │◄──│  - CommentRecord PDA  (comments)     │
   │  - comments *  │   │  - RatingRecord PDA   (ratings)      │
   │  - ratings *   │   └──────────────────────────────────────┘
   └────────┬───────┘
   * MongoDB is a fast read-cache.
     Solana on-chain is the source of truth.
            │
   ┌────────▼───────┐
   │      Mux       │  (Video Streaming)
   └────────────────┘
```

---

## 2. Tiered NFT Membership

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEMBERSHIP TIERS                             │
├──────────────────┬──────────────────────┬───────────────────────────┤
│  🥉 BRONZE        │  🥈 SILVER            │  🥇 GOLD                  │
│  Price: $3 USDC  │  Price: $5 USDC      │  Price: $10 USDC          │
│  Expire: 30 days │  Expire: 30 days     │  Expire: 30 days          │
├──────────────────┼──────────────────────┼───────────────────────────┤
│  ✅ Watch movies  │  ✅ Watch movies      │  ✅ Watch movies           │
│  ❌ Comment       │  ✅ Comment           │  ✅ Comment                │
│  ❌ Rating        │  ✅ Rating            │  ✅ Rating                 │
│                  │                      │  ✅ Early access           │
│                  │                      │     to new movies         │
└──────────────────┴──────────────────────┴───────────────────────────┘

Each tier = a separate Candy Machine on Solana (Metaplex)
Tier stored in NFT metadata attribute: { "trait_type": "tier", "value": "gold" }
```

---

## 3. MongoDB Data Models

```
┌─────────────────────────────────────────────────────────────────────┐
│  Collection: users                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    walletAddress : "7xK...abc"   (unique, primary key)              │
│    nftMintAddress: "9mP...xyz"                                      │
│    tier          : "bronze" | "silver" | "gold"                     │
│    mintedAt      : ISODate("2024-01-01T00:00:00Z")                  │
│    expiresAt     : ISODate("2024-02-01T00:00:00Z")                  │
│    createdAt     : ISODate(...)                                     │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Collection: movies                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    _id          : ObjectId                                          │
│    title        : "Metropolis"                                      │
│    description  : "A sci-fi classic..."                             │
│    genre        : ["sci-fi", "classic"]                             │
│    streamUrl    : "https://stream.mux.com/abc123.m3u8"              │
│    thumbnailUrl : "https://..."                                     │
│    duration     : 5400   (seconds)                                  │
│    releaseYear  : 1927                                              │
│    minTier      : "bronze" | "silver" | "gold"  ← access control   │
│    isNewRelease : true | false    ← gold-only early access flag     │
│    uploadedAt   : ISODate(...)                                      │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Collection: comments   (read-cache, synced from Solana)            │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    _id           : ObjectId                                         │
│    movieId       : ObjectId  → ref: movies                          │
│    walletAddress : "7xK...abc"                                      │
│    content       : "This movie is amazing!"                         │
│    txSignature   : "5hG...zzz"  ← Solana tx proof                  │
│    onChainPda    : "3rT...xyz"  ← CommentRecord PDA address         │
│    createdAt     : ISODate(...)                                     │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Collection: ratings   (read-cache, synced from Solana)             │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    _id           : ObjectId                                         │
│    movieId       : ObjectId  → ref: movies                          │
│    walletAddress : "7xK...abc"                                      │
│    score         : 1 | 2 | 3 | 4 | 5                               │
│    txSignature   : "9kP...aaa"  ← Solana tx proof                  │
│    onChainPda    : "7mQ...def"  ← RatingRecord PDA address          │
│    createdAt     : ISODate(...)                                     │
│  }                                                                  │
│  * Compound unique index: { movieId, walletAddress }               │
│    → one rating per user per movie                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Full User Workflow

### 4a. Minting Flow (First Time)

```
User visits site
      │
      ▼
Connect Wallet (Phantom)
      │
      ▼
Choose Tier: Bronze / Silver / Gold
      │
      ▼
Pay USDC via Candy Machine (Solana)
      │
      ▼
NFT minted to wallet
  - metadata includes: tier, mintedAt
      │
      ▼
Backend saves user to MongoDB
  { walletAddress, nftMintAddress, tier, mintedAt, expiresAt }
      │
      ▼
Redirect to Home Page ✅
```

---

### 4b. Login Flow (Returning User)

```
User visits site
      │
      ▼
Connect Wallet
      │
      ▼
Backend: Sign a message to prove wallet ownership
  "Sign to login to CineChain — nonce: 8f3k2"
      │
      ▼
Backend verifies signature
      │
      ├── ❌ Invalid signature → Reject
      │
      └── ✅ Valid
            │
            ▼
      Check MongoDB: does wallet exist?
            │
            ├── ❌ No NFT found → Redirect to Mint page
            │
            └── ✅ Found
                  │
                  ▼
            Check expiresAt vs today
                  │
                  ├── ❌ Expired → Show "Renew Pass" page
                  │
                  └── ✅ Active
                        │
                        ▼
                  Issue JWT token { walletAddress, tier, expiresAt }
                        │
                        ▼
                  Redirect to Home Page ✅
```

---

### 4c. Watch Movie Flow

```
User clicks a movie
      │
      ▼
Frontend sends request to backend
  GET /api/movies/:id
  Header: Authorization: Bearer <JWT>
      │
      ▼
Backend verifies JWT
      │
      ▼
Check movie.minTier vs user.tier

  Tier hierarchy: bronze < silver < gold

  e.g. movie.minTier = "silver"
       user.tier     = "bronze"  → ❌ Blocked, show "Upgrade" prompt
       user.tier     = "silver"  → ✅ Allow
       user.tier     = "gold"    → ✅ Allow
      │
      ▼
Check movie.isNewRelease
  isNewRelease = true AND user.tier != "gold" → ❌ Blocked
      │
      ▼
Return streamUrl to frontend
      │
      ▼
Video.js / Plyr plays the HLS stream 🎬
```

---

### 4d. Comment & Rating Flow (Hybrid — On-Chain + MongoDB)

```
User submits comment or rating
      │
      ▼
Frontend checks JWT tier:
  Bronze → ❌ Blocked, show "Upgrade" prompt
  Silver → ✅
  Gold   → ✅
      │
      ▼
Frontend sends Solana transaction
  instruction: post_comment  OR  submit_rating
  (signed by user wallet)
      │
      ▼
Solana confirms transaction ✅
Returns: txSignature + PDA address
      │
      ▼
Frontend sends to Backend:
  POST /api/movies/:id/comment
  { content, txSignature, onChainPda }
  Header: Authorization: Bearer <JWT>
      │
      ▼
Backend verifies txSignature on Solana RPC
  - Confirms tx is real and not spoofed
      │
      ▼
Backend saves to MongoDB (fast read-cache):
  { movieId, walletAddress, content,
    txSignature, onChainPda, createdAt }
      │
      ▼
Return updated comments / average rating
  with "✅ Verified on-chain" badge data ✅
```

---

### 4e. Renewal Flow

```
User's pass is expired
      │
      ▼
Show "Your pass expired" page
      │
      ▼
User chooses tier to renew (can upgrade/downgrade)
      │
      ▼
Mint new NFT via Candy Machine
      │
      ▼
Backend updates MongoDB user record:
  nftMintAddress = new mint
  tier           = new tier
  mintedAt       = now
  expiresAt      = now + 30 days
      │
      ▼
Issue new JWT → back to Home Page ✅
```

---

## 5. Anchor Program (On-Chain)

### Program Accounts

```
┌─────────────────────────────────────────────────────────────────────┐
│  Account: PlatformConfig  (one global, owned by admin)             │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    admin        : Pubkey   ← deployer wallet                        │
│    bronze_price : u64      ← in USDC lamports (3_000_000 = $3)      │
│    silver_price : u64      ← 5_000_000 = $5                        │
│    gold_price   : u64      ← 10_000_000 = $10                      │
│    treasury     : Pubkey   ← wallet that receives payments          │
│    bump         : u8                                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Account: MemberPass  (one per user wallet, PDA)                   │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    owner        : Pubkey   ← user wallet                            │
│    tier         : u8       ← 0=Bronze, 1=Silver, 2=Gold             │
│    minted_at    : i64      ← Unix timestamp                         │
│    expires_at   : i64      ← Unix timestamp (minted_at + 30 days)  │
│    nft_mint     : Pubkey   ← associated Metaplex NFT mint           │
│    bump         : u8                                                │
│  }                                                                  │
│                                                                     │
│  PDA seeds: ["member_pass", owner.key()]                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Account: CommentRecord  (one per comment, PDA)                    │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    author       : Pubkey   ← user wallet                            │
│    movie_id     : [u8; 32] ← movie identifier (hashed MongoDB _id) │
│    content      : String   ← max 500 chars                          │
│    created_at   : i64      ← Unix timestamp                         │
│    bump         : u8                                                │
│  }                                                                  │
│                                                                     │
│  PDA seeds: ["comment", author.key(), movie_id, created_at]         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Account: RatingRecord  (one per user per movie, PDA)              │
├─────────────────────────────────────────────────────────────────────┤
│  {                                                                  │
│    author       : Pubkey   ← user wallet                            │
│    movie_id     : [u8; 32] ← movie identifier                       │
│    score        : u8       ← 1 to 5                                 │
│    created_at   : i64      ← Unix timestamp                         │
│    bump         : u8                                                │
│  }                                                                  │
│                                                                     │
│  PDA seeds: ["rating", author.key(), movie_id]                      │
│  * One account per user per movie — re-submitting overwrites score  │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Program Instructions

```
┌─────────────────────────────────────────────────────────────────────┐
│  instruction: initialize_platform                                   │
├─────────────────────────────────────────────────────────────────────┤
│  Signer  : admin                                                    │
│  Accounts: PlatformConfig (init)                                    │
│  Args    : bronze_price, silver_price, gold_price, treasury         │
│  Action  : Creates the global config account                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  instruction: mint_pass                                             │
├─────────────────────────────────────────────────────────────────────┤
│  Signer  : user                                                     │
│  Accounts: PlatformConfig, MemberPass (init), user USDC ATA,        │
│            treasury USDC ATA, nft_mint, token_program,              │
│            associated_token_program, system_program                 │
│  Args    : tier (u8)                                                │
│  Action  :                                                          │
│    1. Transfer USDC from user → treasury (based on tier price)      │
│    2. Mint 1 NFT to user via Metaplex CPI                           │
│    3. Init MemberPass PDA with tier + timestamps                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  instruction: renew_pass                                            │
├─────────────────────────────────────────────────────────────────────┤
│  Signer  : user                                                     │
│  Accounts: PlatformConfig, MemberPass (mut), user USDC ATA,         │
│            treasury USDC ATA, token_program                         │
│  Args    : new_tier (u8)                                            │
│  Action  :                                                          │
│    1. Transfer USDC from user → treasury (new tier price)           │
│    2. Update MemberPass: tier, minted_at, expires_at                │
│    3. Mint new NFT for new tier (optional: burn old one)            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  instruction: verify_pass  (called by your backend)                 │
├─────────────────────────────────────────────────────────────────────┤
│  Signer  : user                                                     │
│  Accounts: MemberPass (read only)                                   │
│  Action  :                                                          │
│    1. Check MemberPass.owner == signer                              │
│    2. Check Clock::get().unix_timestamp < expires_at                │
│    3. Return tier if valid, error if expired                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  instruction: post_comment                                          │
├─────────────────────────────────────────────────────────────────────┤
│  Signer  : user                                                     │
│  Accounts: MemberPass (read), CommentRecord (init),                 │
│            system_program                                           │
│  Args    : movie_id ([u8;32]), content (String)                     │
│  Action  :                                                          │
│    1. Check MemberPass.tier >= Silver (tier >= 1)                   │
│    2. Check MemberPass.expires_at > now                             │
│    3. Validate content length <= 500 chars                          │
│    4. Init CommentRecord PDA with content + timestamp               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  instruction: submit_rating                                         │
├─────────────────────────────────────────────────────────────────────┤
│  Signer  : user                                                     │
│  Accounts: MemberPass (read), RatingRecord (init_if_needed / mut),  │
│            system_program                                           │
│  Args    : movie_id ([u8;32]), score (u8)                           │
│  Action  :                                                          │
│    1. Check MemberPass.tier >= Silver (tier >= 1)                   │
│    2. Check MemberPass.expires_at > now                             │
│    3. Validate score is between 1 and 5                             │
│    4. Init or overwrite RatingRecord PDA                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Anchor Program — Folder Structure

```
programs/
└── movie-platform/
    └── src/
        ├── lib.rs                  ← program entry, declare_id!
        ├── instructions/
        │   ├── mod.rs
        │   ├── initialize_platform.rs
        │   ├── mint_pass.rs
        │   ├── renew_pass.rs
        │   ├── verify_pass.rs
        │   ├── post_comment.rs     ← NEW
        │   └── submit_rating.rs    ← NEW
        ├── state/
        │   ├── mod.rs
        │   ├── platform_config.rs
        │   ├── member_pass.rs
        │   ├── comment_record.rs   ← NEW
        │   └── rating_record.rs    ← NEW
        └── errors.rs
```

---

### Custom Errors

```rust
#[error_code]
pub enum PlatformError {
    #[msg("Member pass has expired")]
    PassExpired,

    #[msg("Invalid tier, must be 0, 1 or 2")]
    InvalidTier,

    #[msg("Insufficient USDC balance")]
    InsufficientFunds,

    #[msg("Pass already active, cannot re-mint")]
    PassAlreadyActive,

    #[msg("Tier too low, Silver or Gold required")]
    TierTooLow,

    #[msg("Comment content exceeds 500 characters")]
    ContentTooLong,

    #[msg("Rating score must be between 1 and 5")]
    InvalidScore,
}
```

---

### How Backend Talks to Anchor

```
User signs login message
        │
        ▼
Backend receives: { walletAddress, signature }
        │
        ▼
Backend fetches MemberPass PDA from Solana RPC
  seeds: ["member_pass", walletAddress]
        │
        ▼
Deserialize MemberPass account with Anchor IDL
        │
        ├── Account not found     → No pass, redirect to mint
        ├── expires_at < now      → Expired, redirect to renew
        └── Valid ✅
              │
              ▼
        Read tier from account (0/1/2 → bronze/silver/gold)
              │
              ▼
        Issue JWT { walletAddress, tier, expiresAt }
              │
              ▼
        Sync to MongoDB (upsert user record)
```

---

### Hybrid Sync — On-Chain to MongoDB

```
User submits comment/rating on frontend
        │
        ▼
Frontend sends tx to Solana (post_comment / submit_rating)
  Anchor validates: tier >= Silver, pass not expired
        │
        ▼
Solana confirms tx ✅
Returns: { txSignature, commentPda / ratingPda }
        │
        ▼
Frontend calls backend: POST /api/movies/:id/comment
  Body: { content, txSignature, onChainPda }
        │
        ▼
Backend verifies txSignature via Solana RPC
  getTransaction(txSignature) → confirm it's real
        │
        ├── ❌ Tx not found or mismatch → Reject (403)
        │
        └── ✅ Verified
              │
              ▼
        Save to MongoDB as read-cache
        { movieId, walletAddress, content,
          txSignature, onChainPda, createdAt }
              │
              ▼
        Frontend displays comment with
        🔗 "Verified on-chain" link → Solana Explorer ✅
```

---

## 6. API Endpoints Summary

```
AUTH
  POST  /api/auth/verify             → verify wallet signature, return JWT

MOVIES
  GET   /api/movies                  → list all accessible movies (filtered by tier)
  GET   /api/movies/:id              → get movie detail + stream URL
  GET   /api/movies/:id/comments     → get comments from MongoDB (fast read)
  GET   /api/movies/:id/rating       → get average rating from MongoDB (fast read)

INTERACTIONS  (Silver + Gold only)
  POST  /api/movies/:id/comment      → verify txSignature, sync comment to MongoDB
  POST  /api/movies/:id/rating       → verify txSignature, sync rating to MongoDB

USER
  GET   /api/user/me                 → get current user profile + tier
  POST  /api/user/mint               → register new NFT after minting
  PUT   /api/user/renew              → update NFT after renewal
```

---

## 7. Tech Stack Summary

```
┌─────────────────────┬────────────────────────────────────────────┐
│ Layer               │ Technology                                 │
├─────────────────────┼────────────────────────────────────────────┤
│ Smart Contract      │ Anchor Framework (Rust)                    │
│ Blockchain          │ Solana (Devnet → Mainnet)                  │
│ NFT Standard        │ Metaplex (CPI from Anchor)                 │
│ NFT Payment         │ USDC (SPL Token)                           │
│ Frontend            │ Next.js + Tailwind CSS                     │
│ Wallet              │ Solana Wallet Adapter (Phantom)            │
│ Contract Client     │ Anchor IDL + @coral-xyz/anchor             │
│ Backend             │ Node.js + Express                          │
│ Auth                │ Wallet Signature + JWT                     │
│ Database            │ MongoDB + Mongoose                         │
│ Video Hosting       │ Mux (free tier)                            │
│ Video Player        │ Video.js or Plyr                           │
│ Movie Source        │ archive.org (public domain films)          │
└─────────────────────┴────────────────────────────────────────────┘
```