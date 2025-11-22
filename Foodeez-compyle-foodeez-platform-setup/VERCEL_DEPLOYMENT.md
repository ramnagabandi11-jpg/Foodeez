# Vercel Deployment Guide for Foodeez Backend

## Quick Deploy to Vercel

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Your Project
Navigate to your project directory and run:
```bash
cd /path/to/Foodeez/Foodeez-compyle-foodeez-platform-setup
vercel --prod
```

## Environment Variables Setup

In your Vercel dashboard, add these environment variables:

### Required Variables
- `NODE_ENV=production`
- `JWT_SECRET` (generate a secure random string)
- `FRONTEND_URL` (your frontend domain)

### Database Variables (if using external services)
- `POSTGRES_HOST`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `MONGODB_URI`
- `REDIS_HOST`
- `REDIS_PASSWORD`
- `ELASTICSEARCH_URL`

### External Services
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`

## Database Setup for Vercel

Since Vercel is serverless, you'll need external database services:

### Options:
1. **MongoDB Atlas** - Free tier available
2. **PlanetScale** - MySQL compatible
3. **Supabase** - PostgreSQL with generous free tier
4. **Neon** - PostgreSQL serverless
5. **Upstash Redis** - Redis serverless

### Example MongoDB Atlas Setup:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free cluster
3. Get connection string
4. Add `MONGODB_URI` to Vercel environment variables

## Deploy Commands

```bash
# Production deployment
vercel --prod

# Preview deployment (for testing)
vercel

# View deployment logs
vercel logs

# View deployment info
vercel inspect
```

## Custom Domain

1. Go to Vercel dashboard
2. Select your project
3. Go to "Domains" tab
4. Add your custom domain
5. Update DNS records as instructed

## Monitoring

- Vercel provides built-in analytics
- Check Vercel dashboard for function execution logs
- Monitor usage in the "Functions" tab

## Troubleshooting

### Common Issues:
1. **Database connection timeouts** - Use serverless databases
2. **Cold starts** - Keep functions warm if needed
3. **Environment variables** - Double-check all required variables
4. **CORS errors** - Add your Vercel domain to CORS origins

### Debug Tips:
- Check `vercel logs` for real-time errors
- Use `console.log()` for debugging (appears in logs)
- Test with `vercel dev` locally first

## Cost Optimization

- Vercel Hobby tier: Free for personal projects
- Pro tier: $20/month for commercial use
- Monitor function execution time
- Optimize database queries
- Use caching where possible