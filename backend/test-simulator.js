// ═══════════════════════════════════════════════════
// MQTT Sensor Simulator
// Use this to test the backend without physical ESP32
// ═══════════════════════════════════════════════════

const mqtt = require('mqtt')

// Configuration
const MQTT_BROKER = 'mqtt://broker.hivemq.com'  // Public test broker
const MQTT_TOPIC = 'smart-agriculture/sensors'

// Connect to broker
const client = mqtt.connect(MQTT_BROKER, {
  clientId: `simulator-${Date.now()}`
})

client.on('connect', () => {
  console.log('✅ Simulator connected to MQTT broker')
  console.log(`📡 Publishing to topic: ${MQTT_TOPIC}`)
  console.log('🔄 Sending sensor data every 5 seconds...\n')

  // Send sensor data every 5 seconds
  setInterval(publishSensorData, 5000)
})

function publishSensorData() {
  // Generate random sensor values
  const sensorData = {
    analog: Math.floor(Math.random() * 4096),      // 0-4095 (ESP32 ADC range)
    voltage: (Math.random() * 3.3).toFixed(2),     // 0-3.3V
    pH: (5 + Math.random() * 3).toFixed(2),        // 5.0-8.0 (typical soil pH)
    temperature: (20 + Math.random() * 15).toFixed(1),  // 20-35°C
    humidity: (40 + Math.random() * 40).toFixed(1),     // 40-80%
    soilMoisture: (30 + Math.random() * 50).toFixed(1)  // 30-80%
  }

  const message = JSON.stringify(sensorData)

  client.publish(MQTT_TOPIC, message, (err) => {
    if (err) {
      console.error('❌ Publish error:', err.message)
      return
    }
    console.log('📤 Published:', message)
  })
}

// Handle errors
client.on('error', (err) => {
  console.error('❌ MQTT error:', err.message)
})

// Handle disconnect
client.on('disconnect', () => {
  console.log('❌ Disconnected from broker')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping simulator...')
  client.end()
  process.exit(0)
})
