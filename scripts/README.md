# Movie Platform Admin Scripts

This directory contains admin scripts for initializing and managing the Movie Platform soulbound NFT system.

## Overview

The scripts are designed to be run sequentially for platform setup, or individually for specific operations.

## Quick Start

### Complete Platform Setup (Recommended)

```bash
npm run admin:setup
```

This runs all setup steps:
1. Initialize custom token mint
2. Initialize platform with token + prices
3. Create NFT collections (Bronze, Silver, Gold)
4. Open mint window (now)

## Individual Scripts

### 1. Initialize Custom Token Mint

Creates a custom SPL token for NFT payments and mints initial supply to admin wallet.

```bash
npm run admin:init:token
```

**Output:** Creates `token_config.json` with:
- Token mint address (PDA)
- Treasury address
- Treasury ATA address

**Details:**
- Token decimals: 6
- Initial supply: 1,000,000,000 (1 billion base units = 1 million tokens)
- Admin gets full supply
- Token mint PDA: `"token-mint"` + program ID

---

### 2. Initialize Platform

Initializes the platform configuration with token mint and tier prices.

```bash
npm run admin:init:platform
```

**Custom prices:**
```bash
npm run admin:init:platform -- --bronze 1000000 --silver 2500000 --gold 5000000
```

**Default prices (in base units, 6 decimals):**
- Bronze: 1,000,000 (1 token)
- Silver: 2,500,000 (2.5 tokens)
- Gold: 5,000,000 (5 tokens)

**Output:** Updates platform config with:
- Token mint address
- Treasury address
- Tier prices
- Authority (admin)

**Prerequisites:** Must run `admin:init:token` first

---

### 3. Create NFT Collections

Creates 3 collections (Bronze, Silver, Gold) using separate collection instructions.

```bash
npm run admin:init:collections
```

**Each collection includes:**
- Collection account (MPL Core)
- Royalties plugin (Platform = 100% creator, 10000 basis points)
- Collection URI (from `/nfts_json/collection_uri.json`)

**Output:** Creates `collection_address.json` with collection addresses

**Prerequisites:** Must run `admin:init:platform` first

---

### 4. Open Mint Window

Opens the mint window at a specified timestamp. Users can only mint after this timestamp.

```bash
npm run admin:open-mint              # Open now
npm run admin:open-mint -- now        # Open now (explicit)
npm run admin:open-mint -- "3/11/2026 10:30"     # Open at specific time
npm run admin:open-mint -- "3/11/2026 10:30PM"   # With AM/PM
```

**Timestamp format:** `M/D/YYYY H:MM` or `M/D/YYYY H:MMAM`

**Examples:**
- `3/11/2026 10:30` - 10:30 AM UTC
- `3/11/2026 10:30PM` - 10:30 PM UTC
- `3/11/2026 22:30` - 10:30 PM UTC

**Prerequisites:** Must run `admin:init:collections` first

---

### 5. Mint Tokens to Users

Mints custom tokens to a specified wallet address. Admin must have enough tokens.

```bash
npm run admin:mint-tokens -- <WALLET_ADDRESS>
npm run admin:mint-tokens -- <WALLET_ADDRESS> <AMOUNT>
```

**Examples:**
```bash
npm run admin:mint-tokens -- 5sH3h1... 1000000  # Mint 1M = 1 token
npm run admin:mint-tokens -- 5sH3h1... 5000000  # Mint 5M = 5 tokens
```

**Details:**
- Creates recipient's ATA if it doesn't exist
- Checks admin balance before minting
- Amount in base units (6 decimals)

**Prerequisites:** Must run `admin:init:token` first

---

### 6. Allow Transfer (Unfreeze NFT)

Removes the FreezeDelegate plugin from an NFT, making it transferable.

```bash
npm run admin:allow-transfer -- <ASSET_ADDRESS>
npm run admin:allow-transfer -- <ASSET_ADDRESS> <COLLECTION_ADDRESS>
```

**Examples:**
```bash
npm run admin:allow-transfer -- 5sH3h1...
npm run admin:allow-transfer -- 5sH3h1... 7xK9y2...
```

**Details:**
- Only platform authority can call this
- Removes FreezeDelegate plugin
- NFT becomes fully transferable
- Royalties plugin remains (platform gets 100% royalties)
- If collection not provided, auto-detects from config

**What happens after unfreeze:**
- ✅ Owner can transfer NFT to another wallet
- ✅ Owner can sell NFT on marketplaces
- ✅ Owner can gift NFT to others
- ✅ Platform receives 100% royalties on secondary sales

**Prerequisites:** Platform must be initialized

---

## Workflow

### First-Time Setup

```bash
# 1. Start local validator
npm run local:start

# 2. Run complete setup
npm run admin:setup

# 3. Mint tokens to users
npm run admin:mint-tokens -- <WALLET_ADDRESS> 1000000

# 4. Users can now mint NFTs from frontend
```

### Step-by-Step Setup

```bash
# Step 1: Initialize token
npm run admin:init:token

# Step 2: Initialize platform
npm run admin:init:platform

# Step 3: Create collections
npm run admin:init:collections

# Step 4: Open mint
npm run admin:open-mint

# Step 5: Mint tokens to users
npm run admin:mint-tokens -- <WALLET_ADDRESS> 1000000
```

