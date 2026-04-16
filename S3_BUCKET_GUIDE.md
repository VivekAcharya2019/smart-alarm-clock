# S3 Bucket Setup Guide for APK Builds

Quick guide to create a temporary S3 bucket with public access for hosting your APK files.

## Prerequisites

- AWS CLI installed and configured
- AWS account with S3 permissions

### Install AWS CLI (if needed)

**Windows:**
```powershell
# Download and install from:
https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Linux/Mac:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Configure AWS CLI

```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format (json)
```

---

## Method 1: Automated Script (Recommended)

### Windows PowerShell

```powershell
cd C:\Users\Vivek.Acharya\projects\SmartAlarmClock
.\create-s3-bucket.ps1
```

### Linux/Mac

```bash
chmod +x create-s3-bucket.sh
./create-s3-bucket.sh
```

**This creates:**
- ✅ Public S3 bucket
- ✅ Bucket policy for public read access
- ✅ Versioning enabled
- ✅ Lifecycle rule (auto-delete after 30 days)
- ✅ Saves bucket name to `.env.s3`

---

## Method 2: AWS Console (Manual)

### Step 1: Create Bucket

1. Go to: https://s3.console.aws.amazon.com/s3/
2. Click **"Create bucket"**
3. **Bucket name:** `smart-alarm-clock-builds-20260416` (must be globally unique)
4. **Region:** Choose nearest (e.g., us-east-1)
5. **Uncheck:** "Block all public access" ⚠️
   - Uncheck all 4 sub-options:
     - [ ] Block public access to buckets and objects granted through new access control lists (ACLs)
     - [ ] Block public access to buckets and objects granted through any access control lists (ACLs)
     - [ ] Block public access to buckets and objects granted through new public bucket or access point policies
     - [ ] Block public and cross-account access to buckets and objects through any public bucket or access point policies
6. **Check:** "I acknowledge that the current settings might result in this bucket and the objects within becoming public"
7. Click **"Create bucket"**

### Step 2: Set Bucket Policy

1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Scroll to **"Bucket policy"**
4. Click **"Edit"**
5. Paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

6. Replace `YOUR-BUCKET-NAME` with your actual bucket name
7. Click **"Save changes"**

### Step 3: Enable Versioning (Optional)

1. Go to **"Properties"** tab
2. Find **"Bucket Versioning"**
3. Click **"Edit"**
4. Select **"Enable"**
5. Click **"Save changes"**

### Step 4: Set Lifecycle Rule (Optional)

1. Go to **"Management"** tab
2. Click **"Create lifecycle rule"**
3. Rule name: `DeleteOldBuilds`
4. Choose: **"Apply to all objects in the bucket"**
5. Check: **"I acknowledge..."**
6. Under **"Lifecycle rule actions"**:
   - Check: **"Expire current versions of objects"**
7. Days after object creation: **30**
8. Click **"Create rule"**

---

## Method 3: AWS CLI (Quick Commands)

```bash
# Set variables
BUCKET_NAME="smart-alarm-clock-builds-$(date +%Y%m%d)"
REGION="us-east-1"

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Disable block public access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set public read policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }]
}'

echo "Bucket created: https://$BUCKET_NAME.s3.$REGION.amazonaws.com/"
```

---

## Using the S3 Bucket

### Upload APK from Local Machine

```bash
# Upload file
aws s3 cp android/app/build/outputs/apk/debug/app-debug.apk s3://YOUR-BUCKET-NAME/

# Public URL will be:
# https://YOUR-BUCKET-NAME.s3.REGION.amazonaws.com/app-debug.apk
```

### Upload from Jenkins

Add to your Jenkinsfile:

```groovy
stage('Upload to S3') {
    steps {
        script {
            def bucketName = env.S3_BUCKET_NAME ?: 'smart-alarm-clock-builds-20260416'
            def apkFile = 'android/app/build/outputs/apk/debug/app-debug.apk'
            def s3Key = "builds/app-debug-${BUILD_NUMBER}.apk"

            sh "aws s3 cp ${apkFile} s3://${bucketName}/${s3Key}"

            def downloadUrl = "https://${bucketName}.s3.us-east-1.amazonaws.com/${s3Key}"
            echo "APK uploaded: ${downloadUrl}"

            // Save URL for later use
            writeFile file: 'apk-url.txt', text: downloadUrl
            archiveArtifacts artifacts: 'apk-url.txt'
        }
    }
}
```

### List Files in Bucket

```bash
aws s3 ls s3://YOUR-BUCKET-NAME/
```

### Download APK

**Direct URL (anyone can access):**
```
https://YOUR-BUCKET-NAME.s3.REGION.amazonaws.com/app-debug.apk
```

**Using AWS CLI:**
```bash
aws s3 cp s3://YOUR-BUCKET-NAME/app-debug.apk ./
```

### Generate Presigned URL (Temporary Access)

If you want time-limited URLs:

```bash
# Generate URL valid for 7 days
aws s3 presign s3://YOUR-BUCKET-NAME/app-debug.apk --expires-in 604800
```

---

## Configure Jenkins to Use S3

### Option 1: Environment Variable

In Jenkins:
1. Go to **Manage Jenkins → System**
2. Under **Global properties**, check **Environment variables**
3. Add variable:
   - Name: `S3_BUCKET_NAME`
   - Value: `your-bucket-name`

### Option 2: Jenkins Credentials

Store AWS credentials securely:

1. **Manage Jenkins → Credentials → System → Global credentials**
2. Click **Add Credentials**
3. Kind: **Secret text**
4. Secret: Your bucket name
5. ID: `s3-bucket-name`

Then in Jenkinsfile:
```groovy
environment {
    S3_BUCKET = credentials('s3-bucket-name')
}
```

### Option 3: IAM Role (Best for EC2)

If Jenkins is on EC2, attach IAM role with S3 permissions:

**IAM Policy:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR-BUCKET-NAME",
                "arn:aws:s3:::YOUR-BUCKET-NAME/*"
            ]
        }
    ]
}
```

