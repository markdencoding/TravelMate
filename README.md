# TravelMate

**A Web-Based Travel and Itinerary Planning System**

TravelMate is a full-stack web application that helps travelers organize trips, manage itineraries, track expenses, and access real-time maps and weather information — all in one place.

## Features

- 🔐 **Authentication** — Secure registration, login, and JWT-based sessions
- 🗺️ **Trip Management** — Create, edit, and organize trips
- 📍 **Destinations** — Search and save destinations with map integration
- 📅 **Itinerary Planning** — Day-by-day itinerary with activities
- 💰 **Expense Tracking** — Record and categorize travel expenses
- 🌤️ **Weather Integration** — View weather for your destinations
- 🗾 **Maps Integration** — Location search and map display
- 🔔 **Notifications** — Trip reminders and budget alerts
- 📊 **Dashboard** — Overview of trips, expenses, and upcoming activities

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Backend | Node.js + Express.js |
| Database | Supabase PostgreSQL |
| Authentication | JWT (application-managed) |
| Password Security | bcrypt |
| API Style | REST |
| External APIs | Maps/Location, Weather |

## Project Structure

```
PROJECT NGANI/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client & service modules
│   │   └── utils/          # Constants & utilities
│   └── ...
├── backend/                # Express REST API
│   ├── src/
│   │   ├── config/         # Environment & database config
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helpers & custom errors
│   └── ...
├── database/
│   └── migrations/         # SQL migration files
├── .env.example            # Environment variable template
├── .gitignore
├── DESIGN.md               # Project specification (source of truth)
└── README.md
```

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Git**
- **Supabase** account with a PostgreSQL database

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST.supabase.co:5432/postgres
   JWT_SECRET=your-strong-random-secret
   JWT_EXPIRES_IN=7d
   MAPS_API_KEY=your-maps-api-key
   WEATHER_API_KEY=your-weather-api-key
   ```

3. **Never commit `.env` files** — they are excluded by `.gitignore`.

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migration files in order in the Supabase SQL Editor:
   - `database/migrations/001_create_users.sql`
   - `database/migrations/002_create_trips.sql`
   - ... through `008_create_indexes.sql`
3. Copy your database connection string to `DATABASE_URL` in `.env`.

## Running the Application

### Backend
```bash
cd backend
npm install
npm run dev        # Development (nodemon)
# or
npm start          # Production
```
The API will be available at `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

> During development, the Vite dev server proxies `/api` requests to the backend automatically.

## API Endpoints

### Health
- `GET /api/health` — Server status

### Authentication
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Sign in
- `POST /api/auth/logout` — Sign out
- `GET /api/auth/me` — Current user profile

*Additional endpoints (trips, destinations, itinerary, expenses, maps, weather) will be added incrementally.*

## Testing

```bash
# Test backend health
curl http://localhost:5000/api/health

# Test with the frontend
# Navigate to http://localhost:5173 in your browser
```

## Git Workflow

- `main` — Stable, working version
- `feature/<name>` — Feature branches
- `fix/<name>` — Bug fix branches

Commit messages follow conventional format:
```
feat: add trip management API
fix: resolve login validation error
docs: update README
```

## Design Specification

See [DESIGN.md](./DESIGN.md) for the complete project specification.

## License

ISC
