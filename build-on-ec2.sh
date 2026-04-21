#!/bin/bash
set -e

echo "========================================="
echo "Smart Alarm Clock - EC2 Build Script"
echo "========================================="
echo ""

# Configuration
NODE_VERSION="18"
JAVA_VERSION="21"
ANDROID_SDK_VERSION="11076708"  # Latest command-line tools
ANDROID_HOME="/opt/android-sdk"
BUILD_TOOLS_VERSION="35.0.0"
COMPILE_SDK_VERSION="35"
NDK_VERSION="26.1.10909125"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS. This script supports Ubuntu and Amazon Linux."
    exit 1
fi

echo "Detected OS: $OS"
echo ""

# Update system
echo "Step 1: Updating system packages..."
if [ "$OS" = "ubuntu" ]; then
    sudo apt-get update
    sudo apt-get install -y curl wget unzip git build-essential
elif [ "$OS" = "amzn" ]; then
    sudo yum update -y
    sudo yum install -y curl wget unzip git gcc-c++ make
else
    echo "Unsupported OS: $OS"
    exit 1
fi
echo "System updated successfully."
echo ""

# Install Node.js
echo "Step 2: Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    if [ "$OS" = "ubuntu" ]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "amzn" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    fi
else
    echo "Node.js already installed: $(node -v)"
fi

# Verify Node.js installation
if command -v node &> /dev/null; then
    echo "Node.js version: $(node -v)"
    echo "npm version: $(npm -v)"
else
    echo "ERROR: Node.js installation failed"
    exit 1
fi
echo ""

# Install Java JDK
echo "Step 3: Installing Java JDK $JAVA_VERSION..."
if ! command -v java &> /dev/null; then
    if [ "$OS" = "ubuntu" ]; then
        sudo apt-get install -y openjdk-${JAVA_VERSION}-jdk
    elif [ "$OS" = "amzn" ]; then
        sudo yum install -y java-${JAVA_VERSION}-amazon-corretto-devel
    fi
else
    echo "Java already installed: $(java -version 2>&1 | head -n 1)"
fi

# Verify Java installation
if command -v java &> /dev/null; then
    java -version

    # Set JAVA_HOME
    if [ "$OS" = "ubuntu" ]; then
        export JAVA_HOME=/usr/lib/jvm/java-${JAVA_VERSION}-openjdk-amd64
    elif [ "$OS" = "amzn" ]; then
        export JAVA_HOME=/usr/lib/jvm/java-${JAVA_VERSION}-amazon-corretto
    fi

    echo "JAVA_HOME set to: $JAVA_HOME"
else
    echo "ERROR: Java installation failed"
    exit 1
fi
echo ""

# Install Android SDK
echo "Step 4: Installing Android SDK..."
if [ ! -d "$ANDROID_HOME" ]; then
    echo "Creating Android SDK directory..."
    sudo mkdir -p $ANDROID_HOME
    sudo chown -R $USER:$USER $ANDROID_HOME

    cd /tmp
    echo "Downloading Android SDK command-line tools..."
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_SDK_VERSION}_latest.zip

    echo "Extracting SDK tools..."
    unzip -q commandlinetools-linux-${ANDROID_SDK_VERSION}_latest.zip
    mkdir -p $ANDROID_HOME/cmdline-tools
    mv cmdline-tools $ANDROID_HOME/cmdline-tools/latest

    echo "Cleaning up..."
    rm commandlinetools-linux-${ANDROID_SDK_VERSION}_latest.zip
else
    echo "Android SDK directory already exists at $ANDROID_HOME"
fi

# Set up environment variables
export ANDROID_HOME=$ANDROID_HOME
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin

echo "Android SDK environment variables set:"
echo "  ANDROID_HOME=$ANDROID_HOME"
echo "  ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
echo ""

# Accept Android SDK licenses
echo "Step 5: Accepting Android SDK licenses..."
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1 || true
echo ""

# Install required Android SDK components
echo "Step 6: Installing Android SDK components..."
echo "This may take several minutes..."
$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --install \
    "platform-tools" \
    "platforms;android-${COMPILE_SDK_VERSION}" \
    "build-tools;${BUILD_TOOLS_VERSION}" \
    "ndk;${NDK_VERSION}" \
    "cmake;3.22.1" > /dev/null

echo "Android SDK components installed successfully."
echo ""

# Navigate to project directory
echo "Step 7: Setting up project..."
PROJECT_DIR=$(pwd)
echo "Project directory: $PROJECT_DIR"

# Install npm dependencies
echo "Step 8: Installing npm dependencies..."
npm install
echo "Dependencies installed successfully."
echo ""

# Make gradlew executable
echo "Step 9: Preparing Gradle wrapper..."
cd android
chmod +x gradlew
echo "Gradle wrapper ready."
echo ""

# Clean and build APK
echo "Step 10: Building Android APK..."
echo "This may take several minutes on first build..."
./gradlew clean --no-daemon
./gradlew assembleDebug --no-daemon

# Check if APK was created
APK_PATH="$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo ""
    echo "========================================="
    echo "✅ BUILD SUCCESSFUL!"
    echo "========================================="
    echo ""
    echo "APK Location: $APK_PATH"
    echo "APK Size: $(du -h $APK_PATH | cut -f1)"
    echo ""
    echo "To manually upload to S3, use:"
    echo "aws s3 cp $APK_PATH s3://YOUR_BUCKET_NAME/builds/app-debug-\$(date +%Y%m%d-%H%M%S).apk"
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ BUILD FAILED"
    echo "========================================="
    echo "APK file not found at expected location: $APK_PATH"
    exit 1
fi

# Create environment setup script for future use
echo "Step 11: Creating environment setup script..."
cat > $PROJECT_DIR/env-setup.sh << 'EOF'
#!/bin/bash
# Source this file to set up Android environment variables
# Usage: source env-setup.sh

export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=/opt/android-sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$JAVA_HOME/bin

echo "Android build environment variables set:"
echo "  ANDROID_HOME=$ANDROID_HOME"
echo "  ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"
echo "  JAVA_HOME=$JAVA_HOME"
EOF

chmod +x $PROJECT_DIR/env-setup.sh
echo "Environment setup script created at: $PROJECT_DIR/env-setup.sh"
echo "Run 'source env-setup.sh' in future sessions to set environment variables."
echo ""

echo "========================================="
echo "Setup Complete!"
echo "========================================="
