// ═══════════════════════════════════════════════════
// FILE: src/middleware/attachTokens.js
// PURPOSE: Sends access + refresh tokens correctly
//          based on the detected platform
//          Web    → refresh token in HTTP-only cookie
//          Mobile → both tokens in response body
//          API    → both tokens in response body
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Read req.platform (set by detectPlatform)
// Step 2: Read req.tokenData (set by authController)
//         tokenData = { accessToken, refreshToken, user }
// Step 3: For web → set HTTP-only cookie for refresh
//         For mobile/api → put both tokens in body
// Step 4: Send the response

const attachTokens = (req, res) => {

  // tokenData is attached to req by authController
  // before this middleware is called
  const { accessToken, refreshToken, user } = req.tokenData

  // Determine cookie security based on environment
  // In production: secure=true (HTTPS only)
  // In development: secure=false (HTTP allowed)
  const isProduction = process.env.NODE_ENV === 'production'

  if (req.platform === 'web') {
    // ── WEB: Refresh token goes in HTTP-only cookie ──
    // JavaScript CANNOT read this cookie
    // Browser sends it automatically with every request
    // This prevents XSS attacks from stealing the token

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,         // JS cannot access this
      secure:   isProduction, // HTTPS only in production
      sameSite: 'strict',     // no cross-site requests
      maxAge:   7 * 24 * 60 * 60 * 1000 // 7 days in ms
    })

    // Only access token in response body for web
    return res.status(200).json({
      success:     true,
      accessToken,            // store in memory (not localStorage)
      user: {
        id:    user.id    || user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    })

  } else {
    // ── MOBILE / API: Both tokens in response body ──
    // Mobile app stores tokens in secure device storage
    // API clients store in memory

    return res.status(200).json({
      success:      true,
      accessToken,
      refreshToken, // included in body for mobile/api
      user: {
        id:    user.id    || user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    })
  }
}

module.exports = attachTokens