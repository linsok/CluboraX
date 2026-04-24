import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProfile } from '../api/profile'

const AuthContext = createContext()

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
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for existing authentication on mount
    const token = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    const sessionExpiration = localStorage.getItem('sessionExpiration')
    
    // Check if session has expired
    if (sessionExpiration) {
      const expirationTime = parseInt(sessionExpiration)
      const currentTime = new Date().getTime()
      
      if (currentTime > expirationTime) {
        // Session expired, clear all data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('sessionExpiration')
        setIsLoading(false)
        return
      }
    }
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        setIsAuthenticated(true)
        
        // Fetch fresh user data from API to ensure we have latest first_name/last_name
        getProfile()
          .then(response => {
            // Update with fresh data if available
            if (response?.data || response?.user) {
              const freshUserData = response.data || response.user || response
              setUser(freshUserData)
              localStorage.setItem('user', JSON.stringify(freshUserData))
            }
          })
          .catch(error => {
            console.error('Failed to fetch fresh user data:', error)
            // Continue with cached data if API fails
          })
      } catch (error) {
        console.error('Error parsing user data:', error)
        // Clear corrupted data
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('sessionExpiration')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = (userData, accessToken, refreshToken, rememberMe = false) => {
    setUser(userData)
    setIsAuthenticated(true)
    
    // Store tokens and user data
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Store remember me preference
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
      // Set extended session time (30 days in milliseconds)
      const expirationTime = new Date().getTime() + (30 * 24 * 60 * 60 * 1000)
      localStorage.setItem('sessionExpiration', expirationTime.toString())
    } else {
      // For regular login, session expires in 7 days
      localStorage.removeItem('rememberMe')
      const expirationTime = new Date().getTime() + (7 * 24 * 60 * 60 * 1000)
      localStorage.setItem('sessionExpiration', expirationTime.toString())
    }
    
    toast.success('Login successful!')
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    
    // Clear all authentication data
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('sessionExpiration')
    
    toast.success('Logged out successfully!')
    navigate('/login')
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
