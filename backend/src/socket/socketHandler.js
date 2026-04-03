// ═══════════════════════════════════════════════════
// FILE: src/socket/socketHandler.js
// PURPOSE: Manages all Socket.io connections,
//          disconnections, and real-time events
//          Exports emitSensorData so MQTT client
//          can trigger broadcasts
// ═══════════════════════════════════════════════════

let ioInstance = null

const initSocket = (io) => {
  ioInstance = io

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected    | ID: ${socket.id}`)

    socket.emit('connected', {
      message:   'Connected to Smart Agriculture Backend',
      socketId:  socket.id,
      timestamp: new Date().toISOString()
    })

    socket.on('joinRoom', (room) => {
      socket.join(room)
      console.log(`📦 Client ${socket.id} joined room: ${room}`)
      socket.emit('roomJoined', {
        room,
        message: `Joined room: ${room}`
      })
    })

    socket.on('leaveRoom', (room) => {
      socket.leave(room)
      console.log(`📤 Client ${socket.id} left room: ${room}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(
        `❌ Client disconnected | ID: ${socket.id} | Reason: ${reason}`
      )
    })

    socket.on('error', (error) => {
      console.error(
        `⚠️  Socket error | ID: ${socket.id} | ${error.message}`
      )
    })
  })

  console.log('✅ Socket.io initialized')
}

const emitSensorData = (data) => {
  if (!ioInstance) {
    console.warn('⚠️  Socket.io not initialized yet')
    return
  }

  ioInstance.emit('sensorData', {
    ...data,
    receivedAt: new Date().toISOString()
  })

  console.log(
    `📡 Emitted sensorData to all clients:`,
    JSON.stringify(data)
  )
}

const emitToRoom = (room, data) => {
  if (!ioInstance) {
    console.warn('⚠️  Socket.io not initialized yet')
    return
  }

  ioInstance.to(room).emit('sensorData', {
    ...data,
    receivedAt: new Date().toISOString()
  })

  console.log(`📡 Emitted sensorData to room: ${room}`)
}

module.exports = {
  initSocket,
  emitSensorData,
  emitToRoom
}