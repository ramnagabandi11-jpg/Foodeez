#!/bin/bash

set -e

echo "🎯 Starting after-install deployment hook..."

# Wait for new tasks to start and become healthy
echo "⏳ Waiting for new tasks to start..."
MAX_WAIT_TIME=600  # 10 minutes
WAIT_INTERVAL=10
elapsed_time=0

while [ $elapsed_time -lt $MAX_WAIT_TIME ]; do
    # Get service status
    SERVICE_STATUS=$(aws ecs describe-services --services foodeez-backend --query 'services[0].status' --output text)
    DEPLOYMENTS=$(aws ecs describe-services --services foodeez-backend --query 'services[0].deployments' --output json)

    echo "📊 Service status: $SERVICE_STATUS"
    echo "📋 Current deployments:"
    echo "$DEPLOYMENTS" | jq -r '.[] | "  - Task: \(.taskDefinition | split("/")[-1]) | Status: \(.status) | Desired: \(.desiredCount) | Running: \(.runningCount) | Pending: \(.pendingCount)"'

    # Check if primary deployment is stable
    PRIMARY_DEPLOYMENT=$(echo "$DEPLOYMENTS" | jq -r '.[] | select(.status=="PRIMARY")')
    if [ ! -z "$PRIMARY_DEPLOYMENT" ]; then
        DESIRED_COUNT=$(echo "$PRIMARY_DEPLOYMENT" | jq -r '.desiredCount')
        RUNNING_COUNT=$(echo "$PRIMARY_DEPLOYMENT" | jq -r '.runningCount')

        if [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ] && [ "$RUNNING_COUNT" -gt 0 ]; then
            echo "✅ All desired tasks are running"
            break
        fi
    fi

    sleep $WAIT_INTERVAL
    elapsed_time=$((elapsed_time + WAIT_INTERVAL))
    echo "⏰ Waiting... (${elapsed_time}s elapsed)"
done

if [ $elapsed_time -ge $MAX_WAIT_TIME ]; then
    echo "❌ Timeout waiting for tasks to become healthy"
    exit 1
fi

# Get load balancer DNS name
LOAD_BALANCER_DNS=$(aws elbv2 describe-load-balancers --names foodeez-alb --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "")

if [ ! -z "$LOAD_BALANCER_DNS" ] && [ "$LOAD_BALANCER_DNS" != "None" ]; then
    echo "🌐 Load balancer DNS: $LOAD_BALANCER_DNS"

    # Wait for target group health checks to pass
    echo "🏥 Waiting for target group health checks..."
    TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names foodeez-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "")

    if [ ! -z "$TARGET_GROUP_ARN" ] && [ "$TARGET_GROUP_ARN" != "None" ]; then
        MAX_HEALTH_WAIT=300
        health_elapsed_time=0

        while [ $health_elapsed_time -lt $MAX_HEALTH_WAIT ]; do
            HEALTH_STATUS=$(aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --query 'TargetHealthDescriptions[].TargetHealth.State' --output text | tr '\n' ',' | sed 's/,$//')

            echo "💚 Target health statuses: $HEALTH_STATUS"

            if [[ "$HEALTH_STATUS" == *"healthy"* ]]; then
                HEALTHY_COUNT=$(echo "$HEALTH_STATUS" | tr ',' '\n' | grep -c "healthy" || echo "0")
                TOTAL_COUNT=$(echo "$HEALTH_STATUS" | tr ',' '\n' | wc -l | tr -d ' ')

                if [ "$HEALTHY_COUNT" -eq "$TOTAL_COUNT" ] && [ "$TOTAL_COUNT" -gt 0 ]; then
                    echo "✅ All targets are healthy"
                    break
                fi
            fi

            sleep 15
            health_elapsed_time=$((health_elapsed_time + 15))
            echo "⏰ Waiting for health checks... (${health_elapsed_time}s elapsed)"
        done
    fi

    # Test application health endpoint
    echo "🔍 Testing application health endpoint..."
    HEALTH_CHECK_URL="http://$LOAD_BALANCER_DNS/health"

    for i in {1..10}; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")

        if [ "$HTTP_STATUS" = "200" ]; then
            echo "✅ Health check passed (HTTP $HTTP_STATUS)"

            # Test response time
            RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$HEALTH_CHECK_URL")
            echo "⚡ Response time: ${RESPONSE_TIME}s"
            break
        else
            echo "⚠️ Health check failed (HTTP $HTTP_STATUS), retrying..."
            sleep 15
        fi

        if [ $i -eq 10 ]; then
            echo "❌ Health check failed after 10 attempts"
            exit 1
        fi
    done

    # Test API endpoints
    echo "🔍 Testing key API endpoints..."
    BASE_URL="http://$LOAD_BALANCER_DNS"

    # Test API health
    API_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/v1/health" || echo "000")
    if [ "$API_HEALTH_STATUS" = "200" ]; then
        echo "✅ API health endpoint passed"
    else
        echo "⚠️ API health endpoint returned HTTP $API_HEALTH_STATUS"
    fi

else
    echo "⚠️ Load balancer not found, skipping health checks"
fi

# Create deployment success marker
cat > deployment-status.json << EOF
{
  "status": "success",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "loadBalancerDNS": "$LOAD_BALANCER_DNS",
  "deploymentId": "${CODEBUILD_BUILD_ID:-'local'}",
  "imageTag": "${IMAGE_TAG:-'latest'}"
}
EOF

echo "✅ After-install hook completed successfully"
echo "🎉 Deployment appears to be healthy!"

# Clean up deployment alarm if it exists
if [ -f "deployment-alarm.txt" ]; then
    ALARM_NAME=$(cat deployment-alarm.txt)
    echo "🧹 Cleaning up deployment alarm: $ALARM_NAME"
    aws cloudwatch delete-alarms --alarm-names $ALARM_NAME || true
    rm -f deployment-alarm.txt
fi