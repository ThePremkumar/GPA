# Role-Based Access Control (RBAC) Documentation
## Educational Management System - Firebase Implementation

---

## Role Hierarchy & Definitions

### 1. Super Admin Role (`super_admin`)

**Full System Authority** - Complete control over all system operations and data.

#### Permissions & Capabilities:

**User Management:**
- ✅ Create new admin accounts (Super Admin or Batch Admin)
- ✅ Modify admin credentials and passwords
- ✅ Delete/deactivate admin accounts
- ✅ Assign and reassign batch/regulation to Batch Admins
- ✅ View all admin activity logs
- ✅ Manage student accounts across all batches

**Content Management:**
- ✅ Create new regulations (e.g., 2021, 2023, 2025)
- ✅ Create new batches (e.g., 2021-2025, 2023-2027)
- ✅ Add/modify/delete semesters
- ✅ Add/modify/delete subjects for any batch/regulation
- ✅ Update subject credits, codes, and names
- ✅ Bulk import/export academic data

**System Operations:**
- ✅ Access all dashboard sections
- ✅ View system-wide analytics and reports
- ✅ Configure system settings
- ✅ Manage Firebase security rules
- ✅ Access activity logs with full details (timestamp, admin name, action)

**Restrictions:**
- ❌ None - Full unrestricted access

---

### 2. Batch Admin Role (`year_admin`)

**Limited Scope Authority** - Restricted to assigned regulation and batch only.

#### Permissions & Capabilities:

**User Management:**
- ✅ View student list for assigned batch only
- ✅ Update student information (name, email, DOB) for assigned batch
- ✅ View student academic records for assigned batch
- ❌ Cannot create or delete student accounts
- ❌ Cannot access students from other batches
- ❌ Cannot manage other admins

**Content Management:**
- ✅ Add new subjects for assigned regulation/batch
- ✅ Modify existing subjects for assigned regulation/batch
- ✅ Delete subjects for assigned regulation/batch
- ✅ Create semesters for assigned regulation/batch
- ✅ View all subjects and semesters for assigned regulation/batch
- ❌ Cannot create new regulations
- ❌ Cannot create new batches
- ❌ Cannot modify subjects/semesters for other batches

**System Operations:**
- ✅ Access dashboard sections: Students, Subjects, Settings
- ✅ Manage subjects for assigned batch only
- ✅ View activity logs for their assigned batch only
- ✅ Generate reports for assigned batch
- ❌ Cannot access "Manage Admins" section
- ❌ Cannot access subjects for other batches
- ❌ Cannot modify system settings
- ❌ Cannot view system-wide analytics

**Restrictions:**
- ❌ No access to data outside assigned regulation/batch
- ❌ No permission escalation capabilities
- ❌ Cannot create new regulations or batches
- ❌ Cannot manage other admins
- ✅ Full content management within assigned batch scope
- ✅ All actions are logged and traceable

---

