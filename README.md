# 🎬 Movie Platform

A decentralized movie streaming platform built on Solana blockchain with tiered NFT-based membership subscriptions.

![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=Solana&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-2563EB?style=for-the-badge)

## 📖 Overview

Movie Platform is a Web3-powered streaming service that uses Solana NFTs as membership passes. Users purchase tiered passes (Bronze, Silver, Gold) to access movies with varying levels of features including commenting, rating, and early access.

### 🌟 Key Features

- **Tiered NFT Memberships**: Bronze, Silver, and Gold passes with different access levels
- **Soulbound NFTs**: Passes are initially non-transferable (soulbound) for security
- **Custom Token Economy**: Platform uses its own SPL token for payments
- **On-Chain Verification**: All pass verification happens on Solana blockchain
- **Web3 Integration**: Phantom wallet integration for seamless crypto payments
- **TMDB Integration**: Rich movie data from The Movie Database API
- **Responsive Design**: Beautiful UI built with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  - Movie browsing & streaming                                    │
│  - Wallet connection (Phantom)                                    │
│  - NFT minting & verification                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌─────────────┐ ┌─────────────────┐
│   TMDB API    │ │  Solana     │ │  Next.js API    │
│  Movie Data   │ │  Blockchain │ │  (Backend)      │
│               │ │  - NFTs     │ │  - Verify NFT   │
│               │ │  - Passes   │ │  - Mint NFT     │
│               │ │  - Token   │ │  - Transactions │
└───────────────┘ └─────────────┘ └─────────────────┘
```

## 🎯 Membership Tiers

| Tier | Price | Duration | Watch | Comment | Rate | Early Access |
|------|-------|----------|-------|---------|------|--------------|
| 🥉 Bronze | 1 Token | 30 days | ✅ | ❌ | ❌ | ❌ |
| 🥈 Silver | 2.5 Tokens | 30 days | ✅ | ✅ | ✅ | ❌ |
| 🥇 Gold | 5 Tokens | 30 days | ✅ | ✅ | ✅ | ✅ |

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ and **npm**
- **Rust** and **Cargo** (for smart contract development)
- **Solana CLI** v1.18+
- **Anchor** v0.30+
- **Phantom Wallet** browser extension

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yobyeklow/movie_platform.git
cd movie_platform
```

2. **Install dependencies**

```bash
# Install root dependencies
npm install

# Install Next.js app dependencies
cd movie_app
npm install
cd ..
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```bash
# TMDB API
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p

# YouTube API
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key

# Solana Configuration
NEXT_PUBLIC_RPC_URL=http://localhost:8899
NEXT_PUBLIC_PROGRAM_ID=ApfCLKKr7Y6GX9qKWujhDGmSNvdN93tNidyPe2hyB9jL
NEXT_PUBLIC_IS_MAINNET=false
NEXT_PUBLIC_USDC_MINT=your_usdc_mint_address
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_NETWORK=mainnet

# Internal
INTERNAL_SECRET=your_internal_secret
```

> 💡 **Note**: For development, you can run on devnet or use a local validator.

### Local Development

#### Option 1: Using Local Validator

1. **Start the local validator**

```bash
npm run local:start
```

2. **Initialize the platform** (first time only)

```bash
# This runs all setup scripts:
# - Initialize custom token
# - Initialize platform config
# - Create NFT collections
# - Open mint window

# Run individual setup steps:
npm run admin:init:token           # Create token mint
npm run admin:init:platform        # Initialize platform
npm run admin:init:collections     # Create collections
npm run admin:open-mint            # Open mint window
```

3. **Start the Next.js development server**

```bash
cd movie_app
npm run dev
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

#### Option 2: Using Devnet

1. **Configure `.env` for devnet**

```bash
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet
```

2. **Deploy the smart contract**

```bash
anchor build
anchor deploy
```

3. **Initialize the platform**

```bash
npm run admin:init:platform
npm run admin:init:collections
npm run admin:open-mint
```

4. **Start the frontend**

```bash
cd movie_app
npm run dev
```

## 📦 Project Structure

```
movie_platform/
├── programs/
│   └── movie_platform/       # Solana smart contracts (Anchor)
│       ├── src/
│       │   ├── instructions/ # Instruction handlers
│       │   ├── state/        # Account state definitions
│       │   ├── error.rs      # Error types
│       │   └── lib.rs        # Program entry point
│       └── Cargo.toml
│
├── movie_app/                # Next.js frontend
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── page.tsx         # Home page
│   │   ├── movie/           # Movie detail pages
│   │   ├── trending/        # Trending movies
│   │   ├── nft/             # NFT pages
│   │   └── idl/             # IDL files
│   ├── components/          # React components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # External API services
│   ├── utils/               # Utility functions
│   ├── public/              # Static assets
│   ├── next.config.ts       # Next.js config
│   └── package.json
│
├── scripts/                  # Admin scripts for platform setup
│   ├── init-token.ts
│   ├── init-platform.ts
│   ├── create-collections.ts
│   ├── open-mint.ts
│   ├── mint-tokens.ts
│   └── README.md
│
├── tests/                   # Anchor tests
├── Anchor.toml             # Anchor configuration
├── Cargo.toml              # Rust workspace config
├── package.json            # Root dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

## 🔧 Smart Contract Instructions

| Instruction | Description | Authority |
|-------------|-------------|-----------|
| `initialize_token` | Create custom SPL token mint | Admin |
| `initialize_platform` | Initialize platform config | Admin |
| `create_bronze_collection` | Create Bronze NFT collection | Admin |
| `create_silver_collection` | Create Silver NFT collection | Admin |
| `create_gold_collection` | Create Gold NFT collection | Admin |
| `set_collections` | Link collections to platform | Admin |
| `open_mint` | Open mint window | Admin |
| `mint_pass` | Mint user NFT pass | Public |
| `burn_pass` | Burn user NFT pass | NFT Owner |
| `verify_pass` | Verify user pass tier | Public |
| `allow_transfer` | Unfreeze NFT for transfer | Admin |
| `withdraw_treasury` | Withdraw from treasury | Admin |

## 💰 Admin Scripts

### Initialize Token

Create the platform's custom SPL token:

```bash
npm run admin:init:token
```

Creates `token_config.json` with token mint and treasury addresses.

### Initialize Platform

Set up platform configuration with tier prices:

```bash
npm run admin:init:platform

