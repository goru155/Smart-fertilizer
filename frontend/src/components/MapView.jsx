import React, { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

// Set Mapbox base URL
mapboxgl.baseApiUrl = 'https://api.mapbox.com'

const MapView = ({ token, style, sensorData }) => {
  const mapContainerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [mapError, setMapError] = useState(null)

  useEffect(() => {
    if (!token) {
      setMapError('Mapbox token not available')
      return
    }

    // Initialize Mapbox
    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: style || 'mapbox://styles/mapbox/satellite-streets-v11',
      center: [77.2090, 28.6139], // Default: Delhi, India
      zoom: 13,
      pitch: 45,
      bearing: 0,
      antialias: true
    })

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add fullscreen control
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    map.on('load', () => {
      console.log('✅ Map loaded successfully')
    })

    map.on('error', (e) => {
      console.error('❌ Map error:', e.error)
      setMapError('Failed to load map')
    })

    mapRef.current = map

    return () => {
      if (markerRef.current) {
        markerRef.current.remove()
      }
      map.remove()
    }
  }, [token])

  // Update marker when sensor data changes
  useEffect(() => {
    if (!mapRef.current || !sensorData) return

    const map = mapRef.current

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Only create marker if we have valid data
    if (sensorData.soilMoisture !== null && sensorData.soilMoisture !== undefined) {
      // Create custom marker element
      const el = document.createElement('div')
      el.className = 'sensor-marker'
      el.innerHTML = `
        <div class="marker-pin" style="background: ${getMoistureColor(sensorData.soilMoisture)}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
        </div>
      `

      // Create popup content
      const popupContent = `
        <div class="sensor-popup">
          <h4>🌱 Sensor Reading</h4>
          <div class="popup-grid">
            <div class="popup-item">
              <span class="popup-label">🌡️ Temperature</span>
              <span class="popup-value">${formatValue(sensorData.temperature)} °C</span>
            </div>
            <div class="popup-item">
              <span class="popup-label">💧 Humidity</span>
              <span class="popup-value">${formatValue(sensorData.humidity)} %</span>
            </div>
            <div class="popup-item">
              <span class="popup-label">🌿 Soil Moisture</span>
              <span class="popup-value">${formatValue(sensorData.soilMoisture)} %</span>
            </div>
            <div class="popup-item">
              <span class="popup-label">🔬 pH Level</span>
              <span class="popup-value">${formatValue(sensorData.pH)}</span>
            </div>
            <div class="popup-item">
              <span class="popup-label">⚡ Voltage</span>
              <span class="popup-value">${formatValue(sensorData.voltage)} V</span>
            </div>
          </div>
          <div class="popup-time">
            <small>Updated: ${sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'Just now'}</small>
          </div>
        </div>
      `

      // Create marker at farm location (using default coordinates)
      const marker = new mapboxgl.Marker(el)
        .setLngLat([77.2090, 28.6139])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: true })
            .setHTML(popupContent)
        )
        .addTo(map)

      markerRef.current = marker

      // Add marker pulse animation
      setTimeout(() => {
        const pin = document.querySelector('.marker-pin')
        if (pin) {
          pin.style.animation = 'pulse 2s infinite'
        }
      }, 100)
    }
  }, [sensorData])

  // Helper functions
  const getMoistureColor = (moisture) => {
    if (moisture === null || moisture === undefined) return '#95a5a6'
    if (moisture < 20) return '#e74c3c' // Dry - red
    if (moisture < 40) return '#f39c12' // Low - orange
    if (moisture < 60) return '#27ae60' // Optimal - green
    return '#3498db' // High - blue
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) return '--'
    return typeof value === 'number' ? value.toFixed(2) : value
  }

  return (
    <div className="map-view-container">
      {mapError ? (
        <div className="map-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          <p>{mapError}</p>
          <span>Please check your Mapbox configuration</span>
        </div>
      ) : (
        <>
          <div ref={mapContainerRef} className="map-container" />
          <div className="map-legend">
            <div className="legend-title">Soil Moisture Status</div>
            <div className="legend-items">
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#e74c3c' }}></span>
                <span>Dry (&lt;20%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#f39c12' }}></span>
                <span>Low (20-40%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#27ae60' }}></span>
                <span>Optimal (40-60%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: '#3498db' }}></span>
                <span>High (&gt;60%)</span>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .map-view-container {
          position: relative;
          height: 100%;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(35, 67, 58, 0.1);
        }

        .map-container {
          width: 100%;
          height: 100%;
        }

        .map-error {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.95);
          color: #6c746f;
        }

        .map-error svg {
          color: #bdc3c7;
        }

        .map-error p {
          font-size: 1.1rem;
          font-weight: 600;
          color: #e74c3c;
        }

        .map-legend {
          position: absolute;
          bottom: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 16px;
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          z-index: 10;
          min-width: 180px;
        }

        .legend-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: #23433a;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #6c746f;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* Sensor Marker Styles */
        .sensor-marker {
          cursor: pointer;
        }

        .marker-pin {
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transform: rotate(-45deg);
          transition: transform 0.2s ease;
        }

        .marker-pin svg {
          transform: rotate(45deg);
        }

        .marker-pin:hover {
          transform: rotate(-45deg) scale(1.1);
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(39, 174, 96, 0);
          }
        }

        /* Popup Styles */
        .sensor-popup {
          min-width: 220px;
          padding: 8px;
        }

        .sensor-popup h4 {
          font-size: 1rem;
          font-weight: 700;
          color: #23433a;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(74, 92, 83, 0.1);
        }

        .popup-grid {
          display: grid;
          gap: 8px;
        }

        .popup-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
        }

        .popup-label {
          font-size: 0.85rem;
          color: #6c746f;
        }

        .popup-value {
          font-size: 0.9rem;
          font-weight: 700;
          color: #23433a;
        }

        .popup-time {
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid rgba(74, 92, 83, 0.1);
          text-align: right;
        }

        .popup-time small {
          font-size: 0.75rem;
          color: #95a5a6;
        }

        /* Mapbox control overrides */
        .mapboxgl-ctrl-group {
          border-radius: 8px !important;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }

        .mapboxgl-ctrl button {
          background: white !important;
        }

        .mapboxgl-ctrl button:hover {
          background: #f5f9f7 !important;
        }
      `}</style>
    </div>
  )
}

export default MapView
