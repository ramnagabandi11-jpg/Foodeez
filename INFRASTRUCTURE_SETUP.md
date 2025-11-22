# Foodeez Platform - Production Infrastructure Setup

## 📋 OVERVIEW

This guide covers the complete production infrastructure setup for the Foodeez food delivery platform, including all 9 applications, database, CI/CD pipeline, and monitoring systems.

## 🏗️ INFRASTRUCTURE ARCHITECTURE

### Cloud Provider: AWS
- **Region:** Mumbai (ap-south-1) - Primary
- **Backup Region:** Singapore (ap-southeast-1)
- **CDN:** Global CloudFlare

### High-Level Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Apps      │    │   Mobile Apps    │    │   Admin Apps    │
│  (Next.js)      │    │  (iOS/Android)   │    │  (All Platforms)│
└─────────┬───────┘    └─────────┬────────┘    └─────────┬───────┘
          │                      │                       │
          └──────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │    (Amazon API Gateway)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Load Balancer         │
                    │  (Application Load Balancer)│
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Auto Scaling Group      │
                    │    (EC2 Instances)         │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Services             │
                    │   (Node.js + Express)     │
                    └─────────────┬─────────────┘
                                 │
                ┌────────────────┴────────────────┐
                │                                  │
    ┌───────────▼────────────┐       ┌───────────▼────────────┐
    │     Database           │       │     Cache & Queue     │
    │  (MongoDB Atlas)       │       │ (Redis + RabbitMQ)    │
    └────────────────────────┘       └────────────────────────┘
```

## 🛠️ STEP-BY-STEP IMPLEMENTATION

### Phase 1: AWS Account Setup

```bash
# 1. Create AWS Account and configure
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Default region: ap-south-1
# Default output format: json

# 2. Create IAM Users
aws iam create-user --user-name foodeez-admin
aws iam create-user --user-name foodeez-developer
aws iam create-user --user-name foodeez-cicd

# 3. Create IAM Roles and Policies
aws iam create-role --role-name foodeez-ec2-role --assume-role-policy-document file://trust-policy.json
aws iam create-role --role-name foodeez-lambda-role --assume-role-policy-document file://lambda-trust-policy.json
```

### Phase 2: VPC and Networking Setup

Create the networking infrastructure:

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=foodeez-vpc}]'

# Create Subnets
aws ec2 create-subnet --vpc-id vpc-xxxxxxxxx --cidr-block 10.0.1.0/24 --availability-zone ap-south-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=foodeez-public-1a}]'
aws ec2 create-subnet --vpc-id vpc-xxxxxxxxx --cidr-block 10.0.2.0/24 --availability-zone ap-south-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=foodeez-public-1b}]'
aws ec2 create-subnet --vpc-id vpc-xxxxxxxxx --cidr-block 10.0.3.0/24 --availability-zone ap-south-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=foodeez-private-1a}]'
aws ec2 create-subnet --vpc-id vpc-xxxxxxxxx --cidr-block 10.0.4.0/24 --availability-zone ap-south-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=foodeez-private-1b}]'

# Create Internet Gateway
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=foodeez-igw}]'

# Create Route Tables
aws ec2 create-route-table --vpc-id vpc-xxxxxxxxx --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=foodeez-rt-public}]'
```

### Phase 3: Security Groups

Create security groups for different services:

```bash
# Security Group for Application Load Balancer
aws ec2 create-security-group --group-name foodeez-alb-sg --description "Security group for ALB" --vpc-id vpc-xxxxxxxxx

aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 443 --cidr 0.0.0.0/0

# Security Group for EC2 Instances
aws ec2 create-security-group --group-name foodeez-ec2-sg --description "Security group for EC2 instances" --vpc-id vpc-xxxxxxxxx

aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 22 --cidr 0.0.0.0/0  # SSH access
aws ec2 authorize-security-group-ingress --group-id sg-xxxxxxxxx --protocol tcp --port 80 --source-group sg-xxxxxxxxx  # From ALB
```

### Phase 4: Database Setup (MongoDB Atlas)

```bash
# Create MongoDB Atlas Cluster
curl --user "{PUBLIC_API_KEY}:{PRIVATE_API_KEY}" --digest --header "Accept: application/json" --header "Content-Type: application/json" --request POST "https://cloud.mongodb.com/api/atlas/v1.0/groups/{GROUP-ID}/clusters" --data '
{
  "name": "foodeez-cluster",
  "providerSettings": {
    "providerName": "AWS",
    "regionName": "AP_SOUTH_1",
    "instanceSizeName": "M30"
  },
  "clusterType": "REPLICASET",
  "replicationFactor": 3,
  "diskSizeGB": 100,
  "providerBackupEnabled": true,
  "autoScaling": {
    "diskGBEnabled": true
  },
  "backupEnabled": true,
  "projectId": "{PROJECT-ID}"
}'
```

