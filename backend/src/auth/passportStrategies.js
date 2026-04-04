// ═══════════════════════════════════════════════════
// FILE: src/auth/passportStrategies.js
// PURPOSE: Configures Google + Facebook OAuth
//          strategies for Passport.js
//          Handles user mapping/linking logic
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Configure Google strategy with credentials
// Step 2: Configure Facebook strategy with credentials
// Step 3: In each strategy callback:
//         a) Extract profile data from provider
//         b) Check if oauthId exists in DB
//         c) If yes → return existing user
//         d) If no  → check if email exists
//         e) If email exists → link OAuth to account
//         f) If nothing exists → create new user
// Step 4: Call done(null, user) to continue
// Step 5: Export a function that initializes both

const passport       = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const FacebookStrategy = require('passport-facebook')
const db             = require('../db')

const initPassport = () => {

  // ── GOOGLE STRATEGY ─────────────────────────────
  passport.use(new GoogleStrategy(
    {
      // Credentials from Google Cloud Console
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL,

      // Request additional profile fields
      scope: ['profile', 'email']
    },

    // Callback runs after Google authenticates user
    // profile: data returned by Google
    // done: call this when finished
    async (accessToken, refreshToken, profile, done) => {
      try {

        // Extract clean data from Google profile
        const oauthProfile = {
          oauthId: profile.id,
          name:    profile.displayName,
          email:   profile.emails?.[0]?.value || null,
          avatar:  profile.photos?.[0]?.value || null
        }

        // ── USER MAPPING LOGIC ─────────────────────

        // Step 1: Check if this Google ID already exists
        let user = await db.findUserByOAuthId(
          'google',
          oauthProfile.oauthId
        )

        if (user) {
          // User already linked this Google account
          // Just return them
          return done(null, user)
        }

        // Step 2: Check if email already has an account
        if (oauthProfile.email) {
          user = await db.findUserByEmail(oauthProfile.email)

          if (user) {
            // Account exists with this email
            // Link Google to their existing account
            user = await db.linkOAuthToUser(
              user.id || user._id,
              'google',
              oauthProfile
            )
            // Set needsOnboarding if not already set
            if (!user.needsOnboarding && !user.farmerProfile?.contact) {
              user = await db.updateUser(user.id || user._id, { needsOnboarding: true })
            }
            return done(null, user)
          }
        }

        // Step 3: No existing account found
        // Create a brand new user from Google profile
        user = await db.createOAuthUser('google', oauthProfile)
        return done(null, user)

      } catch (error) {
        // Pass error to Passport to handle
        return done(error, null)
      }
    }
  ))

  // ── FACEBOOK STRATEGY ───────────────────────────
  // Only initialize if credentials are provided
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy(
      {
        // Credentials from Facebook Developer Console
        clientID:     process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL:  process.env.FACEBOOK_CALLBACK_URL,

        // Request email field from Facebook
        // Facebook does not include it by default
        profileFields: ['id', 'displayName', 'email', 'photos']
      },

    // Same structure as Google callback
    async (accessToken, refreshToken, profile, done) => {
      try {

        // Extract clean data from Facebook profile
        const oauthProfile = {
          oauthId: profile.id,
          name:    profile.displayName,
          email:   profile.emails?.[0]?.value || null,
          avatar:  profile.photos?.[0]?.value || null
        }

        // ── USER MAPPING LOGIC (same as Google) ───

        // Step 1: Check if Facebook ID already linked
        let user = await db.findUserByOAuthId(
          'facebook',
          oauthProfile.oauthId
        )

        if (user) {
          return done(null, user)
        }

        // Step 2: Check if email already has account
        if (oauthProfile.email) {
          user = await db.findUserByEmail(oauthProfile.email)

          if (user) {
            // Link Facebook to existing account
            user = await db.linkOAuthToUser(
              user.id || user._id,
              'facebook',
              oauthProfile
            )
            // Set needsOnboarding if not already set
            if (!user.needsOnboarding && !user.farmerProfile?.contact) {
              user = await db.updateUser(user.id || user._id, { needsOnboarding: true })
            }
            return done(null, user)
          }
        }

        // Step 3: Create new user from Facebook profile
        user = await db.createOAuthUser(
          'facebook',
          oauthProfile
        )
        return done(null, user)

      } catch (error) {
        return done(error, null)
      }
    }
  ))
  }

  // ── SERIALIZE / DESERIALIZE ─────────────────────
  // Required by Passport even in JWT-based systems
  // We use minimal serialization since JWTs are
  // stateless — we don't use sessions

  // Store only the user ID in the session
  passport.serializeUser((user, done) => {
    done(null, user.id || user._id)
  })

  // Retrieve user from ID stored in session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.findUserById(id)
      done(null, user)
    } catch (error) {
      done(error, null)
    }
  })
}

module.exports = initPassport