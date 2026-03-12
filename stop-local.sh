#!/bin/bash

# Stop Metaplex Local Validator Script

echo "🛑 Stopping Metaplex Local Validator..."

# Check if PID file exists
if [ -f .validator.pid ]; then
    # Read the PID from the file
    VALIDATOR_PID=$(cat .validator.pid)
    
    # Check if the process is running
    if ps -p $VALIDATOR_PID > /dev/null 2>&1; then
        echo "🔌 Killing validator process (PID: $VALIDATOR_PID)..."
        kill $VALIDATOR_PID
        
        # Wait a moment
        sleep 2
        
        # Force kill if still running
        if ps -p $VALIDATOR_PID > /dev/null 2>&1; then
            echo "⚠️  Force killing validator process..."
            kill -9 $VALIDATOR_PID
        fi
        
        echo "✅ Validator stopped successfully!"
    else
        echo "⚠️  Validator process is not running (PID: $VALIDATOR_PID)"
    fi
    
    # Remove the PID file
    rm -f .validator.pid
else
    echo "⚠️  No validator PID file found."
fi

# Also try to kill any running metaplex-validator processes by name (failsafe)
echo "🔍 Checking for any remaining metaplex validator processes..."
VALIDATOR_PROCS=$(ps aux | grep -i "metaplex.*validator" | grep -v grep | awk '{print $2}')

if [ -n "$VALIDATOR_PROCS" ]; then
    echo "Found validator processes: $VALIDATOR_PROCS"
    for pid in $VALIDATOR_PROCS; do
        echo "Killing process $pid..."
        kill $pid 2>/dev/null
        sleep 1
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null
        fi
    done
    echo "✅ All validator processes stopped!"
else
    echo "No running validator processes found."
fi

# Check for any test-validator processes too
TEST_VALIDATOR_PROCS=$(ps aux | grep "solana.*test-validator" | grep -v grep | awk '{print $2}')
if [ -n "$TEST_VALIDATOR_PROCS" ]; then
    echo "Found test-validator processes: $TEST_VALIDATOR_PROCS"
    for pid in $TEST_VALIDATOR_PROCS; do
        kill $pid 2>/dev/null
    done
    echo "✅ Test validator processes stopped!"
fi

echo ""
echo "💡 Use './start-local.sh' to start the validator again"
