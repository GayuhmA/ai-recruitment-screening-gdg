# Google OAuth Setup Guide

## Prerequisites
- Google Cloud Console account
- Your Next.js app running locally

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `AI Recruitment Platform`
4. Click **"Create"**

### 2. Enable Google+ API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type → Click **"Create"**
3. Fill in the required fields:
   - **App name**: AI Recruitment Platform
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Click **"Add or Remove Scopes"**
   - Add: `email`, `profile`, `openid`
6. Click **"Save and Continue"**
7. **Test users** (for development):
   - Add your email addresses
8. Click **"Save and Continue"**

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Configure:
   - **Name**: AI Recruitment Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     http://127.0.0.1:3000/api/auth/callback/google
     ```
5. Click **"Create"**
6. **Copy your credentials**:
   - Client ID
   - Client Secret

### 5. Update Environment Variables

1. Open `.env.local` file in your project root
2. Add your Google OAuth credentials:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-actual-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### 6. Generate NextAuth Secret

Run this command in your terminal:

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env.local`

### 7. Restart Your Development Server

```bash
npm run dev
```

## Testing

1. Go to `http://localhost:3000/login`
2. Click **"Continue with Google"**
3. Select your Google account
4. Grant permissions
5. You should be redirected to the dashboard

## Production Deployment

When deploying to production:

1. **Update OAuth redirect URIs** in Google Cloud Console:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

2. **Update environment variables** in your hosting platform:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_SECRET=your-production-secret
   ```

3. **Publish OAuth App** in Google Cloud Console:
   - Go to OAuth consent screen
   - Click "Publish App"
   - Submit for verification (if needed)

## Troubleshooting

### Error: redirect_uri_mismatch
- Check that your redirect URI exactly matches in Google Cloud Console
- Make sure there are no trailing slashes
- Verify you're using the correct port (3000)

### Error: Access blocked
- Make sure you added your email to test users
- Check if OAuth consent screen is properly configured

### Error: Invalid credentials
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env.local`
- Restart your development server after changing env variables

## Security Notes

- Never commit `.env.local` to version control
- Keep `.env.example` without real credentials
- Rotate secrets regularly in production
- Use different OAuth clients for development/staging/production

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Setup](https://support.google.com/cloud/answer/6158849)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
