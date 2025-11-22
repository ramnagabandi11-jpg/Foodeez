# Foodeez Frontend Applications

This repository contains the complete frontend applications for the Foodeez food delivery platform, including web applications and mobile apps.

## 📱 Applications Overview

### Web Applications
1. **Customer App** (`customer-app/`) - Customer-facing food ordering application
2. **Restaurant Portal** (`restaurant-portal/`) - Restaurant management dashboard
3. **Admin Dashboard** (`admin-dashboard/`) - Platform administration interface

### Mobile Applications
1. **Customer Mobile App** (`mobile/customer-mobile-app/`) - React Native customer app
2. **Delivery Partner App** (`mobile/delivery-partner-app/`) - React Native delivery app

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- React Native CLI (for mobile apps)
- Android Studio (for Android development)
- Xcode (for iOS development)

### Environment Variables

Create `.env.local` files for each application:

#### Customer App (customer-app/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY=your_razorpay_key_here
```

#### Restaurant Portal (restaurant-portal/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

#### Admin Dashboard (admin-dashboard/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## 📦 Installation & Setup

### Web Applications

1. **Customer Web App**
```bash
cd customer-app
npm install
npm run dev
# Visit http://localhost:3001
```

2. **Restaurant Portal**
```bash
cd restaurant-portal
npm install
npm run dev
# Visit http://localhost:3002
```

3. **Admin Dashboard**
```bash
cd admin-dashboard
npm install
npm run dev
# Visit http://localhost:3003
```

### Mobile Applications

1. **Customer Mobile App**
```bash
cd mobile/customer-mobile-app
npm install
npx react-native run-android
# or
npx react-native run-ios
```

2. **Delivery Partner App**
```bash
cd mobile/delivery-partner-app
npm install
npx react-native run-android
# or
npx react-native run-ios
```

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework**: Next.js 14 (Web), React Native (Mobile)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Web), StyleSheet (Mobile)
- **State Management**: Zustand, React Query
- **Real-time**: Socket.io Client
- **Payment**: Razorpay Integration
- **Navigation**: React Navigation (Mobile)

### Key Features

#### Customer Applications (Web & Mobile)
- 🍽️ Restaurant browsing and search
- 📱 Real-time order tracking
- 💳 Multiple payment methods (Razorpay, Wallet, COD)
- ⭐ Rating and review system
- 📍 Location-based restaurant discovery
- 🛒 Shopping cart management
- 📊 Order history and tracking
- 🔔 Real-time notifications

#### Restaurant Portal
- 📊 Analytics dashboard
- 🍽️ Menu management (drag-and-drop)
- 📋 Order management system
- 💰 Revenue tracking
- ⭐ Review management
- 🕐 Business hours management
- 📈 Performance metrics

#### Admin Dashboard
- 👥 User management (customers, restaurants, delivery partners)
- 🏪 Restaurant approval workflows
- 📊 Platform analytics and reporting
- 💰 Revenue tracking
- 🔧 System administration
- 📋 Audit logs
- 🎯 Platform metrics

#### Delivery Partner App
- 🗺️ Real-time order tracking
- 📍 GPS location sharing
- 📱 Order management
- 💳 Earnings dashboard
- ⭐ Rating system
- 🔔 Order notifications

## 🔧 Development

### Code Structure

```
frontend/
├── customer-app/              # Customer Web App
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Next.js pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and services
│   │   ├── api/              # API integration
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Helper functions
│   └── public/               # Static assets
├── restaurant-portal/        # Restaurant Management
│   └── [similar structure]
├── admin-dashboard/          # Platform Administration
│   └── [similar structure]
└── mobile/                   # React Native Apps
    ├── customer-mobile-app/  # Customer Mobile App
    └── delivery-partner-app/ # Delivery Partner App
