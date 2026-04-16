# Create S3 bucket for APK builds with public access (PowerShell)

# Configuration
$BUCKET_NAME = "smart-alarm-clock-builds-$(Get-Date -Format 'yyyyMMdd')"
$REGION = "us-east-1"  # Change to your preferred region

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creating S3 Bucket for APK Builds" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Bucket name: $BUCKET_NAME" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host ""

# Create bucket
Write-Host "Step 1: Creating S3 bucket..." -ForegroundColor Blue
aws s3 mb "s3://$BUCKET_NAME" --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create bucket!" -ForegroundColor Red
    exit 1
}

# Disable Block Public Access
Write-Host "Step 2: Configuring public access..." -ForegroundColor Blue
aws s3api put-public-access-block `
    --bucket $BUCKET_NAME `
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Create bucket policy for public read access
Write-Host "Step 3: Setting bucket policy..." -ForegroundColor Blue
$policyJson = @"
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
"@

$policyJson | Out-File -FilePath "$env:TEMP\bucket-policy.json" -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "file://$env:TEMP\bucket-policy.json"

# Enable versioning
Write-Host "Step 4: Enabling versioning..." -ForegroundColor Blue
aws s3api put-bucket-versioning `
    --bucket $BUCKET_NAME `
    --versioning-configuration Status=Enabled

# Set lifecycle rule
Write-Host "Step 5: Setting lifecycle rule (delete after 30 days)..." -ForegroundColor Blue
$lifecycleJson = @"
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
"@

$lifecycleJson | Out-File -FilePath "$env:TEMP\lifecycle.json" -Encoding utf8
aws s3api put-bucket-lifecycle-configuration `
    --bucket $BUCKET_NAME `
    --lifecycle-configuration "file://$env:TEMP\lifecycle.json"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ S3 Bucket Created Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Bucket Name: " -ForegroundColor Yellow -NoNewline
Write-Host $BUCKET_NAME -ForegroundColor White
Write-Host "Region: " -ForegroundColor Yellow -NoNewline
Write-Host $REGION -ForegroundColor White
Write-Host "Public URL: " -ForegroundColor Yellow -NoNewline
Write-Host "https://$BUCKET_NAME.s3.$REGION.amazonaws.com/" -ForegroundColor White
Write-Host ""
Write-Host "Example APK URL:" -ForegroundColor Yellow
Write-Host "https://$BUCKET_NAME.s3.$REGION.amazonaws.com/app-debug-1.apk" -ForegroundColor White
Write-Host ""
Write-Host "To upload APK:" -ForegroundColor Yellow
Write-Host "  aws s3 cp app-debug.apk s3://$BUCKET_NAME/" -ForegroundColor White
Write-Host ""
Write-Host "To list files:" -ForegroundColor Yellow
Write-Host "  aws s3 ls s3://$BUCKET_NAME/" -ForegroundColor White
Write-Host ""
Write-Host "To delete bucket (when done):" -ForegroundColor Yellow
Write-Host "  aws s3 rb s3://$BUCKET_NAME --force" -ForegroundColor White
Write-Host ""

# Save bucket name for Jenkins
Write-Host "Saving bucket name to .env file..." -ForegroundColor Blue
"S3_BUCKET_NAME=$BUCKET_NAME" | Out-File -FilePath ".env.s3" -Encoding utf8
Write-Host "Bucket name saved to .env.s3" -ForegroundColor Green
