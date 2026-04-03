# Smart Agriculture Frontend

React-based dashboard for the Smart Agriculture IoT system.

## Tech Stack

- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Charts**: Chart.js with react-chartjs-2
- **Maps**: Mapbox GL JS

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── SensorCard.jsx
│   │   ├── SensorChart.jsx
│   │   ├── MapView.jsx
│   │   └── index.js
│   ├── context/          # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx
│   ├── services/         # API and WebSocket services
│   │   ├── api.js
│   │   └── socket.js
│   ├── App.jsx           # Main app with routing
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the values if needed (defaults work for local development).

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## Features

### Authentication
- Login/Register forms with validation
- JWT token management with auto-refresh
- OAuth support (Google, Facebook)
- HTTP-only cookies for web clients

### Dashboard
- **Overview Tab**: Real-time sensor cards showing:
  - Temperature
  - Humidity
  - Soil Moisture
  - pH Level
  - Voltage
  - Analog Reading

- **Charts Tab**: Historical sensor data visualization
- **Map Tab**: Farm location with sensor markers

### Real-time Updates
- WebSocket connection for live sensor data
- Automatic chart updates
- Connection status indicator

## API Integration

The frontend communicates with the backend at:
- REST API: `/api/*` (proxied to `http://localhost:5000`)
- WebSocket: Socket.io connection

### Protected Routes
All API requests include the JWT access token. Token refresh is handled automatically via interceptors.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server URL | `http://localhost:5000` |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
