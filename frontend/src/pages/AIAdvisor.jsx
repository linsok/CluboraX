import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { sendChatMessage, getChatHistory, clearChatHistory, analyzeEventProposal, analyzeClubProposal, warmupChatbot } from '../api/aiAdvisor'
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

const generateSessionTitle = (messages) => {
  const userMessages = messages.filter(m => m.type === 'user')
  if (userMessages.length === 0) return 'New Chat'

  const greetingRegex = /^(hi|hello|hey|yo|greetings|good morning|good afternoon|good evening|howdy|sup|whats up|hola|hi there|hello there|how are you|how are you doing|how is it going|hows it going)[.!?]*$/i
  
  let targetMessage = userMessages[0].content

  if (greetingRegex.test(targetMessage.trim()) && userMessages.length > 1) {
    const nonGreetingMessage = userMessages.find(m => !greetingRegex.test(m.content.trim()))
    if (nonGreetingMessage) {
      targetMessage = nonGreetingMessage.content
    }
  }

  let title = targetMessage.trim()

  // 1. Strip leading greetings
  title = title.replace(/^(hi|hello|hey|yo|greetings|hola|good morning|good afternoon|good evening|howdy)\b\s*[,.-]*\s*/i, '')

  // 2. Strip leading bot names
  title = title.replace(/^(ai|chatbot|bot|advisor)\b\s*[,.-]*\s*/i, '')

  // 3. Strip leading polite/asking phrases
  title = title.replace(/^(may i know|please tell me|can you help me with|could you please tell me|how do i|how to|i want to|i need to|tell me about|info on)\b\s*/i, '')

  // 4. Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1)

  // 5. Strip trailing punctuation
  title = title.replace(/[.!?]+$/, '')

  // 6. Truncate
  if (title.length > 30) {
    title = title.substring(0, 30).trim() + '...'
  }

  if (!title || greetingRegex.test(title.trim())) {
    return 'General Chat'
  }

  return title
}

const renderInlineStyling = (text) => {
  if (!text) return '';

  const boldParts = text.split('**');
  return boldParts.map((part, index) => {
    const isBold = index % 2 !== 0;
    
    const linkRegex = /\[([^\]]+)\](?:\(([^)]+)\))?/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(part)) !== null) {
      if (match.index > lastIndex) {
        elements.push(part.substring(lastIndex, match.index));
      }

      const linkText = match[1];
      const linkUrl = match[2] || '#';
      elements.push(
        <span
          key={match.index}
          className="text-purple-600 font-semibold hover:underline cursor-pointer"
          onClick={() => {
            if (linkUrl && linkUrl !== '#') {
              window.open(linkUrl, '_blank');
            }
          }}
        >
          {linkText}
        </span>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < part.length) {
      elements.push(part.substring(lastIndex));
    }

    return isBold ? (
      <strong key={index} className="font-bold text-gray-900">{elements}</strong>
    ) : (
      <span key={index}>{elements}</span>
    );
  });
};

const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-3 text-left leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const text = para.trim();
        if (!text) return null;

        const isBullet = text.startsWith('* ') || text.startsWith('- ') || text.includes('\n* ') || text.includes('\n- ');
        const isNumbered = /^\d+\.\s+/.test(text) || text.includes('\n1. ') || /\n\d+\.\s+/.test(text);

        if (isBullet) {
          const lines = text.split('\n');
          return (
            <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[*|-]\s+/, '').trim();
                if (!cleanLine) return null;
                return <li key={lIdx}>{renderInlineStyling(cleanLine)}</li>;
              })}
            </ul>
          );
        }

        if (isNumbered) {
          const lines = text.split('\n');
          return (
            <ol key={pIdx} className="list-decimal pl-5 space-y-1.5 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\d+\.\s+/, '').trim();
                if (!cleanLine) return null;
                return <li key={lIdx}>{renderInlineStyling(cleanLine)}</li>;
              })}
            </ol>
          );
        }

        const lines = text.split('\n');
        if (lines.length > 1) {
          return (
            <p key={pIdx} className="space-y-1">
              {lines.map((line, lIdx) => (
                <span key={lIdx} className="block">{renderInlineStyling(line)}</span>
              ))}
            </p>
          );
        }

        return (
          <p key={pIdx}>
            {renderInlineStyling(text)}
          </p>
        );
      })}
    </div>
  );
};

