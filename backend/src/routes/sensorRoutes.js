// ═══════════════════════════════════════════════════
  // FILE: src/routes/sensorRoutes.js
  // PURPOSE: Define HTTP endpoints for sensor data
  //          Apply rate limiting + JWT protection
  // ═══════════════════════════════════════════════════

  // HOW THIS WORKS:
  // Step 1:  Import Express and rate limiter
  // Step 2:  Import JWT verification middleware
  // Step 3:  Import sensor controller functions
  // Step 4:  Create router and define routes with middleware chain
  // Step 5:  Export router for use in server.js

  // ─── IMPORTS ───────────────────────────────────────
  const express = require('express')
  const rateLimit = require('express-rate-limit')
  const verifyAccessToken = require('../middleware/verifyAccessToken')
  const sensorController = require('../controllers/sensorController')

  // ─── ROUTER SETUP ──────────────────────────────────
  const router = express.Router()

  // ─── RATE LIMITER CONFIG ───────────────────────────
  /**
   * General API rate limiter
   * - Window: 15 minutes
   * - Max requests: 100 per window
   *
   * Applied to all sensor routes
   */
  const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false,
  })

  // ─── ROUTES ────────────────────────────────────────

  /**
   * GET /api/sensor/latest
   *
   * Middleware chain:
   * 1. apiLimiter - Check rate limit
   * 2. verifyAccessToken - Validate JWT
   * 3. sensorController.getLatestSensorData - Return data
   */
  router.get('/latest', apiLimiter, verifyAccessToken, sensorController.getLatestSensorData)

  /**
   * GET /api/sensor/history
   *
   * Query params:
   *   ?limit=50 (optional, default 50, max 500)
   *
   * Middleware chain:
   * 1. apiLimiter - Check rate limit
   * 2. verifyAccessToken - Validate JWT
   * 3. sensorController.getSensorHistory - Return data
   */
  router.get('/history', apiLimiter, verifyAccessToken, sensorController.getSensorHistory)

  // ─── EXPORTS ──────────────────────────────────────
  module.exports = router