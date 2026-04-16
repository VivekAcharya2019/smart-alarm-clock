#!/bin/bash
# Jenkins + Android SDK Setup Script for EC2 Ubuntu 22.04
# Run this script on a fresh EC2 instance to set up everything

set -e

echo "========================================"
echo "Jenkins + Android SDK Setup for EC2"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Update system
echo -e "${BLUE}Step 1: Updating system...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# Install Java 17
echo -e "${BLUE}Step 2: Installing Java 17...${NC}"
sudo apt-get install -y openjdk-17-jdk
java -version

# Install Jenkins
echo -e "${BLUE}Step 3: Installing Jenkins...${NC}"
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt-get update
sudo apt-get install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Install Node.js 20
echo -e "${BLUE}Step 4: Installing Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

# Install Android SDK
echo -e "${BLUE}Step 5: Installing Android SDK...${NC}"
sudo mkdir -p /opt/android-sdk
sudo chown jenkins:jenkins /opt/android-sdk

# Download Android Command Line Tools as jenkins user
sudo -u jenkins bash << 'EOF'
cd /opt/android-sdk
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q commandlinetools-linux-11076708_latest.zip
mkdir -p cmdline-tools
mv cmdline-tools cmdline-tools/latest
rm commandlinetools-linux-11076708_latest.zip

# Set environment variables
echo 'export ANDROID_HOME=/opt/android-sdk' >> ~/.bashrc
echo 'export ANDROID_SDK_ROOT=/opt/android-sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# Accept licenses and install SDK components
yes | /opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager --update
/opt/android-sdk/cmdline-tools/latest/bin/sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;26.1.10909125" \
    "cmake;3.22.1"
EOF

# Install additional tools
echo -e "${BLUE}Step 6: Installing additional tools...${NC}"
sudo apt-get install -y git wget curl unzip

# Get Jenkins initial password
echo ""
echo -e "${GREEN}========================================"
echo "Installation Complete!"
echo "========================================${NC}"
echo ""
echo -e "${BLUE}Jenkins Information:${NC}"
echo "  URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo ""
echo -e "${BLUE}Initial Admin Password:${NC}"
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Open Jenkins URL in browser"
echo "  2. Use initial admin password above"
echo "  3. Install suggested plugins"
echo "  4. Create admin user"
echo "  5. Create new pipeline job"
echo "  6. Point to GitHub repo: https://github.com/VivekAcharya2019/smart-alarm-clock"
echo ""
echo -e "${GREEN}Setup complete! 🚀${NC}"
