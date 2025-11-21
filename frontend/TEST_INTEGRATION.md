# 🔍 Integration Testing Guide

This guide will help you test the integration between your frontend applications and the deployed AWS backend.

## 🌐 Backend Health Check

### Test API Connectivity

```bash
# Test backend health
curl http://18.60.53.146:3000/health

# Expected Response:
{
  "status": "ok",
  "timestamp": "2024-01-XX",
  "environment": "production",
  "uptime": "1234.56"
}
```

### Test Key API Endpoints

```bash
# Test authentication endpoint
curl -X POST http://18.60.53.146:3000/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test restaurants endpoint
curl http://18.60.53.146:3000/v1/search/restaurants

# Test search endpoint
curl "http://18.60.53.146:3000/v1/search/restaurants?query=pizza"
```

## 📱 Frontend Testing Checklist

### Web Applications

#### Customer Web App
- [ ] **Homepage loads**: http://your-customer-app.vercel.app
- [ ] **Restaurant search**: Search for restaurants
- [ ] **Restaurant details**: Click on a restaurant
- [ ] **User authentication**: Test login/register flow
- [ ] **Shopping cart**: Add items to cart
- [ ] **Order placement**: Complete an order flow
- [ ] **Real-time features**: Socket.io connection working
- [ ] **Payment integration**: Razorpay modal opens

#### Restaurant Portal
- [ ] **Login**: Restaurant owner login
- [ ] **Dashboard**: Load analytics dashboard
- [ ] **Order management**: View incoming orders
- [ ] **Menu management**: Update menu items
- [ ] **Real-time updates**: New order notifications
- [ ] **Analytics**: View revenue charts

#### Admin Dashboard
- [ ] **Admin login**: Super admin authentication
- [ ] **User management**: View and manage users
- [ ] **Restaurant approvals**: Approve pending restaurants
- [ ] **Platform analytics**: View platform metrics
- [ ] **Audit logs**: View admin activity logs

### Mobile Applications

#### Customer Mobile App
```bash
# Test build
cd mobile/customer-mobile-app
npm run build:android  # or run:android
```

Test on device/emulator:
- [ ] **App launches** successfully
- [ ] **API connectivity**: Backend requests working
- [ ] **Authentication**: Login/registration flow
- [ ] **Location services**: GPS permission and functionality
- [ ] **Order tracking**: Real-time updates
- [ ] **Push notifications**: Test notification handling
- [ ] **Offline mode**: Basic offline functionality

#### Delivery Partner App
```bash
# Test build
cd mobile/delivery-partner-app
npm run build:android  # or run:android
```

Test on device/emulator:
- [ ] **Delivery partner login**: Authentication working
- [ ] **Order acceptance**: Accept/reject orders
- [ ] **Location tracking**: GPS sharing working
- [ ] **Earnings display**: Revenue tracking
- [ ] **Navigation**: Map integration working
- [ ] **Order completion**: Mark orders as delivered

## 🔧 Frontend Configuration Test

### Environment Variables

Create a test file `test-env.js`:

```javascript
// Test environment variables
const apiUrls = {
  customer: process.env.NEXT_PUBLIC_API_URL,
  socket: process.env.NEXT_PUBLIC_SOCKET_URL,
  env: process.env.NEXT_PUBLIC_APP_ENV
};

console.log('Environment Variables Test:');
console.log('API URL:', apiUrls.customer);
console.log('Socket URL:', apiUrls.socket);
console.log('App Environment:', apiUrls.env);

// Expected for production:
// API URL: http://18.60.53.146:3000/v1
// Socket URL: http://18.60.53.146:3000
// App Environment: production
```

### API Connection Test

Create `api-connection-test.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://18.60.53.146:3000/v1';

async function testAPIConnection() {
  try {
    // Test health check
    const healthResponse = await axios.get('http://18.60.53.146:3000/health');
    console.log('✅ Backend Health:', healthResponse.data);

    // Test API endpoint
    const restaurantsResponse = await axios.get(`${API_BASE_URL}/search/restaurants`);
    console.log('✅ Restaurants API:', restaurantsResponse.data.success);

    // Test Socket.io connection
    const { io } = require('socket.io-client');
    const socket = io('http://18.60.53.146:3000');

    socket.on('connect', () => {
      console.log('✅ Socket.io Connected:', socket.id);
      socket.disconnect();
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Socket.io Error:', error.message);
    });

  } catch (error) {
    console.error('❌ API Connection Test Failed:', error.message);
  }
}

testAPIConnection();
```

## 🔍 Real-time Features Testing

### Socket.io Events

Test Socket.io connection in browser console:

```javascript
// Test Socket.io connection
const socket = io('http://18.60.53.146:3000');

socket.on('connect', () => {
  console.log('Connected to Socket.io server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.io server');
});

// Test order tracking
socket.emit('track:order', 'test-order-id');
socket.on('order:status', (data) => {
  console.log('Order status update:', data);
});
```

### Order Flow Testing

1. **Complete Order Flow**:
   - Customer places order
   - Restaurant receives notification
   - Delivery partner accepts order
   - Real-time status updates
   - Order completion

