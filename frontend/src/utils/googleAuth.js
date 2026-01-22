// Google OAuth 2.0 configuration and utilities

// Google OAuth configuration - REPLACE WITH YOUR ACTUAL CREDENTIALS
// Get these from: https://console.cloud.google.com/
// Go to APIs & Services → Credentials → OAuth 2.0 Client ID
const GOOGLE_CLIENT_ID = '675410168838-qiu06nn429381gufhn4f2v6jopshi057.apps.googleusercontent.com' // <-- REPLACE THIS
const GOOGLE_CLIENT_SECRET = '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' // <-- REPLACE THIS

// Dynamic redirect URI based on current port
const getCurrentRedirectUri = () => {
  const port = window.location.port
  return `http://localhost:${port}/auth/google/callback`
}

const REDIRECT_URI = getCurrentRedirectUri()

// Google OAuth endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

// Scopes required for the application
const SCOPES = [
  'openid',
  'email',
  'profile'
]

// Generate Google OAuth URL with professional parameters
export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getCurrentRedirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'select_account', // Forces account selection
    include_granted_scopes: 'true',
    state: generateRandomState(), // Security parameter
    enable_grant_auto: 'false' // Prevents auto-approval
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

// Generate random state for security
const generateRandomState = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code) => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: getCurrentRedirectUri(),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error_description || 'Failed to exchange authorization code')
  }

  const data = await response.json()
  return data
}

// Get user information from Google
export const getGoogleUserInfo = async (accessToken) => {
  const response = await fetch(`${GOOGLE_USERINFO_URL}?access_token=${accessToken}`)
  
  if (!response.ok) {
    throw new Error('Failed to get user information from Google')
  }
  
  const data = await response.json()
  return data
}

// Handle Google OAuth callback
export const handleGoogleCallback = async (code) => {
  try {
    // Exchange authorization code for tokens
    const tokenData = await exchangeCodeForToken(code)
    
    // Get user information
    const userInfo = await getGoogleUserInfo(tokenData.access_token)
    
    // Create user object for your application
    const user = {
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      avatar: userInfo.picture,
      provider: 'google',
      verified: userInfo.verified_email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
    }
    
    return {
      user,
      tokens: tokenData
    }
  } catch (error) {
    console.error('Google OAuth error:', error)
    throw error
  }
}

// Sign in with Google (for the login button)
export const signInWithGoogle = () => {
  // Check if Google credentials are configured
  if (GOOGLE_CLIENT_ID === 'your-actual-google-client-id.apps.googleusercontent.com') {
    alert('🔧 Google OAuth is not configured. Please set up your Google Client ID and Client Secret in googleAuth.js')
    return
  }
  
  // Check if we're in development and give a helpful message
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔍 Google OAuth Debug Info:')
    console.log('Client ID:', GOOGLE_CLIENT_ID)
    console.log('Redirect URI:', REDIRECT_URI)
    console.log('Current URL:', window.location.href)
    
    // Alert user about Google OAuth setup
    const confirmSetup = confirm(
      'Google OAuth requires setup in Google Cloud Console:\n\n' +
      '1. Go to: https://console.cloud.google.com/\n' +
      '2. Select your project\n' +
      '3. Go to APIs & Services → Credentials\n' +
      '4. Make sure your OAuth 2.0 Client ID has this redirect URI:\n' +
      REDIRECT_URI + '\n\n' +
      'Click OK to continue with Google OAuth, or Cancel to skip.'
    )
    
    if (!confirmSetup) {
      return
    }
  }
  
  // Production mode - redirect to actual Google OAuth
  const authUrl = getGoogleAuthUrl()
  
  // Debug: Log the URL for debugging
  console.log('Google OAuth URL:', authUrl)
  console.log('Redirect URI:', REDIRECT_URI)
  
  window.location.href = authUrl
}

export default {
  getGoogleAuthUrl,
  exchangeCodeForToken,
  getGoogleUserInfo,
  handleGoogleCallback,
  signInWithGoogle
}