### Unfreeze NFT

```bash
# Unfreeze specific NFT
npm run admin:allow-transfer -- <ASSET_ADDRESS>
```

---

## Configuration Files

### `scripts/authority-keypair.json`

Contains admin and collection keypairs:

```json
{
  "AdminKey": "...",
  "TreasuryKey": "...",
  "BronzeCollectionKey": "...",
  "SilverCollectionKey": "...",
  "GoldCollectionKey": "..."
}
```

### `token_config.json`

Created by `admin:init:token`:

```json
{
  "tokenMint": "...",
  "treasury": "...",
  "treasuryATA": "..."
}
```

### `collection_address.json`

Created by `admin:init:collections`:

```json
{
  "BronzeCollectionAddress": "...",
  "SilverCollectionAddress": "...",
  "GoldCollectionAddress": "..."
}
```

### `nfts_json/collection_uri.json`

Collection metadata URIs (IPFS):

```json
{
  "bronze_uri": "ipfs://...",
  "silver_uri": "ipfs://...",
  "gold_uri": "ipfs://..."
}
```

---

## Smart Contract Instructions Used

| Script | Instruction | Description |
|--------|-------------|-------------|
| `01-init-token.ts` | `initializeToken` | Create custom token mint |
| `02-init-platform.ts` | `initializePlatform` | Init platform with token + prices |
| `03-create-collections.ts` | `createBronzeCollection` | Create Bronze collection |
| `03-create-collections.ts` | `createSilverCollection` | Create Silver collection |
| `03-create-collections.ts` | `createGoldCollection` | Create Gold collection |
| `04-open-mint.ts` | `openMint` | Open mint window |
| `05-mint-tokens.ts` | SPL Token `mintTo` | Mint tokens to users |
| `06-allow-transfer.ts` | `allowTransfer` | Remove FreezeDelegate (unfreeze NFT) |

---

## Soulbound NFT Behavior

### Default State (Soulbound)
| Action | Allowed? |
|---------|----------|
| Mint from platform | ✅ YES |
| Use platform services | ✅ YES |
| Burn own NFT | ✅ YES (anytime) |
| Transfer to other wallet | ❌ NO |
| Sell on marketplace | ❌ NO |
| Gift to friend | ❌ NO |

### After `allow-transfer` (Transferable)
| Action | Allowed? |
|---------|----------|
| Mint from platform | ✅ YES |
| Use platform services | ✅ YES |
| Burn own NFT | ✅ YES |
| Transfer to other wallet | ✅ YES |
| Sell on marketplace | ✅ YES |
| Gift to friend | ✅ YES |
| Platform gets 100% royalties | ✅ YES |

---

## Frontend Integration

The following features are integrated in the frontend:

| Feature | Integration |
|---------|-------------|
| Mint NFT | ✅ Frontend API routes |
| Burn NFT | ✅ Frontend API routes |
| Verify Pass | ✅ Frontend API routes |
| List Passes | ✅ Frontend API routes |
| Allow Transfer | ✅ Admin panel (planned) |

---

## Troubleshooting

### Error: "Keypair file not found"

**Solution:** Ensure `NEXT_KEYPAIR` is set in `.env`:
```bash
NEXT_KEYPAIR=scripts/authority-keypair.json
```

### Error: "Token config not found"

**Solution:** Run `npm run admin:init:token` first.

### Error: "Platform config not initialized"

**Solution:** Run `npm run admin:init:platform` first.

### Error: "Insufficient admin token balance"

**Solution:** Admin must have enough tokens. Check initial supply from `admin:init:token`.

### Error: "You are not the platform authority"

**Solution:** Ensure you're using the correct admin keypair from `authority-keypair.json`.

### Error: "Asset account does not exist"

**Solution:** Check the asset address. Ensure it's a valid NFT asset address.

---

## Help Commands

Each script has built-in help:

```bash
npm run admin:init:token -- --help
npm run admin:init:platform -- --help
npm run admin:init:collections -- --help
npm run admin:open-mint -- --help
npm run admin:mint-tokens -- --help
npm run admin:allow-transfer -- --help
```

---

## Notes

- All scripts use the `NEXT_PUBLIC_RPC_URL` from `.env` (default: `http://localhost:8899`)
- Admin keypairs are loaded from `scripts/authority-keypair.json`
- Collection URIs are loaded from `nfts_json/collection_uri.json`
- Token has 6 decimals (similar to USDC)
- Default prices can be overridden with command-line arguments
- All transactions require confirmation

---

## Security

- **Authority Protection:** Only admin keypair can call `admin:*` scripts
- **Treasury:** Treasury is a real keypair (can own ATAs)
- **Plugin Authority:** All plugins use platform as authority
- **Royalties:** Platform receives 100% royalties on secondary sales

---

## Future Enhancements

Potential admin scripts for future:

- `admin:freeze-nft` - Re-apply FreezeDelegate to NFT
- `admin:set-prices` - Update tier prices
- `admin:close-mint` - Close mint window temporarily
- `admin:update-uri` - Update collection URIs
- `admin:verify-pass` - Check user's pass tier (CLI version)

---

**For questions or issues, please refer to the smart contract documentation or check the logs.**