2. **Expected Socket Events**:
   ```javascript
   // Customer receives
   'order:status': { status: 'confirmed', orderId: 'xxx' }
   'order:status': { status: 'preparing', orderId: 'xxx' }
   'order:status': { status: 'picked_up', orderId: 'xxx' }
   'order:status': { status: 'delivered', orderId: 'xxx' }

   // Restaurant receives
   'order:new': { order: orderData, timestamp: 'xxx' }

   // Delivery partner receives
   'delivery:request': { order: orderData }
   ```

## 📱 Mobile Device Testing

### Android Testing

1. **Install APK**:
```bash
cd mobile/customer-mobile-app
npm run build:android
# Install generated APK on Android device
```

2. **Test Scenarios**:
- [ ] App launches and loads home screen
- [ ] Restaurant search and filtering
- [ ] Menu browsing and item selection
- [ ] Cart management and checkout
- [ ] Order placement and payment
- [ ] Real-time order tracking
- [ ] Push notifications
- [ ] Profile management

### iOS Testing

1. **Build and Install**:
```bash
cd mobile/customer-mobile-app
npm run build:ios
# Use Xcode to build and install on iOS device/simulator
```

2. **Test Scenarios**:
- Same as Android testing
- [ ] iOS-specific features (Apple Pay, Face ID)
- [ ] iOS notifications
- [ ] App Store guidelines compliance

## 🔒 Security Testing

### HTTPS/SSL Testing

```bash
# Test if backend supports HTTPS (if configured)
curl https://18.60.53.146:3000/health

# Test CORS headers
curl -I -H "Origin: https://your-app.vercel.app" \
  http://18.60.53.146:3000/v1/restaurants
```

Expected CORS Headers:
```
Access-Control-Allow-Origin: https://your-app.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Authentication Testing

```javascript
// Test JWT token handling
const testAuth = async () => {
  try {
    // Test login
    const response = await fetch('http://18.60.53.146:3000/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    const data = await response.json();

    if (data.success && data.data?.accessToken) {
      console.log('✅ Authentication working');

      // Test protected route
      const protectedResponse = await fetch('http://18.60.53.146:3000/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${data.data.accessToken}` }
      });

      console.log('✅ Protected route accessible:', protectedResponse.ok);
    }
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
  }
};

testAuth();
```

## 📊 Performance Testing

### Web Performance

Use browser DevTools:

1. **Load Time**: Apps should load in < 3 seconds
2. **First Contentful Paint**: < 1.5 seconds
3. **Lighthouse Score**: > 90 for performance
4. **Bundle Size**: Optimize JavaScript bundles

### Mobile Performance

```bash
# Measure app startup time
# In mobile app console:
console.time('App Startup');
// ... app initialization
console.timeEnd('App Startup');

// Expected: < 2 seconds
```

## 🐛 Troubleshooting Guide

### Common Issues

#### CORS Errors
**Problem**: `Access-Control-Allow-Origin` error
**Solution**: Update backend CORS configuration:
```javascript
app.use(cors({
  origin: [
    'https://your-customer-app.vercel.app',
    'https://your-restaurant-app.vercel.app',
    'https://your-admin-app.vercel.app'
  ],
  credentials: true
}));
```

#### Socket.io Connection Issues
**Problem**: Socket.io not connecting
**Solution**: Check if backend Socket.io is running:
```bash
curl http://18.60.53.146:3000/socket.io/
```

#### API Timeouts
**Problem**: Requests timing out
**Solution**: Increase timeout or check backend performance:
```javascript
// In frontend axios config
axios.defaults.timeout = 15000; // 15 seconds
```

#### Mobile App Not Connecting
**Problem**: Mobile app can't reach API
**Solution**:
1. Check network connectivity
2. Verify API URL in mobile config
3. Test API accessibility from mobile browser

### Debug Tools

#### Frontend Debugging
```javascript
// Enable debug mode
localStorage.setItem('debug', 'true');

// Check API calls
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
```

#### Backend Debugging
Check AWS ECS logs:
1. Go to AWS Console
2. ECS → Clusters → foodeez-cluster
3. Tasks → Select task → View logs

## ✅ Success Criteria

Your integration is successful when:

### Backend ✅
- [ ] Health endpoint responding
- [ ] All API endpoints accessible
- [ ] Socket.io server running
- [ ] CORS properly configured
- [ ] Database connected

### Frontend Web Apps ✅
- [ ] All apps accessible via HTTPS
- [ ] User authentication working
- [ ] API calls responding correctly
- [ ] Real-time features functional
- [ ] Payment integration working

### Mobile Apps ✅
- [ ] Apps install and launch
- [ ] API connectivity to AWS backend
- [ ] Core features functional
- [ ] Push notifications working
- [ ] Location services working

### End-to-End ✅
- [ ] Complete user journey working
- [ ] Order flow from start to finish
- [ ] Real-time updates across all apps
- [ ] Payment processing functional
- [ ] Error handling working

## 🚀 Launch Checklist

Before going live:

1. **Testing Complete**:
   - [ ] All integration tests passing
   - [ ] Performance benchmarks met
   - [ ] Security measures in place

2. **Monitoring Ready**:
   - [ ] Error tracking configured
   - [ ] Analytics setup
   - [ ] Logging enabled

3. **Documentation Updated**:
   - [ ] API documentation current
   - [ ] User guides ready
   - [ ] Support documentation available

**🎉 Your Foodeez platform is ready for production launch!**