# Flight Deals API

A modern, production-ready API for searching flights, tracking prices, and managing price alerts. Built with NestJS, Prisma, PostgreSQL, and integrated with the Amadeus Flight API.

## Features

### Core Features
- **Real Flight Search** - Amadeus API integration for live flight data
- **Airport Autocomplete** - Smart airport search with 7-day Redis caching
- **Search History** - Track and analyze past flight searches
- **Price Alerts** - Set target prices and get notified when flights drop
- **Email Notifications** - Automated price drop alerts via email
- **Webhook Support** - Integrate with external services for notifications

### Technical Features
- **Pluggable Providers** - Easy to add more flight data sources
- **Redis Caching** - OAuth tokens (25min TTL) and airport data (7-day TTL)
- **Background Jobs** - Bull queue with hourly price checking
- **Error Handling** - Comprehensive exception handling with user-friendly messages
- **Database Storage** - PostgreSQL with Prisma ORM for type-safe queries
- **Simple Frontend** - Responsive web UI for flight search
- **Docker Support** - Development environment with Docker Compose
- **Railway Ready** - Production deployment configuration included

## Project Structure

```
flight-deals-api/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Database migrations
├── src/
│   ├── alerts/                 # Price alerts management
│   ├── common/                 # Shared utilities and filters
│   │   ├── exceptions/         # Custom exception classes
│   │   └── filters/            # Global exception filter
│   ├── jobs/                   # Background job processing
│   │   ├── processors/         # Bull job processors
│   │   └── schedulers/         # Cron job schedulers
│   ├── notifications/          # Email and webhook notifications
│   ├── providers/              # Flight provider implementations
│   │   ├── amadeus/            # Amadeus API integration
│   │   │   ├── amadeus-auth.service.ts
│   │   │   ├── amadeus-transform.service.ts
│   │   │   └── amadeus.provider.ts
│   │   └── mock/               # Mock provider for testing
│   ├── redis/                  # Redis service
│   ├── search/                 # Search API and services
│   │   ├── airport.service.ts  # Airport autocomplete
│   │   └── search.service.ts   # Flight search & history
│   └── prisma/                 # Prisma service
├── public/                     # Frontend assets
│   ├── index.html              # Flight search UI
│   ├── styles.css              # Responsive styles
│   └── app.js                  # Frontend logic
├── test/                       # E2E tests
├── docker-compose.yml          # Local development stack
├── railway.json                # Railway deployment config
├── .railwayignore              # Railway ignore patterns
└── RAILWAY_DEPLOYMENT.md       # Railway deployment guide
```

## Quick Start

