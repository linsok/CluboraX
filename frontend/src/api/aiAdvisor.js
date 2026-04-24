import { apiClient } from './client'

/**
 * AI Advisor API Service
 * Handles AI-powered advice and suggestions
 */

// Send a chat message to AI advisor
export const sendChatMessage = async (message, context = {}) => {
  try {
    const { mode = 'general', session_id = '', ...rest } = context
    const response = await apiClient.post('/api/ai-advisor/chat/', {
      message,
      mode,
      session_id,
      context: rest,
    })
    return response.data
  } catch (error) {
    console.error('Send chat message error:', error)
    throw error
  }
}

// Get chat history
export const getChatHistory = async (limit = 50) => {
  try {
    const response = await apiClient.get('/api/ai-advisor/history/', {
      params: { limit }
    })
    return response.data
  } catch (error) {
    console.error('Get chat history error:', error)
    throw error
  }
}

// Analyze event proposal
export const analyzeEventProposal = async (title, description, context = {}) => {
  try {
    const response = await apiClient.post('/api/ai-advisor/analyze-event/', {
      title,
      description,
      context
    })
    return response.data
  } catch (error) {
    console.error('Analyze event proposal error:', error)
    throw error
  }
}

// Analyze club proposal
export const analyzeClubProposal = async (title, description, context = {}) => {
  try {
    const response = await apiClient.post('/api/ai-advisor/analyze-club/', {
      title,
      description,
      context
    })
    return response.data
  } catch (error) {
    console.error('Analyze club proposal error:', error)
    throw error
  }
}

// Get AI suggestions for content improvement
export const getContentSuggestions = async (content, contentType = 'general') => {
  try {
    const response = await apiClient.post('/api/ai-advisor/suggest/', {
      content,
      content_type: contentType
    })
    return response.data
  } catch (error) {
    console.error('Get content suggestions error:', error)
    throw error
  }
}

// Check policy compliance
export const checkPolicyCompliance = async (title, description, type = 'event') => {
  try {
    const response = await apiClient.post('/api/ai-advisor/check-compliance/', {
      title,
      description,
      type
    })
    return response.data
  } catch (error) {
    console.error('Check policy compliance error:', error)
    throw error
  }
}

// Clear chat history
export const clearChatHistory = async () => {
  try {
    const response = await apiClient.delete('/api/ai-advisor/history/')
    return response.data
  } catch (error) {
    console.error('Clear chat history error:', error)
    throw error
  }
}

// Get AI advisor statistics
export const getAIAdvisorStats = async () => {
  try {
    const response = await apiClient.get('/api/ai-advisor/stats/')
    return response.data
  } catch (error) {
    console.error('Get AI advisor stats error:', error)
    throw error
  }
}

export default {
  sendChatMessage,
  getChatHistory,
  analyzeEventProposal,
  analyzeClubProposal,
  getContentSuggestions,
  checkPolicyCompliance,
  clearChatHistory,
  getAIAdvisorStats
}
