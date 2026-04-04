# Smart Agriculture System

A full-stack smart agriculture monitoring system with real-time sensor data, map visualization, and OAuth authentication.

## Project Structure

```
smart-fertilizer/
├── backend/          # Node.js/Express backend with Socket.io
└── frontend/         # React/Vite frontend
```

## Prerequisites

- Node.js 18+ installed
- MongoDB running locally on port 27017
- npm or yarn package manager

## Installation

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend

```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Start Frontend

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## OAuth Setup (Google & Facebook)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `backend/.env`

### Facebook OAuth

1. Go to [Facebook Developer Console](https://developers.facebook.com/)
2. Create a new app
3. Add **Facebook Login** product
4. Go to **Settings** → **Basic**
5. Configure:
   - **Valid OAuth Redirect URIs**: `http://localhost:5000/api/auth/facebook/callback`
6. Copy App ID and App Secret to `backend/.env`

### Update .env file

Edit `backend/.env` with your credentials:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
FACEBOOK_APP_ID=your-actual-app-id
FACEBOOK_APP_SECRET=your-actual-app-secret
```

**Restart the backend** after updating the `.env` file.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/facebook` - Facebook OAuth login

### Sensor Data
- `GET /api/sensor/latest` - Get latest sensor reading
- `GET /api/sensor/history` - Get historical data

### Map
- `GET /api/map/token` - Get Mapbox token
- `GET /api/map/bounds` - Get field boundaries

## Testing with Simulator

### Option 1: Built-in Simulator

```bash
cd backend
node test-simulator.js
```

This sends random sensor data every 5 seconds via MQTT.

### Option 2: MQTT Client (Manual)

Connect to the public MQTT broker and publish to topic `smart-agriculture/sensors`:

**MQTT Broker:** `mqtt://broker.hivemq.com`
**Topic:** `smart-agriculture/sensors`

**Payload format (JSON):**
```json
{
  "analog": 2048,
  "voltage": 1.65,
  "pH": 6.85,
  "temperature": 28.5,
  "humidity": 65.2,
  "soilMoisture": 45.0
}
```

### Option 3: ESP32 Device

If using a physical ESP32, configure it to:
1. Connect to the same MQTT broker
2. Publish sensor readings to the `smart-agriculture/sensors` topic
3. Send data as JSON with the fields above

### Data Flow

```
┌─────────────────┐     MQTT      ┌─────────┐    WebSocket    ┌──────────┐
│ ESP32/Simulator │ ─────────────>│ Backend │ ───────────────>│ Frontend │
│   (JSON)        │  (publish)    │         │   (emit)        │ (display)│
└─────────────────┘               └─────────┘                 └──────────┘
```

### Expected Sensor Ranges

| Field | Type | Range | Unit |
|-------|------|-------|------|
| `analog` | Integer | 0-4095 | - |
| `voltage` | Float | 0-3.3 | V |
| `pH` | Float | 0-14 | pH |
| `temperature` | Float | -10 to 50 | °C |
| `humidity` | Float | 0-100 | % |
| `soilMoisture` | Float | 0-100 | % |

## Tech Stack

**Backend:**
- Node.js + Express
- Socket.io (real-time updates)
- MongoDB (database)
- Passport.js (OAuth)
- JWT (authentication)

**Frontend:**
- React 18
- Vite (build tool)
- React Router
- Socket.io client
- Chart.js (data visualization)
- Mapbox GL (maps)
