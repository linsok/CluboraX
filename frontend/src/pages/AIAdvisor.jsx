import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendChatMessage, getChatHistory, clearChatHistory, analyzeEventProposal, analyzeClubProposal } from '../api/aiAdvisor'
import { 
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon,
  ArrowPathIcon,
  LightBulbIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  XMarkIcon,
  PlusIcon,
  ClockIcon,
  Bars3Icon,
  ArrowLeftIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

const AIAdvisor = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your CluboraX AI Assistant. I can help you with:\n\n• Creating event proposals\n• Club management suggestions\n• Policy compliance checks\n• Content improvements\n• General campus-related questions\n\nHow can I assist you today?",
      timestamp: new Date().toISOString()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedMode, setSelectedMode] = useState('general')
  const [showModeSelector, setShowModeSelector] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [openChatMenu, setOpenChatMenu] = useState(null)
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Current Chat', date: new Date().toISOString(), active: true }
  ])
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Modes for different AI advisor functions
  const modes = [
    {
      id: 'general',
      name: 'General Chat',
      icon: SparklesIcon,
      description: 'Ask me anything!',
      color: 'purple'
    },
    {
      id: 'event',
      name: 'Event Proposal',
      icon: CalendarIcon,
      description: 'Get help with event planning',
      color: 'blue'
    },
    {
      id: 'club',
      name: 'Club Proposal',
      icon: UserGroupIcon,
      description: 'Club creation assistance',
      color: 'green'
    },
    {
      id: 'content',
      name: 'Content Review',
      icon: DocumentTextIcon,
      description: 'Improve your content',
      color: 'orange'
    }
  ]

  const currentMode = modes.find(m => m.id === selectedMode)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [inputMessage])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message) => {
      setIsTyping(true)
      const response = await sendChatMessage(message, { mode: selectedMode })
      return response
    },
    onSuccess: (data) => {
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.message || data.response || 'I received your message. How else can I help?',
        timestamp: new Date().toISOString(),
        mode: selectedMode
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    },
    onError: (error) => {
      setIsTyping(false)
      toast.error('AI advisor is currently unavailable. Please try again later.')
      console.error('Send message error:', error)
    }
  })

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      mode: selectedMode
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    
    // Send to AI
    sendMessageMutation.mutate(inputMessage)
  }

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Chat cleared! How can I help you today?",
          timestamp: new Date().toISOString()
        }
      ])
      toast.success('Chat history cleared')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: `Chat ${chatHistory.length + 1}`,
      date: new Date().toISOString(),
      active: true
    }
    
    // Deactivate all chats
    setChatHistory(prev => prev.map(chat => ({ ...chat, active: false })))
    
    // Add new chat
    setChatHistory(prev => [...prev, newChat])
    
    // Reset messages
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: "Hello! I'm your CluboraX AI Assistant. How can I assist you today?",
        timestamp: new Date().toISOString()
      }
    ])
    
    toast.success('New chat started')
  }

  const handleSelectChat = (chatId) => {
    setChatHistory(prev => prev.map(chat => ({
      ...chat,
      active: chat.id === chatId
    })))
    
    // In production, load messages for this chat from backend
    toast.success('Chat loaded')
  }

  const handleDeleteChat = (chatId) => {
    if (chatHistory.length === 1) {
      toast.error('Cannot delete the last chat')
      return
    }
    
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
    toast.success('Chat deleted')
  }

  // Suggested prompts
  const suggestedPrompts = [
    "How do I create an event proposal?",
    "What are the requirements for starting a club?",
    "Help me improve my event description",
    "Check if my proposal meets campus policies"
  ]

  const handleSuggestedPrompt = (prompt) => {
    setInputMessage(prompt)
    textareaRef.current?.focus()
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  CluboraX
                </h2>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  title="Close Sidebar"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {/* Back to Dashboard */}
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left group"
                >
                  <ArrowLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>

                {/* New Chat */}
                <button
                  onClick={handleNewChat}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">New chat</span>
                </button>

                {/* Search */}
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors text-left"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">Search</span>
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                <ClockIcon className="w-4 h-4 mr-2" />
                Chat History
              </h3>
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      chat.active
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          chat.active ? 'text-purple-900' : 'text-gray-900'
                        }`}>
                          {chat.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(chat.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setOpenChatMenu(openChatMenu === chat.id ? null : chat.id)
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-all"
                        >
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openChatMenu === chat.id && (
                          <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toast.success('Rename feature coming soon!')
                              }}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                              <span>Rename</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenChatMenu(null)
                                handleDeleteChat(chat.id)
                              }}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                <p className="font-medium text-gray-700">CluboraX AI Assistant</p>
                <p className="mt-1">Powered by Advanced AI</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[600px] flex flex-col"
            >
              {/* Search Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats and projects"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto">
                {chatHistory
                  .filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => {
                        handleSelectChat(chat.id)
                        setShowSearch(false)
                        setSearchQuery('')
                      }}
                      className="w-full flex items-center space-x-3 px-6 py-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100"
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ClockIcon className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(chat.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">Enter</span>
                    </button>
                  ))}
                {searchQuery && chatHistory.filter(chat => 
                  chat.title.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No chats found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'ml-80' : 'ml-0'} overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                {!showSidebar && (
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Bars3Icon className="w-6 h-6" />
                  </button>
                )}
                
                <div className={`flex items-center space-x-3 ${!showSidebar ? 'pl-4 border-l border-gray-200' : ''}`}>
                  <img 
                    src="/img/logo1.png" 
                    alt="CluboraX Logo" 
                    className="w-10 h-10 object-contain" 
                    style={{
                      filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))'
                    }}
                  />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      CluboraX AI
                    </h1>
                    <p className="text-xs text-gray-500">Your intelligent campus companion</p>
                  </div>
                </div>
              </div>
            
              {/* Right Section */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                <button
                  onClick={() => setShowModeSelector(!showModeSelector)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
                >
                  <currentMode.icon className="w-5 h-5 text-purple-600" />
                  <span className="hidden sm:inline">{currentMode.name}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {/* Mode Selector Dropdown */}
                <AnimatePresence>
                  {showModeSelector && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-2 w-72 z-30"
                    >
                      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 mb-2">
                        <span className="font-semibold text-gray-700">Select Mode</span>
                        <button
                          onClick={() => setShowModeSelector(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      {modes.map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setSelectedMode(mode.id)
                            setShowModeSelector(false)
                            toast.success(`Switched to ${mode.name} mode`)
                          }}
                          className={`w-full flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors ${
                            selectedMode === mode.id
                              ? 'bg-purple-50 border-2 border-purple-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <mode.icon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                          <div className="text-left flex-1">
                            <div className="font-medium text-gray-900">{mode.name}</div>
                            <div className="text-sm text-gray-500">{mode.description}</div>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearChat}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear chat"
              >
                <TrashIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-48">
        {/* Add spacing to align with header logo */}
        <div className={`flex items-start space-x-4 ${!showSidebar ? '' : ''}`}>
          {!showSidebar && (
            <div className="w-10"></div>
          )}
          <div className={`flex-1 ${!showSidebar ? 'pl-4' : ''}`}>
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`mb-6 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-3 w-full ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.type === 'ai'
                      ? 'bg-white border-2 border-purple-200'
                      : 'bg-gradient-to-br from-gray-700 to-gray-900'
                  }`}>
                    {message.type === 'ai' ? (
                      <img 
                        src="/img/logo1.png" 
                        alt="CluboraX AI" 
                        className="w-7 h-7 object-contain" 
                        style={{
                          filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))'
                        }}
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">You</span>
                    )}
                  </div>
                  
                  {/* Message Content */}
                  <div className={`flex-1 ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block px-5 py-3 rounded-2xl shadow-sm max-w-4xl ${
                      message.type === 'ai'
                        ? 'bg-white border border-gray-200'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    }`}>
                      <div className={`text-sm sm:text-base whitespace-pre-wrap ${
                        message.type === 'ai' ? 'text-gray-800' : 'text-white'
                      }`}>
                        {message.content}
                      </div>
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 px-2 ${
                      message.type === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex justify-start"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center">
                  <img 
                    src="/img/logo1.png" 
                    alt="CluboraX AI" 
                    className="w-7 h-7 object-contain" 
                    style={{
                      filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.25))'
                    }}
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Suggested Prompts (shown when no messages except welcome) */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8"
            >
              <div className="text-center mb-4">
                <LightBulbIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Try asking:</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    onClick={() => handleSuggestedPrompt(prompt)}
                    className="text-left p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <span className="text-gray-700 group-hover:text-purple-600 transition-colors">
                      {prompt}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
        </div>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 transition-all duration-300 ${showSidebar ? 'ml-80' : 'ml-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <form onSubmit={handleSendMessage} className="flex items-start space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message CluboraX AI (${currentMode.name} mode)...`}
                rows={1}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none max-h-32 text-gray-800 placeholder-gray-400"
                disabled={isTyping}
                style={{ minHeight: '48px' }}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className={`rounded-xl transition-all duration-200 flex-shrink-0 ${
                inputMessage.trim() && !isTyping
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <PaperAirplaneIcon className="w-6 h-6" />
            </motion.button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-2">
            CluboraX AI can make mistakes. Please verify important information.
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

export default AIAdvisor
