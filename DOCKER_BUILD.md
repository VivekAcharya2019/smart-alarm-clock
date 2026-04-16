# Building with Docker

This guide explains how to build the Smart Alarm Clock Android app using Docker, which avoids Windows-specific build issues.

## Prerequisites

1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
   - Make sure it's running (whale icon in system tray)

2. **ADB (Android Debug Bridge)** - Optional, for installing APK
   - Comes with Android Studio
   - Or download standalone: https://developer.android.com/tools/releases/platform-tools

## Quick Start

### Windows (PowerShell)

```powershell
# Navigate to project directory
cd C:\Users\Vivek.Acharya\projects\SmartAlarmClock

# Run the build script
.\docker-build.ps1
```

### Linux/Mac/WSL (Bash)

```bash
# Navigate to project directory
cd ~/projects/SmartAlarmClock

# Make script executable
chmod +x docker-build.sh

# Run the build script
./docker-build.sh
```

## What Happens During Build

1. **Docker Image Creation** (~5 minutes first time)
   - Downloads Ubuntu 22.04 base image
   - Installs Java 17
   - Installs Node.js 20
   - Downloads Android SDK
   - Installs Android build tools
   - Cached for subsequent builds

2. **APK Build** (~5-10 minutes first time)
   - Installs npm dependencies
   - Runs Gradle build
   - Compiles Java code
   - Packages APK
   - Outputs to `./build-output/apk/debug/app-debug.apk`

## Manual Docker Commands

If you want more control, use these commands:

### Build Docker Image

```bash
docker build -t smart-alarm-clock-builder .
```

### Build Debug APK

```bash
docker run --rm \
  -v "$(pwd)/build-output:/app/android/app/build/outputs" \
  smart-alarm-clock-builder \
  bash -c "cd android && ./gradlew assembleDebug"
```

### Build Release APK (Signed)

```bash
docker run --rm \
  -v "$(pwd)/build-output:/app/android/app/build/outputs" \
  smart-alarm-clock-builder \
  bash -c "cd android && ./gradlew assembleRelease"
```

### Interactive Shell (for debugging)

```bash
docker run --rm -it \
  smart-alarm-clock-builder \
  bash
```

## Installing the APK

Once built, install on your device/emulator:

### With Device/Emulator Connected

```bash
# List connected devices
adb devices

# Install APK
adb install ./build-output/apk/debug/app-debug.apk

# Or force reinstall (if already installed)
adb install -r ./build-output/apk/debug/app-debug.apk
```

### Manual Installation

1. Copy APK to your device
2. Open file manager on device
3. Tap the APK file
4. Allow installation from unknown sources if prompted
5. Tap Install

## Troubleshooting

### Docker Desktop Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
- Start Docker Desktop
- Wait for it to fully start (whale icon turns white)
- Try again

### Permission Denied (Linux/Mac)

**Error:** `permission denied while trying to connect to Docker daemon`

**Solution:**
```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in, then:
docker ps
```

### Build Output Not Found

**Error:** APK not in `build-output` folder

**Solution:**
```bash
# Check if build succeeded
docker run --rm smart-alarm-clock-builder bash -c "cd android && ./gradlew assembleDebug --info"

# Check container output
docker run --rm smart-alarm-clock-builder bash -c "ls -la android/app/build/outputs/apk/debug/"
```

### Out of Disk Space

**Error:** `no space left on device`

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Remove old images
docker images
docker rmi <IMAGE_ID>
```

## Build Variants

### Debug Build (Development)
- Faster build time
- Includes debug symbols
- Not optimized
- Larger APK size

```bash
./docker-build.ps1
```

### Release Build (Production)
- Optimized and minified
- Smaller APK size
- Requires signing key
- Ready for distribution

```bash
docker run --rm \
  -v "$(pwd)/build-output:/app/android/app/build/outputs" \
  smart-alarm-clock-builder \
  bash -c "cd android && ./gradlew assembleRelease"
```

## Advantages of Docker Build

✅ **Consistent Environment**
- Same build on any machine
- No "works on my machine" issues

✅ **Avoids Windows Issues**
- No file locking problems
- No Gradle cache corruption
- No antivirus interference

✅ **Clean Build**
- Isolated from host system
- No conflicting dependencies
- Fresh environment every time

✅ **CI/CD Ready**
- Can use same Dockerfile in CI pipelines
- GitHub Actions, GitLab CI, Jenkins

## Next Steps

After successful build:

1. **Test the APK**
   ```bash
   adb install ./build-output/apk/debug/app-debug.apk
   adb shell am start -n com.smartalarmclock/.MainActivity
   ```

2. **View Logs**
   ```bash
   adb logcat | grep "SmartAlarmClock"
   ```

3. **Generate Release APK**
   - Set up signing key
   - Build release variant
   - Upload to Play Store

## Additional Resources

- [React Native Documentation](https://reactnative.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Android Developer Guide](https://developer.android.com/)
- [Gradle Build Tool](https://gradle.org/)
