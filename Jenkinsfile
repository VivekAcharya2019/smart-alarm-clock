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
                expression { return env.UPLOAD_TO_S3 == 'true' }
            }
            steps {
                echo 'Uploading APK to S3...'
                sh '''
                    aws s3 cp android/app/build/outputs/apk/debug/app-debug.apk \
                    s3://your-bucket/smart-alarm-clock/app-debug-${BUILD_NUMBER}.apk
                '''
            }
        }
    }

    post {
        success {
            echo 'Build completed successfully!'
            echo "APK available at: ${BUILD_URL}artifact/android/app/build/outputs/apk/debug/app-debug.apk"
        }

        failure {
            echo 'Build failed!'
        }

        always {
            cleanWs()
        }
    }
}
