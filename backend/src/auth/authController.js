// ═══════════════════════════════════════════════════
// FILE: src/auth/authController.js
// PURPOSE: All authentication business logic
//          register, login, refresh, logout, me
//          All DB calls go through DAL only
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: register → hash password → save user → done
// Step 2: login    → find user → check password
//                 → generate tokens → attach to req
//                 → call attachTokens middleware
// Step 3: refresh  → find token in DB → verify not
//                    expired → delete old → issue new
//                 → detect reuse → wipe all if reused
// Step 4: logout   → delete refresh token from DB
//                 → clear cookie if web
// Step 5: me       → return req.user from middleware

const bcrypt = require('bcryptjs')
const db     = require('../db')
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
  buildTokenMetadata
} = require('../utils/tokenUtils')

// ─── REGISTER ────────────────────────────────────
// POST /api/auth/register
// Creates a new user account with hashed password

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      })
    }

    // Check if email is already registered
    const existingUser = await db.findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      })
    }

    // Hash the password before storing
    // 12 salt rounds = strong security + acceptable speed
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user via DAL
    const user = await db.createUser({
      name,
      email:    email.toLowerCase(),
      password: hashedPassword,
      role:     'user'
    })

    // Return success without tokens
    // User must log in after registering
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in.'
    })

  } catch (error) {
    console.error('Register error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    })
  }
}

// ─── LOGIN ───────────────────────────────────────
// POST /api/auth/login
// Verifies credentials and issues tokens

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find user by email via DAL
    const user = await db.findUserByEmail(email)
    if (!user) {
      // Vague message intentional — don't reveal
      // whether email exists or not (security best practice)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Check if this is an OAuth-only account
    // OAuth users have no password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google or Facebook login'
      })
    }

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    )

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    // Generate access token (short-lived JWT)
    const accessToken = generateAccessToken({
      userId: user.id || user._id,
      email:  user.email,
      role:   user.role
    })

    // Generate refresh token (random string, not JWT)
    const refreshToken = generateRefreshToken()

    // Build metadata for token storage
    const metadata = buildTokenMetadata(
      req,
      req.platform  // set by detectPlatform middleware
    )
    metadata.expiresAt = getRefreshTokenExpiry()

    // Save refresh token to DB via DAL
    await db.saveRefreshToken(
      user.id || user._id,
      refreshToken,
      metadata
    )

    // Attach token data to req for attachTokens middleware
    req.tokenData = {
      accessToken,
      refreshToken,
      user
    }

    // Call next() to reach attachTokens middleware
    // which sends tokens based on platform
    next()

  } catch (error) {
    console.error('Login error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    })
  }
}

// ─── REFRESH ─────────────────────────────────────
// POST /api/auth/refresh
// Issues new access + refresh tokens (rotation)
// Detects token reuse (theft detection)

const refresh = async (req, res, next) => {
  try {

    // Web: token comes from HTTP-only cookie
    // Mobile/API: token comes from request body
    const incomingToken =
      req.cookies?.refreshToken ||
      req.body?.refreshToken

    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      })
    }

    // Look up token in DB via DAL
    const tokenRecord = await db.findRefreshToken(
      incomingToken
    )

    // ── THEFT DETECTION ─────────────────────────
    // Token not found in DB means it was already used
    // This indicates a stolen token being reused
    if (!tokenRecord) {
      // We don't know whose token this was
      // But if we did — we'd wipe all their tokens
      // For now: reject with security warning
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token.',
        code:    'TOKEN_REUSE_DETECTED'
      })
    }

    // Check if token has expired
    const now = new Date()
    if (new Date(tokenRecord.expiresAt) < now) {
      // Clean up expired token
      await db.deleteRefreshToken(incomingToken)
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired. Please log in.',
        code:    'TOKEN_EXPIRED'
      })
    }

    // ── ROTATION ────────────────────────────────
    // Delete the OLD refresh token immediately
    // This is the core of rotation security
    await db.deleteRefreshToken(incomingToken)

    // Get the user this token belongs to
    const user = await db.findUserById(tokenRecord.userId)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      })
    }

    // Issue brand new access token
    const newAccessToken = generateAccessToken({
      userId: user.id || user._id,
      email:  user.email,
      role:   user.role
    })

    // Issue brand new refresh token
    const newRefreshToken = generateRefreshToken()

    // Build metadata for new token
    const metadata = buildTokenMetadata(
      req,
      tokenRecord.platform  // preserve original platform
    )
    metadata.expiresAt = getRefreshTokenExpiry()

    // Save new refresh token to DB
    await db.saveRefreshToken(
      user.id || user._id,
      newRefreshToken,
      metadata
    )

    // Attach new tokens to req for attachTokens
    req.tokenData = {
      accessToken:  newAccessToken,
      refreshToken: newRefreshToken,
      user
    }

    next()

  } catch (error) {
    console.error('Refresh error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed. Please log in.'
    })
  }
}