const AIAdvisor = () => {
  useEffect(() => {
    warmupChatbot()
  }, [])

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return localStorage.getItem('active_session_id') || 'default'
  })
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
  const [chatHistory, setChatHistory] = useState([])
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Load chat history from backend
  const { data: rawHistory } = useQuery({
    queryKey: ['chatHistory'],
    queryFn: () => getChatHistory(200),
    refetchOnWindowFocus: false,
  })

  // Group messages into sessions
  useEffect(() => {
    const sessionsMap = {}
    
    if (rawHistory?.results) {
      // Sort from oldest to newest to ensure proper order within each session
      const sortedRaw = [...rawHistory.results].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

      sortedRaw.forEach(item => {
        const sessId = item.session_id || 'default'
        if (!sessionsMap[sessId]) {
          sessionsMap[sessId] = {
            id: sessId,
            title: '',
            date: item.created_at,
            messages: []
          }
        }
        sessionsMap[sessId].messages.push(
          {
            id: `${item.id}_user`,
            type: 'user',
            content: item.user_message,
            timestamp: item.created_at,
            mode: item.mode
          },
          {
            id: `${item.id}_ai`,
            type: 'ai',
            content: item.ai_response,
            timestamp: item.created_at,
            mode: item.mode
          }
        )
      })

      // Generate clean/rephrased title for each session
      Object.keys(sessionsMap).forEach(sessId => {
        const session = sessionsMap[sessId]
        session.title = generateSessionTitle(session.messages)
      })
    }

    const sessionsList = Object.values(sessionsMap)
    
    // Sort sessions by date (newest first)
    sessionsList.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Map sessions to sidebar format
    let updatedHistory = sessionsList.map(session => ({
      id: session.id,
      title: session.title,
      date: session.date,
      active: session.id === activeSessionId
    }))

    // If active session does not exist in backend yet (it's new/empty)
    const activeExists = sessionsList.some(s => s.id === activeSessionId)
    if (!activeExists) {
      updatedHistory = [
        {
          id: activeSessionId,
          title: 'New Chat',
          date: new Date().toISOString(),
          active: true
        },
        ...updatedHistory
      ]
    }

    setChatHistory(updatedHistory)

    // Load active session messages
    const activeSession = sessionsMap[activeSessionId]
    if (activeSession) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Hello! I'm your CluboraX AI Advisor. How can I assist you today?",
          timestamp: activeSession.date
        },
        ...activeSession.messages
      ])
    } else {
      // For a new empty session, show the full greeting and suggestions
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Hello! I'm your CluboraX AI Advisor. I can help you with general questions about university events, clubs, campus policies, and other activities.\n\nHow can I assist you today?",
          timestamp: new Date().toISOString()
        }
      ])
    }
  }, [rawHistory, activeSessionId])

  // Modes for different AI advisor functions
  const modes = [
    {
      id: 'general',
      name: 'General Chat',
      icon: SparklesIcon,
      description: 'Ask me anything!',
      color: 'purple'
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
      const response = await sendChatMessage(message, { 
        mode: selectedMode,
        session_id: activeSessionId
      })
      return response
    },
    onSuccess: (data) => {
      // Invalidate query to trigger history refresh and update sidebar/messages
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
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
    
    // Add user message locally
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

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear the entire chat history?')) {
      try {
        await clearChatHistory()
        queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
        
        // Reset local state to default
        const defaultSessId = 'default'
        setActiveSessionId(defaultSessId)
        localStorage.setItem('active_session_id', defaultSessId)
        
        setMessages([
          {
            id: 1,
            type: 'ai',
            content: "Chat cleared! How can I help you today?",
            timestamp: new Date().toISOString()
          }
        ])
        toast.success('All chat history cleared')
      } catch (err) {
        toast.error('Failed to clear chat history')
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleNewChat = () => {
    const newChatId = String(Date.now())
    setActiveSessionId(newChatId)
    localStorage.setItem('active_session_id', newChatId)
    
    // Reset messages display to welcome
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
    const stringId = String(chatId)
    setActiveSessionId(stringId)
    localStorage.setItem('active_session_id', stringId)
    toast.success('Chat loaded')
  }

  const handleDeleteChat = async (chatId) => {
    if (chatHistory.length === 1) {
      toast.error('Cannot delete the last chat')
      return
    }
    
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      try {
        await clearChatHistory(String(chatId))
        queryClient.invalidateQueries({ queryKey: ['chatHistory'] })
        toast.success('Chat session deleted')
      } catch (err) {
        toast.error('Failed to delete chat session')
      }
    }
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
      <div className={`flex-1 flex flex-col h-screen transition-all duration-300 ${showSidebar ? 'ml-80' : 'ml-0'} overflow-hidden`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
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
                <div
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 select-none"
                >
                  <currentMode.icon className="w-5 h-5 text-purple-600" />
                  <span className="hidden sm:inline">{currentMode.name}</span>
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
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
                      <div className={`text-sm sm:text-base ${
                        message.type === 'ai' ? 'text-gray-800' : 'text-white'
                      }`}>
                        {message.type === 'ai' ? (
                          <MarkdownRenderer content={message.content} />
                        ) : (
                          <span className="whitespace-pre-wrap">{message.content}</span>
                        )}
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

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 shadow-lg flex-shrink-0 pb-6">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
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
