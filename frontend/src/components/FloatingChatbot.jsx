import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'

const FloatingChatbot = () => {
  const [showTooltip, setShowTooltip] = useState(false)
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/ai-advisor')
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="absolute bottom-full right-0 mb-3 bg-white rounded-xl shadow-2xl p-4 w-64 border border-gray-100"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <img src="/img/logo1.png" alt="CluboraX Logo" className="w-5 h-5 object-contain" />
                <h4 className="font-semibold text-gray-900">CluboraX AI</h4>
              </div>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Need help? Ask me about events, clubs, or campus activities!
            </p>
            <button
              onClick={handleClick}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200"
            >
              Start Chat
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-20 h-20 bg-white rounded-full shadow-2xl flex items-center justify-center border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 group relative"
        style={{
          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
        }}
      >
        <img 
          src="/img/logo1.png" 
          alt="CluboraX Logo" 
          className="w-14 h-14 object-contain group-hover:scale-110 transition-transform duration-300" 
          style={{
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 2px rgba(0, 0, 0, 0.2))'
          }}
        />
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-purple-500 opacity-0 group-hover:opacity-20 animate-ping" />
        
        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </motion.button>
    </div>
  )
}

export default FloatingChatbot
