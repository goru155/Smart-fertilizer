// ═══════════════════════════════════════════════════
  // FILE: src/mqtt/mqttClient.js
  // PURPOSE: Connect to MQTT broker, subscribe to topic,
  //          receive ESP32 sensor data, store via DAL,
  //          emit via WebSocket
  // ═══════════════════════════════════════════════════

  // HOW THIS WORKS:
  // Step 1:  Load environment variables (MQTT broker URL, topic)
  // Step 2:  Create MQTT client connection to broker
  // Step 3:  Subscribe to sensor topic on connect
  // Step 4:  On message received → parse JSON → validate → store via DAL
  // Step 5:  Emit data via WebSocket to all connected frontends
  // Step 6:  Handle errors and reconnection automatically

  // ─── ENVIRONMENT ─────────────────────────────────
  require('dotenv').config()

  // ─── IMPORTS ────────────────────────────────────
  const mqtt = require('mqtt')
  const db = require('../db')              // DAL for storing sensor data
  const { emitSensorData } = require('../socket/socketHandler') // WebSocket broadcast

  // ─── CONFIGURATION ───────────────────────────────
  const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com'
  const MQTT_TOPIC = process.env.MQTT_TOPIC || 'smart-agriculture/sensors'

  // ─── CLIENT STATE ────────────────────────────────
  let client = null
  let isConnected = false

  // ─── CONNECTION OPTIONS ──────────────────────────
  const options = {
    // Client ID must be unique per connection
    clientId: `smart-agri-backend-${Date.now()}`,

    // Clean session = true means broker won't store
    // messages for this client when disconnected
    clean: true,

    // How long to wait before considering
    // connection failed (in ms)
    connectTimeout: 30000,

    // Automatically reconnect if disconnected
    reconnectPeriod: 5000,  // Try every 5 seconds

    // Maximum number of reconnection attempts
    maxReconnects: 10,

    // Keepalive - send ping every 60 seconds
    // to keep connection alive
    keepalive: 60
  }

  // ─── MESSAGE VALIDATION ──────────────────────────
  /**
   * Validates that incoming sensor data has expected structure
   * Prevents garbage data from being stored in database
   *
   * @param {Object} data - Parsed MQTT payload
   * @returns {boolean} - true if valid, false if invalid
   */
  // ─── MESSAGE VALIDATION ──────────────────────────
  const validateSensorData = (data) => {
    // Must be an object
    if (!data || typeof data !== 'object') {
      console.warn('⚠️  Invalid sensor data: not an object')
      return false
    }

    // Fields that YOUR ESP32 publishes
    const allowedFields = [
      'analog',
      'voltage',
      'pH'
    ]

    // Check if at least one allowed field exists
    const hasValidField = allowedFields.some(field => field in data)

    if (!hasValidField) {
      console.warn('⚠️  Invalid sensor data: no valid sensor fields found')
      console.warn(`   Expected fields: ${allowedFields.join(', ')}`)
      console.warn(`   Received: ${JSON.stringify(data)}`)
      return false
    }

    // Validate numeric fields are actually numbers
    for (const field of allowedFields) {
      if (field in data && typeof data[field] !== 'number') {
        console.warn(`⚠️  Invalid sensor data: ${field} must be a number, got ${typeof data[field]}`)
        return false
      }
    }

    // Additional validation for pH values (should be 0-14)
    if ('pH' in data && (data.pH < 0 || data.pH > 14)) {
      console.warn(`⚠️  Invalid pH value: ${data.pH} (should be 0-14)`)
      // Don't reject - ESP32 might send invalid readings during calibration
    }

    return true
  }

