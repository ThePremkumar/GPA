# Firebase Connection Error - Troubleshooting Guide

## Error: "Failed to get document because the client is offline"

This error means your Firebase configuration is not properly set up. Here's how to fix it:

---

## Step 1: Check Your .env File

Your `.env` file should contain your actual Firebase credentials. Currently, it's using placeholder values.

**Location**: `d:\learn\firebase\CGPA claculator\.env`

**Required Format**:
```env
VITE_FIREBASE_API_KEY=AIzaSyC...your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## Step 2: Get Your Firebase Credentials

### Option A: From Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one if you haven't)
3. Click the **gear icon** (⚙️) → **Project settings**
4. Scroll down to **"Your apps"** section
5. If no web app exists:
   - Click **</>** (web icon)
   - Register app with a nickname (e.g., "CGPA Calculator")
   - Copy the `firebaseConfig` object
6. If web app exists:
   - Find your app in the list
   - Click **"Config"** to see credentials

### Option B: Create New Firebase Project

If you don't have a Firebase project yet:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `CGPA-Calculator` (or your choice)
4. Disable Google Analytics (optional)
5. Click **"Create project"**
6. Wait for project creation
7. Follow "Option A" above to get credentials

---

## Step 3: Enable Required Services

### Enable Authentication
1. In Firebase Console → **Authentication**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. **Enable** the toggle
6. Click **"Save"**

### Enable Firestore Database
1. In Firebase Console → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose location (closest to your users)
5. Click **"Enable"**

---

## Step 4: Update Your .env File

Copy your Firebase config and update `.env`:

```env
# Replace these with your actual values from Firebase Console
VITE_FIREBASE_API_KEY=AIzaSyC_your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

**⚠️ IMPORTANT**: 
- Do NOT commit this file to Git (it's already in .gitignore)
- Keep these credentials secret
- Each value should be on its own line
- No quotes around values
- No spaces around the `=` sign

---

## Step 5: Restart Your Dev Server

After updating `.env`:

1. **Stop** the current dev server (Ctrl+C in terminal)
2. **Restart** it:
   ```bash
   npm run dev
   ```
3. **Refresh** your browser

---

## Step 6: Verify Connection

Open browser console (F12) and check for:

✅ **No errors** = Firebase connected successfully  
❌ **"client is offline"** = Check .env file again  
❌ **"invalid API key"** = Wrong credentials in .env  

---

## Updated Login System

I've updated your student login system as requested:

### New Format:
```javascript
// Student Email Format
const email = `${regNum}@csbs.com`;  // Changed from @student.csbs

// Student Password
const password = dob;  // yyyy-mm-dd format (no normalization)
```

### Example:
- **Registration Number**: 21CS001
- **Date of Birth**: 2004-06-24
- **Login Email**: `21CS001@csbs.com`
- **Login Password**: `2004-06-24`

---

## Testing the New Login

### 1. Create a Test Student Account

1. Navigate to: `http://localhost:5173/signup`
2. Fill in the form:
   - **Name**: Test Student
   - **Email**: test@example.com
   - **Registration Number**: 21CS001
   - **Regulation**: 2021
   - **Batch**: 2021-2025
   - **Date of Birth**: Select from calendar (e.g., June 24, 2004)
3. Click **"Sign Up"**

### 2. Login with New Format

1. Navigate to: `http://localhost:5173/login`
2. Enter:
   - **Registration Number**: 21CS001
   - **Date of Birth**: Select June 24, 2004 from calendar
3. Click **"Access Dashboard"**

---

## Common Issues & Solutions

### Issue: "Invalid credential"
**Cause**: Wrong email format or password  
**Solution**: 
- Email is now `regNum@csbs.com` (not `@student.csbs`)
- Password is DOB in `yyyy-mm-dd` format (e.g., `2004-06-24`)

### Issue: "Client is offline"
**Cause**: Firebase not configured  
**Solution**: Follow Steps 1-5 above

### Issue: "API key not valid"
**Cause**: Wrong API key in .env  
**Solution**: Double-check credentials from Firebase Console

### Issue: Changes not reflecting
**Cause**: Dev server not restarted  
**Solution**: Stop and restart `npm run dev`

### Issue: "Email already in use"
**Cause**: Account already exists with old format  
**Solution**: 
- Delete user from Firebase Console → Authentication
- Or use a different registration number

---

## Quick Verification Checklist

Before testing:

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] .env file updated with real credentials
- [ ] Dev server restarted after .env changes
- [ ] Browser refreshed

After signup:

- [ ] User appears in Firebase Console → Authentication
- [ ] Email format is `regNum@csbs.com`
- [ ] User document in Firestore → students collection
- [ ] Can login with regNum and DOB

---

## Example .env File (Template)

Create or update your `.env` file:

```env
# Firebase Configuration
# Get these from Firebase Console → Project Settings → Your apps

VITE_FIREBASE_API_KEY=AIzaSyC_replace_with_your_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Save this file** and **restart your dev server**.

---

## Need Help?

If you're still seeing errors:

1. Check browser console (F12) for specific error messages
2. Verify Firebase Console shows your project is active
3. Confirm Authentication and Firestore are enabled
4. Make sure .env file is in the project root directory
5. Ensure no typos in environment variable names (must start with `VITE_`)

---

## Summary of Changes Made

✅ **Student Email**: Changed from `regNum@student.csbs` to `regNum@csbs.com`  
✅ **Student Password**: Now uses DOB directly in `yyyy-mm-dd` format  
✅ **No Normalization**: Password is not converted to `YYYYMMDD` anymore  
✅ **Consistent Format**: Both signup and login use the same format  

**Next Step**: Configure your Firebase credentials in the `.env` file!
