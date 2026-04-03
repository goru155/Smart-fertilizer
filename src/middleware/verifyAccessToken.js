// ═══════════════════════════════════════════════════
// FILE: src/middleware/verifyAccessToken.js
// PURPOSE: Protects routes by verifying the JWT
//          access token on every incoming request
//          Attaches the decoded user to req.user
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Read Authorization header from request
// Step 2: Extract the token after "Bearer "
// Step 3: Verify the token using JWT_SECRET
// Step 4: If valid → attach decoded user to req.user
//         If invalid/expired → return 401 error
// Step 5: Call next() to proceed to the route handler

const { verifyAccessToken } = require('../utils/tokenUtils')

const verifyAccessTokenMiddleware = (req, res, next) => {

  // Read the Authorization header
  // Expected format: "Bearer <token>"
  const authHeader = req.headers['authorization']

  // Reject if no Authorization header is present
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    })
  }

  // Extract token by removing "Bearer " prefix
  // authHeader.split(' ') = ['Bearer', '<token>']
  const token = authHeader.split(' ')[1]

  // Reject if header format is wrong
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Invalid token format.'
    })
  }

  try {
    // Verify the token signature and expiry
    // Returns decoded payload: { userId, email, role }
    // Throws if expired or tampered
    const decoded = verifyAccessToken(token)

    // Attach decoded user info to request object
    // Route handlers can now access req.user
    req.user = {
      userId: decoded.userId,
      email:  decoded.email,
      role:   decoded.role
    }

    // Token is valid — proceed to route handler
    next()

  } catch (error) {

    // Token has expired
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh.',
        code:    'TOKEN_EXPIRED'
        // Frontend uses this code to trigger
        // silent refresh automatically
      })
    }

    // Token was tampered with or is invalid
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code:    'TOKEN_INVALID'
      })
    }

    // Unexpected error
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.'
    })
  }
}

module.exports = verifyAccessTokenMiddleware