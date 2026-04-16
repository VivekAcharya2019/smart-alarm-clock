# Jenkins CI/CD Setup for Smart Alarm Clock

Complete guide to set up Jenkins on EC2 to automatically build your React Native Android app.

## Prerequisites

- EC2 instance (Ubuntu 22.04 LTS)
- Minimum: **t3.medium** (2 vCPU, 4GB RAM)
- Recommended: **t3.large** (2 vCPU, 8GB RAM) for faster builds
- Security group with ports open: 22 (SSH), 8080 (Jenkins), 443 (HTTPS optional)

---

## Part 1: Jenkins Installation on EC2

### Step 1: SSH into EC2

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 2: Install Jenkins

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Java 17
sudo apt-get install -y openjdk-17-jdk

# Add Jenkins repository
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt-get update
sudo apt-get install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
sudo systemctl status jenkins
```

### Step 3: Get Initial Admin Password

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

Copy this password - you'll need it in Step 4.

### Step 4: Access Jenkins

1. Open browser: `http://your-ec2-ip:8080`
2. Paste the initial admin password
3. Click **"Install suggested plugins"**
4. Create admin user
5. Save and finish

---

## Part 2: Configure Jenkins for Android Builds

### Step 1: Install Required Plugins

Go to: **Manage Jenkins → Plugins → Available plugins**

Install these plugins:
- ✅ **Git plugin** (usually pre-installed)
- ✅ **Pipeline**
- ✅ **GitHub Integration**
- ✅ **Android Signing** (optional, for release builds)
- ✅ **Slack Notification** (optional)

Click "Install" and restart Jenkins.

### Step 2: Install Android SDK on Jenkins Server

SSH back into EC2:

```bash
# Create Android SDK directory
sudo mkdir -p /opt/android-sdk
sudo chown jenkins:jenkins /opt/android-sdk

# Switch to jenkins user
sudo su - jenkins

# Download Android Command Line Tools
cd /opt/android-sdk
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-11076708_latest.zip
mkdir -p cmdline-tools
mv cmdline-tools cmdline-tools/latest

# Set environment for jenkins user
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

# Exit jenkins user
exit
```

### Step 3: Install Node.js

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Configure Jenkins Environment Variables

In Jenkins web UI:
1. Go to: **Manage Jenkins → System**
2. Scroll to **Global properties**
3. Check **"Environment variables"**
4. Add these variables:

| Name | Value |
|------|-------|
| `ANDROID_HOME` | `/opt/android-sdk` |
| `ANDROID_SDK_ROOT` | `/opt/android-sdk` |
| `JAVA_HOME` | `/usr/lib/jvm/java-17-openjdk-amd64` |

5. Click **Save**

---

## Part 3: Create Jenkins Pipeline Job

### Step 1: Create New Job

1. Jenkins Dashboard → **New Item**
2. Enter name: `smart-alarm-clock-build`
3. Select **"Pipeline"**
4. Click **OK**

### Step 2: Configure Pipeline

#### General Section:
- ✅ Check **"GitHub project"**
- Project URL: `https://github.com/VivekAcharya2019/smart-alarm-clock`

#### Build Triggers:
Choose one:

**Option A: Manual Builds**
- Leave triggers unchecked
- You'll click "Build Now" manually

**Option B: GitHub Webhooks (Auto-build on push)**
- ✅ Check **"GitHub hook trigger for GITScm polling"**
- See "Part 4: GitHub Webhook Setup" below

**Option C: Scheduled Builds**
- ✅ Check **"Build periodically"**
- Schedule: `H 2 * * *` (builds daily at 2 AM)

#### Pipeline Definition:

**Option 1: Pipeline from SCM (Recommended)**
- Definition: **"Pipeline script from SCM"**
- SCM: **Git**
- Repository URL: `https://github.com/VivekAcharya2019/smart-alarm-clock.git`
- Branch: `*/main`
- Script Path: `Jenkinsfile`

**Option 2: Inline Pipeline Script**
- Definition: **"Pipeline script"**
- Paste the Jenkinsfile content directly

### Step 3: Save and Build

1. Click **Save**
2. Click **"Build Now"**
3. Watch build progress in **"Build History"**
4. Click on build #1 → **"Console Output"** to see logs

---

## Part 4: GitHub Webhook Setup (Optional - Auto Build)

To trigger builds automatically when you push to GitHub:

### On GitHub:

1. Go to: `https://github.com/VivekAcharya2019/smart-alarm-clock/settings/hooks`
2. Click **"Add webhook"**
3. Payload URL: `http://your-ec2-ip:8080/github-webhook/`
4. Content type: `application/json`
5. Events: **"Just the push event"**
6. Click **"Add webhook"**

### Test It:

```bash
# Push a change
git commit --allow-empty -m "Test Jenkins webhook"
git push

# Jenkins should automatically start a build!
```

---

## Part 5: Download Built APK

### Method 1: Jenkins Web UI

1. Go to build page: `http://your-ec2-ip:8080/job/smart-alarm-clock-build/lastSuccessfulBuild/`
2. Click **"Build Artifacts"**
3. Download `app-debug.apk`

### Method 2: Direct Download Link

```bash
# Direct download URL (replace with your details)
wget http://your-ec2-ip:8080/job/smart-alarm-clock-build/lastSuccessfulBuild/artifact/android/app/build/outputs/apk/debug/app-debug.apk
```

### Method 3: SCP from EC2

```bash
# From your Windows machine
scp -i your-key.pem ubuntu@your-ec2-ip:/var/lib/jenkins/workspace/smart-alarm-clock-build/android/app/build/outputs/apk/debug/app-debug.apk .
```

