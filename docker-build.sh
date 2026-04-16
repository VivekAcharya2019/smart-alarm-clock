#!/bin/bash
# Docker Build Script for Smart Alarm Clock

set -e

echo "======================================"
echo "Smart Alarm Clock - Docker Build"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Build Docker image
echo -e "${BLUE}Step 1: Building Docker image...${NC}"
docker build -t smart-alarm-clock-builder .

# Create output directory
mkdir -p ./build-output

# Run build in container
echo -e "${BLUE}Step 2: Building Android APK...${NC}"
docker run --rm \
    -v "$(pwd)/build-output:/app/android/app/build/outputs" \
    smart-alarm-clock-builder \
    bash -c "cd android && ./gradlew clean && ./gradlew assembleDebug"

echo ""
echo -e "${GREEN}======================================"
echo "Build completed successfully!"
echo "======================================${NC}"
echo ""
echo "APK location:"
echo "  ./build-output/apk/debug/app-debug.apk"
echo ""
echo "To install on device/emulator:"
echo "  adb install ./build-output/apk/debug/app-debug.apk"
echo ""
