#!/bin/bash

# AWS S3 Deployment Script for Foodeez Frontend Applications
# This script deploys all web applications to AWS S3 + CloudFront

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
AWS_REGION="ap-south-1"
BACKEND_API_URL="http://18.60.53.146:3000"
BUILD_DIR=".next"

echo -e "${YELLOW}🚀 Starting Foodeez Frontend AWS Deployment${NC}"

# Function to deploy app to S3
deploy_to_s3() {
    local app_name=$1
    local bucket_name=$2
    local app_dir=$3

    echo -e "\n${YELLOW}📦 Building ${app_name}...${NC}"

    # Build the application
    cd "$app_dir"

    # Set environment variables for production
    export NEXT_PUBLIC_API_URL="${BACKEND_API_URL}/v1"
    export NEXT_PUBLIC_SOCKET_URL="${BACKEND_API_URL}"
    export NEXT_PUBLIC_APP_ENV="production"

    # Build the app
    npm run build

    echo -e "${GREEN}✅ ${app_name} build completed${NC}"

    # Upload to S3
    echo -e "${YELLOW}📤 Uploading ${app_name} to S3 bucket: ${bucket_name}...${NC}"

    # Sync build files to S3
    aws s3 sync "${BUILD_DIR}/" "s3://${bucket_name}/" \
        --delete \
        --region "${AWS_REGION}" \
        --exclude ".next/cache/*" \
        --exclude "node_modules/*"

    # Set website configuration
    aws s3 website "s3://${bucket_name}/" \
        --index-document index.html \
        --error-document 404.html \
        --region "${AWS_REGION}"

    echo -e "${GREEN}✅ ${app_name} deployed to S3${NC}"

    cd ..
}

# Deploy all web applications
echo -e "\n${YELLOW}🏗️  Deploying all Foodeez applications to AWS...${NC}"

# Deploy Customer App
deploy_to_s3 "Customer App" "foodeez-customer-app" "customer-app"

# Deploy Restaurant Portal
deploy_to_s3 "Restaurant Portal" "foodeez-restaurant-portal" "restaurant-portal"

# Deploy Admin Dashboard
deploy_to_s3 "Admin Dashboard" "foodeez-admin-dashboard" "admin-dashboard"

echo -e "\n${GREEN}🎉 All Foodeez frontend applications deployed successfully to AWS S3!${NC}"

# Display bucket information
echo -e "\n${YELLOW}📋 Deployment Summary:${NC}"
echo -e "${GREEN}• Customer App: https://foodeez-customer-app.s3.${AWS_REGION}.amazonaws.com${NC}"
echo -e "${GREEN}• Restaurant Portal: https://foodeez-restaurant-portal.s3.${AWS_REGION}.amazonaws.com${NC}"
echo -e "${GREEN}• Admin Dashboard: https://foodeez-admin-dashboard.s3.${AWS_REGION}.amazonaws.com${NC}"

echo -e "\n${YELLOW}🌐 Next Steps:${NC}"
echo "1. Set up AWS Certificate Manager for SSL certificates"
echo "2. Create CloudFront distributions for CDN"
echo "3. Configure Route 53 DNS records"
echo "4. Update Amplify configuration for mobile apps"
echo "5. Set up CodePipeline for CI/CD"

echo -e "\n${GREEN}✨ Deployment completed successfully!${NC}"