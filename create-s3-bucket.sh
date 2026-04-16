#!/bin/bash
# Create S3 bucket for APK builds with public access

set -e

# Configuration
BUCKET_NAME="smart-alarm-clock-builds-$(date +%Y%m%d)"
REGION="us-east-1"  # Change to your preferred region

echo "========================================"
echo "Creating S3 Bucket for APK Builds"
echo "========================================"
echo ""
echo "Bucket name: $BUCKET_NAME"
echo "Region: $REGION"
echo ""

# Create bucket
echo "Step 1: Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Disable Block Public Access
echo "Step 2: Configuring public access..."
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Create bucket policy for public read access
echo "Step 3: Setting bucket policy..."
cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

# Enable versioning (optional)
echo "Step 4: Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket $BUCKET_NAME \
    --versioning-configuration Status=Enabled

# Set lifecycle rule to delete old builds (optional)
echo "Step 5: Setting lifecycle rule (delete after 30 days)..."
cat > /tmp/lifecycle.json <<EOF
{
    "Rules": [
        {
            "Id": "DeleteOldBuilds",
            "Status": "Enabled",
            "Filter": {
                "Prefix": ""
            },
            "Expiration": {
                "Days": 30
            }
        }
    ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
    --bucket $BUCKET_NAME \
    --lifecycle-configuration file:///tmp/lifecycle.json

echo ""
echo "========================================"
echo "✅ S3 Bucket Created Successfully!"
echo "========================================"
echo ""
echo "Bucket Name: $BUCKET_NAME"
echo "Region: $REGION"
echo "Public URL: https://$BUCKET_NAME.s3.$REGION.amazonaws.com/"
echo ""
echo "Example APK URL:"
echo "https://$BUCKET_NAME.s3.$REGION.amazonaws.com/app-debug-1.apk"
echo ""
echo "To upload APK:"
echo "  aws s3 cp app-debug.apk s3://$BUCKET_NAME/"
echo ""
echo "To list files:"
echo "  aws s3 ls s3://$BUCKET_NAME/"
echo ""
echo "To delete bucket (when done):"
echo "  aws s3 rb s3://$BUCKET_NAME --force"
echo ""
