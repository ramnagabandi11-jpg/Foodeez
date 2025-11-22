# Foodeez Platform - AWS Deployment Guide

This document provides comprehensive instructions for deploying the Foodeez food delivery platform to AWS cloud infrastructure.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Manual Deployment Steps](#manual-deployment-steps)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Alerting](#monitoring-and-alerting)
- [Security Configuration](#security-configuration)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Overview

The Foodeez platform is deployed on AWS using a modern, scalable architecture with:

- **Container Orchestration**: AWS ECS Fargate
- **Databases**: RDS PostgreSQL, DocumentDB, ElastiCache Redis, OpenSearch Service
- **Load Balancing**: Application Load Balancer with CloudFront CDN
- **CI/CD**: AWS CodePipeline with automated testing and deployment
- **Monitoring**: CloudWatch metrics, logs, and alerts
- **Security**: WAF, encryption, IAM roles, and VPC isolation

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.0+)
   ```bash
   pip install awscli
   aws configure
   ```

2. **Docker** (v20.0+)
   ```bash
   docker --version
   ```

3. **Node.js** (v18+)
   ```bash
   node --version
   npm --version
   ```

4. **Optional: AWS CDK** (for advanced deployments)
   ```bash
   npm install -g aws-cdk
   ```

### AWS Account Setup

1. Ensure your AWS account has these services enabled:
   - ECS, ECR, CodePipeline, CodeBuild
   - RDS, DocumentDB, ElastiCache, OpenSearch
   - CloudFront, WAF, Shield
   - CloudWatch, SNS

2. Configure IAM permissions with these policies:
   - AdministratorAccess (for deployment)
   - Or specific service-based policies for production

3. Set up cost monitoring and billing alerts

### Environment Variables

Create a `.env` file with your configuration:

```bash
# AWS Configuration
AWS_DEFAULT_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Application Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (will be loaded from AWS Secrets Manager)
# These are for local development only
DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodeez_prod
DB_USER=foodeez_user
DB_PASSWORD=your_password

# Other Services
MONGODB_URI=mongodb://localhost:27017/foodeez
REDIS_HOST=localhost
REDIS_PORT=6379
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
```

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud                            │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │   CloudFront    │    │        Route 53              │   │
│  │      CDN        │    │       DNS Service           │   │
│  └─────────┬───────┘    └───────────────┬──────────────┘   │
│            │                          │                    │
│  ┌─────────▼───────┐    ┌──────────────▼──────────────┐   │
│  │  Application    │    │       AWS WAF               │   │
│  │ Load Balancer   │    │   Web Application Firewall  │   │
│  └─────────┬───────┘    └──────────────────────────────┘   │
│            │                                                │
│  ┌─────────▼─────────────────────────────────────────┐     │
│  │              ECS Fargate Cluster                  │     │
│  │  ┌────────────────────────────────────────────┐   │     │
│  │  │        Foodeez Backend Service              │   │     │
│  │  │           (Node.js/Express)                 │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  └─────────┬─────────────────────────────────────────┘     │
│            │                                                │
│  ┌─────────▼─────────────────────────────────────────┐     │
│  │              AWS Managed Services                 │     │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │     │
│  │  │   RDS       │ │ DocumentDB  │ │ ElastiCache │ │     │
│  │  │ PostgreSQL   │ │ MongoDB     │ │   Redis     │ │     │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ │     │
│  │  ┌─────────────────────────────────────────────┐   │     │
│  │  │           OpenSearch Service                │   │     │
│  │  │         (Elasticsearch)                      │   │     │
│  │  └─────────────────────────────────────────────┘   │     │
│  └─────────────────────────────────────────────────────┘
```

### Network Architecture

- **VPC**: 10.0.0.0/16 CIDR block
- **Public Subnets**: Load balancer and NAT gateways
- **Private Subnets**: ECS tasks and application services
- **Database Subnets**: Isolated RDS and DocumentDB instances

## Quick Start

### 1. Automated Deployment

Run the deployment script:

```bash
# For production environment
./deploy.sh -e production -r us-east-1

# For staging environment
./deploy.sh -e staging -r us-west-2

# Skip confirmation prompts
./deploy.sh -e production --yes
```

### 2. Manual Deployment

#### Step 1: Deploy Infrastructure

```bash
# Upload CloudFormation templates
aws s3 sync infrastructure/ s3://your-cloudformation-bucket/

# Deploy master stack
aws cloudformation deploy \
  --template-file infrastructure/master.yaml \
  --stack-name foodeez-platform \
  --parameter-overrides file://params.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND
```

#### Step 2: Build and Push Docker Image

```bash
# Build Docker image
docker build -t foodeez-backend .

# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Tag and push image
docker tag foodeez-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/foodeez-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/foodeez-backend:latest
```

#### Step 3: Update ECS Service

```bash
# Update task definition
aws ecs register-task-definition --cli-input-json file://aws-task-definition.json

# Update service
aws ecs update-service \
  --cluster foodeez-cluster \
  --service foodeez-backend \
  --task-definition foodeez-backend:latest
```

## Manual Deployment Steps

### 1. VPC and Networking

Deploy the networking infrastructure first:

```bash
aws cloudformation deploy \
  --template-file infrastructure/vpc.yaml \
  --stack-name foodeez-vpc \
  --parameter-overrides Environment=production
```

### 2. Database Services

Deploy the database stack:

```bash
aws cloudformation deploy \
  --template-file infrastructure/databases.yaml \
  --stack-name foodeez-databases \
  --parameter-overrides \
    Environment=production \
    VpcId=vpc-xxxxxxxxx \
    PrivateSubnetIds=subnet-xxx,subnet-yyy \
    DBInstanceClass=db.t3.medium
```

### 3. ECS and Application

Deploy the application stack:

```bash
aws cloudformation deploy \
  --template-file infrastructure/ecs.yaml \
  --stack-name foodeez-ecs \
  --parameter-overrides \
    Environment=production \
    VpcId=vpc-xxxxxxxxx \
    PrivateSubnetIds=subnet-xxx,subnet-yyy \
    ApplicationSecurityGroupId=sg-xxxxxxxxx
```

### 4. Monitoring and Security

Deploy monitoring and security stacks:

```bash
# Monitoring
aws cloudformation deploy \
  --template-file infrastructure/monitoring.yaml \
  --stack-name foodeez-monitoring \
  --parameter-overrides \
    Environment=production \
    EmailAlertRecipient=alerts@foodeez.com

# Security
aws cloudformation deploy \
  --template-file infrastructure/security.yaml \
  --stack-name foodeez-security \
  --parameter-overrides \
    Environment=production \
    AllowedIPRanges=0.0.0.0/0
```

## CI/CD Pipeline

### Pipeline Stages

1. **Source**: CodeCommit repository
2. **Build**: CodeBuild with Docker image creation
3. **Deploy**: CodeDeploy with blue/green deployment

### Triggering Deployments

Deployments are automatically triggered when code is pushed to the `main` branch:

```bash
git checkout main
git add .
git commit -m "Update application code"
git push origin main
```

### Manual Pipeline Execution

```bash
# Start pipeline execution
aws codepipeline start-pipeline-execution --name foodeez-backend-pipeline

# Monitor pipeline status
aws codepipeline get-pipeline-state --name foodeez-backend-pipeline
```

## Monitoring and Alerting

### CloudWatch Dashboard

Access the dashboard via:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=foodeez-dashboard
```

### Key Metrics

- **CPU Utilization**: >80% triggers alert
- **Memory Utilization**: >85% triggers alert
- **ALB 5XX Errors**: >10 errors/minute triggers alert
- **Response Time**: >5 seconds triggers alert
- **Database Connections**: >80 connections triggers alert

### Log Analysis

View application logs:
```bash
# ECS logs
aws logs tail /ecs/production-foodeez-backend --follow

# Database logs
aws logs tail /rds/production-foodeez-database --follow
```

## Security Configuration

### WAF Rules

- **Common Attacks**: AWSManagedRulesCommonRuleSet
- **SQL Injection**: AWSManagedRulesSQLiRuleSet
- **XSS Protection**: AWSManagedRulesKnownBadInputsRuleSet
- **Rate Limiting**: 2000 requests/minute per IP

### Encryption

- **Data at Rest**: KMS-encrypted EBS volumes and S3 buckets
- **Data in Transit**: TLS 1.2+ for all communications
- **Application Secrets**: AWS Secrets Manager

### Access Control

- **IAM Roles**: Principle of least privilege
- **VPC Isolation**: Private subnets for databases
- **Security Groups**: Restrictive ingress/egress rules

## Cost Optimization

### Resource Sizing

| Resource | Instance Size | Monthly Cost (USD) |
|----------|---------------|-------------------|
| ECS Fargate | 1 vCPU, 2GB RAM | $50-150 |
| RDS PostgreSQL | db.t3.medium | $150-300 |
| DocumentDB | db.t3.medium | $200-400 |
| ElastiCache Redis | cache.t3.micro | $25-50 |
| OpenSearch | small | $100-200 |
| ALB | - | $25-50 |

### Optimization Strategies

1. **Auto Scaling**: Scale based on demand
2. **Spot Instances**: Use Fargate Spot for non-critical workloads
3. **Reserved Instances**: Commit to 1-3 year terms for predictable workloads
4. **S3 Storage**: Use Intelligent-Tiering for static assets
5. **Monitoring**: Set up billing alerts and cost allocation tags

## Troubleshooting

### Common Issues

#### Service Won't Start

1. Check CloudWatch logs for errors
2. Verify task definition is valid
3. Check security group permissions
4. Verify environment variables and secrets

```bash
# Check ECS task status
aws ecs describe-services --cluster foodeez-cluster --services foodeez-backend

# View task logs
aws logs tail /ecs/production-foodeez-backend --follow
```

#### Database Connection Issues

1. Check VPC peering and security groups
2. Verify database credentials in Secrets Manager
3. Check database instance health
4. Review connection limits

```bash
# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier production-foodeez-postgresql

# Test database connectivity
aws rds describe-db-log-files --db-instance-identifier production-foodeez-postgresql
```

#### High CPU/Memory Usage

1. Review application metrics
2. Check for memory leaks
3. Analyze query performance
4. Consider scaling resources

```bash
# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=foodeez-backend \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

### Health Checks

Monitor application health:

```bash
# Check application health endpoint
curl -f https://your-load-balancer-dns/health

# Check ECS service health
aws ecs describe-services --cluster foodeez-cluster --services foodeez-backend \
  --query 'services[0].deployments[*].[desiredCount, runningCount, status]'

# Check load balancer health
aws elbv2 describe-target-health --target-group-arn your-target-group-arn
```

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review CloudWatch alerts
   - Check log error rates
   - Monitor costs

2. **Monthly**:
   - Apply security patches
   - Review IAM permissions
   - Update dependencies

3. **Quarterly**:
   - Run security audits
   - Performance testing
   - Cost optimization review

### Backup and Recovery

- **Database**: Automated daily snapshots with 30-day retention
- **S3 Assets**: Versioning enabled with lifecycle policies
- **Configuration**: CloudFormation templates stored in version control
- **Disaster Recovery**: Multi-AZ deployment with 4-hour RTO

### Scaling Operations

```bash
# Scale ECS service
aws ecs update-service \
  --cluster foodeez-cluster \
  --service foodeez-backend \
  --desired-count 5

# Scale RDS instance
aws rds modify-db-instance \
  --db-instance-identifier production-foodeez-postgresql \
  --db-instance-class db.t3.large \
  --apply-immediately
```

## Support

For deployment issues or questions:

1. **Documentation**: Check this guide first
2. **CloudWatch**: Review metrics and logs
3. **AWS Support**: Contact AWS for infrastructure issues
4. **Team**: Internal escalation for application issues

---

**Important**: This deployment creates AWS resources that will incur costs. Monitor your AWS billing dashboard regularly and implement cost controls as needed.