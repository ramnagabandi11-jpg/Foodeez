#!/bin/bash

set -e

echo "🚀 Deploying Foodeez Backend Services to AWS..."
echo "This will set up databases, Redis, and S3 for Vercel deployment"
echo ""

# Configuration
STACK_NAME="foodeez-vercel-services"
REGION="ap-south-2"
ENVIRONMENT="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Configuration:${NC}"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure'${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_USER=$(aws sts get-caller-identity --query Arn --output text | cut -d/ -f2)

echo -e "${GREEN}✅ AWS Account: $AWS_ACCOUNT (${AWS_USER})${NC}"
echo ""

# Deploy CloudFormation stack
echo -e "${YELLOW}🏗️  Deploying CloudFormation stack...${NC}"

aws cloudformation deploy \
    --template-file infrastructure/vercel-stack.yaml \
    --stack-name $STACK_NAME \
    --parameter-overrides Environment=$ENVIRONMENT \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --tags Environment=$ENVIRONMENT Project=Foodeez

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CloudFormation stack deployed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to deploy CloudFormation stack${NC}"
    exit 1
fi

# Get outputs from stack
echo ""
echo -e "${YELLOW}📋 Getting service endpoints...${NC}"

POSTGRES_HOST=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PostgreSQLHost`].OutputValue' \
    --output text)

POSTGRES_PORT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PostgreSQLPort`].OutputValue' \
    --output text)

DOCDB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DocumentDBEndpoint`].OutputValue' \
    --output text)

REDIS_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`RedisEndpoint`].OutputValue' \
    --output text)

S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

# Display environment variables for Vercel
echo ""
echo -e "${GREEN}🎉 AWS Services deployed successfully!${NC}"
echo ""
echo -e "${YELLOW}Add these environment variables to your Vercel project:${NC}"
echo "----------------------------------------"
echo "# PostgreSQL"
echo "POSTGRES_HOST=$POSTGRES_HOST"
echo "POSTGRES_PORT=$POSTGRES_PORT"
echo "POSTGRES_DB=foodeez"
echo "POSTGRES_USER=foodeez_admin"
echo "POSTGRES_PASSWORD=FoodeezSecurePassword123!"
echo ""
echo "# DocumentDB (MongoDB)"
echo "MONGODB_URI=mongodb://foodeez_admin:FoodeezSecurePassword123!@$DOCDB_ENDPOINT:27017/foodeez?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
echo ""
echo "# Redis"
echo "REDIS_HOST=$REDIS_ENDPOINT"
echo "REDIS_PORT=6379"
echo "REDIS_PASSWORD=FoodeezRedisAuth123!"
echo ""
echo "# S3"
echo "AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)"
echo "AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)"
echo "AWS_REGION=$REGION"
echo "AWS_S3_BUCKET=$S3_BUCKET"
echo ""
echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo "1. Save these environment variables in your Vercel project settings"
echo "2. The databases are in private subnets and accessible from Vercel"
echo "3. Default passwords are used - change them for production"
echo "4. It may take 5-10 minutes for databases to become fully available"
echo ""
echo -e "${GREEN}✅ Ready for Vercel deployment!${NC}"