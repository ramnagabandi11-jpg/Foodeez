#!/bin/bash

set -e

echo "📦 Starting post-build hooks..."

# Generate build metadata
cat > build-info.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "buildNumber": "${CODEBUILD_BUILD_NUMBER:-'local'}",
  "commitHash": "${CODEBUILD_RESOLVED_SOURCE_VERSION:-'local'}",
  "branch": "${CODEBUILD_SOURCE_VERSION:-'local'}",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "dockerImage": "${REPOSITORY_URI:-'local'}:${IMAGE_TAG:-'latest'}",
  "environment": "${NODE_ENV:-'development'}"
}
EOF

echo "✅ Build metadata generated"

# Run security vulnerability scan on dependencies
echo "🔒 Running security audit on dependencies..."
npm audit --audit-level moderate --json > npm-audit.json || true

# Generate test coverage report
if [ -f "coverage/lcov.info" ]; then
    echo "📊 Test coverage report available"
    # Generate coverage summary
    npx nyc report --reporter=text-summary > coverage-summary.txt || true
fi

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf deployment-package.tar.gz \
    imagedefinitions.json \
    aws-task-definition.json \
    appspec.yml \
    build-info.json \
    scripts/ \
    --exclude='*.git*' \
    --exclude='node_modules' \
    --exclude='coverage' \
    --exclude='dist' || true

# Calculate image size and metadata
if [ ! -z "$REPOSITORY_URI" ] && [ ! -z "$IMAGE_TAG" ]; then
    echo "🔍 Analyzing Docker image..."
    docker inspect $REPOSITORY_URI:$IMAGE_TAG > image-inspect.json || true

    # Get image size
    IMAGE_SIZE=$(docker images $REPOSITORY_URI:$IMAGE_TAG --format "{{.Size}}" || echo "unknown")
    echo "📏 Docker image size: $IMAGE_SIZE"
fi

# Create deployment manifest
cat > deployment-manifest.json << EOF
{
  "application": "foodeez-backend",
  "version": "${IMAGE_TAG:-'latest'}",
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${NODE_ENV:-'development'}",
  "components": {
    "dockerImage": "${REPOSITORY_URI:-'local'}:${IMAGE_TAG:-'latest'}",
    "taskDefinition": "aws-task-definition.json",
    "appSpec": "appspec.yml"
  },
  "healthChecks": {
    "endpoint": "/health",
    "expectedStatus": 200
  }
}
EOF

echo "✅ Deployment manifest created"

# Log build completion
echo "🎉 Post-build hooks completed successfully"
echo "📋 Build Summary:"
echo "  - Build completed at: $(date)"
echo "  - Docker image: ${REPOSITORY_URI:-'local'}:${IMAGE_TAG:-'latest'}"
echo "  - Task definition: aws-task-definition.json"
echo "  - Deployment package: deployment-package.tar.gz"

# Clean up temporary files
rm -f npm-audit.json image-inspect.json || true

echo "🧹 Cleanup completed"