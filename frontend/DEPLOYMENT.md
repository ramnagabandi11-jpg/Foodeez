# 🚀 Frontend Deployment Guide

This guide will help you deploy the Foodeez frontend applications to connect with your AWS backend at `http://18.60.53.146:3000`.

## 📋 Prerequisites

- Your backend is deployed on AWS: `http://18.60.53.146:3000`
- Node.js 18+ and npm 8+
- Git repository with frontend code
- Accounts for deployment platforms (Vercel/Netlify)

## 🌐 Web Application Deployment

### Option 1: Vercel (Recommended)

#### Customer Web App

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy Customer App**:
```bash
cd customer-app
vercel --prod
```

3. **Environment Variables** (Vercel Dashboard):
- `NEXT_PUBLIC_API_URL`: `http://18.60.53.146:3000/v1`
- `NEXT_PUBLIC_SOCKET_URL`: `http://18.60.53.146:3000`
- `NEXT_PUBLIC_RAZORPAY_KEY`: Your Razorpay key

#### Restaurant Portal

```bash
cd restaurant-portal
vercel --prod
```

Environment Variables:
- `NEXT_PUBLIC_API_URL`: `http://18.60.53.146:3000/v1`
- `NEXT_PUBLIC_SOCKET_URL`: `http://18.60.53.146:3000`

#### Admin Dashboard

```bash
cd admin-dashboard
vercel --prod
```

Environment Variables:
- `NEXT_PUBLIC_API_URL`: `http://18.60.53.146:3000/v1`
- `NEXT_PUBLIC_SOCKET_URL`: `http://18.60.53.146:3000`

### Option 2: Netlify

#### Build Commands

**Customer App**:
```bash
cd customer-app
npm run build
```

**Restaurant Portal**:
```bash
cd restaurant-portal
npm run build
```

**Admin Dashboard**:
```bash
cd admin-dashboard
npm run build
```

#### Netlify Configuration

Create `netlify.toml` in each app:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NEXT_PUBLIC_API_URL = "http://18.60.53.146:3000/v1"
  NEXT_PUBLIC_SOCKET_URL = "http://18.60.53.146:3000"
  NEXT_PUBLIC_APP_ENV = "production"

[[redirects]]
  from = "/uploads/*"
  to = "http://18.60.53.146:3000/uploads/:splat"
  status = 200
```

## 📱 Mobile App Deployment

### Android

#### Customer Mobile App

1. **Build APK**:
```bash
cd mobile/customer-mobile-app
npm run build:android
```

2. **Generate AAB** (for Play Store):
```bash
cd android
./gradlew bundleRelease
```

#### Production Configuration

Update `android/app/build.gradle`:
```gradle
android {
    ...
    defaultConfig {
        ...
        buildConfigField "String", "API_BASE_URL", '"http://18.60.53.146:3000/v1"'
        buildConfigField "String", "SOCKET_URL", '"http://18.60.53.146:3000"'
    }
}
```

### iOS

#### Customer Mobile App

1. **Open Xcode**:
```bash
cd mobile/customer-mobile-app
open ios/FoodeezCustomerApp.xcworkspace
```

2. **Build for Production**:
- Select "Any iOS Device"
- Product → Archive
- Upload to App Store Connect

#### Production Configuration

Update `ios/FoodeezCustomerApp/Info.plist`:
```xml
<key>APIBaseURL</key>
<string>http://18.60.53.146:3000/v1</string>
<key>SocketURL</key>
<string>http://18.60.53.146:3000</string>
```

## 🔧 Production Configuration

### Environment Files

All production `.env.production` files are already configured to point to your AWS backend:

```env
NEXT_PUBLIC_API_URL=http://18.60.53.146:3000/v1
NEXT_PUBLIC_SOCKET_URL=http://18.60.53.146:3000
NEXT_PUBLIC_APP_ENV=production
```

### API Connection Updates

The following files have been updated to connect to your production backend:

#### Web Applications
- `next.config.js` - Updated default API URLs
- `.env.production` files for all apps
- `vercel.json` deployment configurations

#### Mobile Applications
- `src/config/api.ts` - Production API configuration
- Build configurations for Android and iOS

## 🔒 Security Considerations

### HTTPS/SSL

1. **Backend**: Your AWS backend uses HTTP - consider setting up SSL certificate
2. **Frontend**: Vercel/Netlify provide automatic HTTPS
3. **API Calls**: Consider upgrading to HTTPS for production

### CORS Configuration

Your backend should allow requests from your frontend domains:

```javascript
// Backend CORS configuration
const corsOptions = {
  origin: [
    'https://your-customer-app.vercel.app',
    'https://your-restaurant-app.vercel.app',
    'https://your-admin-app.vercel.app'
  ],
  credentials: true
};
```

## 📊 Monitoring and Analytics

### Vercel Analytics

- Automatic analytics for web applications
- Performance metrics
- Error tracking

### Mobile Analytics

Implement analytics in mobile apps:

```typescript
// Example for Firebase Analytics
import analytics from '@react-native-firebase/analytics';

await analytics().logEvent('order_completed', {
  order_id: orderId,
  restaurant_id: restaurantId
});
```

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy-customer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_CUSTOMER }}
          working-directory: ./customer-app

  deploy-restaurant:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_RESTAURANT }}
          working-directory: ./restaurant-portal

  deploy-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_ADMIN }}
          working-directory: ./admin-dashboard
```

## 🧪 Production Testing

### End-to-End Testing

1. **API Connectivity**:
```bash
curl http://18.60.53.146:3000/health
```

2. **Frontend Health**:
- Check all web applications load
- Test user registration/login
- Verify Socket.io connections

### Mobile Testing

1. **TestFlight (iOS)**:
```bash
npm run build:ios
# Upload to App Store Connect for TestFlight
```

2. **Internal Testing (Android)**:
```bash
npm run build:android
# Generate APK and distribute internally
```

## 📱 App Store Submission

### Google Play Store

1. **Prepare Assets**:
- App icons (512x512)
- Feature graphic (1024x500)
- Screenshots (various devices)

2. **Store Listing**:
- App name: "Foodeez - Food Delivery"
- Description: Order delicious food from your favorite restaurants
- Category: Food & Drink

### Apple App Store

1. **App Metadata**:
- App name: "Foodeez"
- Subtitle: "Food Delivery Made Easy"
- App Store Connect setup

## 🎉 Success Metrics

Your deployment is successful when:

✅ **Web Applications**:
- All three apps accessible via HTTPS
- User registration/login working
- API calls responding correctly
- Real-time features working via Socket.io

✅ **Mobile Applications**:
- Apps install and launch correctly
- API connectivity to AWS backend
- Push notifications working
- Core features functional

✅ **Integration**:
- Backend and frontend communicating
- Real-time order tracking working
- Payment integration functional
- User data syncing correctly

## 🆘 Troubleshooting

### Common Issues

**CORS Errors**:
```javascript
// Backend - Add your frontend domains to CORS whitelist
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:3001']
}));
```

**Socket.io Connection Issues**:
```javascript
// Check if backend Socket.io is running
curl http://18.60.53.146:3000/socket.io/
```

**Mobile API Connection**:
```typescript
// Verify API_BASE_URL in mobile app config
console.log('API URL:', API_CONFIG.BASE_URL);
```

## 📞 Support

If you encounter deployment issues:

1. **Backend Issues**: Check AWS ECS logs
2. **Frontend Issues**: Check Vercel/Netlify build logs
3. **Mobile Issues**: Check build logs and device console

**Deployment Status**: 🚀 Your Foodeez platform is production-ready!