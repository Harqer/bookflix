#!/bin/bash

# 🏛️ Siphon Neural Bootstrap Script
# Purpose: Manually triggers the "Neural Weight Installation" on the Sovereign Cluster.

echo "🚀 Siphon: Initiating Manual Neural Installation..."

# 1. Select Installation Path
INSTALL_PATH="/mnt/models"
if [ ! -w "/mnt" ]; then
    echo "⚠️ Siphon: /mnt is not writable. Falling back to $HOME/models..."
    INSTALL_PATH="$HOME/models"
fi

# 2. Prompt for Registry URL
if [ -z "$SIPHON_REGISTRY_URL" ]; then
    read -p "📥 Enter your Siphon Registry URL: " SIPHON_REGISTRY_URL
fi

# 3. Create Model Directories
mkdir -p "$INSTALL_PATH/riggs"
mkdir -p "$INSTALL_PATH/diffuman"
mkdir -p "$INSTALL_PATH/cosmos"
mkdir -p "$INSTALL_PATH/trellis"

# 4. Pull Sovereign Weights
echo "📥 Siphon: Pulling RigGS Neural Weights (32GB)..."
curl -L -o "$INSTALL_PATH/riggs/riggs_v2_weights.bin" "$SIPHON_REGISTRY_URL/weights/riggs_v2"

echo "📥 Siphon: Pulling DiffuMan 4DGS Weights (45GB)..."
curl -L -o "$INSTALL_PATH/diffuman/diffuman_4dgs.pt" "$SIPHON_REGISTRY_URL/weights/diffuman"

echo "📥 Siphon: Pulling NVIDIA Cosmos Predict Weights (80GB)..."
curl -L -o "$INSTALL_PATH/cosmos/cosmos_predict.bin" "$SIPHON_REGISTRY_URL/weights/cosmos"

echo "📥 Siphon: Pulling Microsoft Trellis Forge Weights (22GB)..."
curl -L -o "$INSTALL_PATH/trellis/trellis_3d.safetensors" "$SIPHON_REGISTRY_URL/weights/trellis"

# 3. Verify Integrity
echo "🔍 Siphon: Verifying Neural Integrity..."
sha256sum -c /mnt/models/checksums.txt

echo "✅ Siphon: Neural Installation Complete. Your H200 Cluster is now Sovereign."