// ─── MESSAGE HANDLER ─────────────────────────────
    /**
     * Handles incoming MQTT messages from ESP32
     *
     * Flow:
     * 1. Log received topic and message for debugging
     * 2. Parse JSON payload (ESP32 sends JSON string)
     * 3. Validate data structure
     * 4. Store via DAL (works with in-memory or MongoDB)
     * 5. Emit via WebSocket to all connected frontends
     *
     * @param {string} topic - MQTT topic the message was published to
     * @param {Buffer} message - Raw MQTT message payload
     */
    const handleMessage = async (topic, message) => {
      try {
        // Step 1: Log the topic (for debugging)
        console.log(`📨 MQTT message received on topic: ${topic}`)

        // Step 2: Convert Buffer to string
        const payloadString = message.toString()
        console.log(`   Raw payload: ${payloadString}`)

        // Step 3: Parse JSON
        // ESP32 should send: {"temperature": 25.5, "humidity": 60, ...}
        let payload
        try {
          payload = JSON.parse(payloadString)
        } catch (parseError) {
          console.error('❌ Failed to parse MQTT payload as JSON:', parseError.message)
          return  // Stop processing invalid JSON
        }

        // Step 4: Validate payload structure
        if (!validateSensorData(payload)) {
          console.error('❌ Sensor data validation failed')
          return  // Stop processing invalid data
        }

        // Step 5: Store via DAL
        // This is the key abstraction — same call works for
        // in-memory (dev) and MongoDB (prod)
        const savedData = await db.saveSensorData(payload)
        console.log('✅ Sensor data saved via DAL:', savedData)

        // Step 6: Emit to WebSocket clients
        // Frontend receives real-time updates instantly
        emitSensorData(savedData)

      } catch (error) {
        console.error('❌ Error processing MQTT message:', error.message)
        // Don't rethrow — one bad message shouldn't crash the listener
      }
    }

  // ─── CONNECTION HANDLER ──────────────────────────
  /**
   * Called when successfully connected to MQTT broker
   * Subscribes to the configured topic
   */
  const onConnect = () => {
    console.log(`✅ Connected to MQTT broker: ${MQTT_BROKER_URL}`)
    isConnected = true

    // Subscribe to sensor topic
    client.subscribe(MQTT_TOPIC, (err) => {
      if (err) {
        console.error(`❌ Failed to subscribe to ${MQTT_TOPIC}:`, err.message)
        return
      }
      console.log(`📡 Subscribed to MQTT topic: ${MQTT_TOPIC}`)
    })
  }

  // ─── ERROR HANDLER ───────────────────────────────
  /**
   * Handles MQTT client errors
   * Connection errors, protocol errors, etc.
   */
  const onError = (error) => {
    console.error('❌ MQTT client error:', error.message)
    isConnected = false
  }

  // ─── DISCONNECT HANDLER ──────────────────────────
  /**
   * Called when disconnected from broker
   * Logs reason and updates connection state
   */
  const onDisconnect = () => {
    console.log('❌ Disconnected from MQTT broker')
    isConnected = false
  }

  // ─── RECONNECT HANDLER ───────────────────────────
  /**
   * Called when attempting to reconnect
   * Useful for logging reconnection attempts
   */
  const onReconnect = () => {
    console.log('🔄 Attempting to reconnect to MQTT broker...')
  }

  // ─── OFFLINE HANDLER ─────────────────────────────
  /**
   * Called when client goes offline
   */
  const onOffline = () => {
    console.log('📴 MQTT client went offline')
    isConnected = false
  }

  // ─── INITIALIZATION FUNCTION ─────────────────────
  /**
   * Creates MQTT client, attaches event handlers,
   * initiates connection to broker
   *
   * Must be called from server.js during startup
   */
  const initMQTT = () => {
    console.log('')
    console.log('╔════════════════════════════════════════╗')
    console.log('║   📡 MQTT Client Initializing...       ║')
    console.log('╠════════════════════════════════════════╣')
    console.log(`║   Broker : ${MQTT_BROKER_URL}                   ║`)
    console.log(`║   Topic  : ${MQTT_TOPIC}        ║`)
    console.log('╚════════════════════════════════════════╝')
    console.log('')

    // Create MQTT client connection
    client = mqtt.connect(MQTT_BROKER_URL, options)

    // Attach event handlers
    client.on('connect', onConnect)
    client.on('message', handleMessage)
    client.on('error', onError)
    client.on('disconnect', onDisconnect)
    client.on('reconnect', onReconnect)
    client.on('offline', onOffline)

    return client
  }

  // ─── PUBLISH FUNCTION (OPTIONAL) ─────────────────
  /**
   * Sends data TO ESP32 via MQTT
   * Useful for sending commands or configuration updates
   *
   * @param {string} topic - Topic to publish to
   * @param {Object} data - Data to send (will be JSON stringified)
   */
  const publishMQTT = (topic, data) => {
    if (!client || !isConnected) {
      console.warn('⚠️  Cannot publish: MQTT client not connected')
      return false
    }

    const message = JSON.stringify(data)
    client.publish(topic, message, (err) => {
      if (err) {
        console.error('❌ Failed to publish MQTT message:', err.message)
        return false
      }
      console.log(`📤 Published to ${topic}: ${message}`)
      return true
    })
  }

  // ─── UTILITY FUNCTIONS ────────────────────────────
  /**
   * Check if MQTT client is currently connected
   */
  const getMQTTConnectionStatus = () => {
    return {
      connected: isConnected,
      broker: MQTT_BROKER_URL,
      topic: MQTT_TOPIC
    }
  }

  /**
   * Manually disconnect from MQTT broker
   * Use only for graceful shutdown
   */
  const disconnectMQTT = () => {
    if (client) {
      client.end()
      console.log('👋 MQTT client disconnected gracefully')
      isConnected = false
    }
  }

  // ─── EXPORTS ─────────────────────────────────────
  module.exports = {
    initMQTT,                    // Call from server.js
    publishMQTT,                 // Optional: send data to ESP32
    getMQTTConnectionStatus,     // Health check endpoint
    disconnectMQTT               // Graceful shutdown
  }