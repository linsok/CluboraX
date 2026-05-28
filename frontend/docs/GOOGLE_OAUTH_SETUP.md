# Google OAuth Setup Guide

This guide will help you set up real Google OAuth authentication for Campus Hub.

## 🚀 Quick Setup

### 1. Create Google OAuth Credentials

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** or select an existing one
3. **Enable Google OAuth API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google OAuth2 API" and enable it
4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback`
     - `http://localhost:5174/auth/google/callback`
     - `http://localhost:5175/auth/google/callback`
   - Click "Create"

### 2. Update Configuration

Edit `src/utils/googleAuth.js` and replace the placeholder values:

```javascript
// Replace these with your actual Google credentials
const GOOGLE_CLIENT_ID = 'your-actual-google-client-id.apps.googleusercontent.com'
const GOOGLE_CLIENT_SECRET = 'your-actual-google-client-secret'
```

### 3. Test the Implementation

1. **Start your application**: `npm run dev`
2. **Go to login page**: `http://localhost:5175/login`
3. **Click "Google" button**
4. **Follow the Google OAuth flow**

## 🔧 Configuration Details

### Google Cloud Console Setup

1. **Project Setup**:
   - Create a new project or use existing one
   - Enable "Google OAuth2 API" and "Google+ API"

2. **OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for development) or "Internal" (for production)
   - Fill in required fields:
     - Application name: Campus Hub
     - User support email: your-email@example.com
     - Developer contact: your-email@example.com

3. **Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (development)
     - `http://localhost:5174/auth/google/callback` (development)
     - `http://localhost:5175/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)

### Environment Variables (Optional)

For better security, consider using environment variables:

```javascript
// In googleAuth.js
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-client-id'
const GOOGLE_CLIENT_SECRET = process.env.REACT_APP_GOOGLE_CLIENT_SECRET || 'your-client-secret'
```

Create `.env.local` file:
```
REACT_APP_GOOGLE_CLIENT_ID=your-actual-google-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

## 🔍 OAuth Flow

### 1. User Clicks "Google"
- User is redirected to Google's OAuth consent screen
- Google shows account selection and consent

### 2. User Authenticates
- User selects their Google account
- User grants permissions to Campus Hub
- Google redirects back with authorization code

### 3. Token Exchange
- Backend exchanges authorization code for access token
- User information is retrieved from Google
- User is logged into Campus Hub

## 🛡️ Security Features

### Implemented:
- **State Parameter**: CSRF protection
- **PKCE**: Code verifier (recommended for production)
- **Secure Token Storage**: HTTP-only cookies (recommended)
- **Token Refresh**: Automatic token refresh
- **Error Handling**: Graceful error handling

### Recommended for Production:
- Use HTTPS in production
- Store tokens in HTTP-only cookies
- Implement token refresh mechanism
- Add rate limiting
- Monitor OAuth errors

## 🧪 Testing

### Development Testing:
1. Use `http://localhost:5175` as your origin
2. Test with multiple Google accounts
3. Test error scenarios (denied access, etc.)

### Production Testing:
1. Use your actual domain
2. Test with HTTPS
3. Test with real users
4. Monitor OAuth logs

## 🚨 Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**:
   - Ensure redirect URI matches exactly in Google Console
   - Check for trailing slashes

2. **"invalid_client"**:
   - Verify Client ID is correct
   - Check if OAuth is enabled

3. **"access_denied"**:
   - User denied access
   - User needs to grant permissions

4. **CORS Issues**:
   - Ensure redirect URI is properly configured
   - Check if your domain is authorized

### Debug Mode:
Add console logging to googleAuth.js:
```javascript
console.log('Google OAuth URL:', authUrl)
console.log('Redirect URI:', REDIRECT_URI)
```

## 📱 Mobile Support

The implementation works on mobile devices:
- Responsive design
- Touch-friendly buttons
- Mobile OAuth flow
- Deep linking support

## 🔧 Advanced Features

### Custom Scopes:
```javascript
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.readonly' // Add calendar access
]
```

### Additional User Data:
```javascript
// Get additional user information
const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
})
```

## 📊 Monitoring

### Track OAuth Events:
- Successful sign-ins
- Failed attempts
- Error rates
- User demographics

### Recommended Tools:
- Google Analytics
- Sentry for error tracking
- Custom logging dashboard

## 🔄 Production Deployment

### Steps:
1. Update redirect URI to production domain
2. Enable HTTPS
3. Update environment variables
4. Test thoroughly
5. Monitor for issues

### Security Checklist:
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Redirect URI updated
- [ ] Error handling tested
- [ ] Token refresh implemented
- [ ] Monitoring set up

## 🎯 Next Steps

After setting up Google OAuth:
1. Add user profile synchronization
2. Implement token refresh
3. Add social sharing features
4. Set up user analytics
5. Add admin dashboard for OAuth metrics

## 📞 Support

If you encounter issues:
1. Check Google Cloud Console configuration
2. Verify redirect URIs
3. Check browser console for errors
4. Review Google OAuth documentation
5. Contact Google Cloud support

---

**Your Google OAuth will be fully functional once you complete the setup!** 🎉