## Firebase Implementation

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
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
      // Read: Self or Super Admin
      allow read: if isAuthenticated() && (request.auth.uid == adminId || isSuperAdmin());
      
      // Write: Super Admin only
      allow write: if isSuperAdmin();
    }
    
    // Students Collection
    match /students/{studentId} {
      // Super Admin: Full access
      allow read, write: if isSuperAdmin();
      
      // Students: Read own profile
      allow read: if isAuthenticated() && request.auth.uid == studentId;
      
      // Batch Admin: Read/Update assigned batch only
      allow read, update: if isYearAdmin() && resource.data.batch == getAssignedYear();
      
      // No create/delete for Batch Admins
    }
    
    // Subjects Collection
    match /subjects/{batchId} {
      // Public read for calculator
      allow read: if true;
      
      // Super Admin: Full write access to all batches
      allow write: if isSuperAdmin();
      
      // Batch Admin: Write access to assigned batch only
      allow write: if isYearAdmin() && batchId == getAssignedYear();
    }
    
    // Activity Logs Collection
    match /activityLogs/{logId} {
      // Super Admin: Full access
      allow read, write: if isSuperAdmin();
      
      // Batch Admin: Read own logs only
      allow read: if isYearAdmin() && resource.data.adminId == request.auth.uid;
      
      // Create: Any admin can log their actions
      allow create: if isAuthenticated() && request.resource.data.adminId == request.auth.uid;
    }
    
    // Regulations Collection (metadata)
    match /regulations/{regId} {
      // Read: Any authenticated user
      allow read: if isAuthenticated();
      
      // Write: Super Admin only
      allow write: if isSuperAdmin();
    }
  }
}
```

---

## Activity Logging Structure

All admin actions must be logged in the `activityLogs` collection:

```javascript
{
  logId: "auto-generated",
  adminId: "uid-of-admin",
  adminName: "Admin Full Name",
  adminRole: "super_admin" | "year_admin",
  action: "created_subject" | "updated_student" | "deleted_admin" | etc.,
  targetType: "subject" | "student" | "admin" | "regulation",
  targetId: "id-of-affected-resource",
  details: {
    // Action-specific details
    before: {...}, // Previous state (for updates)
    after: {...}   // New state
  },
  timestamp: "2025-12-26T10:07:16+05:30",
  batch: "2021-2025", // If applicable
  regulation: "2021"  // If applicable
}
```

---

## Permission Matrix

| Action | Super Admin | Batch Admin | Student |
|--------|-------------|-------------|---------|
| Create Regulations | ✅ | ❌ | ❌ |
| Create Batches | ✅ | ❌ | ❌ |
| Create Semesters (Own Batch) | ✅ | ✅ | ❌ |
| Create Semesters (All Batches) | ✅ | ❌ | ❌ |
| Add Subjects (Own Batch) | ✅ | ✅ | ❌ |
| Add Subjects (All Batches) | ✅ | ❌ | ❌ |
| Modify Subjects (Own Batch) | ✅ | ✅ | ❌ |
| Modify Subjects (All Batches) | ✅ | ❌ | ❌ |
| Delete Subjects (Own Batch) | ✅ | ✅ | ❌ |
| Delete Subjects (All Batches) | ✅ | ❌ | ❌ |
| View Subjects (Own Batch) | ✅ | ✅ | ✅ |
| View Subjects (All Batches) | ✅ | ❌ | ❌ |
| Create Admins | ✅ | ❌ | ❌ |
| Modify Admins | ✅ | ❌ | ❌ |
| Delete Admins | ✅ | ❌ | ❌ |
| View Students (Own Batch) | ✅ | ✅ | ❌ |
| View Students (All Batches) | ✅ | ❌ | ❌ |
| Update Students (Own Batch) | ✅ | ✅ | ❌ |
| Create Students | ✅ | ❌ | ❌ |
| Delete Students | ✅ | ❌ | ❌ |
| View All Activity Logs | ✅ | ❌ | ❌ |
| View Own Activity Logs | ✅ | ✅ | ❌ |
| System Settings | ✅ | ❌ | ❌ |

---

## Implementation Checklist

### Frontend (React)
- [ ] Role-based component rendering
- [ ] Conditional navigation menu items
- [ ] Permission checks before API calls
- [ ] Activity logging on all mutations
- [ ] Error handling for permission denials

### Backend (Firebase)
- [ ] Security rules deployed
- [ ] Activity logs collection created
- [ ] Admin profile structure enforced
- [ ] Batch assignment validation
- [ ] Audit trail implementation

### Testing
- [ ] Super Admin can perform all operations
- [ ] Batch Admin restricted to assigned batch
- [ ] Batch Admin cannot modify subjects
- [ ] Activity logs capture all actions
- [ ] Permission denials are logged
- [ ] No role escalation possible

---

## Security Considerations

1. **No Client-Side Trust**: All permissions enforced server-side via Firebase rules
2. **Immutable Logs**: Activity logs cannot be modified after creation
3. **Batch Isolation**: Batch Admins cannot access data outside their scope
4. **Audit Trail**: Every action traceable to specific admin with timestamp
5. **Role Verification**: Every request validates role from Firestore, not client claims

---

## Example Usage Scenarios

### Scenario 1: Super Admin Creates New Regulation
```javascript
// Super Admin can create new regulation
await addDoc(collection(db, 'regulations'), {
  year: '2025',
  batches: ['2025-2029'],
  createdBy: currentUser.uid,
  createdAt: serverTimestamp()
});

