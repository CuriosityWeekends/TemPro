# Firebase Authentication Setup Guide

This guide will help you set up Firebase authentication with Google sign-in and email restrictions for the TemPro temperature monitoring system.

## Prerequisites

1. A Google account
2. Access to Firebase Console

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "tempro-monitoring")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Click on "Google" provider
5. Enable it by clicking the toggle
6. Add your authorized domain (localhost for development)
7. Click "Save"

## Step 3: Get Firebase Configuration

1. In Firebase Console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "TemPro Web")
6. Copy the Firebase configuration object

## Step 4: Update Configuration

1. Open `firebase-config.js` in your project
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## Step 5: Configure Email Whitelist

1. In `firebase-config.js`, update the `WHITELISTED_EMAILS` array with authorized email addresses:

```javascript
const WHITELISTED_EMAILS = [
  "admin@curiosityweekends.com",
  "emily.johnson@curiosityweekends.com", 
  "tech@curiosityweekends.com",
  // Add more authorized emails here
];
```

## Step 6: Set Up Authorized Domains

1. In Firebase Console, go to Authentication > Settings
2. Under "Authorized domains", add your domain:
   - For development: `localhost`
   - For production: your actual domain (e.g., `yourdomain.com`)

## Step 7: Test the Setup

1. Open your application in a browser
2. Click "Sign in with Google"
3. Complete the Google sign-in process
4. If your email is whitelisted, you should see a success message
5. If not, you'll see an "Access Denied" error

## Security Features

### Email Whitelisting
- Only emails in the `WHITELISTED_EMAILS` array can sign in
- Unauthorized emails are automatically signed out
- Clear error messages for denied access

### User Roles
The system automatically assigns roles based on email:
- `admin@curiosityweekends.com` → Super Admin
- `emily.johnson@curiosityweekends.com` → Admin  
- `tech@curiosityweekends.com` → Tech Admin
- Other whitelisted emails → User

### Session Management
- Users stay signed in across browser sessions
- Automatic sign-out on page refresh if not authenticated
- Secure token-based authentication

## Troubleshooting

### Common Issues

1. **"Firebase not defined" error**
   - Make sure Firebase SDK scripts are loaded before `firebase-config.js`
   - Check that all Firebase scripts are accessible

2. **"Access denied" for valid emails**
   - Verify the email is in the `WHITELISTED_EMAILS` array
   - Check for typos in email addresses
   - Ensure the array is properly formatted

3. **Popup blocked by browser**
   - Allow popups for your domain
   - Try signing in again

4. **CORS errors**
   - Add your domain to Firebase authorized domains
   - For local development, ensure `localhost` is added

### Development vs Production

For local development:
- Use `localhost` in authorized domains
- Test with your development Firebase project

For production:
- Use your actual domain in authorized domains
- Consider using a separate Firebase project for production
- Update the configuration accordingly

## Security Best Practices

1. **Never commit API keys to version control**
   - Use environment variables for production
   - Keep Firebase config secure

2. **Regularly review whitelisted emails**
   - Remove access for former employees
   - Add new authorized users as needed

3. **Monitor Firebase Console**
   - Check authentication logs regularly
   - Monitor for suspicious sign-in attempts

4. **Use HTTPS in production**
   - Firebase requires HTTPS for production domains
   - Ensures secure token transmission

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Firebase configuration values
3. Ensure all scripts are loading properly
4. Check Firebase Console for authentication logs 