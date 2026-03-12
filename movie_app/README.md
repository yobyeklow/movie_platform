# 🎬 Movie Platform Frontend

A Next.js frontend for the Movie Platform decentralized streaming service, built with React, TypeScript, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

## 📖 Overview

This is the frontend application for the Movie Platform, providing users with:

- Movie browsing and discovery
- NFT-based membership management
- Solana wallet integration
- Movie streaming for pass holders
- Tiered access control (Bronze/Silver/Gold)

## 🚀 Getting Started

### Prerequisites

- Node.js v20+ and npm
- Phantom Wallet browser extension
- Access to a running Solana local validator or devnet

### Installation

1. **Navigate to the movie_app directory**

```bash
cd movie_app
```

2. **Install dependencies**

```bash
npm install
```

3. **Create environment file**

The `.env` file should be a symlink to the root `.env` file (already configured):

```bash
# This should already be set up
.env -> ../.env
```

The root `.env` should contain:

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

# Internal
INTERNAL_SECRET=your_internal_secret
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## 📂 Project Structure

```
movie_app/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── create-mint-transaction/
│   │   ├── complete-mint/
│   │   ├── verify-nft/
│   │   └── burn-pass/
│   ├── idl/                 # Anchor IDL files
│   ├── movie/               # Movie detail pages
│   │   └── [slug]/
│   ├── nft/                 # NFT pages
│   ├── trending/            # Trending movies
│   ├── collection/          # User's NFT collection
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
│
├── components/              # React components
│   ├── WalletProvider.tsx   # Solana wallet provider
│   ├── movie/
│   │   ├── MovieCard.tsx    # Movie preview card
│   │   └── MovieDetail.tsx  # Full movie details
│   ├── nft/
│   │   ├── NFTCard.tsx      # NFT pass card
│   │   └── TierSelection.tsx
│   └── ui/                  # UI components
│
├── hooks/                   # Custom React hooks
│   ├── useMovies.ts         # Fetch movie data
│   ├── useTrending.ts       # Fetch trending movies
│   ├── useProgram.ts        # Anchor program
│   └── pda.ts               # PDA utilities
│
├── services/                # External API services
│   ├── tmdb_service.ts      # TMDB API client
│   ├── youtube_service.ts   # YouTube API client
│   └── api_service.ts       # General API service
│
├── utils/                   # Utility functions
│   ├── index.ts             # General utilities
│   └── connection.ts        # Solana connection
│
├── public/                  # Static assets
├── middleware.ts            # Next.js middleware
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## 🎨 Components

### WalletProvider

Manages Solana wallet connection using the Solana Wallet Adapter.

**Location**: `components/WalletProvider.tsx`

**Features**:
- Connect/disconnect wallet
- Auto-connect on load
- Network detection
- Transaction signing

### MovieCard

Displays movie preview with poster, title, and rating.

**Location**: `components/movie/MovieCard.tsx`

### MovieDetail

Full movie details with description, cast, and streaming player.

**Location**: `components/movie/MovieDetail.tsx`

### NFTCard

Displays user's NFT pass with tier, mint date, and expiration.

**Location**: `components/nft/NFTCard.tsx`

## 🔌 API Routes

### POST /api/create-mint-transaction

Creates a mint transaction for purchasing an NFT pass.

**Request**:
```json
{
  "walletAddress": "7xK9y2...",
  "tier": "bronze" | "silver" | "gold"
}
```

**Response**:
```json
{
  "transaction": "base64_encoded_transaction",
  "message": "Transaction created successfully"
}
```

### POST /api/complete-mint

Completes the mint transaction after signature.

**Request**:
```json
{
  "signature": "transaction_signature",
  "walletAddress": "7xK9y2...",
  "tier": "bronze"
}
```

### POST /api/verify-nft

Verifies if a wallet holds a valid NFT pass.

**Request**:
```json
{
  "walletAddress": "7xK9y2..."
}
```

**Response**:
```json
{
  "hasPass": true,
  "tier": "silver",
  "expiresAt": "2024-04-12T00:00:00Z"
}
```

### POST /api/burn-pass

Burns an NFT pass.

**Request**:
```json
{
  "walletAddress": "7xK9y2...",
  "nftMint": "9mP..."
}
```

## 🪝 Custom Hooks

### useMovies

Fetches movie data from TMDB.

```typescript
const { movies, loading, error } = useMovies({ page: 1 });
```

### useTrending

Fetches trending movies from TMDB.

```typescript
const { trending, loading, error } = useTrending({ timeframe: 'day' });
```

### useProgram

Interacts with the Anchor program.

```typescript
const { program, provider } = useProgram();
```

## 🎯 Pages

### Home (`/`)

- Featured movies carousel
- Trending movies section
- Popular movies section
- NFT mint CTA

### Movie Detail (`/movie/:slug`)

- Movie information (title, description, cast, etc.)
- Trailer (YouTube embed)
- Streaming player (for pass holders)
- Tier-based access control

### NFT (`/nft`)

- Tier selection (Bronze/Silver/Gold)
- Mint NFT pass
- Pass management

### Collection (`/collection`)

- User's NFT collection
- Pass details and expiration
- Burn pass option

### Trending (`/trending`)

- Trending movies grid
- Filter by timeframe (day/week)

## 🎨 Styling

This project uses **Tailwind CSS v4** for styling.

### Custom Colors

Defined in `app/globals.css`:
```css
@theme {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  /* ... more colors */
}
```

## 🔐 Authentication

The app uses **Solana wallet authentication** via Phantom wallet:

1. User clicks "Connect Wallet"
2. Phantom wallet popup appears
3. User approves connection
4. Wallet address stored in state
5. User can sign transactions

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_TMDB_API_KEY` | TMDB API key | `eyJh...` |
| `NEXT_PUBLIC_YOUTUBE_API_KEY` | YouTube API key | `AIza...` |
| `NEXT_PUBLIC_TMDB_BASE_URL` | TMDB base URL | `https://api.themoviedb.org/3` |
| `NEXT_PUBLIC_TMDB_IMAGE_BASE_URL` | TMDB image base URL | `https://image.tmdb.org/t/p` |
| `NEXT_PUBLIC_RPC_URL` | Solana RPC URL | `http://localhost:8899` |
| `NEXT_PUBLIC_PROGRAM_ID` | Program ID | `ApfCLK...` |
| `NEXT_PUBLIC_IS_MAINNET` | Mainnet flag | `false` |
| `NEXT_PUBLIC_USDC_MINT` | USDC mint address | `2Ey6BW...` |
| `INTERNAL_SECRET` | Internal secret | `secret123` |

## 🧪 Testing

```bash
npm run lint
```

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🐛 Troubleshooting

### Issue: Environment variables not loading

**Solution**: Restart the dev server after changing `.env`:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Issue: Wallet connection fails

**Solution**:
- Ensure Phantom wallet is installed
- Check if you're on the correct network (devnet/mainnet)
- Refresh the page and try connecting again

### Issue: Movies not loading

**Solution**:
- Check that TMDB API key is valid in `.env`
- Verify network connection to TMDB API

### Issue: Build errors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Rebuild
npm run build
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

Build the project and deploy the `.next` folder:
```bash
npm run build
# Deploy the .next folder to your hosting platform
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [TMDB API](https://developers.themoviedb.org/3)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

When contributing to the frontend:

1. Follow the existing code style
2. Use TypeScript for type safety
3. Write meaningful commit messages
4. Test your changes thoroughly

---

**Built with Next.js & ❤️**
