#!/bin/bash

set -e

echo "🚀 Starting pre-build hooks..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-"production"}
export AWS_REGION=${AWS_DEFAULT_REGION:-"us-east-1"}

# Verify AWS credentials are available
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not available or invalid"
    exit 1
fi

echo "✅ AWS credentials verified"

# Validate required environment variables
required_vars=("AWS_ACCOUNT_ID" "ECR_REPOSITORY_NAME")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

echo "✅ Required environment variables verified"

# Clean up any dangling Docker images
echo "🧹 Cleaning up dangling Docker images..."
docker system prune -f || true

# Validate Dockerfile exists and is readable
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found"
    exit 1
fi

echo "✅ Dockerfile found"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found"
    exit 1
fi

echo "✅ package.json found"

# Display build information
echo "📋 Build Information:"
echo "  - Node Version: $(node --version)"
echo "  - NPM Version: $(npm --version)"
echo "  - Docker Version: $(docker --version)"
echo "  - Build Number: ${CODEBUILD_BUILD_NUMBER:-'local'}"
echo "  - Commit Hash: ${CODEBUILD_RESOLVED_SOURCE_VERSION:-'local'}"
echo "  - Branch: ${CODEBUILD_SOURCE_VERSION:-'local'}"

# Check if we're in a Git repository
if [ -d ".git" ]; then
    echo "  - Git Branch: $(git rev-parse --abbrev-ref HEAD)"
    echo "  - Git Commit: $(git rev-parse HEAD)"
fi

echo "🎯 Pre-build validation completed successfully"