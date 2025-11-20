#!/bin/bash

set -e

echo "🔧 Starting before-install deployment hook..."

# Get current task definition and service information
TASK_DEFINITION_ARN=$(aws ecs describe-services --services foodeez-backend --query 'services[0].taskDefinition' --output text)
CURRENT_DESIRED_COUNT=$(aws ecs describe-services --services foodeez-backend --query 'services[0].desiredCount' --output text)

echo "📋 Current service information:"
echo "  - Task Definition: $TASK_DEFINITION_ARN"
echo "  - Desired Count: $CURRENT_DESIRED_COUNT"

# Backup current configuration
echo "💾 Creating backup of current configuration..."
aws ecs describe-task-definition --task-definition $TASK_DEFINITION_ARN > current-task-definition-backup.json

# Get network configuration
VPC_ID=$(aws ecs describe-services --services foodeez-backend --query 'services[0].networkConfiguration.awsvpcConfiguration.subnets[0]' --output text | cut -d '/' -f2 | cut -c 1-8)
echo "🌐 Detected VPC ID: $VPC_ID"

# Check for any running tasks before deployment
RUNNING_TASKS=$(aws ecs list-tasks --service-name foodeez-backend --query 'taskArns' --output text | wc -w)
echo "🔄 Currently running tasks: $RUNNING_TASKS"

# Create CloudWatch alarm for deployment monitoring
ALARM_NAME="foodeez-backend-deployment-$(date +%s)"

aws cloudwatch put-metric-alarm \
    --alarm-name $ALARM_NAME \
    --alarm-description "Monitor foodeez-backend deployment health" \
    --metric-name HTTPCode_Target_5XX_Count \
    --namespace AWS/ApplicationELB \
    --statistic Sum \
    --period 60 \
    --evaluation-periods 2 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=LoadBalancer,Value=app/foodeez-alb/* \
    --treat-missing-data notBreaching || echo "⚠️ Could not create CloudWatch alarm (ALB may not exist)"

echo "🚨 Created deployment monitoring alarm: $ALARM_NAME"

# Store alarm name for cleanup
echo $ALARM_NAME > deployment-alarm.txt

# Pre-deployment health check
echo "🏥 Running pre-deployment health check..."
LOAD_BALANCER_DNS=$(aws elbv2 describe-load-balancers --names foodeez-alb --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "")

if [ ! -z "$LOAD_BALANCER_DNS" ] && [ "$LOAD_BALANCER_DNS" != "None" ]; then
    echo "🌐 Testing current deployment health..."

    # Test health endpoint
    HEALTH_CHECK_URL="http://$LOAD_BALANCER_DNS/health"

    for i in {1..5}; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            echo "✅ Pre-deployment health check passed (attempt $i)"
            break
        else
            echo "⚠️ Health check attempt $i failed, retrying..."
            sleep 10
        fi
    done
else
    echo "⚠️ Load balancer not found, skipping health check"
fi

# Enable enhanced monitoring
echo "📊 Enabling enhanced monitoring..."
aws ecs update-service \
    --service foodeez-backend \
    --enable-execute-command \
    --health-check-grace-period-seconds 300 || echo "⚠️ Could not enable enhanced monitoring"

echo "✅ Before-install hook completed successfully"