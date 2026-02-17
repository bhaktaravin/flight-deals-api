# Railway Deployment Guide

This guide covers deploying the Flight Deals API to Railway with PostgreSQL and Redis.

## Prerequisites

- Railway account (sign up at https://railway.app)
- Railway CLI (optional): `npm i -g @railway/cli`
- GitHub repository connected to Railway

## Architecture on Railway

Your application will use these Railway services:
- **Web Service** - NestJS API (this repo)
- **PostgreSQL** - Database for searches, results, and price alerts
- **Redis** - Caching for Amadeus tokens and airport searches

## Deployment Steps

### 1. Create New Project on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `bhaktaravin/flight-deals-api`
4. Railway will auto-detect NestJS and start deployment

### 2. Add PostgreSQL Database

1. In your Railway project, click "+ New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a database and set `DATABASE_URL` automatically

### 3. Add Redis

1. Click "+ New" again
2. Select "Database" → "Redis"
3. Railway will set `REDIS_URL` automatically

### 4. Configure Environment Variables

In your Railway project settings, add these variables:

#### Required - Amadeus API
```
AMADEUS_CLIENT_ID=your_client_id_here
AMADEUS_CLIENT_SECRET=your_client_secret_here
AMADEUS_BASE_URL=https://test.api.amadeus.com
FLIGHT_PROVIDER=amadeus
```

#### Required - Application
```
PORT=3000
NODE_ENV=production
```

#### Optional - Email Notifications (for price alerts)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

**Note:** Railway automatically sets `DATABASE_URL` and `REDIS_URL` when you add those services.

### 5. Update Redis Connection

Railway provides `REDIS_URL` in the format `redis://user:password@host:port`.

Update `src/redis/redis.service.ts` to use Railway's Redis:

```typescript
private client = new Redis(process.env.REDIS_URL || {
  host: 'localhost',
  port: 6379,
});
```

Also update `src/jobs/jobs.module.ts`:

```typescript
BullModule.forRoot({
  redis: process.env.REDIS_URL || {
    host: 'localhost',
    port: 6379,
  },
}),
```

### 6. Deploy

Railway will automatically deploy on every push to `main`. You can also:

```bash
# Manual deploy via CLI
railway up

# View logs
railway logs

# Open deployed app
railway open
```

## Post-Deployment

### Run Migrations

Railway automatically runs `npx prisma migrate deploy` on startup (configured in `railway.json`).

### Verify Deployment

1. Check your Railway deployment URL (e.g., `https://flight-deals-api-production.up.railway.app`)
2. Test endpoints:

```bash
# Health check
curl https://your-app.railway.app

# Search airports
curl "https://your-app.railway.app/search/airports?query=london"

# Search flights
curl -X POST https://your-app.railway.app/search/flights \
  -H "Content-Type: application/json" \
  -d '{"origin":"LAX","destination":"JFK","departDate":"2026-03-15","passengers":1}'
```

### Monitor Price Alerts

Price alert cron job runs every hour automatically. Check logs:

```bash
railway logs --filter "PriceCheckScheduler"
```

## Scaling on Railway

### Horizontal Scaling
- Railway supports multiple instances
- Configure under "Settings" → "Deploy"

### Vertical Scaling
- Railway auto-scales resources based on usage
- Monitor in "Metrics" tab

## Troubleshooting

### Database Connection Issues
```bash
# Check DATABASE_URL is set
railway variables

# View database logs
railway logs --service postgres
```

### Redis Connection Issues
```bash
# Check REDIS_URL is set
railway variables

# Test Redis connection
railway run redis-cli -u $REDIS_URL ping
```

### Application Logs
```bash
# View real-time logs
railway logs --follow

# Filter by log level
railway logs --filter "ERROR"
```

## Cost Estimates

Railway offers:
- **Free Tier**: $5 credit/month (good for testing)
- **Developer Plan**: $10/month (includes $10 credit)
- **Pro Plan**: $20/month (includes $20 credit)

Estimated usage for this app:
- **Web Service**: ~$3-5/month (512MB RAM, low traffic)
- **PostgreSQL**: ~$2-3/month (shared database)
- **Redis**: ~$1-2/month (shared instance)

**Total**: ~$6-10/month for light usage

## Environment Configs

### Development (.env)
```env
DATABASE_URL="postgresql://flight:flightpass@localhost:5432/flight_deals?schema=public"
REDIS_URL="redis://localhost:6379"
FLIGHT_PROVIDER=amadeus
```

### Production (Railway)
```env
# Set in Railway dashboard
DATABASE_URL=<auto-set-by-railway>
REDIS_URL=<auto-set-by-railway>
FLIGHT_PROVIDER=amadeus
AMADEUS_CLIENT_ID=<your-production-key>
AMADEUS_CLIENT_SECRET=<your-production-secret>
NODE_ENV=production
```

## Custom Domain (Optional)

1. Go to Railway project → Settings → Domains
2. Click "Generate Domain" for free Railway subdomain
3. Or add custom domain (e.g., `api.flightdeals.com`)
4. Update DNS records as instructed

## CI/CD

Railway automatically deploys on:
- Push to `main` branch
- Manual trigger via dashboard or CLI

Configure deployment branches in Settings → Deploy.

## Monitoring & Alerts

Set up alerts in Railway:
1. Go to Settings → Notifications
2. Add webhook or email for:
   - Deployment failures
   - High resource usage
   - Downtime alerts

## Backup Strategy

### Database Backups
Railway automatically backs up PostgreSQL daily. To create manual backup:

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

### Restore from Backup
```bash
railway run psql $DATABASE_URL < backup.sql
```

## Support

- Railway Docs: https://docs.railway.app
- Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/railwayapp/railway/issues

## Next Steps

After deployment:
1. Test all endpoints
2. Monitor logs for errors
3. Set up price alert with your email
4. Configure custom domain
5. Set up monitoring/alerts
6. Consider adding APM (Application Performance Monitoring)

Happy deploying! 🚀
