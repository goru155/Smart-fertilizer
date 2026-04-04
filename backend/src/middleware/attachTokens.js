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

  // Check if this is an OAuth callback request that should redirect to frontend
  const isOAuthCallback = req.path?.includes('/auth/google/callback') ||
                          req.path?.includes('/auth/facebook/callback')

  console.log('=== attachTokens called ===')
  console.log('Platform:', req.platform)
  console.log('Is OAuth Callback:', isOAuthCallback)
  console.log('Has tokenData:', !!req.tokenData)

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
    // For OAuth callbacks, redirect to frontend with token
    if (isOAuthCallback) {
      // Set the cookie first
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure:   isProduction,
        sameSite: 'strict',
        maxAge:   7 * 24 * 60 * 60 * 1000
      })

      // Redirect to frontend OAuth callback handler with access token
      // Include needsOnboarding flag so frontend can redirect new users
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000'
      const needsOnboarding = user.needsOnboarding || false
      const redirectURL = `${frontendURL}/oauth/callback?access_token=${accessToken}&needs_onboarding=${needsOnboarding}`
      console.log('OAuth redirect to:', redirectURL)
      return res.redirect(redirectURL)
    }

    return res.status(200).json({
      success:     true,
      accessToken,
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