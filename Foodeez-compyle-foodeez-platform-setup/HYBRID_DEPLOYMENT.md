# Hybrid Deployment: AWS Services + Vercel API + Vercel Frontend

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Vercel        │    │   AWS           │
│   Frontend      │    │   API           │    │   Services      │
│   (Next.js)     │    │   (Serverless)  │    │   (Databases)   │
│                 │    │                 │    │                 │
│  • Static       │◄──►│  • Express      │◄──►│  • PostgreSQL   │
│  • Server-side  │    │  • Serverless   │    │  • MongoDB      │
│  • Global CDN   │    │  • Functions    │    │  • Redis        │
│                 │    │                 │    │  • S3 Storage   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Step 1: Deploy AWS Services (One-time setup)

**In your terminal (with AWS CLI configured):**

```bash
# Navigate to project directory
cd /path/to/Foodeez/Foodeez-compyle-foodeez-platform-setup

# Deploy AWS services
./deploy-aws-services.sh
```

**This creates:**
- ✅ RDS PostgreSQL (Primary database)
- ✅ DocumentDB (MongoDB)
- ✅ ElastiCache Redis (Caching)
- ✅ S3 Bucket (File uploads)
- ✅ VPC with private subnets
- ✅ Security groups and networking

### Step 2: Deploy Backend API to Vercel

**Install Vercel CLI:**
```bash
npm i -g vercel
vercel login
```

**Deploy the API:**
```bash
cd /path/to/Foodeez/Foodeez-compyle-foodeez-platform-setup
vercel --prod
```

### Step 3: Configure Environment Variables in Vercel

**Go to Vercel Dashboard → Project → Settings → Environment Variables**

Add the variables provided by `deploy-aws-services.sh`:

```bash
# Database Connection
POSTGRES_HOST=your-postgres-host.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=foodeez
POSTGRES_USER=foodeez_admin
POSTGRES_PASSWORD=FoodeezSecurePassword123!

MONGODB_URI=mongodb://foodeez_admin:password@docdb-cluster:27017/foodeez

# Redis
REDIS_HOST=your-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=FoodeezRedisAuth123!

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ap-south-2
AWS_S3_BUCKET=your-bucket-name

# App Configuration
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
FRONTEND_URL=your-frontend-domain.vercel.app

# External Services
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Step 4: Deploy Frontend to Vercel

**If you have a frontend (React/Next.js):**

```bash
# Clone/build your frontend
cd /path/to/frontend
npm run build

# Deploy to Vercel
vercel --prod
```

## Cost Breakdown

### AWS Services (Monthly)
- **RDS PostgreSQL (db.t3.micro)**: ~$15-20
- **DocumentDB (db.t3.medium)**: ~$60-80
- **ElastiCache Redis (cache.t3.micro)**: ~$12-15
- **S3 Storage**: ~$5-10 (depending on usage)
- **Data Transfer**: ~$10-20
- **Total AWS**: ~$100-150/month

### Vercel Services (Monthly)
- **Pro Plan**: $20/month
- **Functions**: $0.30 per 100K invocations
- **Bandwidth**: $40 per 100GB
- **Total Vercel**: ~$60-100/month

### 💰 **Total Monthly Cost**: ~$160-250

## Benefits of This Approach

### ✅ **Advantages**
1. **Performance**:
   - Vercel CDN for global frontend delivery
   - Serverless functions auto-scale
   - Database close to users (Mumbai region)

2. **Cost Effective**:
   - No idle server costs
   - Pay-per-use API
   - Generous free tiers

3. **Scalability**:
   - Auto-scaling serverless API
   - Managed databases
   - Global CDN

4. **Developer Experience**:
   - Easy deployments
   - Git integration
   - Preview deployments

### ⚠️ **Considerations**
1. **Cold Starts**: First request may be slower (1-2 seconds)
2. **Database Connection**: Serverless functions need connection pooling
3. **Local Development**: Need to manage AWS credentials locally

## Management Commands

### AWS Services
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name foodeez-vercel-services

# View database logs
aws logs describe-log-groups --log-group-name-prefix /aws/rds

# Update resources
aws cloudformation update-stack \
    --stack-name foodeez-vercel-services \
    --template-body file://infrastructure/vercel-stack.yaml
```

### Vercel API
```bash
# View logs
vercel logs

# Redeploy
vercel --prod

# Check environment variables
vercel env ls
```

## Monitoring & Alerts

### AWS CloudWatch
- Database metrics
- Connection counts
- Storage usage
- Error rates

### Vercel Analytics
- Function execution time
- Error rates
- Geographic distribution
- Bandwidth usage

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   ```bash
   # Check security group allows Vercel access
   # Verify subnet configuration
   # Check database status
   ```

2. **Function Timeout**
   ```bash
   # Increase timeout in vercel.json
   # Optimize database queries
   # Use connection pooling
   ```

3. **CORS Issues**
   ```typescript
   // Update CORS origins in src/app.ts
   cors({
     origin: ['https://your-frontend.vercel.app'],
     credentials: true
   })
   ```

### Debug Commands
```bash
# AWS
aws cloudformation describe-stack-events --stack-name foodeez-vercel-services

# Vercel
vercel logs --follow
vercel inspect
```

## Production Checklist

- [ ] Deploy AWS services using `deploy-aws-services.sh`
- [ ] Configure Vercel environment variables
- [ ] Deploy API to Vercel
- [ ] Test API endpoints
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domains
- [ ] Set up monitoring and alerts
- [ ] Test payment integrations
- [ ] Verify CORS configuration
- [ ] Load test the application

## Next Steps

1. **Run the deployment script**
2. **Configure Vercel environment variables**
3. **Deploy API to Vercel**
4. **Test the deployment**
5. **Set up monitoring**

---

**Need help?** Check the logs or run `vercel logs` to see real-time API issues.