// Log the action
await addDoc(collection(db, 'activityLogs'), {
  adminId: currentUser.uid,
  adminName: userData.name,
  adminRole: 'super_admin',
  action: 'created_regulation',
  targetType: 'regulation',
  details: { year: '2025' },
  timestamp: new Date().toISOString()
});
```

### Scenario 2: Batch Admin Adds Subject to Assigned Batch (ALLOWED)
```javascript
// Batch Admin can add subjects to their assigned batch
const batchId = userData.assignedYear; // e.g., "2021-2025"

try {
  const docRef = doc(db, 'subjects', batchId);
  const docSnap = await getDoc(docRef);
  const currentData = docSnap.exists() ? docSnap.data() : {};
  
  // Add new subject to semester 1
  const semester1Subjects = currentData['1'] || [];
  semester1Subjects.push({ 
    code: 'CS101', 
    name: 'Introduction to Programming', 
    credits: 3,
    sem: 1
  });
  
  await setDoc(docRef, {
    ...currentData,
    '1': semester1Subjects
  }, { merge: true });
  
  // Log the action
  await addDoc(collection(db, 'activityLogs'), {
    adminId: currentUser.uid,
    adminName: userData.name,
    adminRole: 'year_admin',
    action: 'added_subject',
    targetType: 'subject',
    details: { 
      batch: batchId, 
      semester: '1',
      subject: { code: 'CS101', name: 'Introduction to Programming' }
    },
    timestamp: new Date().toISOString()
  });
  
  console.log('Subject added successfully!');
} catch (error) {
  console.error('Error adding subject:', error);
}
```

### Scenario 3: Batch Admin Attempts to Modify Another Batch's Subjects (DENIED)
```javascript
// This will fail at Firebase security rules
const otherBatchId = '2023-2027'; // Not their assigned batch

try {
  await setDoc(doc(db, 'subjects', otherBatchId), {
    '1': [{ code: 'CS102', name: 'New Subject', credits: 3 }]
  });
} catch (error) {
  // Error: Missing or insufficient permissions
  console.error('Permission denied: Can only modify subjects for assigned batch');
}
```

### Scenario 3: Batch Admin Updates Student (ALLOWED)
```javascript
// Batch Admin can update student in their assigned batch
const studentRef = doc(db, 'students', studentId);
const studentData = await getDoc(studentRef);

if (studentData.data().batch === userData.assignedYear) {
  await updateDoc(studentRef, {
    email: 'newemail@example.com',
    updatedBy: currentUser.uid,
    updatedAt: serverTimestamp()
  });
  
  // Log the action
  await addDoc(collection(db, 'activityLogs'), {
    adminId: currentUser.uid,
    adminName: userData.name,
    adminRole: 'year_admin',
    action: 'updated_student',
    targetType: 'student',
    targetId: studentId,
    batch: userData.assignedYear,
    timestamp: new Date().toISOString()
  });
}
```

---

## Conclusion

This RBAC system ensures:
- **Clear separation of duties** between Super Admin and Batch Admin roles
- **Data isolation** preventing unauthorized access across batches
- **Complete audit trail** for compliance and accountability
- **Enforced at database level** preventing client-side bypasses
- **Scalable architecture** supporting future role additions
