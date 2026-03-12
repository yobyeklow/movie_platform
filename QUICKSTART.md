# 🚀 Quick Start Guide

Get up and running with Movie Platform in 10 minutes!

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js v20+ installed
- [ ] npm or yarn installed
- [ ] Rust and Cargo installed
- [ ] Solana CLI installed (`solana --version`)
- [ ] Anchor installed (`anchor --version`)
- [ ] Phantom Wallet browser extension installed

---

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yobyeklow/movie_platform.git
cd movie_platform

# Install dependencies
npm install

# Install frontend dependencies
cd movie_app
npm install
cd ..
```

---

## Step 2: Configure Environment (2 minutes)

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # or create manually
```

Edit `.env` with your values:

```bash
# Get these from https://www.themoviedb.org/settings/api
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here

# Solana configuration
NEXT_PUBLIC_RPC_URL=http://localhost:8899
NEXT_PUBLIC_PROGRAM_ID=ApfCLKKr7Y6GX9qKWujhDGmSNvdN93tNidyPe2hyB9jL
NEXT_PUBLIC_IS_MAINNET=false
```

**Getting API Keys:**
- **TMDB**: Sign up at https://www.themoviedb.org/signup and generate an API key
- **YouTube**: Go to https://console.cloud.google.com and create a YouTube Data API v3 key

---

## Step 3: Start Local Validator (1 minute)

```bash
# Start the local Solana validator
npm run local:start
```

You should see:
```
Validator started with PID: [PID]
✅ Validator running in background
```

---

## Step 4: Initialize the Platform (2 minutes)

Run these commands in order:

```bash
# 1. Create the token
npm run admin:init:token

# 2. Initialize the platform
npm run admin:init:platform

# 3. Create NFT collections
npm run admin:init:collections

# 4. Open the mint window
npm run admin:open-mint
```

---

## Step 5: Get Some Tokens (1 minute)

To mint NFTs, you need tokens:

```bash
# Mint 10 tokens to your wallet
# Replace YOUR_WALLET_ADDRESS with your Phantom wallet address
npm run admin:mint-tokens -- YOUR_WALLET_ADDRESS 10000000
```

**Find your wallet address**: Open Phantom wallet → Copy address

---

## Step 6: Start the Frontend (1 minute)

```bash
cd movie_app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 7: Mint Your First NFT (2 minutes)

1. Click "Connect Wallet" and connect your Phantom wallet
2. Navigate to the NFT page or click "Get Started"
3. Select a tier (Bronze/Silver/Gold)
4. Approve the transaction in Phantom
5. Your NFT pass will be minted! 🎉

---

## ✅ You're All Set!

You can now:
- Browse movies on the home page
- Watch movies (if you have a pass)
- View your NFT collection
- Try different tiers

---

## 🎯 Next Steps

### Explore the Code

```bash
# Smart contracts (Rust/Anchor)
ls programs/movie_platform/src/

# Frontend (Next.js)
ls movie_app/app/
ls movie_app/components/

# Admin scripts
ls scripts/
```

### Read the Documentation

- [README.md](README.md) - Full project documentation
- [scripts/README.md](scripts/README.md) - Admin scripts guide
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

### Run Tests

```bash
# Smart contract tests
anchor test

# Frontend linting
cd movie_app
npm run lint
```

### Deploy to Devnet

```bash
# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

---

## 🛑 Stopping Everything

When you're done:

```bash
# Stop the frontend (Ctrl+C in the terminal)

# Stop the local validator
npm run local:stop
```

---

## ❓ Troubleshooting

### Problem: `command not found: anchor`

**Solution**: Install Anchor
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### Problem: `Error: Keypair file not found`

**Solution**: Ensure `.env` has `NEXT_KEYPAIR=scripts/authority-keypair.json`

### Problem: `Error: Platform not initialized`

**Solution**: Run `npm run admin:init:platform`

### Problem: `Error: Mint not open`

**Solution**: Run `npm run admin:open-mint`

### Problem: Movies not loading

**Solution**: Check that TMDB API key is valid in `.env`

---

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Documentation](https://www.anchor-lang.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Phantom Wallet](https://phantom.app/)

---

**Need help?** Open an issue on GitHub!

---

**Happy coding! 🎬**
