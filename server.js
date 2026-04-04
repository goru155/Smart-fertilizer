// ═══════════════════════════════════════════════════
// FILE: server.js
// PURPOSE: Main entry point of the entire backend
//          Creates Express app, attaches Socket.io,
//          registers all middleware and routes,
//          initializes Passport, starts server
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1:  Load environment variables from .env
// Step 2:  Create Express app
// Step 3:  Create raw HTTP server from Express app
//          (required for Socket.io to share the port)
// Step 4:  Attach Socket.io to the HTTP server
// Step 5:  Apply security middleware (helmet, cors)
// Step 6:  Apply body parsing middleware
// Step 7:  Initialize Passport.js strategies
// Step 8:  Initialize Socket.io handler
// Step 9:  Register all API routes
// Step 10: Add health check route
// Step 11: Add global error handler
// Step 12: Start listening on PORT

// ─── ENVIRONMENT ─────────────────────────────────
// Must be loaded FIRST before any other imports
// that might read process.env values
require('dotenv').config()

// ─── CORE IMPORTS ────────────────────────────────
const express      = require('express')
const http         = require('http')        // Node built-in
const { Server }   = require('socket.io')
const helmet       = require('helmet')
const cors         = require('cors')
const cookieParser = require('cookie-parser')
const passport     = require('passport')

// ─── LOCAL IMPORTS ────────────────────────────────
const corsOptions    = require('./src/config/corsOptions')
const initPassport   = require('./src/auth/passportStrategies')
const { initSocket } = require('./src/socket/socketHandler')
const { initMQTT } = require('./src/mqtt/mqttClient')
const sensorRoutes = require('./src/routes/sensorRoutes')
const mapRoutes = require('./src/routes/mapRoutes')

// ─── APP SETUP ───────────────────────────────────
const authRoutes = require('./src/auth/authRoutes')
// Step 1: Create Express application
const app = express()

// Step 2: Create raw HTTP server from Express app
// IMPORTANT: Socket.io must attach to THIS server
// not to app directly — they must share one port
const server = http.createServer(app)

// Step 3: Create Socket.io server
// Attach to the HTTP server with CORS config
const io = new Server(server, {
  cors: {
    // Socket.io needs its own CORS config
    origin:      corsOptions.origin,
    methods:     ['GET', 'POST'],
    credentials: true
  },

  // How long to wait before considering
  // a client disconnected (in ms)
  pingTimeout: 60000,

  // How often to send ping to check connection
  pingInterval: 25000
})

// ─── SECURITY MIDDLEWARE ─────────────────────────

// helmet: sets secure HTTP response headers
// Protects against XSS, clickjacking, sniffing etc.
// Must be applied BEFORE routes
app.use(helmet({
  // Allow cross-origin requests for our API
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// cors: restricts which origins can call this API
// Uses our corsOptions config from src/config/
app.use(cors(corsOptions))

// ─── BODY PARSING MIDDLEWARE ─────────────────────

// Parse incoming JSON request bodies
// Required for POST/PUT routes to read req.body
app.use(express.json({
  // Limit request body size to prevent abuse
  limit: '10kb'
}))

// Parse URL-encoded form data
app.use(express.urlencoded({
  extended: true,
  limit:    '10kb'
}))

// Parse cookies from incoming requests
// Required for reading HTTP-only refresh tokens
// on web client requests
app.use(cookieParser(process.env.COOKIE_SECRET))

// ─── PASSPORT INITIALIZATION ─────────────────────

// Initialize Google + Facebook OAuth strategies
// Must be called BEFORE any route that uses
// passport.authenticate()
initPassport()
app.use(passport.initialize())

// ─── SOCKET.IO INITIALIZATION ────────────────────

// Register all Socket.io event handlers
// Must be called BEFORE server starts listening
initSocket(io)

// ─── MQTT INITIALIZATION ─────────────────────────

// Initialize MQTT client to receive ESP32 sensor data
 // Must be called BEFORE server starts listening
 initMQTT()
app.use('/api/sensor', sensorRoutes)
app.use('/api/map', mapRoutes)

// ─── HEALTH CHECK ROUTE ──────────────────────────

// GET /api/health
// Sensor routes - JWT protected, rate limited
app.use('/api/sensor', sensorRoutes)

   // Map routes - JWT protected, rate limited
app.use('/api/map', mapRoutes)

   // 🔥 ADD THIS LINE 🔥
   // Auth routes - handles login, register, OAuth
app.use('/api/auth', authRoutes)
// Simple endpoint to verify server is running
// Used in hardware integration checklist (Step 5)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'Smart Agriculture Backend is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString()
  })
})

// ─── API ROUTES ──────────────────────────────────

// Change FROM (commented out):
  // Sensor routes (added in Step 6)
  // app.use('/api/sensor', sensorRoutes)

  // Map routes (added in Step 6)
  // app.use('/api/map', mapRoutes)

  // Change TO (uncommented):
  // Sensor routes - JWT protected, rate limited
  app.use('/api/sensor', sensorRoutes)

  // Map routes - JWT protected, rate limited
  app.use('/api/map', mapRoutes)
// ─── 404 HANDLER ─────────────────────────────────

// Catches any request that did not match a route
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  })
})

// ─── GLOBAL ERROR HANDLER ────────────────────────

// Catches any error thrown by route handlers
// Must have 4 parameters for Express to treat
// it as an error handler — do not remove 'next'
app.use((err, req, res, next) => {

  // Log the full error for debugging
  console.error('❌ Server error:', err.message)

  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS: Request origin not allowed'
    })
  }

  // Generic server error response
  // Never expose internal error details in production
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message    // show details in development
  })
})

// ─── START SERVER ────────────────────────────────

const PORT = process.env.PORT || 5000

// IMPORTANT: Call server.listen() NOT app.listen()
// server is the HTTP server that Socket.io is
// attached to — app.listen() creates a NEW server
// that would not have Socket.io attached
server.listen(PORT, () => {
  console.log('')
  console.log('╔════════════════════════════════════════╗')
  console.log('║   🌱 Smart Agriculture Backend         ║')
  console.log('╠════════════════════════════════════════╣')
  console.log(`║   🚀 Server   : http://localhost:${PORT}   ║`)
  console.log(`║   🌍 ENV      : ${process.env.NODE_ENV || 'development'}              ║`)
  console.log(`║   🔌 Socket   : enabled                ║`)
  console.log('╚════════════════════════════════════════╝')
  console.log('')
})

// ─── EXPORT FOR TESTING ──────────────────────────
// Exported so server can be imported in test files
module.exports = { app, server, io }