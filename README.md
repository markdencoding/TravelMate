# 🌍 TravelMate

**A Comprehensive, Beautiful, and Resilient Web-Based Travel & Itinerary Planning System**

TravelMate is a full-stack, production-ready web application designed to help travelers effortlessly organize trips, manage day-by-day itineraries, track multi-currency expenses, and access real-time maps and weather forecasts — all wrapped in a stunning, responsive, glassmorphism-inspired user interface.

---

## ✨ Key Features

- 🔐 **Secure Authentication** — JWT-based sessions, `bcrypt` password hashing, and a robust OTP password reset system.
- 🎨 **Premium UI/UX** — Modern, dynamic glassmorphism aesthetics, fluid micro-animations, and a highly responsive layout optimized for mobile and desktop viewports.
- 🗺️ **Trip & Itinerary Management** — Create customized trips, organize day-by-day activities, and visualize your entire travel plan seamlessly.
- 📍 **Destination Intelligence** — Discover and save destinations with rich geographical data.
- 💰 **Multi-Currency Expense Tracking** — Record expenses, automatically detect country currencies, and monitor travel budgets.
- 🌤️ **Real-time Weather & 16-Day Forecasts** — View live weather conditions and extended forecasts for any destination.
- 🗾 **Interactive Maps** — Search locations, reverse-geocode coordinates, and view detailed maps.
- 🔔 **Smart Notifications** — Receive automated trip reminders, budget alerts, and timely travel tips.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite 8, React Router v7, Vanilla CSS (Custom Design System) |
| **Backend** | Node.js + Express.js, JWT, Nodemailer |
| **Database** | PostgreSQL (Hosted on Supabase) |
| **Map Engine** | Leaflet + React-Leaflet |
| **Geocoding** | Mapbox (with OpenStreetMap Nominatim fallback) |
| **Weather Data** | OpenWeatherMap (with Open-Meteo fallback) |

### 🛡️ Unbreakable Architecture (Fallback Providers)
TravelMate is engineered for resilience. If primary third-party APIs fail or API keys are missing, the application automatically switches to open-source fallbacks:
- **Location & Geocoding:** Falls back to **OpenStreetMap Nominatim**.
- **Weather Data:** Falls back to **Open-Meteo** (providing extensive 16-day forecasts completely free).
- **Email Delivery (OTP):** In development, it falls back to **Ethereal** test email accounts to simulate password resets without real credentials.

---

## 📂 Project Structure

```text
TravelMate/
├── frontend/               # React + Vite Single Page Application (SPA)
│   ├── src/
│   │   ├── components/     # Modular UI components (Auth, Dashboard, Maps, Weather, etc.)
│   │   ├── pages/          # Full page layouts
│   │   ├── services/       # Axios API client & endpoints
│   │   └── index.css       # Global Design System (Tokens, Utilities, Glassmorphism)
│   ├── vite.config.js      # Vite configuration & development proxy
│   └── package.json
├── backend/                # Node.js + Express REST API
│   ├── src/
│   │   ├── config/         # Environment variables, DB pooling, CORS
│   │   ├── controllers/    # API request handlers
│   │   ├── middleware/     # JWT Auth, Validation, Error handling
│   │   ├── routes/         # Express routing definitions
│   │   ├── services/       # Core business logic (Email, Weather, Maps, Auth)
│   │   └── server.js       # Application Entry Point
│   └── package.json
├── database/
│   └── migrations/         # Sequential PostgreSQL schema files
├── docs/                   # Documentation & Visual Audits
└── README.md
```

---

## 🚀 Deployment Guide (Production)

TravelMate utilizes a decoupled architecture, ideal for deploying the Frontend to **Vercel** and the Backend to **Render**.

### 1. Backend Deployment (Render)
1. Navigate to your [Render Dashboard](https://dashboard.render.com).
2. Create a new **Web Service** connected to your GitHub repository.
3. Configure the following settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Supply your production Environment Variables (see below).
5. Deploy and copy your new backend URL.

### 2. Frontend Deployment (Vercel)
1. Navigate to your [Vercel Dashboard](https://vercel.com).
2. Import the GitHub repository.
3. Configure the following settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
4. Add the Environment Variable: `VITE_API_URL` and set it to your Render backend URL.
5. Deploy!

---

## 🔐 Environment Variables

Never commit `.env` files. Copy `.env.example` to `.env` locally.

### Backend (`.env` in root)
```env
# Server & Security
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-frontend-url.vercel.app
JWT_SECRET=your-strong-random-secret-key

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST].supabase.co:5432/postgres

# External Integrations (Optional due to Fallbacks)
MAPS_API_KEY=your_mapbox_key
WEATHER_API_KEY=your_openweathermap_key

# SMTP Configuration (REQUIRED FOR PRODUCTION PASSWORD RESET)
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-secure-app-password
SMTP_FROM="TravelMate <noreply@travelmate.com>"
```

### Frontend (Vercel Dashboard)
```env
VITE_API_URL=https://your-render-backend-url.onrender.com
```

---

## 💻 Local Development

**Prerequisites:** Node.js (v18+), npm, and a Supabase PostgreSQL database.

**1. Clone & Configure Database:**
- Execute the SQL files located in `database/migrations/` sequentially inside your Supabase SQL editor.
- Update `DATABASE_URL` in your `.env` file.

**2. Start the Application:**
TravelMate includes a unified script to run both servers concurrently.

```bash
# Install dependencies for both environments
cd backend && npm install
cd ../frontend && npm install
cd ..

# Start full-stack development environment
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **API Health Check:** `GET /api/health`

---
*Built with ❤️ for Seamless Global Travel Planning.*
