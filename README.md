# Weather Analytics – Comfort Index Dashboard

A full-stack weather analytics application that ranks cities based on a custom **Comfort Index** calculated from temperature, humidity, and wind speed. Built with Node.js/Express backend and React frontend, secured with Auth0 authentication and MFA.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Comfort Index Formula](#comfort-index-formula)
- [Reasoning Behind Variable Weights](#reasoning-behind-variable-weights)
- [Trade-offs Considered](#trade-offs-considered)
- [Cache Design](#cache-design)
- [Auth0 Configuration](#auth0-configuration)
- [Testing](#testing)
- [Bonus Features](#bonus-features)
- [Quick Demo Flow](#quick-demo-flow)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Repository Access](#repository-access)

---

## Features

-  Real-time weather data from OpenWeatherMap API
- Custom Comfort Index scoring (0–100)
- Auth0 authentication with MFA enforcement
-  Dark/Light mode toggle
-  Responsive design (desktop table + mobile cards)
-  Temperature trend graphs per city
-  Frontend sorting and filtering
-  Intelligent caching (5-minute TTL)

---

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **HTTP Client:** Axios
- **Caching:** Node-Cache (TTL 300s)
- **Authentication:** jsonwebtoken + jwks-rsa (Auth0 token validation)
- **Testing:** Jest

### Frontend
- **Framework:** React (Vite)
- **Authentication:** Auth0 React SDK
- **Charts:** react-chartjs-2 + chart.js
- **Styling:** CSS with CSS Variables (theming)

---

## Setup Instructions

### Prerequisites

- Node.js v18+ installed
- npm or yarn
- Auth0 account
- OpenWeatherMap API key

### Clone the Repository

```bash
git clone https://github.com/your-username/weather-analytics.git
cd weather-analytics
```

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

## Environment Variables

### Backend `.env`

Create a `.env` file in the `backend` directory:

```env
PORT=5000
OPENWEATHER_API_KEY=your_openweather_api_key
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=https://weather-api
```

### Frontend `.env`

Create a `.env` file in the `frontend` directory:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=https://weather-api
VITE_BACKEND_URL=http://localhost:5000
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### Open the App

Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Health check |
| GET | `/cities` | Public | List of available cities |
| GET | `/weather/:cityId` | Public | Weather data for a city (returns `{data, cache: HIT/MISS}`) |
| GET | `/debug/cache` | Debug | Cache status (may be protected) |
| GET | `/api/weather/comfort` | Protected | Ranked cities with comfort scores |
| GET | `/api/weather/forecast/:cityId` | Protected | 5-day temperature forecast for a city |

### Protected Endpoint Response Examples

**GET /api/weather/comfort**
```json
{
  "totalCities": 10,
  "generatedAt": "2026-01-17T10:30:00.000Z",
  "processedCache": "MISS",
  "cities": [
    {
      "rank": 1,
      "cityId": 1248991,
      "cityName": "Colombo",
      "tempC": 28,
      "humidity": 75,
      "windSpeed": 3.5,
      "description": "scattered clouds",
      "comfortScore": 72,
      "rawCache": "HIT"
    }
  ]
}
```

**GET /api/weather/forecast/:cityId**
```json
{
  "cityId": 1248991,
  "cityName": "Colombo",
  "points": [
    { "time": "2026-01-17 12:00:00", "tempC": 28 },
    { "time": "2026-01-17 15:00:00", "tempC": 30 }
  ],
  "cache": "MISS"
}
```

---

## Comfort Index Formula

The Comfort Index is calculated **server-side only** using three weather parameters. The final score ranges from 0 (least comfortable) to 100 (most comfortable).

### Formula

```javascript
// Individual component scores (0-100)
tempScore = clamp(100 - |tempC - 22| × 3, 0, 100)
humidityScore = clamp(100 - |humidity - 45| × 1.5, 0, 100)
windScore = clamp(100 - |windSpeed - 3| × 12, 0, 100)

// Weighted average
comfortScore = round(0.5 × tempScore + 0.3 × humidityScore + 0.2 × windScore)

// Final clamping
comfortScore = clamp(comfortScore, 0, 100)
```

### Ideal Values

| Parameter | Ideal Value | Unit |
|-----------|-------------|------|
| Temperature | 22°C | Celsius |
| Humidity | 45% | Percentage |
| Wind Speed | 3 m/s | Meters/second |

---

## Reasoning Behind Variable Weights

| Parameter | Weight | Reasoning |
|-----------|--------|-----------|
| **Temperature (50%)** | 0.5 | Temperature has the most direct and immediate impact on human comfort. Extreme heat or cold significantly affects how comfortable we feel outdoors. |
| **Humidity (30%)** | 0.3 | Humidity affects perceived temperature and overall comfort. High humidity makes heat feel oppressive, while low humidity can cause discomfort through dryness. |
| **Wind Speed (20%)** | 0.2 | Wind provides cooling effect but has less impact than temperature/humidity. Gentle breeze is pleasant; strong winds become uncomfortable. |

### Penalty Multipliers

- **Temperature (×3):** Aggressive penalty because deviations from 22°C quickly become uncomfortable
- **Humidity (×1.5):** Moderate penalty as humidity tolerance range is wider
- **Wind Speed (×12):** High multiplier because the ideal wind range (0-6 m/s) is narrow

---

## Trade-offs Considered

### 1. Simplicity vs. Accuracy
- **Chosen:** Simple linear formula with three variables
- **Trade-off:** More accurate models (heat index, wind chill) would require complex calculations and additional data
- **Reasoning:** Linear approach is transparent, maintainable, and sufficient for ranking purposes

### 2. Server-side vs. Client-side Calculation
- **Chosen:** Server-side only
- **Trade-off:** Less flexible for client customization
- **Reasoning:** Ensures consistency, protects business logic, and reduces client bundle size

### 3. Fixed Weights vs. User-configurable
- **Chosen:** Fixed weights
- **Trade-off:** Users cannot personalize comfort preferences
- **Reasoning:** Simplifies implementation; consistent experience for all users

### 4. Caching Duration
- **Chosen:** 5-minute TTL
- **Trade-off:** Data may be slightly stale
- **Reasoning:** Weather doesn't change dramatically in 5 minutes; reduces API calls and improves response times

### 5. Real-time vs. Cached Data Display
- **Chosen:** Show cache status (HIT/MISS) for transparency
- **Trade-off:** Slightly more complex UI
- **Reasoning:** Users understand data freshness; developers can debug caching behavior

---

## Cache Design

### Overview

The application implements a **two-tier caching strategy** using Node-Cache with a 5-minute TTL (300 seconds).

### Cache Layers

| Cache Key Pattern | Description | TTL |
|-------------------|-------------|-----|
| `raw:{cityId}` | Raw weather data per city | 5 minutes |
| `processed:comfort:list` | Computed comfort rankings | 5 minutes |

### Cache Flow

```
Request → Check processed cache
              ↓
         [HIT] Return cached list
              ↓
         [MISS] For each city:
                   → Check raw cache
                   → [HIT] Use cached weather
                   → [MISS] Fetch from OpenWeatherMap, cache result
              ↓
         Calculate comfort scores
              ↓
         Cache processed list
              ↓
         Return response with cache status
```

### Benefits

1. **Reduced API calls:** Minimizes OpenWeatherMap API usage
2. **Faster responses:** Cached data returns in <10ms
3. **Cost savings:** Fewer external API calls = lower costs
4. **Resilience:** Cached data available if external API is slow/down

### Cache Status in Response

Every response includes cache status for debugging:
- `processedCache: "HIT" | "MISS"` - Overall list cache status
- `rawCache: "HIT" | "MISS"` - Per-city raw data cache status

---

## Auth0 Configuration

### 1. Create SPA Application

1. Go to Auth0 Dashboard → Applications → Create Application
2. Choose **Single Page Application**
3. Configure URLs:
   - **Allowed Callback URLs:** `http://localhost:5173`
   - **Allowed Logout URLs:** `http://localhost:5173`
   - **Allowed Web Origins:** `http://localhost:5173`

### 2. Create API

1. Go to APIs → Create API
2. Set **Identifier** (audience): `https://weather-api`
3. This must match `AUTH0_AUDIENCE` and `VITE_AUTH0_AUDIENCE`

### 3. Disable Public Signups

1. Go to Authentication → Database → Username-Password-Authentication
2. Disable **Sign Ups** toggle
3. Only pre-created users can log in

### 4. Create Whitelisted Test User

1. Go to User Management → Users → Create User
2. Create user with:
   - **Email:** `careers@fidenz.com`
   - **Password:** `Pass#fidenz`
3. Verify the email address

### 5. Enable MFA

1. Go to Security → Multi-factor Auth
2. Enable **Email** factor
3. **Note:** Auth0 requires enabling at least one other factor (e.g., OTP) when using Email as MFA
4. Set policy to **Always** or use Actions

### 6. Enforce MFA via Post-Login Action

1. Go to Actions → Flows → Login
2. Create a custom action:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  if (!event.authentication.methods.find(m => m.name === 'mfa')) {
    api.multifactor.enable('any');
  }
};
```

3. Deploy and add to Login flow

### Protected Endpoints

The following endpoints require a valid Bearer token:
- `GET /api/weather/comfort`
- `GET /api/weather/forecast/:cityId`

---

## Testing

### Run Unit Tests

```bash
cd backend
npm test
```

### Test Coverage

Unit tests verify the Comfort Index calculation:

```javascript
// Comfort score is always between 0 and 100
test("Comfort Index is always between 0 and 100", () => {
  const score = calculateComfortIndex({
    tempC: 50,
    humidity: 100,
    windSpeed: 20
  });
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(100);
});

// Comfortable weather scores higher than uncomfortable weather
test("Comfortable weather scores higher than uncomfortable weather", () => {
  const comfortable = calculateComfortIndex({
    tempC: 22,
    humidity: 45,
    windSpeed: 3
  });
  const uncomfortable = calculateComfortIndex({
    tempC: 40,
    humidity: 90,
    windSpeed: 0
  });
  expect(comfortable).toBeGreaterThan(uncomfortable);
});
```

---

## Bonus Features

### ✅ Dark Mode
- Toggle between light and dark themes
- Preference persisted in localStorage
- Smooth transitions between themes

### ✅ Frontend Sorting & Filtering
- Search cities by name
- Sort by Rank, Comfort Score, or Temperature
- Ascending/Descending order toggle

### ✅ Temperature Trend Graph
- Click on any city to view 5-day temperature forecast
- Interactive line chart using Chart.js
- Data fetched from `/api/weather/forecast/:cityId`

### ✅ Unit Tests
- Jest tests for Comfort Index calculation
- Validates score boundaries (0-100)
- Verifies relative scoring logic

---

## Quick Demo Flow

1. **Open App** → Navigate to `http://localhost:5173`
2. **Click "Log In"** → Redirected to Auth0 login page
3. **Enter Credentials:**
   - Email: `careers@fidenz.com`
   - Password: `Pass#fidenz`
4. **Complete MFA** → Enter email verification code
5. **View Dashboard** → See ranked cities with comfort scores
6. **Try Features:**
   - Search for a city
   - Sort by different columns
   - Toggle dark mode
   -  Click a city row to view temperature trend
7. **Logout** → Click "Log Out" button

---

## Known Limitations

### 1. City List is Static
- Fixed list of 10 cities configured in backend
- Users cannot add/remove cities

### 2. OpenWeatherMap API Limits
- Free tier: 60 calls/minute, 1,000,000 calls/month
- Heavy usage may hit rate limits

### 3. MFA Email Factor Constraint
- Auth0 requires enabling another factor (e.g., OTP) when using Email for MFA
- This is an Auth0 platform limitation

### 4. No Offline Support
- App requires internet connection
- No service worker or offline caching implemented

### 5. Single Timezone Display
- Forecast times shown in UTC
- No user timezone conversion

### 6. Limited Weather Parameters
- Only uses temperature, humidity, wind speed
- Does not consider UV index, precipitation, air quality

### 7. No Historical Data
- Only current weather and 5-day forecast
- No historical comfort trends

---

## Troubleshooting

### 401 Unauthorized Error

**Cause:** Invalid or expired access token

**Solutions:**
- Ensure `AUTH0_AUDIENCE` matches in both backend and frontend `.env`
- Check that the Auth0 API identifier is correct
- Log out and log back in to get a fresh token
- Verify the Auth0 domain is correct

### CORS Errors

**Cause:** Frontend and backend origins mismatch

**Solutions:**
- Ensure backend has CORS configured for `http://localhost:5173`
- Check `VITE_BACKEND_URL` is set to `http://localhost:5000`
- Restart both servers after changing `.env` files

### Environment Variables Not Loading

**Cause:** `.env` file not read or wrong format

**Solutions:**
- Ensure `.env` files are in the correct directories (`backend/` and `frontend/`)
- No spaces around `=` in `.env` files
- Restart the dev server after changes
- For Vite, all env vars must start with `VITE_`

### Token Validation Errors

**Cause:** Misconfigured Auth0 settings

**Solutions:**
- Verify `AUTH0_DOMAIN` includes `.auth0.com`
- Check API audience matches exactly
- Ensure the API is enabled in Auth0 Dashboard
- Check the RS256 algorithm is configured

### Cache Not Working

**Cause:** Node-Cache misconfiguration

**Solutions:**
- Restart backend server
- Check `/debug/cache` endpoint for cache status
- Verify TTL is set correctly (300 seconds)

---

## Repository Access



---

## License

This project was created as a technical assessment for Fidenz.

---

**Built with  using Node.js,Auth0