```

### Key Components

#### Authentication
- JWT-based authentication
- Role-based access control
- Session management with AsyncStorage
- Token refresh mechanism

#### Real-time Features
- Socket.io integration for real-time updates
- Live order tracking
- Real-time notifications
- Delivery location sharing

#### Payment Integration
- Razorpay payment gateway
- Multiple payment methods
- Wallet management
- Refund processing

#### State Management
- Zustand for global state
- React Query for server state
- Local storage for persistence

## 🎨 UI/UX Guidelines

### Design System
- **Primary Colors**: Red (#ef4444), Green (#22c55e)
- **Typography**: Inter font family
- **Spacing**: Tailwind CSS utility classes
- **Components**: Headless UI + custom styling

### Responsive Design
- Mobile-first approach
- Breakpoint system (sm, md, lg, xl)
- Adaptive layouts
- Touch-friendly interactions

## 🧪 Testing

### Web Applications
```bash
npm test                    # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Mobile Applications
```bash
npm test                    # Run Jest tests
npx react-native run-ios --simulator="iPhone 14"
npx react-native run-android
```

## 📱 Build & Deployment

### Web Applications
```bash
npm run build              # Production build
npm start                  # Start production server
```

### Mobile Applications

#### Android
```bash
cd android
./gradlew assembleRelease  # Generate APK
./gradlew bundleRelease    # Generate AAB
```

#### iOS
```bash
cd ios
xcodebuild -workspace Foodez.xcworkspace -scheme Foodez -configuration Release
```

## 🔗 API Integration

### Base URLs
- **Development**: `http://localhost:3000/v1`
- **Staging**: `https://staging-api.foodeez.com/v1`
- **Production**: `https://api.foodeez.com/v1`

### Key Endpoints
- `/auth/*` - Authentication
- `/restaurants/*` - Restaurant management
- `/orders/*` - Order management
- `/payments/*` - Payment processing
- `/reviews/*` - Reviews and ratings
- `/admin/*` - Platform administration

## 🚨 Error Handling

### Web Applications
- Global error boundaries
- Toast notifications (react-hot-toast)
- Graceful fallbacks
- User-friendly error messages

### Mobile Applications
- Error screens
- Network connectivity checks
- Local storage fallbacks
- Crash reporting

## 🔒 Security

### Authentication
- JWT tokens with expiration
- Refresh token mechanism
- Secure token storage
- Role-based access control

### Data Protection
- Input validation
- XSS prevention
- CSRF protection
- Secure API communication

## 📊 Performance

### Web Applications
- Code splitting with Next.js
- Image optimization
- Lazy loading
- Service workers for caching

### Mobile Applications
- Bundle optimization
- Image optimization with FastImage
- Memory management
- Battery optimization

## 🌐 Internationalization

### Supported Languages
- English (primary)
- Hindi
- Bengali
- Tamil
- Telugu
- Marathi

### Implementation
- react-i18next for internationalization
- RTL support for Arabic languages
- Localized date/time formatting
- Currency localization

## 📱 Platform Support

### Web
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile
- iOS 12+
- Android 7+ (API level 24+)
- React Native 0.72+

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Code Standards
- ESLint + Prettier for code formatting
- TypeScript for type safety
- Conventional commits
- Proper documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Documentation](../backend/docs/api.md)
- [Development Guides](./docs/)
- [Deployment Guides](./docs/deployment/)

### Contact
- Development Team: dev@foodeez.com
- Support: support@foodeez.com
- Discord: [Foodeez Developer Community](https://discord.gg/foodeez)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Advanced search filters
- [ ] Social features (share, follow)
- [ ] Loyalty program integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support expansion
- [ ] Progressive Web Apps (PWAs)
- [ ] Voice search capabilities
- [ ] AR restaurant previews

### Planned Improvements
- [ ] Performance optimization
- [ ] Enhanced accessibility
- [ ] Advanced offline capabilities
- [ ] AI-powered recommendations
- [ ] Integration with more payment gateways

---

**Built with ❤️ by the Foodeez Development Team**