---

## Part 6: Jenkins Pipeline Features

### Current Pipeline Stages:

```
1. Checkout         - Clone code from GitHub
2. Install Deps     - npm install
3. Lint & Test      - Code quality checks
4. Build APK        - gradlew assembleDebug
5. Archive APK      - Save artifact in Jenkins
```

### Build Time Estimates:

| Stage | First Build | Subsequent |
|-------|-------------|------------|
| Checkout | 10s | 5s |
| Dependencies | 2-3 min | 30s (cached) |
| Lint/Test | 30s | 30s |
| Build APK | 8-10 min | 2-3 min |
| **Total** | **12-15 min** | **3-5 min** |

---

## Part 7: Advanced Configuration

### Build Release APK (Signed)

Update Jenkinsfile to add release build stage:

```groovy
stage('Build Release APK') {
    steps {
        dir('android') {
            sh '''
                ./gradlew assembleRelease \
                -Pandroid.injected.signing.store.file=/path/to/keystore.jks \
                -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
                -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
                -Pandroid.injected.signing.key.password=$KEY_PASSWORD
            '''
        }
    }
}
```

Add credentials in Jenkins: **Manage Jenkins → Credentials**

### Upload APK to S3

Add to Jenkinsfile:

```groovy
stage('Upload to S3') {
    steps {
        sh '''
            aws s3 cp android/app/build/outputs/apk/debug/app-debug.apk \
            s3://your-bucket/builds/app-debug-${BUILD_NUMBER}.apk
        '''
    }
}
```

Install AWS CLI on Jenkins server:
```bash
sudo apt-get install -y awscli
aws configure
```

### Send Slack Notifications

Install Slack plugin and add to Jenkinsfile:

```groovy
post {
    success {
        slackSend channel: '#builds',
                  color: 'good',
                  message: "✅ Build #${BUILD_NUMBER} succeeded! Download: ${BUILD_URL}artifact/"
    }
    failure {
        slackSend channel: '#builds',
                  color: 'danger',
                  message: "❌ Build #${BUILD_NUMBER} failed!"
    }
}
```

---

## Part 8: Troubleshooting

### Build Fails: "ANDROID_HOME not found"

**Solution:**
```bash
sudo su - jenkins
echo $ANDROID_HOME
# If empty, add to jenkins bashrc
echo 'export ANDROID_HOME=/opt/android-sdk' >> ~/.bashrc
source ~/.bashrc
exit
# Restart Jenkins
sudo systemctl restart jenkins
```

### Build Fails: "Permission denied: gradlew"

**Solution:**
```bash
sudo su - jenkins
cd /var/lib/jenkins/workspace/smart-alarm-clock-build/android
chmod +x gradlew
exit
```

Or add to Jenkinsfile: `sh 'chmod +x gradlew'`

### Out of Disk Space

**Check disk usage:**
```bash
df -h
```

**Clean old builds:**
- Jenkins → **Manage Jenkins → Manage Old Data**
- Or set build retention: Job → Configure → Discard old builds

**Clean Gradle cache:**
```bash
sudo su - jenkins
rm -rf ~/.gradle/caches
exit
```

### Build is Slow

**Increase EC2 instance size:**
- Stop instance
- Change instance type to t3.large or t3.xlarge
- Start instance

**Enable Gradle daemon:**
Add to `android/gradle.properties`:
```properties
org.gradle.daemon=true
org.gradle.parallel=true
org.gradle.configureondemand=true
```

---

## Part 9: Security Best Practices

### Secure Jenkins

1. **Enable HTTPS:**
```bash
sudo apt-get install -y nginx certbot
# Configure nginx reverse proxy with SSL
```

2. **Restrict Access:**
   - Jenkins → Manage Jenkins → Security
   - Enable "Matrix-based security"
   - Only allow authenticated users

3. **Use SSH Keys for Git:**
   - Generate SSH key for jenkins user
   - Add to GitHub deploy keys

4. **Store Secrets Securely:**
   - Use Jenkins Credentials
   - Never hardcode passwords in Jenkinsfile

---

## Quick Reference Commands

```bash
# Start/Stop Jenkins
sudo systemctl start jenkins
sudo systemctl stop jenkins
sudo systemctl restart jenkins

# View Jenkins logs
sudo journalctl -u jenkins -f

# Switch to jenkins user
sudo su - jenkins

# Manual build from command line
cd /var/lib/jenkins/workspace/smart-alarm-clock-build/android
./gradlew assembleDebug

# Check Jenkins status
sudo systemctl status jenkins
```

---

## Expected Workflow

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Update feature"
   git push
   ```

2. **Jenkins auto-builds** (if webhook configured)
   - Or manually click "Build Now"

3. **Wait 3-5 minutes** for build

4. **Download APK** from Jenkins

5. **Install on device:**
   ```bash
   adb install app-debug.apk
   ```

---

## Summary

✅ **Jenkins installed on EC2**
✅ **Android SDK configured**
✅ **Pipeline created**
✅ **Builds APK automatically**
✅ **APK downloadable from Jenkins**

**Your app builds in the cloud now!** 🚀

Build URL: `http://your-ec2-ip:8080/job/smart-alarm-clock-build/`

---

## Next Steps

1. Set up Jenkins on EC2 (30 minutes)
2. Configure pipeline (10 minutes)
3. Run first build (15 minutes)
4. Set up webhook for auto-builds (5 minutes)
5. Download and test APK!

Need help with any step? Let me know!
