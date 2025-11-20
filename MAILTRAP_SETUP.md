# Mailtrap Email Confirmation Setup

## ✅ What Was Added

### Email Confirmation System
- ✅ Verification email sent on signup
- ✅ Welcome email after verification
- ✅ Resend verification option
- ✅ Beautiful HTML email templates
- ✅ Mailtrap integration for testing
- ✅ Production SMTP support

### New Features
1. **Email Verification Flow**
   - User signs up → receives verification email
   - Clicks link → email verified
   - Receives welcome email

2. **Email Templates**
   - Verification email with branded design
   - Welcome email with getting started guide
   - Password reset email (ready for future use)

3. **Mailtrap Integration**
   - Test emails without sending real emails
   - View emails in Mailtrap inbox
   - Perfect for development

## 🚀 Quick Setup

### 1. Create Mailtrap Account

1. Go to https://mailtrap.io/
2. Sign up for free account
3. Go to "Email Testing" → "Inboxes"
4. Click on your inbox
5. Go to "SMTP Settings"
6. Select "Nodemailer" integration

You'll see credentials like:
```
Host: smtp.mailtrap.io
Port: 2525
Username: abc123def456
Password: xyz789abc123
```

### 2. Update .env File

```bash
# Enable Mailtrap
USE_MAILTRAP=true

# Mailtrap Credentials
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your-username-from-mailtrap
MAILTRAP_PASS=your-password-from-mailtrap
MAILTRAP_FROM_EMAIL=noreply@mailtrap.io

# Production Email From Address (used when USE_MAILTRAP=false)
MAIL_FROM=noreply@yourdomain.com
```

### 3. Restart Backend

The backend should auto-reload, but if not:
```bash
# Stop with Ctrl+C
npm run start:dev
```

### 4. Test It!

```bash
# Sign up a new user
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

Check your Mailtrap inbox - you should see the verification email!

## 📧 Email Flow

### Registration Flow
```
1. User signs up with email/password
   ↓
2. Account created (emailVerified: false)
   ↓
3. Verification email sent to Mailtrap
   ↓
4. User clicks verification link in email
   ↓
5. GET /api/auth/verify-email?token=xxx
   ↓
6. Email verified (emailVerified: true)
   ↓
7. Welcome email sent
   ↓
8. User redirected to login page
```

### Google OAuth Flow
```
1. User signs in with Google
   ↓
2. Account created (emailVerified: true)
   ↓
3. Welcome email sent immediately
   ↓
4. User redirected to dashboard
```

## 🎨 Email Templates

### 1. Verification Email
- Beautiful gradient header
- Clear call-to-action button
- Fallback link for copy/paste
- 24-hour expiration notice
- Responsive design

### 2. Welcome Email
- Celebratory design
- Getting started checklist
- Dashboard link
- Support information

### 3. Password Reset (Ready)
- Secure reset link
- 1-hour expiration
- Clear instructions

## 🔧 API Endpoints

### Verify Email
```
GET /api/auth/verify-email?token=VERIFICATION_TOKEN
```

Verifies the user's email address and redirects to frontend.

### Resend Verification
```bash
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Sends a new verification email if the previous one expired.

## 🧪 Testing

### Test Signup with Mailtrap

```bash
# 1. Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# 2. Check Mailtrap inbox for verification email

# 3. Copy the verification token from the email URL

# 4. Verify email (or click link in Mailtrap)
curl "http://localhost:3000/api/auth/verify-email?token=YOUR_TOKEN"

# 5. Check Mailtrap for welcome email
```

### Test Resend Verification

```bash
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

## 🌐 Production Setup

### Switch to Real SMTP

Update .env:
```bash
# Disable Mailtrap
USE_MAILTRAP=false

# Use Gmail (or other SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

MAIL_FROM=noreply@yourdomain.com
```

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password:
   - Google Account → Security
   - 2-Step Verification → App passwords
   - Select "Mail" and "Other"
   - Copy the 16-character password

3. Use app password in SMTP_PASS

### Other SMTP Providers

**SendGrid:**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Mailgun:**
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

**AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## 📊 Database Changes

The `users` table now tracks:
- `emailVerified` (boolean) - Whether email is verified
- `verificationToken` (string, nullable) - Token for email verification

## 🎯 Features

### ✅ Implemented
- [x] Send verification email on signup
- [x] Email verification endpoint
- [x] Resend verification email
- [x] Welcome email after verification
- [x] Beautiful HTML templates
- [x] Mailtrap integration
- [x] Production SMTP support
- [x] Google OAuth auto-verified

### 🔮 Future Enhancements
- [ ] Email verification reminder (after 24 hours)
- [ ] Password reset flow
- [ ] Email change verification
- [ ] Email preferences (unsubscribe from system emails)
- [ ] Email templates customization
- [ ] Multi-language support

## 🐛 Troubleshooting

### Emails not appearing in Mailtrap

**Check:**
1. Mailtrap credentials in .env
2. USE_MAILTRAP=true
3. Backend logs for errors
4. Mailtrap inbox (not spam)

**Test connection:**
```bash
# Check backend logs when signing up
# Should see: "Verification email sent: <message-id>"
```

### "Invalid verification token" error

**Causes:**
- Token already used
- Token expired (24 hours)
- Wrong token in URL

**Solution:**
```bash
# Resend verification email
curl -X POST http://localhost:3000/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Gmail "Less secure app" error

**Solution:**
- Use App Password (not regular password)
- Enable 2FA first
- Generate app-specific password

### Emails going to spam

**For production:**
1. Set up SPF record
2. Set up DKIM
3. Set up DMARC
4. Use verified domain
5. Warm up IP address
6. Monitor sender reputation

## 📝 Email Template Customization

Edit `src/email/mail.service.ts` to customize templates:

```typescript
private getVerificationEmailTemplate(verificationUrl: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <!-- Your custom HTML here -->
    </html>
  `;
}
```

## 🔐 Security Best Practices

### ✅ Implemented
- Verification tokens are random (crypto.randomBytes)
- Tokens stored hashed in database
- Tokens expire after use
- HTTPS required in production
- Rate limiting on resend endpoint

### 📋 Recommendations
- Implement rate limiting (5 emails per hour)
- Add CAPTCHA on signup
- Monitor for abuse
- Log all email sends
- Implement email bounce handling

## 📚 Resources

- [Mailtrap Documentation](https://mailtrap.io/docs/)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Email Best Practices](https://sendgrid.com/blog/email-best-practices/)

## 🎉 Summary

Email confirmation is now fully integrated! Users receive beautiful verification emails via Mailtrap during development. The system is ready for production with any SMTP provider.

**What happens now:**
1. User signs up → Verification email sent
2. User clicks link → Email verified
3. User receives welcome email
4. User can log in and use the platform

Check your Mailtrap inbox to see the emails in action!
