# React Native Android Build Environment
FROM ubuntu:22.04

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Set environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Install system dependencies
RUN apt-get update && apt-get install -y \
    openjdk-17-jdk \
    wget \
    unzip \
    git \
    curl \
    build-essential \
    file \
    apt-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Create Android SDK directory
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools

# Download and install Android Command Line Tools
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip \
    && unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_HOME}/cmdline-tools \
    && mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses || true

# Install Android SDK components
RUN sdkmanager --update && \
    sdkmanager \
    "platform-tools" \
    "platforms;android-34" \
    "build-tools;34.0.0" \
    "ndk;26.1.10909125" \
    "cmake;3.22.1"

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set proper permissions
RUN chmod +x android/gradlew

# Expose Metro bundler port
EXPOSE 8081

# Default command
CMD ["bash"]
