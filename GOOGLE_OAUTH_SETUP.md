# Google OAuth Setup Guide

## 1. Create Google OAuth Credentials

### Step 1: Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Create a new project or select an existing one

### Step 2: Enable Google+ API
1. Go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: Your Email Marketing Platform
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
   - Add scopes: email, profile
   - Add test users (for development)

### Step 4: Configure OAuth Client
1. Application type: **Web application**
2. Name: Email Marketing Platform
3. Authorized JavaScript origins:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
4. Authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/google/callback
   ```
5. Click "Create"

### Step 5: Copy Credentials
You'll receive:
- **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
- **Client Secret**: Something like `GOCSPX-abc123xyz`

## 2. Update Environment Variables

### Backend (.env)
```bash
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 3. Test Google Login

### Backend Test
```bash
# Start backend (should already be running)
npm run start:dev

# Test Google OAuth initiation
curl http://localhost:3000/api/auth/google
# Should redirect to Google login
```

### Frontend Test
1. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Visit http://localhost:3001

3. Click "Sign in with Google"

4. You should be redirected to Google login

5. After authentication, you'll be redirected back to your app

## 4. How It Works

### Flow Diagram
```
User clicks "Sign in with Google"
    ↓
Frontend redirects to: GET /api/auth/google
    ↓
Backend redirects to Google OAuth
    ↓
User logs in with Google
    ↓
Google redirects to: GET /api/auth/google/callback
    ↓
Backend receives user profile
    ↓
Backend creates/updates user in database
    ↓
Backend generates JWT token
    ↓
Backend redirects to: http://localhost:3001/auth/callback?token=JWT
    ↓
Frontend stores token in localStorage
    ↓
Frontend redirects to dashboard
```

### Database Changes
The User entity now includes:
- `googleId` - Google user ID
- `firstName` - From Google profile
- `lastName` - From Google profile
- `picture` - Google profile picture URL
- `provider` - 'local' or 'google'
- `passwordHash` - Now nullable (not needed for Google users)

### Account Linking
If a user signs up with email/password and later uses Google OAuth with the same email:
- The accounts are automatically linked
- User can sign in with either method
- Google profile info is added to existing account

## 5. Production Setup

### Update Redirect URIs
In Google Cloud Console, add production URLs:
```
https://yourdomain.com
https://api.yourdomain.com/auth/google/callback
```

### Update Environment Variables
```bash
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com
```

### OAuth Consent Screen
1. Go to "OAuth consent screen"
2. Change from "Testing" to "In production"
3. Submit for verification (if needed)

## 6. Security Best Practices

### Backend
- ✅ Validate Google tokens
- ✅ Use HTTPS in production
- ✅ Set secure cookie flags
- ✅ Implement CSRF protection
- ✅ Rate limit OAuth endpoints

### Frontend
- ✅ Store tokens securely (httpOnly cookies in production)
- ✅ Validate redirect URLs
- ✅ Handle OAuth errors gracefully
- ✅ Implement logout functionality

## 7. Troubleshooting

### Error: redirect_uri_mismatch
**Problem:** The redirect URI doesn't match what's configured in Google Console

**Solution:**
1. Check the exact URL in Google Console
2. Ensure it matches `GOOGLE_CALLBACK_URL` in `.env`
3. Include the full path: `/api/auth/google/callback`
4. Check for trailing slashes

### Error: invalid_client
**Problem:** Client ID or Secret is incorrect

**Solution:**
1. Double-check credentials in `.env`
2. Ensure no extra spaces or quotes
3. Regenerate credentials if needed

### Error: access_denied
**Problem:** User denied permission or app not verified

**Solution:**
1. Add user as test user in Google Console
2. Accept all requested permissions
3. Verify OAuth consent screen is configured

### Backend doesn't restart after .env change
**Solution:**
```bash
# Stop the dev server (Ctrl+C)
# Restart it
npm run start:dev
```

### Token not being stored
**Problem:** Frontend callback page not working

**Solution:**
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_API_URL` is set
3. Check that token is in URL query params

## 8. Testing Checklist

- [ ] Google login button appears on login page
- [ ] Clicking button redirects to Google
- [ ] Can sign in with Google account
- [ ] Redirected back to app after login
- [ ] Token stored in localStorage
- [ ] User data saved in database
- [ ] Can access protected routes
- [ ] Profile picture displays (if implemented)
- [ ] Can link existing email/password account
- [ ] Can sign out and sign in again

## 9. API Endpoints

### Initiate Google OAuth
```
GET /api/auth/google
```
Redirects to Google login page.

### OAuth Callback
```
GET /api/auth/google/callback
```
Handles Google's response, creates/updates user, generates JWT, redirects to frontend.

### Frontend Callback
```
GET /auth/callback?token=JWT_TOKEN
```
Receives token from backend, stores it, redirects to dashboard.

## 10. Example User Flow

### New User (First Time)
1. User clicks "Sign in with Google"
2. Redirected to Google login
3. Grants permissions
4. Backend creates new user with:
   - email from Google
   - googleId
   - firstName, lastName
   - picture URL
   - provider: 'google'
   - emailVerified: true
5. JWT token generated
6. Redirected to dashboard

### Existing User (Email/Password)
1. User previously signed up with email/password
2. Now clicks "Sign in with Google" with same email
3. Backend finds existing user by email
4. Links Google account:
   - Adds googleId
   - Updates firstName, lastName, picture
   - Sets emailVerified: true
5. User can now sign in with either method

### Returning Google User
1. User clicks "Sign in with Google"
2. Backend finds user by googleId
3. Generates new JWT token
4. Redirected to dashboard

## 11. Additional Features (Optional)

### Display User Profile
Update dashboard to show Google profile picture:
```tsx
const user = JSON.parse(localStorage.getItem('user') || '{}')

{user.picture && (
  <img 
    src={user.picture} 
    alt={user.firstName}
    className="w-10 h-10 rounded-full"
  />
)}
```

### Logout
```tsx
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
```

### Get Current User Endpoint
Add to `auth.controller.ts`:
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
async getCurrentUser(@Req() req) {
  return this.authService.findById(req.user.userId);
}
```

## 12. Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Passport Google OAuth Strategy](http://www.passportjs.org/packages/passport-google-oauth20/)
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check backend logs for errors
4. Test with curl commands
5. Ensure Google Cloud Console is configured correctly
