# Weather Analytics – Comfort Index Dashboard (Full Stack Assignment)

## Overview
This project is a secure weather analytics application that:
- Reads city codes from `cities.json`
- Fetches live weather data from OpenWeatherMap
- Computes a backend-only Comfort Index (0–100)
- Ranks cities from Most Comfortable → Least Comfortable
- Uses server-side caching (5 minutes)
- Protects the dashboard with Auth0 authentication + MFA
- Supports responsive UI for desktop and mobile

---

## Technology Stack
**Backend**
- Node.js + Express (REST API)
- Axios (OpenWeather API calls)
- Node-Cache (in-memory caching)
- Auth0 JWT validation (jsonwebtoken + jwks-rsa)

**Frontend**
- React (Vite)
- Auth0 React SDK (login/logout + access token)

---

## Setup Instructions

### Prerequisites
- Node.js (LTS recommended)
- OpenWeatherMap API key
- Auth0 tenant

### 1) Clone repo
```bash
git clone https://github.com/AshanShanaka/weather-analytics.git
cd weather-analytics
