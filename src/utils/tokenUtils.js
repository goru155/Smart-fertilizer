// ═══════════════════════════════════════════════════
// FILE: src/utils/tokenUtils.js
// PURPOSE: All JWT + Refresh token creation,
//          signing, and verification in one place
//          Used by authController and middleware
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: generateAccessToken  → signs a short-lived JWT
// Step 2: generateRefreshToken → creates a random opaque
//                                token string (not a JWT)
// Step 3: verifyAccessToken    → checks JWT signature
//                                and expiry
// Step 4: buildTokenMetadata   → packages device/platform
//                                info for storage

const jwt    = require('jsonwebtoken')
const crypto = require('crypto')

// ─── ACCESS TOKEN ────────────────────────────────

// Creates a signed JWT access token
// payload: { userId, email, role }
// Token expires based on JWT_EXPIRES_IN in .env
const generateAccessToken = (payload) => {
  // Guard: ensure secrets are set before signing
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in .env')
  }

  return jwt.sign(
    {
      userId: payload.userId,
      email:  payload.email,
      role:   payload.role || 'user'
    },
    process.env.JWT_SECRET,
    {
      // How long until this token expires
      // Reads from .env — default 15m
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    }
  )
}

// Verifies a JWT access token
// Returns the decoded payload if valid
// Throws an error if expired or tampered
const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in .env')
  }

  // jwt.verify checks:
  // 1. Signature is valid (not tampered)
  // 2. Token has not expired
  // Throws JsonWebTokenError or TokenExpiredError
  return jwt.verify(token, process.env.JWT_SECRET)
}

// ─── REFRESH TOKEN ───────────────────────────────

// Creates a cryptographically random refresh token
// NOT a JWT — just a random string stored in DB
// This makes it impossible to guess or forge
const generateRefreshToken = () => {
  // 64 random bytes converted to hex string
  // Result: 128 character string
  return crypto.randomBytes(64).toString('hex')
}

// Calculates the expiry date for a refresh token
// Reads REFRESH_TOKEN_EXPIRES_IN from .env
// Returns a JavaScript Date object
const getRefreshTokenExpiry = () => {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN
                    || '7d'

  // Parse the duration string (e.g. "7d", "30d")
  const unit  = expiresIn.slice(-1)        // "d"
  const value = parseInt(expiresIn.slice(0, -1)) // 7

  const now = new Date()

  if (unit === 'd') {
    // Add days to current date
    now.setDate(now.getDate() + value)
  } else if (unit === 'h') {
    // Add hours to current date
    now.setHours(now.getHours() + value)
  } else {
    // Default fallback: 7 days
    now.setDate(now.getDate() + 7)
  }

  return now
}

// ─── TOKEN METADATA ──────────────────────────────

// Packages device and platform info for DB storage
// This is saved alongside every refresh token
// Helps identify which device/platform each token
// belongs to — useful for security audits
const buildTokenMetadata = (req, platform) => {
  return {
    platform:  platform || 'web',

    // IP address of the request
    // x-forwarded-for handles requests behind a proxy
    ipAddress: req.headers['x-forwarded-for']
               || req.socket.remoteAddress
               || null,

    // Browser/app identifier string
    userAgent: req.headers['user-agent'] || null,

    issuedAt:  new Date().toISOString(),
    expiresAt: getRefreshTokenExpiry()
  }
}

// ─── EXPORTS ─────────────────────────────────────
module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  buildTokenMetadata
}