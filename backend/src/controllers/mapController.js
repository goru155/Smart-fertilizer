// ═══════════════════════════════════════════════════
  // FILE: src/controllers/mapController.js
  // PURPOSE: Handle Mapbox token and boundary requests
  //          Never expose Mapbox token directly in frontend
  // ═══════════════════════════════════════════════════

  // HOW THIS WORKS:
  // Step 1:  Read Mapbox configuration from environment
  // Step 2:  Return token via protected endpoint (JWT required)
  // Step 3:  Return boundary coordinates for map restriction
  // Step 4:  Rate limit to prevent token harvesting

  // ─── ENVIRONMENT ───────────────────────────────────
  // Mapbox configuration from .env
  // NEVER hardcode these values - always read from process.env
  const MAPBOX_CONFIG = {
    token: process.env.MAPBOX_TOKEN,
    center: {
      lat: parseFloat(process.env.MAP_CENTER_LAT) || 0,
      lng: parseFloat(process.env.MAP_CENTER_LNG) || 0
    },
    boundary: {
      north: parseFloat(process.env.MAP_BOUNDARY_NORTH) || 90,
      south: parseFloat(process.env.MAP_BOUNDARY_SOUTH) || -90,
      east: parseFloat(process.env.MAP_BOUNDARY_EAST) || 180,
      west: parseFloat(process.env.MAP_BOUNDARY_WEST) || -180
    },
    defaultZoom: parseInt(process.env.MAP_DEFAULT_ZOOM) || 13
  }

  // ─── GET MAPBOX TOKEN ──────────────────────────────
  /**
   * Returns Mapbox access token
   *
   * SECURITY:
   * - Token is served from backend only (never hardcoded in frontend)
   * - JWT authentication required
   * - Rate limited to prevent token harvesting
   *
   * Response format:
   * {
   *   success: true,
   *   data: {
   *     token: "pk.eyJ1Ijoi...",
   *     style: "mapbox://styles/mapbox/satellite-streets-v11"
   *   }
   * }
   */
  const getMapboxToken = (req, res) => {
    try {
      // Validate token exists
      if (!MAPBOX_CONFIG.token || MAPBOX_CONFIG.token === 'your_mapbox_token_here') {
        return res.status(503).json({
          success: false,
          message: 'Mapbox token not configured on server'
        })
      }

      // Return token with recommended map style
      res.status(200).json({
        success: true,
        data: {
          token: MAPBOX_CONFIG.token,
          style: 'mapbox://styles/mapbox/satellite-streets-v11'
        }
      })

    } catch (error) {
      console.error('❌ Error in getMapboxToken:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve Mapbox token'
      })
    }
  }

  // ─── GET MAP BOUNDARY ──────────────────────────────
  /**
   * Returns map boundary coordinates for restriction
   *
   * Frontend uses these to:
   * - Restrict pan/zoom to farm area
   * - Set initial view center
   * - Clamp max/min zoom levels
   *
   * Response format:
   * {
   *   success: true,
   *   data: {
   *     center: { lat: 40.7128, lng: -74.0060 },
   *     boundary: { north: ..., south: ..., east: ..., west: ... },
   *     zoom: { min: 10, max: 18, default: 13 }
   *   }
   * }
   */
  const getMapBoundary = (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          center: MAPBOX_CONFIG.center,
          boundary: MAPBOX_CONFIG.boundary,
          zoom: {
            min: 10,
            max: 18,
            default: MAPBOX_CONFIG.defaultZoom
          }
        }
      })

    } catch (error) {
      console.error('❌ Error in getMapBoundary:', error.message)

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve map boundary'
      })
    }
  }

  // ─── EXPORTS ──────────────────────────────────────
  module.exports = {
    getMapboxToken,
    getMapBoundary
  }