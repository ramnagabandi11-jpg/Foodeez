# FoodeeZ Backend API

Node.js + Express backend server for the FoodeeZ food delivery platform.

## Prerequisites

- Node.js v18+
- PostgreSQL 15+
- MongoDB 7+
- Redis 7+
- Elasticsearch/OpenSearch 2.11+

## Quick Start

### 1. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Local Services (Docker Compose)

From the project root:

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MongoDB on port 27017
- Redis on port 6379
- Elasticsearch on port 9200
- pgAdmin on port 5050
- Mongo Express on port 8081

### 4. Verify Database Connections

```bash
npm run typecheck
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

Check health: `http://localhost:3000/health`

## Project Structure

```
backend/
├── src/
│   ├── config/              # Database & service configurations
│   ├── middleware/          # Express middleware
│   ├── models/              # Sequelize & Mongoose models
│   ├── controllers/         # Route controllers
│   ├── services/            # Business logic
│   ├── routes/              # API route definitions
│   ├── validators/          # Request validation schemas
│   ├── utils/               # Utility functions
│   ├── jobs/                # Background jobs
│   ├── sockets/             # Socket.io handlers
│   ├── types/               # TypeScript type definitions
│   ├── app.ts               # Express app configuration
│   ├── server.ts            # Server entry point
│   └── constants.ts         # Application constants
├── migrations/              # Database migrations
├── tests/                   # Test files
├── package.json
├── tsconfig.json
└── .env.example
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with auto-reload
npm run typecheck       # Type checking
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues

# Production
npm run build           # Compile TypeScript to JavaScript
npm start               # Start production server

# Testing
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Database
npm run migrate:create  # Create new migration
npm run migrate:run     # Run pending migrations
npm run migrate:revert  # Revert last migration
npm run seed            # Seed database with test data
```

## API Endpoints

All endpoints are prefixed with `/v1`

### Health & Status
- `GET /health` - Server health check
- `GET /version` - API version information

### Authentication (Weeks 5-6)
- `POST /auth/register` - User registration
- `POST /auth/send-otp` - Send OTP
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/login` - User login
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/logout` - User logout

### More endpoints coming in implementation phases...

## Database Setup

### PostgreSQL
Automatically initialized via Sequelize. Models are defined in `src/models/postgres/`

Key tables:
- users
- customers
- restaurants
- orders
- transactions
- wallets
- ...and 15+ more

### MongoDB
Automatically initialized. Schemas are defined in `src/models/mongodb/`

Collections:
- menu_items
- restaurant_analytics
- delivery_partner_analytics
- platform_logs

### Redis
Connection configured automatically. Used for:
- Session management
- Rate limiting
- Caching
- Geospatial data

## Error Handling

All errors follow a standard response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## Authentication

JWT tokens are used for authentication:
- Access token: Valid for 24 hours
- Refresh token: Valid for 30 days

Include token in header: `Authorization: Bearer <token>`

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `POSTGRES_*` - PostgreSQL connection
- `MONGODB_URI` - MongoDB connection
- `REDIS_*` - Redis connection
- `JWT_SECRET` - JWT signing secret
- `RAZORPAY_*` - Payment gateway keys
- `GOOGLE_MAPS_API_KEY` - Maps API key

## Monitoring

Logs are written to:
- `error.log` - Error logs
- `combined.log` - All logs
- Console output (development)

## Troubleshooting

### Connection Errors
1. Verify Docker containers are running: `docker-compose ps`
2. Check .env file configuration
3. Ensure ports are not in use

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Refused
```bash
# Restart services
docker-compose restart postgres mongodb redis
```

## Development Workflow

1. Create a new feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push to GitHub: `git push origin feature/your-feature`
4. Create a Pull Request
5. After merge, new commits trigger CI/CD pipeline

## Next Steps

1. Implement core models (Week 3-4)
2. Build authentication system (Week 5-6)
3. Create API endpoints (Week 5-6)
4. Implement Socket.io (Week 7-8)
5. Setup admin features (Week 7-8)

See `planning.md` for detailed implementation roadmap.

## Support

For issues or questions, refer to the main project README or contact the development team.
