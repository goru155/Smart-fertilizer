import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket, subscribeToSensorData, disconnectSocket } from '../services/socket'
import { sensorAPI, mapAPI } from '../services/api'
import SensorCard from '../components/SensorCard'
import SensorChart from '../components/SensorChart'
import MapView from '../components/MapView'

const Dashboard = () => {
  const { user, logout } = useAuth()

  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    soilMoisture: null,
    pH: null,
    voltage: null,
    analog: null,
    timestamp: null
  })

  const [chartData, setChartData] = useState([])
  const [mapConfig, setMapConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, chart, map
  const [socketConnected, setSocketConnected] = useState(false)

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load sensor data
        const latestResponse = await sensorAPI.getLatest()
        if (latestResponse.success && latestResponse.data) {
          setSensorData(prev => ({
            ...prev,
            ...latestResponse.data
          }))
        }

        // Load chart history
        const historyResponse = await sensorAPI.getHistory(50)
        if (historyResponse.success && historyResponse.data) {
          setChartData(historyResponse.data)
        }

        // Load map config
        const mapResponse = await mapAPI.getToken()
        if (mapResponse.success && mapResponse.data) {
          setMapConfig(mapResponse.data)
        }
      } catch (error) {
        console.error('Failed to load initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Setup WebSocket connection
  useEffect(() => {
    const socket = getSocket()

    const handleConnect = () => {
      setSocketConnected(true)
      console.log('✅ WebSocket connected')
    }

    const handleDisconnect = () => {
      setSocketConnected(false)
      console.log('❌ WebSocket disconnected')
    }

    const handleSensorData = (data) => {
      console.log('📡 Real-time sensor data:', data)
      setSensorData({
        temperature: data.temperature ?? sensorData.temperature,
        humidity: data.humidity ?? sensorData.humidity,
        soilMoisture: data.soilMoisture ?? sensorData.soilMoisture,
        pH: data.pH ?? sensorData.pH,
        voltage: data.voltage ?? sensorData.voltage,
        analog: data.analog ?? sensorData.analog,
        timestamp: data.receivedAt || new Date().toISOString()
      })

      // Update chart data with new reading
      setChartData(prev => {
        const newData = [...prev, data]
        return newData.slice(-50) // Keep last 50 readings
      })
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('sensorData', handleSensorData)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('sensorData', handleSensorData)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await logout()
    disconnectSocket()
  }, [logout])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <div className="leaf-icon">
              <span className="leaf-stem"></span>
            </div>
            <span>AgroFarm</span>
          </div>
          <div className="connection-status">
            <span className={`status-dot ${socketConnected ? 'connected' : 'disconnected'}`}></span>
            <span>{socketConnected ? 'Live' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name || 'Farmer'}</span>
            <span className="user-email">{user?.email || ''}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Charts
        </button>
        <button
          className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
          Map
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="sensor-grid">
              <SensorCard
                title="Temperature"
                value={sensorData.temperature}
                unit="°C"
                icon="🌡️"
                color="#e74c3c"
              />
              <SensorCard
                title="Humidity"
                value={sensorData.humidity}
                unit="%"
                icon="💧"
                color="#3498db"
              />
              <SensorCard
                title="Soil Moisture"
                value={sensorData.soilMoisture}
                unit="%"
                icon="🌱"
                color="#27ae60"
              />
              <SensorCard
                title="Soil pH"
                value={sensorData.pH}
                unit="pH"
                icon="🔬"
                color="#9b59b6"
              />
              <SensorCard
                title="Voltage"
                value={sensorData.voltage}
                unit="V"
                icon="⚡"
                color="#f39c12"
              />
              <SensorCard
                title="Analog"
                value={sensorData.analog}
                unit=""
                icon="📊"
                color="#1abc9c"
              />
            </div>

            {/* Latest Update */}
            <div className="last-update">
              <span>Last updated:</span>
              <time>{sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleString() : 'Waiting for data...'}</time>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="chart-tab">
            <SensorChart data={chartData} />
          </div>
        )}

        {activeTab === 'map' && mapConfig && (
          <div className="map-tab">
            <MapView
              token={mapConfig.token}
              style={mapConfig.style}
              sensorData={sensorData}
            />
          </div>
        )}
      </main>

      <style>{dashboardStyles}</style>
    </div>
  )
}

const dashboardStyles = `
  .dashboard-page {
    min-height: 100vh;
    background: #f5f9f7;
  }

  .dashboard-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(86, 194, 113, 0.2);
    border-top-color: #56c271;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Header */
  .dashboard-header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(74, 92, 83, 0.1);
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.5rem;
    font-weight: 700;
    color: #23433a;
  }

  .leaf-icon {
    width: 36px;
    height: 36px;
    position: relative;
  }

  .leaf-icon::before,
  .leaf-icon::after {
    content: '';
    position: absolute;
    border-radius: 100% 0 100% 0;
    background: linear-gradient(145deg, #3cb57a, #79d54f);
  }

  .leaf-icon::before {
    width: 18px;
    height: 24px;
    left: 4px;
    top: 6px;
    transform: rotate(-36deg);
  }

  .leaf-icon::after {
    width: 16px;
    height: 21px;
    right: 4px;
    top: 2px;
    transform: rotate(26deg);
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #6c746f;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #95a5a6;
  }

  .status-dot.connected {
    background: #27ae60;
    box-shadow: 0 0 8px rgba(39, 174, 96, 0.5);
  }

  .status-dot.disconnected {
    background: #e74c3c;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .user-name {
    font-weight: 600;
    color: #23433a;
    font-size: 0.95rem;
  }

  .user-email {
    font-size: 0.8rem;
    color: #6c746f;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1.5px solid rgba(74, 92, 83, 0.2);
    border-radius: 12px;
    background: transparent;
    color: #23433a;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(231, 76, 60, 0.1);
    border-color: #e74c3c;
    color: #e74c3c;
  }

  /* Tabs */
  .dashboard-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.5);
    border-bottom: 1px solid rgba(74, 92, 83, 0.1);
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    border-radius: 12px;
    background: transparent;
    color: #6c746f;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    background: rgba(86, 194, 113, 0.1);
    color: #23433a;
  }

  .tab-btn.active {
    background: linear-gradient(135deg, #56c271, #3cb57a);
    color: white;
  }

  /* Content */
  .dashboard-content {
    padding: 24px;
  }

  .overview-tab {
    max-width: 1400px;
    margin: 0 auto;
  }

  .sensor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .last-update {
    text-align: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 16px;
    color: #6c746f;
    font-size: 0.9rem;
  }

  .last-update time {
    margin-left: 8px;
    font-weight: 600;
    color: #23433a;
  }

  .chart-tab {
    max-width: 1200px;
    margin: 0 auto;
  }

  .map-tab {
    height: calc(100vh - 200px);
    min-height: 500px;
  }

  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      gap: 16px;
      padding: 12px 16px;
    }

    .header-left, .header-right {
      width: 100%;
      justify-content: center;
    }

    .dashboard-tabs {
      overflow-x: auto;
      padding: 12px 16px;
    }

    .tab-btn {
      white-space: nowrap;
    }

    .dashboard-content {
      padding: 16px;
    }

    .sensor-grid {
      grid-template-columns: 1fr;
    }
  }
`

export default Dashboard