---

## Organize Your APKs

### Recommended folder structure:

```
s3://your-bucket/
├── builds/
│   ├── app-debug-1.apk
│   ├── app-debug-2.apk
│   └── app-debug-latest.apk
├── releases/
│   ├── v1.0.0/
│   │   └── app-release-1.0.0.apk
│   └── v1.1.0/
│       └── app-release-1.1.0.apk
└── test/
    └── app-test.apk
```

### Upload with custom key:

```bash
# Upload with custom name/path
aws s3 cp app-debug.apk s3://YOUR-BUCKET/builds/app-debug-${BUILD_NUMBER}.apk

# Copy as "latest"
aws s3 cp app-debug.apk s3://YOUR-BUCKET/builds/app-debug-latest.apk
```

---

## Security Considerations

### ⚠️ Public Access Risks

This bucket is **publicly accessible**. Anyone with the URL can download your APK.

**Acceptable for:**
- ✅ Development/testing builds
- ✅ Internal team sharing
- ✅ Temporary builds (auto-deleted after 30 days)

**NOT recommended for:**
- ❌ Production releases
- ❌ APKs with sensitive data
- ❌ Long-term storage

### 🔒 More Secure Alternatives

**1. Use Presigned URLs**
```bash
# Generate temporary download link (expires in 1 hour)
aws s3 presign s3://YOUR-BUCKET/app.apk --expires-in 3600
```

**2. Require Authentication**
Remove public policy and use AWS credentials to download

**3. Use CloudFront**
Add CloudFront distribution with signed URLs

---

## Cost Estimate

### S3 Pricing (us-east-1):

| Item | Cost |
|------|------|
| Storage | $0.023 per GB/month |
| GET requests | $0.0004 per 1,000 |
| Data transfer out | First 100 GB free/month |

**Example monthly cost:**
- 50 APKs × 50 MB = 2.5 GB storage = **$0.06/month**
- 1,000 downloads = **$0.40/month**
- **Total: ~$0.50/month**

---

## Cleanup

### Delete Bucket (When Done)

**Warning:** This deletes ALL files in the bucket!

```bash
# Delete all files and bucket
aws s3 rb s3://YOUR-BUCKET-NAME --force
```

**Or in AWS Console:**
1. Go to S3
2. Select bucket
3. Click **"Empty"** (delete all objects)
4. Click **"Delete"** (delete bucket)

---

## Troubleshooting

### Error: "Access Denied"

**Solution:** Check bucket policy is set correctly and public access is not blocked.

```bash
# Verify policy
aws s3api get-bucket-policy --bucket YOUR-BUCKET-NAME

# Check public access block
aws s3api get-public-access-block --bucket YOUR-BUCKET-NAME
```

### Error: "Bucket already exists"

**Solution:** Choose a different bucket name (must be globally unique).

```bash
# Use date/time for uniqueness
BUCKET_NAME="smart-alarm-builds-$(date +%Y%m%d-%H%M%S)"
```

### Can't Access APK URL

**Check:**
1. ✅ Bucket policy is set
2. ✅ Public access block is disabled
3. ✅ File exists in bucket
4. ✅ URL format: `https://BUCKET.s3.REGION.amazonaws.com/FILE`

---

## Quick Reference

```bash
# Create bucket
aws s3 mb s3://my-bucket

# Upload file
aws s3 cp file.apk s3://my-bucket/

# List files
aws s3 ls s3://my-bucket/

# Download file
aws s3 cp s3://my-bucket/file.apk ./

# Delete file
aws s3 rm s3://my-bucket/file.apk

# Delete bucket
aws s3 rb s3://my-bucket --force

# Get public URL
echo "https://my-bucket.s3.us-east-1.amazonaws.com/file.apk"
```

---

## Summary

✅ **Create bucket** with public access
✅ **Upload APK** from Jenkins after build
✅ **Share public URL** for easy download
✅ **Auto-delete** old builds after 30 days
✅ **Costs** less than $1/month

**Your build artifacts are now publicly accessible!** 🚀
