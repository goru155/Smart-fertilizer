// ═══════════════════════════════════════════════════
// FILE: src/auth/authRoutes.js
// PURPOSE: Defines all auth endpoints and wires
//          them to controllers and middleware
//          Applies rate limiting to all auth routes
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Create rate limiters for auth + OAuth routes
// Step 2: Define standard auth routes
//         (register, login, refresh, logout, me)
// Step 3: Define OAuth routes for Google + Facebook
// Step 4: Chain middleware in correct order:
//         detectPlatform → controller → attachTokens
// Step 5: Export router for use in server.js

const express      = require('express')
const passport     = require('passport')
const rateLimit    = require('express-rate-limit')
const router       = express.Router()

// Import middleware
const detectPlatform         = require('../middleware/detectPlatform')
const verifyAccessToken      = require('../middleware/verifyAccessToken')
const attachTokens           = require('../middleware/attachTokens')

// Import controller functions
const {
  register,
  login,
  refresh,
  logout,
  me,
  oauthSuccess,
  completeOnboarding
} = require('./authController')

// ─── RATE LIMITERS ───────────────────────────────

// Strict limiter for login + register
// Prevents brute force attacks
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS)
            || 15 * 60 * 1000,       // 15 minutes
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX)
            || 20,                   // 20 attempts per window
  message: {
    success: false,
    message: 'Too many attempts. Please try again later.'
  },
  standardHeaders: true,  // Return rate limit info in headers
  legacyHeaders:   false
})

// Limiter for OAuth routes
const oauthLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS)
            || 15 * 60 * 1000,
  max:      parseInt(process.env.OAUTH_RATE_LIMIT_MAX)
            || 10,                   // 10 OAuth attempts
  message: {
    success: false,
    message: 'Too many OAuth attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders:   false
})

// ─── STANDARD AUTH ROUTES ────────────────────────

// POST /api/auth/register
// No auth required — creates new account
router.post('/register',
  authLimiter,        // rate limit first
  detectPlatform,     // detect web/mobile/api
  register            // create user
)

// POST /api/auth/login
// detectPlatform → login → attachTokens
// attachTokens sends tokens based on platform
router.post('/login',
  authLimiter,
  detectPlatform,
  login,              // verify credentials + attach tokenData
  attachTokens        // send tokens based on req.platform
)

// POST /api/auth/refresh
// Rotates refresh token and issues new access token
router.post('/refresh',
  detectPlatform,
  refresh,            // rotate token + attach tokenData
  attachTokens        // send new tokens
)

// POST /api/auth/logout
// Invalidates refresh token — no response body needed
router.post('/logout',
  logout              // delete token + clear cookie
)

// GET /api/auth/me
// Returns current user — requires valid access token
router.get('/me',
  verifyAccessToken,  // check JWT first
  me                  // return user data
)

// POST /api/auth/complete-onboarding
// Completes farmer profile for OAuth users
router.post('/complete-onboarding',
  verifyAccessToken,  // must be authenticated
  detectPlatform,
  completeOnboarding  // save farmer profile
)

// ─── GOOGLE OAUTH ROUTES ─────────────────────────

// GET /api/auth/google
// Redirects user to Google login page
router.get('/google',
  oauthLimiter,
  detectPlatform,
  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    session: false    // we use JWT not sessions
  })
)

// GET /api/auth/google/callback
// Google redirects here after user approves
router.get('/google/callback',
  oauthLimiter,
  detectPlatform,
  // Passport handles the OAuth code exchange
  passport.authenticate('google', {
    session:      false,
    failureRedirect: '/api/auth/failed'
  }),
  oauthSuccess,   // generate tokens
  attachTokens    // send tokens
)

// ─── FACEBOOK OAUTH ROUTES ───────────────────────

// GET /api/auth/facebook
// Redirects user to Facebook login page
router.get('/facebook',
  oauthLimiter,
  detectPlatform,
  passport.authenticate('facebook', {
    scope:   ['email'],
    session: false
  })
)

// GET /api/auth/facebook/callback
// Facebook redirects here after user approves
router.get('/facebook/callback',
  oauthLimiter,
  detectPlatform,
  passport.authenticate('facebook', {
    session:         false,
    failureRedirect: '/api/auth/failed'
  }),
  oauthSuccess,
  attachTokens
)

// ─── OAUTH FAILURE ROUTE ─────────────────────────

// GET /api/auth/failed
// Called when OAuth login fails or user cancels
router.get('/failed', (req, res) => {
  return res.status(401).json({
    success: false,
    message: 'OAuth authentication failed or was cancelled'
  })
})

module.exports = router