
# Flight Deals API

A modern, extensible API for searching and storing flight deals, built with NestJS, Prisma, and PostgreSQL.

## Features
- Search for flight offers using pluggable providers
- Store search history and results in a PostgreSQL database
- Modular architecture with support for additional providers
- Redis integration for caching (optional)
- Prisma ORM for type-safe database access
- End-to-end and unit tests

## Project Structure
```
flight-deals-api/
├── prisma/                # Prisma schema and migrations
├── src/
│   ├── app.*              # Main NestJS app files
│   ├── search/            # Search API, DTOs, models, and service
│   ├── providers/         # Flight provider interface and mock provider
│   ├── redis/             # Redis integration
│   └── prisma/            # Prisma service integration
├── test/                  # End-to-end tests
├── package.json           # Project dependencies and scripts
├── docker-compose.yml     # Local development stack
└── README.md              # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database
- (Optional) Redis for caching

### Installation
```bash
cd flight-deals-api
npm install
```

### Environment Variables
Create a `.env` file in the root of `flight-deals-api/`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/flightdeals
REDIS_URL=redis://localhost:6379
```

### Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Running the API
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`.

### Running Tests
```bash
npm run test
npm run test:e2e
```

## API Endpoints
- `POST /search/flights` — Search for flight offers
- (More endpoints can be added as the project grows)

## Extending Providers
To add a new flight provider:
1. Implement the `Provider` interface in `src/providers/`.
2. Register your provider in `providers.module.ts`.

## License
MIT
