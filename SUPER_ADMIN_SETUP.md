# How to Add the First Super Admin

## Quick Start Guide

Follow these steps to create your first Super Admin account:

---

## Step 1: Verify Firebase Configuration

Make sure your `.env` file has the correct Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Step 2: Update Firestore Rules (Temporary)

**IMPORTANT**: You need to temporarily allow the first admin to create their own profile.

Go to Firebase Console → Firestore Database → Rules, and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getAdminProfile() {
      return get(/databases/$(database)/documents/admins/$(request.auth.uid)).data;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && getAdminProfile().role == 'super_admin';
    }
    
    function isYearAdmin() {
      return isAuthenticated() && getAdminProfile().role == 'year_admin';
    }
    
    function getAssignedYear() {
      return getAdminProfile().assignedYear;
    }
    
    // Admins Collection
    match /admins/{adminId} {
      allow read: if isAuthenticated() && (request.auth.uid == adminId || isSuperAdmin());
      
      // TEMPORARY: Allow initial admin creation
      allow write: if isSuperAdmin() || (request.auth.uid == adminId);
    }
    
    // ... rest of your rules
  }
}
```

**Note**: The line `allow write: if isSuperAdmin() || (request.auth.uid == adminId);` allows a user to create their own admin document. This is needed ONLY for the first Super Admin creation.

---

## Step 3: Access the Admin Setup Page

1. Make sure your development server is running:
   ```bash
   npm run dev
   ```

2. Navigate to the secret admin setup URL:
   ```
   http://localhost:5173/admin-setup-secret
   ```
   (or whatever port your Vite server is using)

---

## Step 4: Create Super Admin

On the Admin Setup page, you'll see:
- A button labeled "Create Super Admin"
- Click it to create the account

**Default Credentials** (as configured in your AdminSetup.jsx):
- **Email**: `premkumar242004@gmail.com`
- **Password**: `Prem2424!`

---

## Step 5: Verify Creation

1. Check Firebase Console → Authentication
   - You should see the new user with the email `premkumar242004@gmail.com`

2. Check Firebase Console → Firestore Database → admins collection
   - You should see a document with:
     ```javascript
     {
       uid: "firebase-generated-uid",
       email: "premkumar242004@gmail.com",
       name: "Super Admin",
       role: "super_admin",
       createdAt: "timestamp"
     }
     ```

---

## Step 6: Test Login

1. Navigate to: `http://localhost:5173/login`
2. Click "Admin Access" (small button at bottom)
3. Enter:
   - **Email**: `premkumar242004@gmail.com`
   - **Password**: `Prem2424!`
4. Click "Access Dashboard"
5. You should be redirected to the dashboard with full Super Admin access

---

## Step 7: CRITICAL - Remove Admin Setup Route

**⚠️ SECURITY WARNING**: After successfully creating the Super Admin, you MUST delete the setup route to prevent unauthorized access.

### Delete These Files:
1. Delete `src/pages/AdminSetup.jsx`

### Update `src/App.jsx`:
Remove this line:
```javascript
import AdminSetup from './pages/AdminSetup';
```

Remove this route:
```javascript
<Route path="/admin-setup-secret" element={<AdminSetup />} />
```

---

## Step 8: Restore Firestore Rules

After creating the Super Admin, update your Firestore rules to remove the temporary permission:

```javascript
// Admins Collection
match /admins/{adminId} {
  allow read: if isAuthenticated() && (request.auth.uid == adminId || isSuperAdmin());
  
  // Only Super Admins can write
  allow write: if isSuperAdmin();
}
```

Remove the `|| (request.auth.uid == adminId)` part.

---

## Alternative Method: Manual Creation via Firebase Console

If you prefer not to use the setup page, you can create the Super Admin manually:

### Step 1: Create User in Firebase Authentication
1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter:
   - Email: `premkumar242004@gmail.com`
   - Password: `Prem2424!`
4. Click "Add User"
5. Copy the generated UID

### Step 2: Create Admin Document in Firestore
1. Go to Firebase Console → Firestore Database
2. Create collection: `admins`
3. Add document with ID = the UID from step 1
4. Add fields:
   ```
   uid: "paste-the-uid-here"
   email: "premkumar242004@gmail.com"
   name: "Super Admin"
   role: "super_admin"
   createdAt: "2025-12-26T12:04:32+05:30"
   ```
5. Save

### Step 3: Test Login
Follow Step 6 from the main method above.

---

## Customizing Super Admin Credentials

If you want to use different credentials, update `src/pages/AdminSetup.jsx`:

```javascript
await signup('your-email@example.com', 'YourPassword123!', 'super_admin', {
  name: 'Your Name',
  role: 'super_admin'
});
```

---

## Troubleshooting

### Error: "Missing or insufficient permissions"
- **Solution**: Make sure you've updated the Firestore rules to allow initial admin creation (Step 2)

### Error: "Email already in use"
- **Solution**: The Super Admin already exists. Try logging in instead.

### Error: "Weak password"
- **Solution**: Use a password with at least 6 characters, including letters and numbers

### Can't access /admin-setup-secret
- **Solution**: Check that the route is properly configured in `src/App.jsx`

### Super Admin created but can't login
- **Solution**: 
  1. Verify the user exists in Firebase Authentication
  2. Verify the admin document exists in Firestore with `role: "super_admin"`
  3. Check browser console for errors

---

## Security Checklist

After creating the Super Admin:

- [ ] Super Admin account created successfully
- [ ] Tested login with Super Admin credentials
- [ ] Deleted `src/pages/AdminSetup.jsx`
- [ ] Removed `/admin-setup-secret` route from `src/App.jsx`
- [ ] Updated Firestore rules to remove temporary permission
- [ ] Verified no one else can create admin accounts
- [ ] Changed default password if using production

---

## Next Steps

Once your Super Admin is set up:

1. **Login** as Super Admin
2. **Navigate** to Dashboard → Manage Admins
3. **Create** additional Batch Admins as needed
4. **Assign** batches to Batch Admins
5. **Monitor** activity logs for all admin actions

Your Super Admin can now:
- ✅ Create and manage all admin accounts
- ✅ Assign roles and batches
- ✅ Manage all students across all batches
- ✅ Manage subjects for all regulations
- ✅ View all activity logs
- ✅ Access all system features

---

## Summary

**Quick Steps:**
1. Update Firestore rules (temporary permission)
2. Visit `/admin-setup-secret`
3. Click "Create Super Admin"
4. Login with credentials
5. **DELETE** AdminSetup.jsx and route
6. Restore Firestore rules

**Default Credentials:**
- Email: `premkumar242004@gmail.com`
- Password: `Prem2424!`

**⚠️ Remember**: Always delete the setup route after creating the Super Admin!
