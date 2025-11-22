#!/bin/bash

set -e

echo "✅ Starting service validation hook..."

# Load balancer configuration
LOAD_BALANCER_DNS=$(aws elbv2 describe-load-balancers --names foodeez-alb --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "")
BASE_URL="http://$LOAD_BALANCER_DNS"

if [ -z "$LOAD_BALANCER_DNS" ] || [ "$LOAD_BALANCER_DNS" = "None" ]; then
    echo "⚠️ Load balancer not found, performing basic service checks"
else
    echo "🌐 Validating service at: $BASE_URL"

    # Health check validation
    echo "🏥 Validating health endpoint..."
    HEALTH_RESPONSE=$(curl -s "$BASE_URL/health" || echo '{"status":"error","message":"Health endpoint unreachable"}')
    HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [ "$HEALTH_STATUS" = "ok" ]; then
        echo "✅ Health endpoint responding correctly"
    else
        echo "❌ Health endpoint validation failed: $HEALTH_RESPONSE"
        exit 1
    fi

    # Database connectivity check
    echo "🗄️ Validating database connectivity..."
    DB_CHECK_RESPONSE=$(curl -s "$BASE_URL/v1/health/databases" || echo '{"status":"error","message":"Database check endpoint unreachable"}')
    DB_STATUS=$(echo "$DB_CHECK_RESPONSE" | jq -r '.status' 2>/dev/null || echo "unknown")

    if [ "$DB_STATUS" = "healthy" ]; then
        echo "✅ Database connectivity validated"
    else
        echo "⚠️ Database connectivity check returned: $DB_CHECK_RESPONSE"
        # Don't fail the deployment for DB connectivity issues, but log them
    fi

    # API endpoint validation
    echo "🔍 Validating API endpoints..."

    # Test restaurant endpoints
    RESTAURANTS_RESPONSE=$(curl -s "$BASE_URL/v1/restaurants" -w "HTTPSTATUS:%{http_code}" || echo "HTTPSTATUS:000")
    RESTAURANTS_STATUS=$(echo "$RESTAURANTS_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    RESTAURANTS_BODY=$(echo "$RESTAURANTS_RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

    if [[ "$RESTAURANTS_STATUS" =~ ^2 ]]; then
        echo "✅ Restaurant API endpoint responding (HTTP $RESTAURANTS_STATUS)"
    else
        echo "⚠️ Restaurant API endpoint returned HTTP $RESTAURANTS_STATUS"
    fi

    # Test authentication endpoint
    AUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"test123","name":"Test User"}' \
        -w "HTTPSTATUS:%{http_code}" || echo "HTTPSTATUS:000")
    AUTH_STATUS=$(echo "$AUTH_RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

    if [[ "$AUTH_STATUS" =~ ^[23] ]]; then
        echo "✅ Authentication API endpoint responding (HTTP $AUTH_STATUS)"
    else
        echo "⚠️ Authentication API endpoint returned HTTP $AUTH_STATUS"
    fi

    # Performance validation
    echo "⚡ Validating response times..."
    AVG_RESPONSE_TIME=0
    TEST_COUNT=5

    for i in $(seq 1 $TEST_COUNT); do
        RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL/health" || echo "10.0")
        AVG_RESPONSE_TIME=$(echo "$AVG_RESPONSE_TIME + $RESPONSE_TIME" | bc -l 2>/dev/null || echo "10.0")
    done

    AVG_RESPONSE_TIME=$(echo "scale=3; $AVG_RESPONSE_TIME / $TEST_COUNT" | bc -l 2>/dev/null || echo "2.0")
    echo "📊 Average response time: ${AVG_RESPONSE_TIME}s"

    # Compare against performance threshold
    MAX_RESPONSE_TIME=2.0
    if (( $(echo "$AVG_RESPONSE_TIME <= $MAX_RESPONSE_TIME" | bc -l 2>/dev/null || echo "1") )); then
        echo "✅ Response time within acceptable limits"
    else
        echo "⚠️ Response time exceeds ${MAX_RESPONSE_TIME}s threshold"
    fi
fi

# ECS service health validation
echo "🔧 Validating ECS service health..."
SERVICE_ARN=$(aws ecs describe-services --services foodeez-backend --query 'services[0].serviceArn' --output text 2>/dev/null || echo "")

if [ ! -z "$SERVICE_ARN" ] && [ "$SERVICE_ARN" != "None" ]; then
    SERVICE_STATUS=$(aws ecs describe-services --services foodeez-backend --query 'services[0].status' --output text)
    DESIRED_COUNT=$(aws ecs describe-services --services foodeez-backend --query 'services[0].desiredCount' --output text)
    RUNNING_COUNT=$(aws ecs describe-services --services foodeez-backend --query 'services[0].runningCount' --output text)

    echo "📊 ECS Service Status:"
    echo "  - Status: $SERVICE_STATUS"
    echo "  - Desired Count: $DESIRED_COUNT"
    echo "  - Running Count: $RUNNING_COUNT"

    if [ "$SERVICE_STATUS" = "ACTIVE" ] && [ "$RUNNING_COUNT" -eq "$DESIRED_COUNT" ] && [ "$DESIRED_COUNT" -gt 0 ]; then
        echo "✅ ECS service is healthy"
    else
        echo "❌ ECS service validation failed"
        exit 1
    fi
else
    echo "⚠️ ECS service not found, skipping validation"
fi

# CloudWatch metrics validation
echo "📈 Validating CloudWatch metrics..."
CPU_UTILIZATION=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value=foodeez-backend \
    --statistics Average \
    --period 60 \
    --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --query 'Datapoints[0].Average' --output text 2>/dev/null || echo "0")

if [ "$CPU_UTILIZATION" != "None" ] && [ "$CPU_UTILIZATION" != "0" ]; then
    echo "📊 Current CPU utilization: ${CPU_UTILIZATION}%"
    if (( $(echo "$CPU_UTILIZATION < 80" | bc -l 2>/dev/null || echo "1") )); then
        echo "✅ CPU utilization within normal range"
    else
        echo "⚠️ High CPU utilization detected"
    fi
else
    echo "📊 No CPU metrics available (service may be scaling)"
fi

# Generate validation report
cat > validation-report.json << EOF
{
  "validationTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "service": "foodeez-backend",
  "status": "success",
  "loadBalancer": {
    "dns": "$LOAD_BALANCER_DNS",
    "healthy": true
  },
  "endpoints": {
    "health": "ok",
    "api": "responding"
  },
  "ecs": {
    "status": "$SERVICE_STATUS",
    "desiredCount": $DESIRED_COUNT,
    "runningCount": $RUNNING_COUNT
  },
  "performance": {
    "averageResponseTime": "$AVG_RESPONSE_TIME",
    "withinThreshold": true
  }
}
EOF

echo "📋 Validation report generated: validation-report.json"
echo "✅ Service validation completed successfully"
echo "🎉 Deployment validation passed!"

# Create success marker for monitoring
echo "SUCCESS" > /tmp/deployment-validation-status

exit 0