### Prerequisites
- Node.js 18+ (recommended v20)
- Docker & Docker Compose (for local development)
- Amadeus API credentials ([Get free account](https://developers.amadeus.com/))

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd flight-deals-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Amadeus credentials:
```env
# Database
DATABASE_URL="postgresql://flight:flightpass@localhost:5432/flight_deals?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Application
PORT=3000
NODE_ENV=development

# Flight Provider
FLIGHT_PROVIDER=amadeus

# Amadeus API (required)
AMADEUS_CLIENT_ID=your_client_id_here
AMADEUS_CLIENT_SECRET=your_client_secret_here
AMADEUS_BASE_URL=https://test.api.amadeus.com

# Email (optional - for price alerts)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

4. **Start Docker services**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

6. **Start the API**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### Verify Installation

Open your browser and navigate to:
- **Frontend**: `http://localhost:3000` - Simple flight search UI
- **API Health**: `http://localhost:3000` - Should return "Flight Deals API"

Test the API:
```bash
# Search airports
curl "http://localhost:3000/search/airports?query=london"

# Search flights
curl -X POST http://localhost:3000/search/flights \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "LAX",
    "destination": "JFK",
    "departDate": "2026-03-15",
    "passengers": 1
  }'
```

## API Endpoints

### Flight Search

**POST /search/flights**

Search for flight offers.

Request:
```json
{
  "origin": "LAX",
  "destination": "JFK",
  "departDate": "2026-03-15",
  "returnDate": "2026-03-22",
  "passengers": 1
}
```

Response:
```json
[
  {
    "id": "uuid",
    "price": 299.99,
    "currency": "USD",
    "duration": 320,
    "stops": 0,
    "segments": [
      {
        "from": "LAX",
        "to": "JFK",
        "carrier": "AA",
        "flightNumber": "123",
        "departure": "2026-03-15T08:00:00Z",
        "arrival": "2026-03-15T16:20:00Z"
      }
    ]
  }
]
```

### Airport Autocomplete

**GET /search/airports?query={search_term}**

Search for airports by name, city, or code.

Response:
```json
[
  {
    "code": "LAX",
    "name": "Los Angeles International Airport",
    "city": "Los Angeles",
    "country": "US"
  }
]
```

### Search History

**GET /search/history**

Get your search history with pagination.

Query Parameters:
- `limit` - Results per page (default: 10)
- `offset` - Skip results (default: 0)
- `startDate` - Filter by start date (ISO 8601)
- `endDate` - Filter by end date (ISO 8601)
- `origin` - Filter by origin airport code
- `destination` - Filter by destination airport code

**GET /search/history/:id**

Get detailed results for a specific search.

**GET /search/popular-routes**

Get the most searched flight routes.

Query Parameters:
- `limit` - Number of routes to return (default: 10)

### Price Alerts

**POST /alerts**

Create a price alert.

Request:
```json
{
  "origin": "LAX",
  "destination": "JFK",
  "departDate": "2026-03-15",
  "returnDate": "2026-03-22",
  "passengers": 1,
  "targetPrice": 250.00,
  "email": "user@example.com",
  "webhook": "https://optional-webhook-url.com"
}
```

**GET /alerts**

List all your price alerts.

**GET /alerts/:id**

Get a specific price alert with notification history.

**PATCH /alerts/:id**

Update a price alert (change target price, pause/resume).

Request:
```json
{
  "targetPrice": 200.00,
  "status": "PAUSED"
}
```

**DELETE /alerts/:id**

Delete a price alert.

## Configuration

### Provider Selection

Switch between flight providers by setting `FLIGHT_PROVIDER` in `.env`:

```env
# Use real Amadeus data
FLIGHT_PROVIDER=amadeus

# Use mock data for testing
FLIGHT_PROVIDER=mock
```

### Redis Caching

Redis is used for:
- **Amadeus OAuth tokens** - 25-minute TTL (auto-refresh)
- **Airport search results** - 7-day TTL (airports rarely change)

To disable Redis, remove `REDIS_URL` from `.env` (not recommended for production).

### Email Notifications

Configure email for price alerts:

**Gmail:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Generate in Google Account settings
```

**Other SMTP:**
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
```

### Background Jobs

Price alerts are checked every hour via cron job. The scheduler runs automatically when the app starts.

To modify the schedule, edit `src/jobs/schedulers/price-check.scheduler.ts`:
```typescript
@Cron(CronExpression.EVERY_HOUR)  // Change to EVERY_30_MINUTES, EVERY_6_HOURS, etc.
```

## Development

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Management

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database (warning: deletes all data)
npx prisma migrate reset

# View database
docker-compose exec postgres psql -U flight -d flight_deals
```

### Redis Management

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# View all keys
KEYS *

# View cached token
GET amadeus:token

# View cached airports
GET airports:london

# Clear all cache
FLUSHALL
```

### Logs and Debugging

```bash
# View app logs
npm run start:dev

# View Docker logs
docker-compose logs -f

# View only API logs
docker-compose logs -f api

# View Bull queue dashboard (optional)
# Install: npm install bull-board
# Access: http://localhost:3000/admin/queues
```

## Production Deployment

### Deploy to Railway

This project is configured for one-click deployment to Railway. See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed instructions.

Quick steps:
1. Push code to GitHub
2. Connect repo to Railway
3. Add PostgreSQL and Redis services
4. Set environment variables (Amadeus credentials)
5. Deploy automatically

### Other Platforms

The app works on any platform that supports:
- Node.js 18+
- PostgreSQL
- Redis
- Environment variables

Popular options: Heroku, Render, Fly.io, AWS, Google Cloud, Azure

### Environment Configuration

**Production checklist:**
- Set `NODE_ENV=production`
- Use production Amadeus URL: `https://api.amadeus.com` (not test URL)
- Enable HTTPS for webhook endpoints
- Set secure SMTP credentials (use app passwords, not account passwords)
- Configure proper DATABASE_URL and REDIS_URL
- Set appropriate PORT (Railway auto-assigns)

## Extending the API

### Adding a New Flight Provider

1. Create provider class implementing `FlightProvider` interface:
```typescript
// src/providers/new-provider/new-provider.ts
@Injectable()
export class NewProvider implements FlightProvider {
  async search(dto: SearchFlightsDto): Promise<FlightOffer[]> {
    // Your implementation
  }
}
```

2. Register in `providers.module.ts`:
```typescript
@Module({
  providers: [NewProvider],
  exports: [NewProvider]
})
export class ProvidersModule {}
```

3. Update factory in `search.module.ts`:
```typescript
useFactory: (mock, amadeus, newProvider) => {
  if (process.env.FLIGHT_PROVIDER === 'new') return newProvider;
  // ...
}
```

### Adding Notification Channels

Extend `notifications.service.ts` to add SMS, Slack, Discord, etc.:
```typescript
async sendSlackNotification(webhook: string, data: any) {
  await this.httpService.post(webhook, {
    text: `Price alert: Flight to ${data.destination} dropped to ${data.price}!`
  });
}
```

## Troubleshooting

### Common Issues

**"Cannot connect to PostgreSQL"**
- Ensure Docker is running: `docker-compose ps`
- Check DATABASE_URL in .env
- Restart services: `docker-compose restart postgres`

**"Redis connection failed"**
- Check Redis is running: `docker-compose ps`
- Verify REDIS_URL format: `redis://localhost:6379`
- Restart: `docker-compose restart redis`

**"Amadeus API unauthorized"**
- Verify credentials in .env
- Check token cache: `redis-cli GET amadeus:token`
- Ensure you're using test URL for test credentials

**"Prisma Client not found"**
- Run: `npx prisma generate`
- Delete `node_modules/.prisma` and regenerate

**"Port 3000 already in use"**
- Change PORT in .env
- Or kill process: `lsof -ti:3000 | xargs kill -9`

## Performance Tips

1. **Redis caching** - Significantly reduces API calls to Amadeus
2. **Database indexing** - Already configured in Prisma schema
3. **Pagination** - Use `limit` and `offset` for large result sets
4. **Background jobs** - Price checks run async, don't block API
5. **Connection pooling** - Prisma handles this automatically

## Monitoring

### Metrics to Track

- API response times
- Amadeus API call volume (free tier: 10 req/sec, 2000/month)
- Redis hit/miss ratio
- Database query performance
- Background job success rate
- Email delivery rate

### Recommended Tools

- Railway Metrics (built-in)
- Sentry (error tracking)
- New Relic / DataDog (APM)
- Prometheus + Grafana (self-hosted)

## Security

- API keys stored in environment variables (never commit .env)
- Input validation with class-validator
- SQL injection protected by Prisma
- Rate limiting recommended (add @nestjs/throttler)
- CORS enabled (configure allowed origins in main.ts)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- [Amadeus API Docs](https://developers.amadeus.com/self-service)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Railway Documentation](https://docs.railway.app/)

## Acknowledgments

- Amadeus for providing free flight API access
- NestJS team for the excellent framework
- Prisma team for the best ORM experience
- Railway for simple deployments
