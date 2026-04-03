import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, getAccessToken, clearAuth } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken()

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await authAPI.getCurrentUser()
        setUser(currentUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Listen for logout events from API interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null)
      setIsAuthenticated(false)
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const data = await authAPI.login(email, password)
      setUser(data.user)
      setIsAuthenticated(true)
      return { success: true, user: data.user }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      }
    }
  }, [])

  const register = useCallback(async (userData) => {
    try {
      const data = await authAPI.register(userData)
      return { success: true, message: data.message }
    } catch (error) {
      console.error('Register error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
    }
  }, [])

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
