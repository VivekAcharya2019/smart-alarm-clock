// Jenkins Pipeline for Smart Alarm Clock Android App
//
// Required Environment Variables (set in Jenkins):
// - S3_BUCKET_NAME: Your S3 bucket name (e.g., "smart-alarm-clock-20260416")
// - UPLOAD_TO_S3: Set to "true" to enable S3 upload (default: false)
// - AWS_REGION: AWS region (default: us-east-1)
//
// AWS credentials should be configured on Jenkins server or EC2 instance with IAM role

pipeline {
    agent {
        docker {
            image 'reactnativecommunity/react-native-android:latest'
            args '-v /var/run/docker.sock:/var/run/docker.sock'
        }
    }

    environment {
        ANDROID_HOME = '/opt/android'
        ANDROID_SDK_ROOT = '/opt/android'
        PATH = "$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo 'Code checked out successfully'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'npm ci'
            }
        }

        stage('Lint & Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint || true'

                echo 'Running tests...'
                sh 'npm test || true'
            }
        }

        stage('Build Android APK') {
            steps {
                echo 'Building Android Debug APK...'
                dir('android') {
                    sh 'chmod +x gradlew'
                    sh './gradlew clean'
                    sh './gradlew assembleDebug'
                }
            }
        }

        stage('Archive APK') {
            steps {
                echo 'Archiving APK artifact...'
                archiveArtifacts artifacts: 'android/app/build/outputs/apk/debug/app-debug.apk',
                                 fingerprint: true,
                                 allowEmptyArchive: false
            }
        }

        stage('Upload to S3 (Optional)') {
            when {
                expression {
                    return env.UPLOAD_TO_S3 == 'true' && env.S3_BUCKET_NAME != null
                }
            }
            steps {
                script {
                    def bucketName = env.S3_BUCKET_NAME
                    def s3Key = "builds/app-debug-${BUILD_NUMBER}.apk"
                    def s3Uri = "s3://${bucketName}/${s3Key}"

                    echo "Uploading APK to S3..."
                    echo "Bucket: ${bucketName}"
                    echo "Key: ${s3Key}"

                    sh """
                        aws s3 cp android/app/build/outputs/apk/debug/app-debug.apk ${s3Uri}
                    """

                    // Generate public download URL
                    def region = env.AWS_REGION ?: 'us-east-1'
                    def downloadUrl = "https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}"

                    echo "APK uploaded successfully!"
                    echo "Download URL: ${downloadUrl}"

                    // Save URL to file for easy access
                    writeFile file: 'apk-download-url.txt', text: downloadUrl
                    archiveArtifacts artifacts: 'apk-download-url.txt', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        success {
            script {
                echo '========================================='
                echo '✅ Build completed successfully!'
                echo '========================================='
                echo ''
                echo "Jenkins Artifact: ${BUILD_URL}artifact/android/app/build/outputs/apk/debug/app-debug.apk"

                if (fileExists('apk-download-url.txt')) {
                    def s3Url = readFile('apk-download-url.txt').trim()
                    echo ''
                    echo 'Public Download URL:'
                    echo s3Url
                }
                echo ''
            }
        }

        failure {
            echo '========================================='
            echo '❌ Build failed!'
            echo '========================================='
        }

        always {
            cleanWs()
        }
    }
}