# Or with custom prices:
npm run admin:init:platform -- --bronze 1000000 --silver 2500000 --gold 5000000
```

Prices are in base units (token has 6 decimals).

### Create Collections

Create the three NFT collections:

```bash
npm run admin:init:collections
```

Creates Bronze, Silver, and Gold collections with IPFS metadata.

### Open Mint Window

Allow users to start minting passes:

```bash
npm run admin:open-mint              # Open now
npm run admin:open-mint -- "3/11/2026 10:30"  # Open at specific time
```

### Mint Tokens to Users

Distribute tokens to users:

```bash
npm run admin:mint-tokens -- <WALLET_ADDRESS> <AMOUNT>

# Example: Mint 1 token (1,000,000 base units)
npm run admin:mint-tokens -- 7xK9y2... 1000000
```

### Allow Transfer (Unfreeze NFT)

Make an NFT transferable:

```bash
npm run admin:allow-transfer -- <ASSET_ADDRESS>
```

This removes the FreezeDelegate plugin, allowing the NFT to be sold or transferred.

For more details, see [scripts/README.md](scripts/README.md).

## 🎨 Frontend Features

### Pages

- **Home (`/`)**: Browse trending and popular movies
- **Movie Detail (`/movie/:slug`)**: View movie details and watch (if pass holder)
- **Trending (`/trending`)**: Trending movies page
- **NFT (`/nft`)**: Mint and manage NFT passes
- **Collection (`/collection`)**: View your NFT collection

### Components

- **WalletProvider**: Solana wallet connection (Phantom)
- **MovieCard**: Movie preview card
- **MovieDetail**: Full movie details with streaming
- **NFTCard**: NFT pass display
- **TierSelection**: Tier selection for minting

### API Routes

- `POST /api/create-mint-transaction`: Create mint transaction
- `POST /api/complete-mint`: Complete mint transaction
- `POST /api/verify-nft`: Verify user's NFT pass
- `POST /api/burn-pass`: Burn NFT pass

### Hooks

- `useMovies`: Fetch movie data from TMDB
- `useTrending`: Fetch trending movies
- `useProgram`: Anchor program interaction

## 🔐 Security

### Environment Variables

Never commit `.env` files. All sensitive configuration is already in `.gitignore`.

### Key Management

- Admin keypairs are stored in `scripts/authority-keypair.json` (not committed)
- Production keys should be stored in a secure vault
- Use environment variables for RPC URLs and program IDs

### Soulbound NFTs

- NFTs are initially soulbound (non-transferable)
- Only admin can unfreeze NFTs via `allow_transfer`
- Platform receives 100% royalties on secondary sales

## 🧪 Testing

### Smart Contract Tests

```bash
anchor test
```

### Frontend Tests

```bash
cd movie_app
npm run test
```

### Local Testing

To test the full flow:

1. Start local validator: `npm run local:start`
2. Initialize platform: `npm run admin:init:platform`
3. Mint tokens to yourself: `npm run admin:mint-tokens -- YOUR_WALLET 10000000`
4. Open mint: `npm run admin:open-mint`
5. Start frontend: `cd movie_app && npm run dev`
6. Open browser and mint an NFT

## 📝 Development Workflow

### Adding New Features

1. **Smart Contract Changes**
   ```bash
   # Edit files in programs/movie_platform/src/
   # Build
   anchor build
   # Test
   anchor test
   ```

2. **Frontend Changes**
   ```bash
   # Edit files in movie_app/
   cd movie_app
   npm run dev
   ```

3. **Update IDL**
   ```bash
   # After smart contract changes, update IDL
   cp target/idl/movie_platform.json movie_app/app/idl/
   ```

### Deployment

#### Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

#### Deploy to Mainnet

```bash
anchor deploy --provider.cluster mainnet
```

## 🐛 Troubleshooting

### Common Issues

**Issue: `Error: Keypair file not found`**

- Ensure `NEXT_KEYPAIR` is set in `.env`
- Check that `scripts/authority-keypair.json` exists

**Issue: `Error: Platform not initialized`**

- Run `npm run admin:init:platform` first

**Issue: `Error: Mint not open`**

- Run `npm run admin:open-mint` to open the mint window

**Issue: Wallet connection fails**

- Ensure Phantom wallet is installed
- Check if you're on the correct network (devnet/mainnet)

**Issue: Environment variables not loading**

- Restart the dev server after changing `.env`
- Check that `.env` is in the root directory

## 📚 Documentation

- [Anchor Documentation](https://www.anchor-lang.com/docs)
- [Solana Documentation](https://docs.solana.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Phantom Wallet Docs](https://docs.phantom.app/)
- [TMDB API Documentation](https://developers.themoviedb.org/3)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

ISC License

## 👥 Authors

- **yobyeklow** - Initial work

## 🙏 Acknowledgments

- [Solana](https://solana.com/) - Blockchain platform
- [Anchor](https://www.anchor-lang.com/) - Solana framework
- [Next.js](https://nextjs.org/) - React framework
- [TMDB](https://www.themoviedb.org/) - Movie database API
- [Phantom](https://phantom.app/) - Solana wallet

---

**Built with ❤️ on Solana**
