import axios from 'axios'

// Create axios instance with base config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Send cookies for web auth
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add access token to headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add platform header for web clients
    config.headers['X-Client-Type'] = 'web'
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: { 'X-Client-Type': 'web' }
          }
        )

        // Store new access token
        if (data.accessToken) {
          setAccessToken(data.accessToken)
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        clearAuth()
        window.dispatchEvent(new CustomEvent('auth:logout'))
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Token storage (in-memory for access token, cookie for refresh)
let accessToken = null

export const getAccessToken = () => {
  return accessToken || localStorage.getItem('accessToken')
}

export const setAccessToken = (token) => {
  accessToken = token
  localStorage.setItem('accessToken', token)
}

export const clearAuth = () => {
  accessToken = null
  localStorage.removeItem('accessToken')
}

// Auth API calls
export const authAPI = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', {
      email,
      password
    })
    if (data.accessToken) {
      setAccessToken(data.accessToken)
    }
    return data
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearAuth()
    }
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/auth/me')
    return data.user
  },

  refreshToken: async () => {
    const { data } = await api.post('/auth/refresh')
    if (data.accessToken) {
      setAccessToken(data.accessToken)
    }
    return data
  }
}

// Sensor API calls
export const sensorAPI = {
  getLatest: async () => {
    const { data } = await api.get('/sensor/latest')
    return data
  },

  getHistory: async (limit = 50) => {
    const { data } = await api.get(`/sensor/history?limit=${limit}`)
    return data
  }
}

// Map API calls
export const mapAPI = {
  getToken: async () => {
    const { data } = await api.get('/map/token')
    return data
  },

  getBoundary: async () => {
    const { data } = await api.get('/map/bounds')
    return data
  }
}

export default api
