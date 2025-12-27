# CGPA/SGPA Calculator - Production Platform

A modern, production-ready full-stack React.js application for managing CGPA/SGPA calculations with hierarchical admin management, real-time data synchronization, and advanced analytics.

## 🚀 Features

### Authentication & Security
- **Two-tier Admin System**: Super Admin and Batch Admin with different permission levels
- **Encrypted Credentials**: AES-256 encryption for sensitive data storage
- **Firebase Authentication**: Secure email/password authentication
- **Role-based Access Control**: Protected routes enforce permissions
- **Activity Logging**: Complete audit trail of all admin actions

### Admin Dashboards

#### Super Admin Panel
- Full system control and configuration
- Add/remove admins with auto-generated passwords
- Modify admin passwords and roles
- Manage semesters, subjects, and regulations
- Create and manage batches
- View all admin activities with timestamps
- Advanced analytics and visualizations

#### Batch Admin Panel
- View assigned regulations and batches
- Create and manage users within assigned batch only
- View subjects (read-only)
- Cannot modify system-level data

### Visualizations
- **D3.js Charts**: CGPA distribution, activity timelines, batch performance
- **Three.js 3D**: Interactive performance globe, stats podium
- **Real-time Updates**: Charts update with live Firestore data

## 📁 Project Structure

```
src/
├── components/
│   ├── charts/                 # D3.js visualization components
│   │   ├── CGPADistributionChart.jsx
│   │   ├── ActivityTimelineChart.jsx
│   │   ├── BatchPerformanceChart.jsx
│   │   └── SGPAChart.jsx
│   ├── visualizations/         # Three.js 3D components
│   │   ├── PerformanceGlobe.jsx
│   │   ├── StatsPodium.jsx
│   │   └── ThreeScene.jsx
│   ├── Calculator.jsx
│   └── Navbar.jsx
├── contexts/
│   ├── AuthContext.jsx         # Enhanced auth with RBAC
│   └── ToastContext.jsx        # Global notifications
├── services/
│   ├── activityService.js      # Activity logging
│   ├── adminService.js         # Admin CRUD operations
│   └── studentService.js       # Student management
├── utils/
│   ├── constants.js            # App-wide constants
│   └── encryption.js           # Web Crypto API utilities
├── pages/
│   ├── dashboard/
│   │   ├── super-admin/        # Super Admin pages
│   │   │   ├── Overview.jsx
│   │   │   ├── AdminManagement.jsx
│   │   │   ├── ActivityLogs.jsx
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   └── ...
│   │   └── batch-admin/        # Batch Admin pages
│   │       ├── Overview.jsx
│   │       └── StudentManagement.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   └── ...
├── firebase/
│   └── config.js
├── data/
│   ├── regulations.js
│   └── subjects.js
└── App.jsx
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### 1. Clone and Install

```bash
cd "CGPA calculator"
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Email/Password** authentication
3. Create a **Firestore Database** (Start in test mode, then deploy rules)
4. Copy your Firebase config

### 3. Environment Setup

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your Firebase config
```

Required variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_ENCRYPTION_KEY=your_strong_32_char_key
```

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or copy `firestore.rules` content to Firebase Console.

### 5. Create Initial Super Admin

1. Navigate to `/admin-setup-secret`
2. Create the first Super Admin account
3. This page should be secured or removed in production

### 6. Run Development Server

```bash
npm run dev
```

## 👥 User Roles & Permissions

| Permission | Super Admin | Batch Admin | Student |
|------------|:-----------:|:-----------:|:-------:|
| Manage Admins | ✅ | ❌ | ❌ |
| Create Passwords | ✅ | ❌ | ❌ |
| Manage Subjects | ✅ | ❌ | ❌ |
| Manage Regulations | ✅ | ❌ | ❌ |
| View All Activities | ✅ | ❌ | ❌ |
| Create Students | ✅ | ✅ (own batch) | ❌ |
| View Subjects | ✅ | ✅ | ✅ |
| Calculate CGPA | ✅ | ✅ | ✅ |

## 🔐 Security Features

### Firestore Rules
- Admin-only write access for sensitive collections
- Batch admins restricted to assigned batch
- Students can only read their own data
- Activity logs are immutable

### Encryption
- AES-256-GCM encryption for sensitive data
- PBKDF2 key derivation with 100,000 iterations
- Unique salt and IV for each encryption

## 📊 Visualization Components

### D3.js Charts
- `CGPADistributionChart` - Bar chart showing CGPA ranges
- `ActivityTimelineChart` - Line/area chart of admin activities
- `BatchPerformanceChart` - Donut chart of batch distribution

### Three.js 3D
- `PerformanceGlobe` - Interactive 3D globe with data points
- `StatsPodium` - 3D podium showing top performers

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

## 📝 API Reference

### Activity Logging

```javascript
import { logActivity } from './services/activityService';
import { ACTIVITY_TYPES } from './utils/constants';

await logActivity({
  type: ACTIVITY_TYPES.STUDENT_CREATED,
  adminId: currentUser.uid,
  adminName: userData.fullName,
  adminEmail: userData.email,
  targetId: studentRegNum,
  targetType: 'student',
  batch: '2024-2028',
  details: { customInfo: 'value' }
});
```

### Admin Management

```javascript
import { createAdmin, getAllAdmins } from './services/adminService';

// Create admin
await createAdmin({
  email: 'admin@example.com',
  password: generatedPassword,
  fullName: 'Admin Name',
  role: ROLES.BATCH_ADMIN,
  assignedBatch: '2024-2028',
  currentAdmin: { uid, fullName, email }
});

// Get all admins
const admins = await getAllAdmins();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
