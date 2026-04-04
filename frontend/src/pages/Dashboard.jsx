import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSocket, subscribeToSensorData, disconnectSocket } from '../services/socket'
import { sensorAPI, mapAPI } from '../services/api'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    soilMoisture: null,
    pH: null,
    voltage: null,
    analog: null,
    timestamp: null
  })
  const [mapConfig, setMapConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)

  // Demo state matching the HTML
  const [weather, setWeather] = useState({
    city: 'Aligarh',
    temp: 22,
    text: 'Sunny',
    humidity: 55,
    soilMoisture: 32,
    wind: 12
  })

  const [tasks, setTasks] = useState([
    { id: 1, title: 'Soil Testing in Field 3', due: 'Due: Today', done: true },
    { id: 2, title: 'Spraying Pesticides', due: 'Due: Tomorrow', done: false },
    { id: 3, title: 'Check Irrigation System', due: 'Due: in 2 Days', done: false }
  ])

  const [activities, setActivities] = useState([
    { icon: '✓', color: 'green', title: 'Inspection of Field 1', time: '15 mins ago', sub: 'Routine inspection completed successfully.' },
    { icon: '✓', color: 'blue', title: 'pH level of Field 2 is maintained', time: '1 hour ago', sub: 'Field 2 pH level is within the ideal range.' },
    { icon: '✓', color: 'green', title: 'Water level of Field 3 is maintained', time: '3 hours ago', sub: 'Water level is stable and sufficient for Field 3.' }
  ])

  const [fields, setFields] = useState([
    { name: 'Field 1', crop: 'Wheat', moisture: 74, ph: 6.8, status: 'Healthy' },
    { name: 'Field 2', crop: 'Wheat', moisture: 61, ph: 6.5, status: 'Healthy' },
    { name: 'Field 3', crop: 'Wheat', moisture: 49, ph: 6.2, status: 'Moderate' },
    { name: 'Field 4', crop: 'Wheat', moisture: 34, ph: 5.9, status: 'Needs Attention' },
    { name: 'Field 5', crop: 'Wheat', moisture: 72, ph: 6.7, status: 'Healthy' },
    { name: 'Field 6', crop: 'Wheat', moisture: 66, ph: 6.4, status: 'Healthy' },
    { name: 'Field 7', crop: 'Wheat', moisture: 58, ph: 6.3, status: 'Moderate' },
    { name: 'Field 8', crop: 'Wheat', moisture: 45, ph: 6.0, status: 'Moderate' },
    { name: 'Field 9', crop: 'Wheat', moisture: 76, ph: 6.9, status: 'Healthy' },
    { name: 'Field 10', crop: 'Wheat', moisture: 68, ph: 6.6, status: 'Healthy' },
    { name: 'Field 11', crop: 'Wheat', moisture: 39, ph: 5.8, status: 'Needs Attention' },
    { name: 'Field 12', crop: 'Wheat', moisture: 73, ph: 6.7, status: 'Healthy' }
  ])

  const [reports] = useState([
    { name: 'Moisture Report - Field 1', date: '02 Apr 2026', type: 'Moisture' },
    { name: 'pH Report - Field 2', date: '30 Mar 2026', type: 'pH' },
    { name: 'Yield Report - Field 3', date: '28 Mar 2026', type: 'Yield' },
    { name: 'Sensor Health Report - Field 4', date: '24 Mar 2026', type: 'Sensor' }
  ])

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [notification, setNotification] = useState('')
  const [settingsToggles, setSettingsToggles] = useState({
    notifications: true,
    autoIrrigation: true,
    weatherSync: true
  })

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const latestResponse = await sensorAPI.getLatest()
        if (latestResponse.success && latestResponse.data) {
          setSensorData(prev => ({ ...prev, ...latestResponse.data }))
        }
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
    }
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('sensorData', handleSensorData)
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('sensorData', handleSensorData)
    }
  }, [sensorData])

  const handleLogout = async () => {
    await logout()
    disconnectSocket()
  }

  const showToast = (message) => {
    setNotification(message)
    setTimeout(() => setNotification(''), 2200)
  }

  const handleSearchWeather = () => {
    const cityInput = document.getElementById('cityInput')
    if (cityInput && cityInput.value.trim()) {
      setWeather(prev => ({
        ...prev,
        city: cityInput.value.trim(),
        temp: 20 + Math.floor(Math.random() * 12),
        humidity: 45 + Math.floor(Math.random() * 30),
        soilMoisture: 25 + Math.floor(Math.random() * 30),
        wind: 8 + Math.floor(Math.random() * 12)
      }))
      showToast(`Weather location set to ${cityInput.value.trim()}`)
    } else {
      showToast('Please enter a city name')
    }
  }

  const handleUseLocation = () => {
    setWeather(prev => ({ ...prev, city: 'My Current Location' }))
    showToast('Using current location')
  }

  const handleAddField = () => {
    if (fields.length >= 12) {
      showToast('Maximum field limit reached (12)')
      return
    }
    const next = fields.length + 1
    const moisture = Math.floor(Math.random() * 50) + 30
    const ph = Number((Math.random() * 1.5 + 5.5).toFixed(1))
    const status = moisture > 60 ? 'Healthy' : moisture > 40 ? 'Moderate' : 'Needs Attention'
    setFields(prev => [...prev, { name: `Field ${next}`, crop: 'Wheat', moisture, ph, status }])
    showToast(`Field ${next} added`)
  }

  const handleScanSoil = () => {
    const fieldSelector = document.getElementById('fieldSelector')
    const selected = fieldSelector ? fieldSelector.value : 'all'

    if (selected === 'all') {
      setFields(prev => prev.map(field => {
        const moisture = Math.floor(Math.random() * 50) + 30
        const ph = Number((Math.random() * 1.5 + 5.5).toFixed(1))
        const status = moisture > 60 ? 'Healthy' : moisture > 40 ? 'Moderate' : 'Needs Attention'
        return { ...field, moisture, ph, status }
      }))
      setActivities(prev => [{
        icon: '✓', color: 'green', title: 'Soil Scan Completed',
        time: 'Just now', sub: 'Moisture and pH updated for all fields.'
      }, ...prev])
    } else {
      const index = Number(selected)
      const moisture = Math.floor(Math.random() * 50) + 30
      const ph = Number((Math.random() * 1.5 + 5.5).toFixed(1))
      const status = moisture > 60 ? 'Healthy' : moisture > 40 ? 'Moderate' : 'Needs Attention'
      setFields(prev => prev.map((f, i) => i === index ? { ...f, moisture, ph, status } : f))
      setActivities(prev => [{
        icon: '✓', color: 'green', title: `${fields[index]?.name || 'Field'} scanned`,
        time: 'Just now', sub: 'Moisture and pH updated for selected field.'
      }, ...prev])
    }
    showToast('Soil scan completed')
  }

  const handleRefreshFieldStats = () => {
    setFields(prev => prev.map(field => {
      const moisture = Math.max(28, Math.min(80, field.moisture + Math.floor(Math.random() * 11) - 5))
      const status = moisture > 60 ? 'Healthy' : moisture > 40 ? 'Moderate' : 'Needs Attention'
      return { ...field, moisture, status }
    }))
    showToast('Field stats refreshed')
  }

  const handleSimulateIrrigation = () => {
    setActivities(prev => [{
      icon: '✓', color: 'blue', title: 'Irrigation Check Completed',
      time: 'Just now', sub: 'Moisture data synchronized for all monitored fields.'
    }, ...prev])
    showToast('Irrigation system check complete')
  }

  const handleSimulateSensorScan = () => {
    setActivities(prev => [{
      icon: '✓', color: 'green', title: 'Sensor Scan Finished',
      time: 'Just now', sub: 'Sensors checked successfully.'
    }, ...prev])
    showToast('Sensor scan finished')
  }

  const handleAddTask = () => {
    const taskName = document.getElementById('taskNameInput')?.value?.trim()
    const taskField = document.getElementById('taskFieldInput')?.value?.trim()
    const taskDue = document.getElementById('taskDueInput')?.value || 'Today'

    if (!taskName) {
      showToast('Please enter a task name')
      return
    }

    setTasks(prev => [{
      id: Date.now(),
      title: taskField ? `${taskName} · ${taskField}` : taskName,
      due: `Due: ${taskDue}`,
      done: false
    }, ...prev])

    if (document.getElementById('taskNameInput')) document.getElementById('taskNameInput').value = ''
    if (document.getElementById('taskFieldInput')) document.getElementById('taskFieldInput').value = ''
    if (document.getElementById('taskDueInput')) document.getElementById('taskDueInput').value = 'Today'

    setShowTaskModal(false)
    showToast('Task added')
  }

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, done: !task.done } : task
    ))
  }

  const handleClearCompleted = () => {
    setTasks(prev => prev.filter(task => !task.done))
    showToast('Completed tasks cleared')
  }

  const handleExportSettings = () => showToast('Settings exported')
  const handleResetDemo = () => window.location.reload()
  const handleTestNotification = () => showToast('Test notification sent')

  const handleToggleSetting = (key) => {
    setSettingsToggles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const getFieldStatusColor = (status) => {
    switch (status) {
      case 'Healthy': return '#5faa43'
      case 'Moderate': return '#f3b71d'
      case 'Needs Attention': return '#e65427'
      default: return '#5faa43'
    }
  }

  const healthyZones = fields.filter(f => f.status === 'Healthy').length
  const moderateZones = fields.filter(f => f.status === 'Moderate').length
  const criticalZones = fields.filter(f => f.status === 'Needs Attention').length

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(86, 194, 113, 0.2)',
          borderTopColor: '#56c271',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="brand">
          <span className="logo">🌾</span>
          <span>AgroDashboard</span>
        </div>

        <nav className="nav">
          <button
            className={`nav-btn ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActivePage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-btn ${activePage === 'fields' ? 'active' : ''}`}
            onClick={() => setActivePage('fields')}
          >
            🌱 Fields
          </button>
          <button
            className={`nav-btn ${activePage === 'reports' ? 'active' : ''}`}
            onClick={() => setActivePage('reports')}
          >
            📈 Reports
          </button>
          <button
            className={`nav-btn ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => setActivePage('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="profile">
          <div className="avatar" id="userAvatar">👤</div>
          <span id="userName">{user?.name || 'User'}</span>
          <button className="logout-btn" id="logoutBtn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="main">
        {/* Weather Search Card - hidden on settings page */}
        {activePage !== 'settings' && (
          <div className="card weather-search-card">
            <div className="weather-search-row">
              <input type="text" id="cityInput" placeholder="Enter city name" defaultValue={weather.city} />
              <button className="action-btn" onClick={handleSearchWeather}>Search Weather</button>
              <button className="ghost-btn" onClick={handleUseLocation}>Use My Location</button>
              <span id="weatherLocationLabel" style={{ fontWeight: 700, color: 'var(--muted)' }}>
                Location: {weather.city}
              </span>
            </div>
          </div>
        )}

        {/* Dashboard Page */}
        {activePage === 'dashboard' && (
          <section className="page active" id="dashboard-page">
            <div className="stats-grid">
              <div className="card stat-card fields">
                <div className="stat-head">
                  <div>
                    <div className="stat-title">Healthy Zones</div>
                    <div className="stat-value" id="healthyZones">{healthyZones}</div>
                    <div className="stat-sub">of total fields</div>
                  </div>
                  <div className="stat-icon">🌿</div>
                </div>
              </div>

              <div className="card stat-card sensors">
                <div className="stat-head">
                  <div>
                    <div className="stat-title">Soil Moisture</div>
                    <div className="stat-value" id="soilMoistureValue">{sensorData.soilMoisture ?? '--'}</div>
                    <div className="stat-sub">average reading</div>
                  </div>
                  <div className="stat-icon">💧</div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Weather Overview Card */}
              <section className="card">
                <div className="panel-title">
                  <h3>🌤️ Weather Overview</h3>
                </div>
                <div className="weather-box-body">
                  <div className="weather-main">
                    <span className="big-icon" id="weatherIcon">☀️</span>
                    <div>
                      <div className="temp">{weather.temp}°C</div>
                      <div id="weatherText">{weather.text}</div>
                    </div>
                  </div>
                  <div className="weather-list">
                    <div className="weather-item">
                      <span>💧</span>
                      <span>Humidity: <strong>{weather.humidity}%</strong></span>
                    </div>
                    <div className="weather-item">
                      <span>🌱</span>
                      <span>Soil Moisture: <strong>{weather.soilMoisture}%</strong></span>
                    </div>
                    <div className="weather-item">
                      <span>💨</span>
                      <span>Wind: <strong>{weather.wind} km/h</strong></span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Bottom Row - 3 cards */}
              <div className="bottom-row">
                <section className="card">
                  <div className="panel-title">
                    <h3>📋 Recent Activities</h3>
                  </div>
                  <div className="recent-list" id="activityList">
                    {activities.map((item, index) => (
                      <div className="activity-item" key={index}>
                        <div className="item-left">
                          <div className={`round-icon icon-${item.color}`}>{item.icon}</div>
                          <div>
                            <div className="item-title">{item.title}</div>
                            <div className="item-sub">{item.sub}</div>
                          </div>
                        </div>
                        <div className="muted-time">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card">
                  <div className="panel-title">
                    <h3>✅ Tasks</h3>
                    <button className="small-btn" id="openTaskModal" onClick={() => setShowTaskModal(true)}>+ Add</button>
                  </div>
                  <div className="task-list" id="taskList">
                    {tasks.map((task) => (
                      <div className="task-item" key={task.id}>
                        <div className="item-left">
                          <div
                            className={`task-status ${task.done ? 'done' : ''}`}
                            onClick={() => handleToggleTask(task.id)}
                          >
                            {task.done && '✓'}
                          </div>
                          <div>
                            <div className={`item-title ${task.done ? 'done' : ''}`}>{task.title}</div>
                            <div className="item-sub">{task.due}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="task-footer">
                    <button className="ghost-btn" id="clearCompleted" onClick={handleClearCompleted}>Clear Done</button>
                  </div>
                </section>

                <section className="card">
                  <div className="panel-title">
                    <h3>🔌 Live Sensor Data</h3>
                    <span className="sensor-realtime-value" id="sensorStatus">
                      {socketConnected ? 'Live' : 'Waiting...'}
                    </span>
                  </div>
                  <div className="recent-list" id="sensorDataList">
                    {socketConnected && sensorData.pH ? (
                      <>
                        <div className="activity-item">
                          <div className="item-left">
                            <div className="round-icon icon-green">pH</div>
                            <div>
                              <div className="item-title">pH Level</div>
                              <div className="item-sub">{sensorData.pH} {sensorData.pH >= 6 && sensorData.pH <= 7 ? '(Optimal)' : '(Adjust needed)'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="activity-item">
                          <div className="item-left">
                            <div className="round-icon icon-blue">💧</div>
                            <div>
                              <div className="item-title">Moisture</div>
                              <div className="item-sub">{sensorData.soilMoisture}% {sensorData.soilMoisture >= 40 ? '(Good)' : '(Low)'}</div>
                            </div>
                          </div>
                        </div>
                        <div className="activity-item">
                          <div className="item-left">
                            <div className="round-icon" style={{ background: '#8e44ad' }}>⚡</div>
                            <div>
                              <div className="item-title">Voltage</div>
                              <div className="item-sub">{sensorData.voltage}V</div>
                            </div>
                          </div>
                          <div className="muted-time">
                            {sensorData.timestamp ? new Date(sensorData.timestamp).toLocaleTimeString() : '--:--:--'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="loading-state">
                        <p>Connecting to sensor...</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </section>
        )}

        {/* Fields Page */}
        {activePage === 'fields' && (
          <section className="page active" id="fields-page">
            <div className="card">
              <div className="panel-title">
                <h3>🌾 Field Management</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select id="fieldSelector" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    <option value="all">All Fields</option>
                    {fields.map((f, i) => (
                      <option key={i} value={i}>{f.name}</option>
                    ))}
                  </select>
                  <button className="action-btn" onClick={handleAddField}>+ Add Field</button>
                  <button className="ghost-btn" id="refreshFieldStats" onClick={handleRefreshFieldStats}>🔄 Refresh</button>
                </div>
              </div>
              <div className="field-stats">
                <div className="mini-stat">
                  <div className="label">Healthy Zones</div>
                  <div className="value" id="healthyCount">{healthyZones}</div>
                </div>
                <div className="mini-stat">
                  <div className="label">Moderate Zones</div>
                  <div className="value" id="moderateCount">{moderateZones}</div>
                </div>
                <div className="mini-stat">
                  <div className="label">Critical Zones</div>
                  <div className="value" id="criticalCount">{criticalZones}</div>
                </div>
              </div>
              <div className="scan-row">
                <div className="scan-top">
                  <select id="scanFieldSelector" style={{ width: '100%', maxWidth: '280px' }}>
                    <option value="all">All Fields</option>
                    {fields.map((f, i) => (
                      <option key={i} value={i}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <button className="action-btn" id="scanSoilBtn" onClick={handleScanSoil}>Scan Soil</button>
              </div>
              <div className="task-footer">
                <button className="ghost-btn" id="simulateIrrigation" onClick={handleSimulateIrrigation}>Run Irrigation Check</button>
                <button className="ghost-btn" id="simulateSensorScan" onClick={handleSimulateSensorScan}>Sensor Scan</button>
              </div>
              <div className="field-list" id="fieldList">
                {fields.map((field, index) => {
                  const pillClass = field.status === 'Healthy' ? 'good' : field.status === 'Moderate' ? 'watch' : 'alert'
                  return (
                    <div className="field-item" key={index}>
                      <div className="item-left">
                        <div>
                          <div className="item-title">{field.name} · {field.crop}</div>
                          <div className="item-sub">Moisture: {field.moisture}% · pH: {field.ph}</div>
                        </div>
                      </div>
                      <span className={`pill ${pillClass}`}>{field.status}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Reports Page */}
        {activePage === 'reports' && (
          <section className="page active" id="reports-page">
            <div className="reports-grid">
              <section className="card">
                <div className="panel-title">
                  <h3>Farm Analytics Reports</h3>
                </div>
                <div className="report-list" id="reportList">
                  {reports.map((report, index) => (
                    <div className="activity-item" key={index}>
                      <div className="item-left">
                        <div className="round-icon icon-blue">📄</div>
                        <div>
                          <div className="item-title">{report.name}</div>
                          <div className="item-sub">{report.date}</div>
                        </div>
                      </div>
                      <span className="pill good">{report.type}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="panel-title">
                  <h3>Field Trends</h3>
                  <select id="farmSelector" style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                    {fields.map((f, i) => (
                      <option key={i} value={i}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="report-chart" style={{ padding: '20px', height: '280px' }}>
                  <canvas id="farmLineChart"></canvas>
                </div>
                <div style={{ padding: '12px 20px 16px', textAlign: 'center', borderTop: '1px solid var(--line)', fontSize: '0.92rem', display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <span style={{ display: 'inline-block', width: 28, height: 3, background: '#2f81c6', borderRadius: 4 }}></span>
                    <span style={{ color: '#2f81c6' }}>Moisture (%)</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <span style={{ display: 'inline-block', width: 28, height: 3, background: '#4a9d35', borderRadius: 4 }}></span>
                    <span style={{ color: '#4a9d35' }}>pH Level</span>
                  </span>
                </div>
              </section>
            </div>
          </section>
        )}

        {/* Settings Page */}
        {activePage === 'settings' && (
          <section className="page active" id="settings-page">
            <div className="settings-grid">
              <section className="card">
                <div className="panel-title">
                  <h3>System Settings</h3>
                </div>
                <div className="setting-list">
                  <div className="setting-item">
                    <div>
                      <div className="item-title">Notification Alerts</div>
                      <div className="item-sub">Receive field and weather alerts instantly</div>
                    </div>
                    <div
                      className={`toggle ${settingsToggles.notifications ? 'on' : ''}`}
                      onClick={() => handleToggleSetting('notifications')}
                    ></div>
                  </div>
                  <div className="setting-item">
                    <div>
                      <div className="item-title">Auto Irrigation Suggestion</div>
                      <div className="item-sub">System recommends irrigation schedules</div>
                    </div>
                    <div
                      className={`toggle ${settingsToggles.autoIrrigation ? 'on' : ''}`}
                      onClick={() => handleToggleSetting('autoIrrigation')}
                    ></div>
                  </div>
                  <div className="setting-item">
                    <div>
                      <div className="item-title">Weather Sync</div>
                      <div className="item-sub">Sync forecast data every 30 minutes</div>
                    </div>
                    <div
                      className={`toggle ${settingsToggles.weatherSync ? 'on' : ''}`}
                      onClick={() => handleToggleSetting('weatherSync')}
                    ></div>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="panel-title">
                  <h3>Quick Actions</h3>
                </div>
                <div className="task-footer" style={{ paddingTop: 18 }}>
                  <button className="action-btn" id="exportSettingsBtn" onClick={handleExportSettings}>Export Settings</button>
                  <button className="ghost-btn" id="resetDemoBtn" onClick={handleResetDemo}>Reset Demo Data</button>
                  <button className="ghost-btn" id="testNotificationBtn" onClick={handleTestNotification}>Test Notification</button>
                </div>
                <div className="empty-state">
                  These controls are connected to the demo dashboard.
                </div>
              </section>
            </div>
          </section>
        )}
      </main>

      {/* Connection Status */}
      <div className={`connection-status ${socketConnected ? 'connected' : 'disconnected'}`} id="connectionStatus">
        {socketConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Notification Toast */}
      <div className={`notification ${notification ? 'show' : ''}`} id="notification">
        {notification}
      </div>

      {/* Task Modal - Only shown when + Add button is clicked on Dashboard */}
      {showTaskModal && (
        <div className="modal-backdrop show" id="taskModalBackdrop" onClick={(e) => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal">
            <div className="modal-head">
              <h3>Add New Task</h3>
              <button className="ghost-btn" id="closeTaskModal" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <input type="text" id="taskNameInput" placeholder="Task name" />
              <input type="text" id="taskFieldInput" placeholder="Field name or number" />
              <select id="taskDueInput">
                <option value="Today">Due Today</option>
                <option value="Tomorrow">Due Tomorrow</option>
                <option value="In 2 Days">Due in 2 Days</option>
                <option value="This Week">Due This Week</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="ghost-btn" id="cancelTaskBtn" onClick={() => setShowTaskModal(false)}>Cancel</button>
              <button className="action-btn" id="saveTaskBtn" onClick={handleAddTask}>Save Task</button>
            </div>
          </div>
        </div>
      )}

      <style>{dashboardStyles}</style>
    </div>
  )
}

const dashboardStyles = `
  :root {
    --green-dark: #1f6a2e;
    --green: #4a9d35;
    --green-soft: #78b84d;
    --mint: #dff1d8;
    --yellow: #f3b71d;
    --orange: #f27a1a;
    --red: #e65427;
    --blue: #2f81c6;
    --card: rgba(255,255,255,0.95);
    --line: rgba(0,0,0,0.09);
    --text: #24313d;
    --muted: #6d7a85;
    --shadow: 0 10px 30px rgba(10, 30, 20, 0.16);
    --radius: 18px;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'Inter', sans-serif;
    color: var(--text);
    background:
      linear-gradient(rgba(237, 247, 237, 0.20), rgba(237, 247, 237, 0.20)),
      url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat fixed;
    min-height: 100vh;
  }

  .app-shell {
    min-height: 100vh;
    backdrop-filter: blur(1.5px);
  }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 28px;
    background: linear-gradient(90deg, rgba(22,90,36,0.96), rgba(46,122,57,0.94));
    box-shadow: 0 4px 14px rgba(0,0,0,0.18);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    color: #fff;
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.2px;
  }

  .brand .logo {
    font-size: 2rem;
  }

  .nav {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .nav-btn, .ghost-btn, .action-btn, .small-btn, .danger-btn {
    border: none;
    cursor: pointer;
    font-family: inherit;
    transition: 0.25s ease;
  }

  .nav-btn {
    color: rgba(255,255,255,0.92);
    background: transparent;
    padding: 10px 14px;
    border-radius: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.96rem;
  }

  .nav-btn:hover,
  .nav-btn.active {
    background: rgba(255,255,255,0.13);
    color: #fff;
    box-shadow: inset 0 -3px 0 #a9dc7f;
  }

  .profile {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    font-weight: 700;
  }

  .avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f5f5f5, #c7e7bb);
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    border: 3px solid rgba(255,255,255,0.7);
    box-shadow: 0 8px 18px rgba(0,0,0,0.18);
  }

  .logout-btn {
    background: rgba(231, 76, 60, 0.2);
    color: #fff;
    border: 1px solid rgba(231, 76, 60, 0.4);
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(231, 76, 60, 0.4);
  }

  .main {
    padding: 20px;
    max-width: 1480px;
    margin: 0 auto;
  }

  .page {
    display: none;
    animation: fadeIn 0.3s ease;
  }

  .page.active { display: block; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .weather-search-card {
    padding: 16px 18px;
    margin-bottom: 18px;
  }

  .weather-search-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .weather-search-row input {
    padding: 12px 14px;
    border: 1px solid #d7dde2;
    border-radius: 12px;
    font: inherit;
    min-width: 240px;
    outline: none;
  }

  .weather-search-row input:focus {
    border-color: #5ea945;
    box-shadow: 0 0 0 4px rgba(94, 169, 69, 0.12);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(180px, 1fr));
    gap: 18px;
    margin-bottom: 18px;
  }

  .card {
    background: var(--card);
    border: 1px solid rgba(255,255,255,0.5);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
  }

  .stat-card {
    padding: 18px 20px 0;
    min-height: 126px;
    position: relative;
  }

  .stat-card::after {
    content: '';
    display: block;
    height: 14px;
    margin: 16px -20px 0;
  }

  .stat-card.fields::after { background: linear-gradient(90deg, #74bb43, #4c9a34); }
  .stat-card.sensors::after { background: linear-gradient(90deg, #6ac16d, #319b7a); }

  .stat-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .stat-icon { font-size: 2.3rem; }

  .stat-title {
    font-size: 0.96rem;
    color: var(--muted);
    font-weight: 700;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
  }

  .stat-sub {
    margin-top: 8px;
    color: var(--muted);
    font-weight: 600;
  }

  .panel-title {
    padding: 18px 22px;
    border-bottom: 1px solid var(--line);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .panel-title h3 { margin: 0; font-size: 1.05rem; }

  .dashboard-grid,
  .field-grid,
  .reports-grid,
  .settings-grid {
    display: grid;
    gap: 18px;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1fr;
    gap: 18px;
    margin-top: 18px;
    align-items: start;
  }

  .weather-box-body {
    padding: 18px 22px 22px;
  }

  .weather-main {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--line);
  }

  .weather-main .big-icon {
    font-size: 4rem;
  }

  .weather-main .temp {
    font-size: 3rem;
    font-weight: 800;
  }

  .weather-list {
    display: grid;
    gap: 12px;
  }

  .weather-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 700;
    color: #394652;
  }

  .weather-item span:first-child {
    font-size: 1.4rem;
    width: 32px;
    text-align: center;
  }

  .sensor-realtime-value {
    font-size: 1.2rem;
    color: #5ea945;
    font-weight: 700;
  }

  .field-image-wrap {
    padding: 18px;
  }

  .field-image {
    width: 100%;
    height: 310px;
    border-radius: 16px;
    object-fit: cover;
    border: 1px solid rgba(0,0,0,0.05);
    display: block;
    background: #e8efe5;
  }

  .legend {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    padding: 0 18px 18px;
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid var(--line);
    font-weight: 700;
  }

  .legend-swatch {
    width: 28px;
    height: 20px;
    border-radius: 5px;
  }

  .recent-list, .task-list, .field-list, .report-list, .setting-list {
    padding: 10px 16px 18px;
    display: grid;
    gap: 10px;
  }

  .activity-item, .task-item, .field-item, .report-item, .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 10px;
    border-bottom: 1px solid var(--line);
  }

  .activity-item:last-child,
  .task-item:last-child,
  .field-item:last-child,
  .report-item:last-child,
  .setting-item:last-child { border-bottom: none; }

  .item-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .round-icon {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .icon-green { background: #5faa43; }
  .icon-blue { background: #3f8bd9; }

  .item-title {
    font-weight: 700;
    margin-bottom: 4px;
  }

  .item-title.done {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .item-sub {
    color: var(--muted);
    font-size: 0.92rem;
  }

  .muted-time {
    color: var(--muted);
    font-weight: 600;
    white-space: nowrap;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    padding: 8px 12px;
    border-radius: 999px;
    font-size: 0.87rem;
    font-weight: 800;
  }

  .pill.good { background: #dff4d8; color: #2f7d2a; }
  .pill.watch { background: #fff0ce; color: #9e6b00; }
  .pill.alert { background: #fde0d7; color: #b4441d; }

  .task-status {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: 2px solid #96c183;
    display: grid;
    place-items: center;
    font-weight: 800;
    color: #fff;
    cursor: pointer;
    background: #fff;
    flex-shrink: 0;
  }

  .task-status.done {
    background: #59ab42;
    border-color: #59ab42;
  }

  .task-footer, .page-actions {
    padding: 0 18px 18px;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .scan-row {
    padding: 0 18px 18px;
    display: block;
  }

  .scan-row .scan-top {
    margin-bottom: 12px;
  }

  .scan-row select {
    width: 100%;
    max-width: 280px;
    padding: 11px 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    font: inherit;
    outline: none;
  }

  .action-btn, .ghost-btn, .small-btn, .danger-btn {
    border-radius: 12px;
    font-weight: 700;
    padding: 11px 16px;
  }

  .action-btn {
    background: linear-gradient(180deg, #5fae46, #428d33);
    color: #fff;
    box-shadow: 0 8px 18px rgba(70, 150, 55, 0.28);
  }

  .ghost-btn, .small-btn {
    background: #fff;
    color: var(--text);
    border: 1px solid var(--line);
  }

  .danger-btn {
    background: linear-gradient(180deg, #ef6b55, #d9472d);
    color: #fff;
    box-shadow: 0 8px 18px rgba(217, 71, 45, 0.22);
  }

  .small-btn, .danger-btn { padding: 8px 12px; font-size: 0.9rem; }

  .field-grid, .reports-grid, .settings-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .field-stats {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0,1fr));
    gap: 16px;
  }

  .mini-stat {
    background: #f7fbf6;
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px;
  }

  .mini-stat .label { color: var(--muted); font-weight: 700; margin-bottom: 8px; }
  .mini-stat .value { font-size: 1.7rem; font-weight: 800; }

  .notification {
    position: fixed;
    right: 18px;
    bottom: 18px;
    background: rgba(32, 44, 54, 0.95);
    color: #fff;
    padding: 14px 16px;
    border-radius: 14px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
    transform: translateY(18px);
    opacity: 0;
    pointer-events: none;
    transition: 0.25s ease;
    max-width: 360px;
    z-index: 100;
    font-weight: 600;
  }

  .notification.show {
    transform: translateY(0);
    opacity: 1;
  }

  .connection-status {
    position: fixed;
    top: 70px;
    right: 20px;
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 700;
    z-index: 90;
  }

  .connection-status.connected {
    background: rgba(94, 169, 69, 0.9);
    color: #fff;
  }

  .connection-status.disconnected {
    background: rgba(231, 76, 60, 0.9);
    color: #fff;
  }

  .loading-state {
    padding: 40px;
    text-align: center;
    color: var(--muted);
  }

  .loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid rgba(94, 169, 69, 0.2);
    border-top-color: #5ea945;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(9, 18, 14, 0.45);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 120;
    padding: 20px;
  }

  .modal-backdrop.show {
    display: flex;
  }

  .modal {
    background: #fff;
    border-radius: 22px;
    width: min(520px, 100%);
    overflow: hidden;
    box-shadow: 0 22px 60px rgba(0,0,0,0.25);
    animation: modalSlide 0.25s ease;
  }

  @keyframes modalSlide {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .modal-head {
    padding: 20px 22px;
    border-bottom: 1px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .modal-head h3 {
    margin: 0;
  }

  .modal-body {
    padding: 20px 22px;
    display: grid;
    gap: 14px;
  }

  .modal-body input,
  .modal-body select {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #d7dde2;
    border-radius: 12px;
    font: inherit;
    outline: none;
  }

  .modal-actions {
    padding: 20px 22px;
    border-top: 1px solid var(--line);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .empty-state {
    padding: 32px 18px;
    text-align: center;
    color: var(--muted);
    font-weight: 600;
  }

  .toggle {
    width: 58px;
    height: 32px;
    border-radius: 999px;
    background: #d1d8de;
    position: relative;
    cursor: pointer;
    transition: 0.25s ease;
    flex-shrink: 0;
  }

  .toggle::after {
    content: '';
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    position: absolute;
    top: 4px;
    left: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.18);
    transition: 0.25s ease;
  }

  .toggle.on {
    background: linear-gradient(180deg, #67ba4b, #459238);
  }

  .toggle.on::after {
    left: 30px;
  }

  @media (max-width: 900px) {
    .topbar { flex-wrap: wrap; gap: 12px; padding: 12px 16px; }
    .nav { order: 2; width: 100%; justify-content: center; }
    .profile { margin-left: auto; }
    .stats-grid { grid-template-columns: 1fr; }
    .field-grid, .reports-grid, .settings-grid { grid-template-columns: 1fr; }
    .field-stats { grid-template-columns: 1fr; }
    .bottom-row { grid-template-columns: 1fr; }
  }

  @media (max-width: 560px) {
    .nav-btn { font-size: 0.85rem; padding: 8px 10px; }
    .avatar { width: 42px; height: 42px; font-size: 1.1rem; }
    .stat-value { font-size: 1.5rem; }
    .weather-search-row { flex-direction: column; align-items: stretch; }
    .modal, .graph-modal { max-width: 100%; }
  }
`

export default Dashboard
