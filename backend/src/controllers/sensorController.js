// ═══════════════════════════════════════════════════
  // FILE: src/controllers/sensorController.js
  // PURPOSE: Handle all sensor-related business logic
  //          Get latest reading, get historical data
  // ═══════════════════════════════════════════════════

  // HOW THIS WORKS:
  // Step 1:  Import DAL (Database Abstraction Layer)
  // Step 2:  Define controller functions that call DAL
  // Step 3:  Return consistent JSON responses
  // Step 4:  Handle errors gracefully

  // ─── IMPORTS ───────────────────────────────────────
  const db = require('../db')  // DAL - works with in-memory or MongoDB

  // ─── GET LATEST SENSOR DATA ────────────────────────
  /**
   * Returns the most recent sensor reading
   *
   * Response format:
   * {
   *   success: true,
   *   data: { analog: 2048, voltage: 1.65, pH: 6.85, timestamp: "..." }
   * }
   */
  const getLatestSensorData = async (req, res) => {
    try {
      // Call DAL to get latest sensor reading
      // Works with in-memory (dev) or MongoDB (prod)
      const latestData = await db.getLatestSensorData()

      // Handle case where no data exists yet
      if (!latestData) {
        return res.status(404).json({
          success: false,
          message: 'No sensor data available yet. Wait for ESP32 to publish.'
        })
      }

      // Return successful response
      res.status(200).json({
        success: true,
        data: latestData
      })

    } catch (error) {
      console.error('❌ Error in getLatestSensorData:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve sensor data'
      })
    }
  }

  // ─── GET SENSOR HISTORY ────────────────────────────
  /**
   * Returns historical sensor readings for charts
   *
   * Query params:
   *   limit (optional) - Number of readings to return (default: 50)
   *
   * Response format:
   * {
   *   success: true,
   *   count: 50,
   *   data: [ {...}, {...}, ... ]  // Array of sensor readings
   * }
   */
  const getSensorHistory = async (req, res) => {
    try {
      // Get limit from query params (default: 50)
      // Frontend can request: /api/sensor/history?limit=100
      const limit = parseInt(req.query.limit) || 50

      // Validate limit (prevent abuse)
      if (limit < 1 || limit > 500) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be between 1 and 500'
        })
      }

      // Call DAL to get historical readings
      const history = await db.getSensorHistory(limit)

      // Handle case where no data exists
      if (!history || history.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No historical sensor data available'
        })
      }

      // Return successful response
      res.status(200).json({
        success: true,
        count: history.length,
        data: history
      })

    } catch (error) {
      console.error('❌ Error in getSensorHistory:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve historical sensor data'
      })
    }
  }

  // ─── EXPORTS ──────────────────────────────────────
  module.exports = {
    getLatestSensorData,
    getSensorHistory
  }