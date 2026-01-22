import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { signInWithGoogle } from '../../utils/googleAuth'

const GoogleAccountSelection = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleContinue = async () => {
    setIsLoading(true)
    toast.loading('Redirecting to Google...', { id: 'google-signin' })

    try {
      // Redirect to actual Google OAuth
      signInWithGoogle()
    } catch (error) {
      setIsLoading(false)
      toast.error('Failed to redirect to Google', { id: 'google-signin' })
      console.error('Google OAuth redirect error:', error)
    }
  }

  const handleUseDifferentAccount = () => {
    // Force account selection by adding prompt parameter
    signInWithGoogle()
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        {/* Google-style header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Sign in with Google</h1>
          <p className="text-gray-600">Choose an account to continue to Campus Hub</p>
        </div>

        {/* Account Selection Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Select your Google Account
          </h3>
          <p className="text-gray-600 text-center text-sm">
            You'll be redirected to Google to choose your account and sign in to Campus Hub
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Redirecting to Google...
              </div>
            ) : (
              'Continue with Google'
            )}
          </motion.button>

          <button
            onClick={handleUseDifferentAccount}
            className="w-full text-blue-600 py-2 px-4 text-sm font-medium hover:text-blue-700 transition-colors"
          >
            Use another account
          </button>
        </div>

        {/* Information */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• You'll be redirected to Google's secure sign-in page</li>
            <li>• Choose your Google account or sign in</li>
            <li>• Grant Campus Hub access to your basic profile information</li>
            <li>• You'll be redirected back to Campus Hub</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to Campus Hub's{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default GoogleAccountSelection