// ─── LOGOUT ──────────────────────────────────────
// POST /api/auth/logout
// Invalidates the refresh token + clears cookie

const logout = async (req, res) => {
  try {

    // Get token from cookie (web) or body (mobile/api)
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken

    if (token) {
      // Delete token from DB via DAL
      await db.deleteRefreshToken(token)
    }

    // Clear the HTTP-only cookie for web clients
    // Has no effect on mobile/API clients
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    })

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Logout failed'
    })
  }
}

// ─── ME ──────────────────────────────────────────
// GET /api/auth/me
// Returns the currently authenticated user
// req.user is set by verifyAccessToken middleware

const me = async (req, res) => {
  try {

    // Fetch fresh user data from DB
    // req.user.userId was set by verifyAccessToken
    const user = await db.findUserById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    return res.status(200).json({
      success: true,
      user: {
        id:    user.id    || user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        needsOnboarding: user.needsOnboarding || false,
        // Include OAuth accounts info (without secrets)
        oauthAccounts: (user.oauthAccounts || []).map(acc => ({
          provider: acc.provider,
          name:     acc.name,
          avatar:   acc.avatar
        }))
      }
    })

  } catch (error) {
    console.error('Me error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    })
  }
}

// ─── OAUTH SUCCESS HANDLER ───────────────────────
// Called after Passport.js completes OAuth flow
// Generates tokens for the OAuth-authenticated user

const oauthSuccess = async (req, res, next) => {
  try {

    // req.user is set by Passport.js after OAuth
    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'OAuth authentication failed'
      })
    }

    // Generate tokens same as standard login
    const accessToken  = generateAccessToken({
      userId: user.id || user._id,
      email:  user.email,
      role:   user.role
    })

    const refreshToken = generateRefreshToken()

    const metadata = buildTokenMetadata(req, req.platform)
    metadata.expiresAt = getRefreshTokenExpiry()

    await db.saveRefreshToken(
      user.id || user._id,
      refreshToken,
      metadata
    )

    // Attach to req for attachTokens middleware
    req.tokenData = { accessToken, refreshToken, user }

    next()

  } catch (error) {
    console.error('OAuth success error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'OAuth login failed'
    })
  }
}

// ─── COMPLETE ONBOARDING ─────────────────────────
// POST /api/auth/complete-onboarding
// Completes farmer profile for OAuth users

const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user.userId
    const {
      name,
      contact,
      locality,
      fieldSize,
      fieldUnit,
      sectorCount,
      soilType,
      irrigationType,
      fertilizerType,
      cropPlan,
      cropNames
    } = req.body

    // Validate required fields
    if (!name || !contact || !locality || !fieldSize || !sectorCount) {
      return res.status(400).json({
        success: false,
        message: 'Required fields are missing'
      })
    }

    // Update user with farmer profile
    const updatedUser = await db.updateUser(userId, {
      name,
      needsOnboarding: false,
      farmerProfile: {
        contact,
        locality,
        fieldSize: parseFloat(fieldSize),
        fieldUnit,
        sectorCount: parseInt(sectorCount),
        soilType,
        irrigationType,
        fertilizerType,
        cropPlan,
        cropNames
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id || updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        needsOnboarding: false
      }
    })

  } catch (error) {
    console.error('Complete onboarding error:', error.message)
    return res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding. Please try again.'
    })
  }
}

// ─── EXPORTS ─────────────────────────────────────
module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  oauthSuccess,
  completeOnboarding
}