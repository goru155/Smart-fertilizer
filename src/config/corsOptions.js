// ═══════════════════════════════════════════════════
// FILE: src/config/corsOptions.js
// PURPOSE: Defines which frontend URLs are allowed
//          to make requests to this backend
//          Blocks all other origins automatically
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Define list of allowed origins from .env
// Step 2: cors middleware checks every incoming
//         request's Origin header
// Step 3: If origin is in the allowed list → allow
// Step 4: If origin is not in the list → block
//         with CORS error
// Step 5: Socket.io uses the same config so
//         WebSocket connections are also protected

// List of allowed origins
// Add your frontend URLs here
// In production: replace with your real domain
const allowedOrigins = [
  // Local development frontend (React default port)
  'http://localhost:3000',

  // Local development alternate port
  'http://localhost:5173',

  // Production frontend URL from .env
  // Set CLIENT_URL=https://yourdomain.com in .env
  process.env.CLIENT_URL
].filter(Boolean) // removes undefined if CLIENT_URL not set

// CORS configuration object
// Passed directly to the cors() middleware
const corsOptions = {

  // Check if the request origin is in our allowed list
  origin: (origin, callback) => {

    // Allow requests with no origin
    // This covers: Postman, mobile apps, server-to-server
    if (!origin) {
      return callback(null, true)
    }

    // Check if origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      // Origin is allowed — proceed
      return callback(null, true)
    } else {
      // Origin is not allowed — block with error
      return callback(
        new Error(`CORS blocked: Origin ${origin} not allowed`),
        false
      )
    }
  },

  // Allow cookies and Authorization headers
  // Required for HTTP-only cookie refresh tokens
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed request headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Client-Type',   // our platform detection header
    'X-Requested-With'
  ],

  // Headers the frontend is allowed to read
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],

  // Cache preflight response for 24 hours
  // Reduces OPTIONS requests from browser
  maxAge: 86400
}

module.exports = corsOptions