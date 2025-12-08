# Google OAuth Authentication Setup Instructions

This application uses Google OAuth 2.0 for authentication. Follow these steps to set up Google authentication for your beer menu application.

## Overview

The authentication system uses Google Sign-In to authenticate users. When a user signs in with Google, their account is automatically created in the local database with a default "user" role. The database administrator must then manually update the role to "curator" or "admin" to grant management access.

## Step 1: Create Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project name/ID for reference

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (unless you have a Google Workspace)
   - App name: **Beer Menu** (or your preferred name)
   - User support email: Your email address
   - Developer contact: Your email address
   - Click **Save and Continue**
   - Scopes: No need to add any (we only need email and profile)
   - Test users: Add your Google email address and any other users who need access
   - Click **Save and Continue**

4. Back to creating OAuth client ID:
   - Application type: **Web application**
   - Name: **Beer Menu Web Client**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for local development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:3000` (for local development)
     - Your production domain (e.g., `https://yourdomain.com`)
   - Click **Create**

5. Copy the **Client ID** that appears (you'll need this for your `.env.local` file)

## Step 4: Configure Environment Variables

Create or update your `.env.local` file in the project root with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:3000

# Database (if not already configured)
DATABASE_URL=your-database-connection-string
```

Also create or update `client/.env.local` with:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**Important:** The `GOOGLE_CLIENT_ID` must be the same in both files.

## Step 5: Install Dependencies

The application requires the `google-auth-library` package for server-side token verification:

```powershell
npm install google-auth-library
```

## Step 6: Run Database Migration

Apply the database schema changes to support Google authentication:

```powershell
npm run db:push
```

This will:
- Add the "curator" role to the role enum
- Update the users table to use Google ID instead of generic OAuth fields
- Add fields for email, name, and profile picture

## Step 7: Grant Curator Access

After a user signs in for the first time, their account is created with the "user" role. To grant management access:

1. Connect to your database
2. Find the user by email:
   ```sql
   SELECT * FROM users WHERE email = 'user@example.com';
   ```
3. Update their role to "curator" or "admin":
   ```sql
   UPDATE users SET role = 'curator' WHERE email = 'user@example.com';
   ```

## Step 8: Test the Authentication

1. Start your development server:
   ```powershell
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Click the "Sign in with Google" button

4. Sign in with your Google account

5. You should be redirected to the dashboard (if you have curator role) or see an access denied message (if you're still a "user")

## User Roles

The system supports three roles:

- **user**: Default role for new sign-ins. No access to management features.
- **curator**: Can manage the beer catalog (add, edit, delete beers, breweries, styles, etc.)
- **admin**: Full administrative access (currently same as curator, but can be extended)

## Access Control

- **Public Access**: The Beer Browser (`/browser`) is accessible to everyone without authentication
- **Protected Access**: The Dashboard (`/dashboard`) and all management features require authentication with curator or admin role

## Security Notes

1. **Client ID is Public**: The Google Client ID in `VITE_GOOGLE_CLIENT_ID` is intentionally public and safe to expose in the browser. It's designed to be visible.

2. **Client Secret is Private**: The `GOOGLE_CLIENT_SECRET` in the server's `.env.local` file must remain private and never be committed to version control.

3. **Session Security**: User sessions are managed via HTTP-only cookies for security.

4. **Token Verification**: All Google ID tokens are verified server-side before creating sessions.

## Production Deployment

When deploying to production:

1. Update the OAuth consent screen with your production domain
2. Add your production domain to Authorized JavaScript origins and redirect URIs
3. Update environment variables with production values
4. Ensure `GOOGLE_REDIRECT_URI` matches your production domain
5. Consider moving the OAuth consent screen from "Testing" to "Production" status in Google Cloud Console

## Troubleshooting

### "Error: redirect_uri_mismatch"
- Ensure your redirect URI in Google Cloud Console exactly matches your application URL
- Check that you've added both `http://localhost:3000` for development

### "Error: invalid_client"
- Verify your Client ID and Client Secret are correct
- Check that they're properly set in both `.env.local` files

### "Access Denied" after login
- Check the user's role in the database
- Ensure the role is set to "curator" or "admin"

### Google Sign-In button not appearing
- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly in `client/.env.local`
- Ensure the Google Sign-In script is loading (check Network tab)

## Cost Information

Google OAuth 2.0 is **completely free** to use. There are no costs associated with:
- Creating a Google Cloud project
- Enabling Google+ API
- Creating OAuth credentials
- User sign-ins (unlimited)

This solution is suitable for applications with any number of users, from 1 to millions.
