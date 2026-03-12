#!/bin/bash
echo "Starting Metaplex Local Validator..."
echo "👑 Admin wallet: $ADMIN_PUBKEY"

# Check if ledger exists, if yes reset it
if [ -d "test-ledger" ]; then
    echo "🔄 Resetting ledger..."
    rm -rf test-ledger
fi

echo "🚀 Starting validator (will create custom USDC token via init-platform)..."

# Start validator in background with output suppressed
# Use nohup so it continues even if terminal closes
nohup metaplex-local-validator > /dev/null 2>&1 &
VALIDATOR_PID=$!
echo "Validator started with PID: $VALIDATOR_PID"
echo $VALIDATOR_PID > .validator.pid

echo "Waiting for validator to be ready..."
sleep 5
echo ""
echo "✅ Validator running in background (PID: $VALIDATOR_PID)"
echo "⏭️  Next steps:"
echo "   1. Run: npm run admin:init:platform (creates custom USDC)"
echo "   2. Run: npm run admin:init:collections"
echo "   3. Run: npm run admin:open:mint"
echo "   4. Run: npm run admin:mint:usdc --recipient USER_ADDRESS --amount 200"
echo ""
echo "💡 Use './stop-local.sh' to stop the validator"
