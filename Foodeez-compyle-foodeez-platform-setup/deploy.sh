#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="production"
AWS_REGION="us-east-1"
SKIP_CONFIRMATION=false

# Function to print colored output
print_color() {
    echo -e "${2}${1}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV     Environment to deploy (development|staging|production)"
    echo "  -r, --region REGION        AWS region (default: us-east-1)"
    echo "  -y, --yes                 Skip confirmation prompts"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e staging -r us-west-2"
    echo "  $0 --environment production --yes"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            AWS_REGION="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_color "Unknown option: $1" $RED
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_color "Error: Environment must be development, staging, or production" $RED
    exit 1
fi

print_color "🚀 Starting Foodeez Platform Deployment" $BLUE
print_color "Environment: $ENVIRONMENT" $YELLOW
print_color "AWS Region: $AWS_REGION" $YELLOW

# Check AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    print_color "Error: AWS CLI is not installed" $RED
    print_color "Please install AWS CLI and configure your credentials" $RED
    exit 1
fi

# Check AWS credentials
print_color "🔑 Checking AWS credentials..." $BLUE
AWS_IDENTITY=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
    print_color "✅ AWS credentials configured for account: $AWS_IDENTITY" $GREEN
else
    print_color "❌ AWS credentials not configured or invalid" $RED
    print_color "Please run 'aws configure' to set up your credentials" $RED
    exit 1
fi

# Check if required tools are installed
print_color "🔧 Checking required tools..." $BLUE

# Check AWS CDK
if ! command -v cdk &> /dev/null; then
    print_color "⚠️ AWS CDK not found. Some features may be limited." $YELLOW
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    print_color "❌ Docker is not installed or not running" $RED
    print_color "Please install Docker to build container images" $RED
    exit 1
fi

print_color "✅ Required tools check completed" $GREEN

# Set AWS region
export AWS_DEFAULT_REGION=$AWS_REGION

# Get S3 bucket for CloudFormation templates
S3_BUCKET_NAME="${ENVIRONMENT}-foodeez-cloudformation-${AWS_IDENTITY}"
S3_BUCKET_EXISTS=$(aws s3 ls | grep -c "$S3_BUCKET_NAME" || true)

if [ "$S3_BUCKET_EXISTS" -eq 0 ]; then
    print_color "📦 Creating S3 bucket for CloudFormation templates..." $BLUE
    aws s3 mb "s3://$S3_BUCKET_NAME" --region $AWS_REGION
    print_color "✅ S3 bucket created: $S3_BUCKET_NAME" $GREEN
else
    print_color "✅ S3 bucket already exists: $S3_BUCKET_NAME" $GREEN
fi

# Upload CloudFormation templates to S3
print_color "📤 Uploading CloudFormation templates to S3..." $BLUE
aws s3 sync infrastructure/ "s3://$S3_BUCKET_NAME/cloudformation/" --delete
print_color "✅ CloudFormation templates uploaded" $GREEN

# Generate CloudFormation parameter file
PARAM_FILE="params-${ENVIRONMENT}.json"
cat > "$PARAM_FILE" << EOF
{
  "Environment": "$ENVIRONMENT",
  "EmailAlertRecipient": "alerts@foodeez.com",
  "SlackWebhookURL": "",
  "VpcCidr": "10.0.0.0/16",
  "DBInstanceClass": "db.t3.medium",
  "DBAllocatedStorage": 100,
  "DesiredCount": 2,
  "MaxCapacity": 10,
  "MultiAZ": true,
  "AllowedIPRanges": ["0.0.0.0/0"]
}
EOF

print_color "📋 Generated parameter file: $PARAM_FILE" $GREEN

# Show deployment summary
echo ""
print_color "📊 Deployment Summary:" $BLUE
echo "  • Environment: $ENVIRONMENT"
echo "  • AWS Region: $AWS_REGION"
echo "  • Account ID: $AWS_IDENTITY"
echo "  • S3 Bucket: $S3_BUCKET_NAME"
echo "  • Stack Template: infrastructure/master.yaml"
echo "  • Parameter File: $PARAM_FILE"
echo ""

# Confirmation prompt
if [ "$SKIP_CONFIRMATION" = false ]; then
    print_color "⚠️ This will deploy the complete Foodeez platform infrastructure to AWS." $YELLOW
    print_color "The deployment may take 30-60 minutes and will incur AWS costs." $YELLOW
    echo ""
    read -p "Do you want to proceed? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_color "Deployment cancelled." $RED
        exit 1
    fi
fi

# Deploy CloudFormation stack
STACK_NAME="${ENVIRONMENT}-foodeez-platform"
print_color "🏗️ Deploying CloudFormation stack: $STACK_NAME" $BLUE

# Create or update the stack
aws cloudformation deploy \
    --template-file infrastructure/master.yaml \
    --s3-bucket "$S3_BUCKET_NAME" \
    --s3-prefix cloudformation \
    --stack-name "$STACK_NAME" \
    --parameter-overrides file://"$PARAM_FILE" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --tags Environment=$ENVIRONMENT Project=Foodeez Platform=$ENVIRONMENT \
    --region $AWS_REGION

# Check deployment status
STACK_STATUS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text)

if [[ "$STACK_STATUS" =~ ^CREATE_COMPLETE$|^UPDATE_COMPLETE$ ]]; then
    print_color "✅ CloudFormation stack deployed successfully!" $GREEN
else
    print_color "❌ CloudFormation stack deployment failed!" $RED
    print_color "Stack status: $STACK_STATUS" $RED

    # Show stack events for debugging
    print_color "📋 Recent stack events:" $YELLOW
    aws cloudformation describe-stack-events --stack-name "$STACK_NAME" \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
        --output table
    exit 1
fi

# Get stack outputs
print_color "📋 Getting stack outputs..." $BLUE
LOAD_BALANCER_DNS=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' --output text)
CLOUDWATCH_DASHBOARD=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudWatchDashboardURL`].OutputValue' --output text)
ECR_REPOSITORY=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryURI`].OutputValue' --output text)
CODE_PIPELINE=$(aws cloudformation describe-stacks --stack_NAME "$STACK_NAME" \
    --query 'Stacks[0].Outputs[?OutputKey==`CodePipelineName`].OutputValue' --output text)

# Display deployment results
echo ""
print_color "🎉 Deployment completed successfully!" $GREEN
echo ""
print_color "📍 Access Information:" $BLUE
echo "  • Load Balancer DNS: $LOAD_BALANCER_DNS"
echo "  • Health Check URL: http://$LOAD_BALANCER_DNS/health"
echo ""
print_color "📊 Monitoring:" $BLUE
echo "  • CloudWatch Dashboard: $CLOUDWATCH_DASHBOARD"
echo ""
print_color "🔧 Development Resources:" $BLUE
echo "  • ECR Repository: $ECR_REPOSITORY"
echo "  • CodePipeline: $CODE_PIPELINE"
echo ""

# Post-deployment instructions
print_color "📝 Next Steps:" $YELLOW
echo "1. Push your Docker image to ECR:"
echo "   docker build -t foodeez-backend ."
echo "   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY"
echo "   docker tag foodeez-backend:latest $ECR_REPOSITORY:latest"
echo "   docker push $ECR_REPOSITORY:latest"
echo ""
echo "2. Monitor the deployment using the CodePipeline console"
echo "3. Configure your domain name to point to the Load Balancer"
echo "4. Set up SSL certificate for HTTPS"
echo ""

# Clean up parameter file
rm -f "$PARAM_FILE"

print_color "✅ Deployment script completed successfully!" $GREEN