### Phase 5: ECS (Elastic Container Service) Setup

```bash
# Create ECS Cluster
aws ecs create-cluster --cluster-name foodeez-cluster --capacity-providers FARGATE FARGATE_SPOT --default-capacity-provider-strategy FARGATE

# Create Task Definition for Backend API
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json

# Create Task Definition for Web Apps
aws ecs register-task-definition --cli-input-json file://webapp-task-definition.json
```

**backend-task-definition.json:**
```json
{
  "family": "foodeez-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::{ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::{ACCOUNT_ID}:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend-api",
      "image": "{ECR_REPOSITORY_URI}:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "{MONGODB_CONNECTION_STRING}"
        },
        {
          "name": "REDIS_URL",
          "value": "{REDIS_CONNECTION_STRING}"
        },
        {
          "name": "JWT_SECRET",
          "value": "{JWT_SECRET}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/foodeez-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Phase 6: Application Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer --name foodeez-alb --subnets subnet-xxxxxxxxx subnet-xxxxxxxxx --security-groups sg-xxxxxxxxx --scheme internet-facing --type application --ip-address-type ipv4

# Create Target Groups
aws elbv2 create-target-group --name foodeez-backend-tg --protocol HTTP --port 3000 --vpc-id vpc-xxxxxxxxx --target-type ip --health-check-path /health --health-check-interval-seconds 30 --health-check-timeout-seconds 5 --healthy-threshold-count 2 --unhealthy-threshold-count 2

aws elbv2 create-target-group --name foodeez-webapp-tg --protocol HTTP --port 80 --vpc-id vpc-xxxxxxxxx --target-type ip --health-check-path / --health-check-interval-seconds 30 --health-check-timeout-seconds 5

# Create Listeners
aws elbv2 create-listener --load-balancer-arn arn:aws:elasticloadbalancing:ap-south-1:{ACCOUNT_ID}:loadbalancer/app/foodeez-alb/xxxxxxxx --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:ap-south-1:{ACCOUNT_ID}:targetgroup/foodeez-webapp-tg/xxxxxxxx

# Add SSL Certificate
aws elbv2 add-listener-certificates --listener-arn arn:aws:elasticloadbalancing:ap-south-1:{ACCOUNT_ID}:listener/app/foodeez-alb/xxxxxxxx --certificates CertificateArn=arn:aws:acm:ap-south-1:{ACCOUNT_ID}:certificate/xxxxxxxx
```

### Phase 7: ECS Service Creation

```bash
# Create Backend Service
aws ecs create-service --cluster foodeez-cluster --service-name foodeez-backend-service --task-definition foodeez-backend:1 --desired-count 2 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx,subnet-xxxxxxxxx],securityGroups=[sg-xxxxxxxxx],assignPublicIp=ENABLED}" --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:ap-south-1:{ACCOUNT_ID}:targetgroup/foodeez-backend-tg/xxxxxxxx,containerName=backend-api,containerPort=3000 --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50" --health-check-grace-period-seconds 60

# Create Web App Service
aws ecs create-service --cluster foodeez-cluster --service-name foodeez-webapp-service --task-definition foodeez-webapp:1 --desired-count 3 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx,subnet-xxxxxxxxx],securityGroups=[sg-xxxxxxxxx],assignPublicIp=ENABLED}" --deployment-configuration "maximumPercent=200,minimumHealthyPercent=50"
```

### Phase 8: Auto Scaling Setup

```bash
# Create Auto Scaling Target for Backend
aws application-autoscaling register-scalable-target --service-namespace ecs --scalable-dimension ecs:service:DesiredCount --resource-id service/foodeez-cluster/foodeez-backend-service --min-capacity 2 --max-capacity 10 --role-arn arn:aws:iam::{ACCOUNT_ID}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService

# Create Auto Scaling Target for Web App
aws application-autoscaling register-scalable-target --service-namespace ecs --scalable-dimension ecs:service:DesiredCount --resource-id service/foodeez-cluster/foodeez-webapp-service --min-capacity 2 --max-capacity 8 --role-arn arn:aws:iam::{ACCOUNT_ID}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService

# Create Scaling Policies
aws application-autoscaling put-scaling-policy --service-namespace ecs --scalable-dimension ecs:service:DesiredCount --resource-id service/foodeez-cluster/foodeez-backend-service --policy-name foodeez-backend-scale-out --policy-type TargetTrackingScaling --target-tracking-scaling-policy-configuration file://backend-scale-out.json
```

