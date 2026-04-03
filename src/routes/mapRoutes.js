// ═══════════════════════════════════════════════════
  // FILE: src/routes/mapRoutes.js
  // PURPOSE: Define HTTP endpoints for map-related data
  //          Apply rate limiting + JWT protection
  // ═══════════════════════════════════════════════════

  // HOW THIS WORKS:
  // Step 1:  Import Express and rate limiter
  // Step 2:  Import JWT verification middleware
  // Step 3:  Import map controller functions
  // Step 4:  Create router and define routes with middleware chain
  // Step 5:  Export router for use in server.js

  // ─── IMPORTS ───────────────────────────────────────
  const express = require('express')
  const rateLimit = require('express-rate-limit')
  const verifyAccessToken = require('../middleware/verifyAccessToken')
  const mapController = require('../controllers/mapController')

  // ─── ROUTER SETUP ──────────────────────────────────
  const router = express.Router()

  // ─── RATE LIMITER CONFIG ───────────────────────────
  /**
   * Map-specific rate limiter (stricter than general API)
   * Prevents token harvesting and map API abuse
   *
   * - Window: 15 minutes
   * - Max requests: 30 per window
   */
  const mapLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.MAP_RATE_LIMIT_MAX) || 30,
    message: {
      success: false,
      message: 'Too many map requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })

  // ─── ROUTES ────────────────────────────────────────

  /**
   * GET /api/map/token
   *
   * Middleware chain:
   * 1. mapLimiter - Strict rate limit (prevent token harvesting)
   * 2. verifyAccessToken - Validate JWT
   * 3. mapController.getMapboxToken - Return token
   */
  router.get('/token', mapLimiter, verifyAccessToken, mapController.getMapboxToken)

  /**
   * GET /api/map/bounds
   *
   * Middleware chain:
   * 1. mapLimiter - Strict rate limit
   * 2. verifyAccessToken - Validate JWT
   * 3. mapController.getMapBoundary - Return boundary coords
   */
  router.get('/bounds', mapLimiter, verifyAccessToken, mapController.getMapBoundary)

  // ─── EXPORTS ──────────────────────────────────────
  module.exports = router