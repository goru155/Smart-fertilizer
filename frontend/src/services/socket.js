import { io } from 'socket.io-client'

let socketInstance = null

export const initSocket = () => {
  if (socketInstance) {
    return socketInstance
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

  socketInstance = io(socketUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000
  })

  socketInstance.on('connect', () => {
    console.log('🔌 Socket connected:', socketInstance.id)
  })

  socketInstance.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason)
  })

  socketInstance.on('connect_error', (error) => {
    console.error('⚠️ Socket connection error:', error.message)
  })

  return socketInstance
}

export const getSocket = () => {
  if (!socketInstance) {
    return initSocket()
  }
  return socketInstance
}

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

// Sensor data events
export const subscribeToSensorData = (callback) => {
  const socket = getSocket()
  socket.on('sensorData', callback)
  return () => socket.off('sensorData', callback)
}

// Room events (for multi-farm support)
export const joinRoom = (room) => {
  const socket = getSocket()
  socket.emit('joinRoom', room)
}

export const leaveRoom = (room) => {
  const socket = getSocket()
  socket.emit('leaveRoom', room)
}

export default {
  initSocket,
  getSocket,
  disconnectSocket,
  subscribeToSensorData,
  joinRoom,
  leaveRoom
}