**backend-scale-out.json:**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 300,
  "ScaleInCooldown": 300
}
```

### Phase 9: Redis (ElastiCache) Setup

```bash
# Create ElastiCache Subnet Group
aws elasticache create-cache-subnet-group --cache-subnet-group-name foodeez-cache-subnet-group --cache-subnet-group-description "Subnet group for Foodeez Redis" --subnet-ids subnet-xxxxxxxxx subnet-xxxxxxxxx

# Create Redis Cluster
aws elasticache create-replication-group --replication-group-id foodeez-redis --replication-group-description "Redis cluster for Foodeez" --cache-node-type cache.m5.large --engine redis --engine-version 6.x --num-cache-clusters 2 --automatic-failover-enabled --cache-subnet-group-name foodeez-cache-subnet-group --security-group-ids sg-xxxxxxxxx
```

### Phase 10: S3 Buckets

```bash
# Create S3 buckets for different purposes
aws s3 mb s3://foodeez-static-assets --region ap-south-1
aws s3 mb s3://foodeez-user-uploads --region ap-south-1
aws s3 mb s3://foodeez-backups --region ap-south-1

# Configure bucket policies
aws s3api put-bucket-policy --bucket foodeez-static-assets --policy file://static-assets-policy.json

**static-assets-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::foodeez-static-assets/*"
    }
  ]
}
```

### Phase 11: CloudFront Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json:**
```json
{
  "CallerReference": "foodeez-cdn-2024",
  "Comment": "CloudFront distribution for Foodeez platform",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "S3-foodeez-static-assets",
        "DomainName": "foodeez-static-assets.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        },
        "OriginPath": ""
      },
      {
        "Id": "ALB-foodeez",
        "DomainName": "foodeez-alb-xxxxxxxx.ap-south-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only",
          "OriginSslProtocols": {
            "Quantity": 2,
            "Items": ["TLSv1.1", "TLSv1.2"]
          }
        },
        "OriginPath": ""
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ALB-foodeez",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "/static/*",
        "TargetOriginId": "S3-foodeez-static-assets",
        "ViewerProtocolPolicy": "https-only",
        "AllowedMethods": {
          "Quantity": 2,
          "Items": ["GET", "HEAD"],
          "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
          }
        },
        "ForwardedValues": {
          "QueryString": false,
          "Cookies": {
            "Forward": "none"
          }
        },
        "MinTTL": 86400,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_All",
  "Aliases": {
    "Quantity": 2,
    "Items": ["api.foodeez.com", "cdn.foodeez.com"]
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": false,
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.1_2016",
    "Certificate": "arn:aws:acm:us-east-1:{ACCOUNT_ID}:certificate/xxxxxxxx"
  },
  "Restrictions": {
    "GeoRestriction": {
      "RestrictionType": "none",
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/404.html",
        "ResponseCode": "404",
        "ErrorCachingMinTTL": 30
      }
    ]
  }
}
```

### Phase 12: Route 53 (DNS Setup)

```bash
# Create Hosted Zone
aws route53 create-hosted-zone --name foodeez.com --caller-reference foodeez-domain-2024

# Create A Records
aws route53 change-resource-record-sets --hosted-zone-id Z3EXAMPLE --change-batch file://a-records.json
```

**a-records.json:**
```json
{
  "Comment": "Create A records for Foodeez",
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.foodeez.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234567890.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "cdn.foodeez.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "d1234567890.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
```

### Phase 13: SSL Certificates (AWS Certificate Manager)

```bash
# Request SSL Certificate
aws acm request-certificate --domain-name foodeez.com --subject-alternative-names "*.foodeez.com" --validation-method DNS
```

### Phase 14: CloudWatch Alarms

```bash
# Create CloudWatch Alarms for monitoring
aws cloudwatch put-metric-alarm --alarm-name foodeez-backend-cpu-high --alarm-description "Backend CPU utilization is high" --metric-name CPUUtilization --namespace AWS/ECS --dimensions Name=ServiceName,Value=foodeez-backend-service Name=ClusterName,Value=foodeez-cluster --statistic Average --period 300 --threshold 80 --comparison-operator GreaterThanThreshold --evaluation-periods 2

# Create alarm for backend errors
aws cloudwatch put-metric-alarm --alarm-name foodeez-backend-errors-high --alarm-description "Backend error rate is high" --metric-name 5XXError --namespace AWS/ApplicationELB --dimensions Name=LoadBalancer,Value=app/foodeez-alb/xxxxxxxx --statistic Sum --period 60 --threshold 10 --comparison-operator GreaterThanThreshold --evaluation-periods 2
```

### Phase 15: Backup and Disaster Recovery

```bash
# Create EBS snapshots
aws ec2 create-snapshot --volume-id vol-xxxxxxxxx --description "Foodeez database backup"

# Set up backup schedule using AWS Backup
aws backup create-backup-plan --backup-plan file://backup-plan.json

**backup-plan.json:**
```json
{
  "BackupPlan": {
    "BackupPlanName": "Foodeez-Backup-Plan",
    "BackupPlanRule": [
      {
        "RuleName": "Daily-Backups",
        "TargetBackupVault": "Foodeez-Backup-Vault",
        "ScheduleExpression": "cron(0 2 ? * * *)",
        "Lifecycle": {
          "DeleteAfterDays": 30
        }
      }
    ]
  }
}
```

## 🔧 DEPLOYMENT SCRIPTS

### Create deployment script

```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e

echo "🚀 Starting Foodeez Platform Deployment..."

# Configuration
AWS_REGION="ap-south-1"
ECR_REPOSITORY="foodeez-backend"
ECR_REGISTRY="{ACCOUNT_ID}.dkr.ecr.ap-south-1.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build and push backend Docker image
echo "📦 Building backend Docker image..."
docker build -t $ECR_REPOSITORY:latest ./backend
docker tag $ECR_REPOSITORY:latest $ECR_REGISTRY/$ECR_REPOSITORY:latest

echo "📤 Pushing backend image to ECR..."
docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

# Update ECS task definition
echo "🔄 Updating ECS task definition..."
TASK_DEF=$(aws ecs describe-task-definition --task-definition foodeez-backend --query 'taskDefinition')
NEW_TASK_DEF=$(echo $TASK_DEF | jq '.containerDefinitions[0].image="'$ECR_REGISTRY/$ECR_REPOSITORY:latest'"')
NEW_TASK_INFO=$(aws ecs register-task-definition --container-definitions "$NEW_TASK_DEF" --family foodeez-backend)

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service --cluster foodeez-cluster --service foodeez-backend-service --task-definition foodeez-backend:$(echo $NEW_TASK_INFO | jq -r '.taskDefinition.revision')

echo "✅ Deployment completed successfully!"

# Health check
echo "🏥 Performing health check..."
sleep 30
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.foodeez.com/health)
if [ $HEALTH_CHECK = "200" ]; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed with status: $HEALTH_CHECK"
    exit 1
fi
```

### Rollback script

```bash
#!/bin/bash
# rollback.sh - Rollback script

set -e

echo "🔙 Starting rollback..."

# Get previous task definition
PREV_TASK_DEF=$(aws ecs describe-task-definition --task-definition foodeez-backend --query 'taskDefinition.revision' --output text)
PREV_REV=$((PREV_TASK_DEF - 1))

echo "🔄 Rolling back to revision: $PREV_REV"

# Update service with previous revision
aws ecs update-service --cluster foodeez-cluster --service foodeez-backend-service --task-definition foodeez-backend:$PREV_REV

echo "✅ Rollback completed!"
```

## 📊 MONITORING SETUP

### Create CloudWatch Dashboard

```bash
aws cloudwatch put-dashboard --dashboard-name Foodeez-Metrics --dashboard-body file://dashboard.json
```

**dashboard.json:**
```json
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "foodeez-backend-service", "ClusterName", "foodeez-cluster"],
          [".", ".", "ServiceName", "foodeez-webapp-service", "."]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "ap-south-1",
        "title": "ECS CPU Utilization",
        "period": 300
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/foodeez-alb/xxxxxxxx"],
          [".", "TargetResponseTime", ".", "."],
          [".", "HTTPCode_Target_2XX_Count", ".", "."],
          [".", "HTTPCode_Target_5XX_Count", ".", "."]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "ap-south-1",
        "title": "Load Balancer Metrics",
        "period": 60
      }
    }
  ]
}
```

## 🚀 NEXT STEPS AFTER INFRASTRUCTURE SETUP

1. **Configure CI/CD Pipeline** (GitHub Actions)
2. **Set up Monitoring and Alerting** (Datadog, Sentry)
3. **Implement SSL/TLS Certificates**
4. **Configure Domain Names and DNS**
5. **Set up Email Services** (SES)
6. **Configure Third-party Integrations**
7. **Perform Load Testing**
8. **Set up Backup and Disaster Recovery**

This infrastructure setup provides a production-ready, scalable, and secure foundation for the Foodeez platform with high availability, auto-scaling, monitoring, and disaster recovery capabilities.