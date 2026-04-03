// ═══════════════════════════════════════════════════
// FILE: src/middleware/detectPlatform.js
// PURPOSE: Detects whether the request comes from
//          a web browser, mobile app, or API client
//          Sets req.platform for use by attachTokens
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Read X-Client-Type header from request
// Step 2: Match it to a known platform
// Step 3: Set req.platform on the request object
// Step 4: Call next() to continue to the next
//         middleware or route handler
//
// Platform values:
//   "web"    → browser (default)
//   "mobile" → iOS or Android app
//   "api"    → third-party client or Postman

const detectPlatform = (req, res, next) => {

  // Read the custom header sent by the client
  // Mobile apps must send: X-Client-Type: mobile
  // API clients can send:  X-Client-Type: api
  // Web browsers send nothing (default to 'web')
  const clientType = req.headers['x-client-type']

  if (clientType === 'mobile') {
    // Mobile app — tokens delivered in response body
    // App is responsible for secure storage
    req.platform = 'mobile'

  } else if (clientType === 'api') {
    // API client (Postman, third-party integration)
    // Tokens delivered in response body
    req.platform = 'api'

  } else {
    // Default: web browser
    // Refresh token delivered as HTTP-only cookie
    // Access token delivered in response body
    req.platform = 'web'
  }

  // Continue to the next middleware or route
  next()
}

module.exports = detectPlatform