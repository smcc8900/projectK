const functions = require('firebase-functions');
const { createOrganizationAdmin } = require('./createAdmin');
const { sendEmail } = require('./emailService');
const admin = require('firebase-admin');

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the createOrganizationAdmin function
exports.createOrganizationAdmin = createOrganizationAdmin;

const db = admin.firestore();
const auth = admin.auth();

/**
 * Cloud Function to set custom claims for a user
 * This is called during registration and user creation
 * Note: Region is set to us-central1 to match frontend configuration
 */
exports.setUserClaims = functions.region('us-central1').https.onCall(async (data, context) => {
  // Verify the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to set claims.'
    );
  }

  const { userId, orgId, role } = data;

  // Validate input
  if (!userId || !orgId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: userId, orgId, role'
    );
  }

  try {
    // Set custom claims
    await auth.setCustomUserClaims(userId, {
      orgId,
      role,
    });

    return { success: true, message: 'Custom claims set successfully' };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to create a new user with auth and custom claims
 * Called by admins to create new employees
 * Note: Region is set to us-central1 to match frontend configuration
 */
exports.createUser = functions.region('us-central1').https.onCall(async (data, context) => {
  // Verify the request is authenticated and from an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.'
    );
  }

  // Check if the caller is an admin
  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can create users.'
    );
  }

  const { email, password, orgId, role, profile } = data;

  // Validate input
  if (!email || !password || !orgId || !role) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: email, password, orgId, role'
    );
  }

  // Verify the caller belongs to the same organization
  if (context.auth.token.orgId !== orgId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Cannot create users for other organizations.'
    );
  }

  try {
    // Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: profile ? `${profile.firstName} ${profile.lastName}` : null,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      orgId,
      role,
    });

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email,
      orgId,
      role,
      profile: profile || {},
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      userId: userRecord.uid,
      message: 'User created successfully',
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function to delete a user from Auth and Firestore
 * Called by admins to delete employees
 * Note: Region is set to us-central1 to match frontend configuration
 */
exports.deleteUser = functions.region('us-central1').https.onCall(async (data, context) => {
  // Verify the request is authenticated and from an admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated.'
    );
  }

  if (context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete users.'
    );
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required field: userId'
    );
  }

  try {
    // Get user document to verify organization
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Verify the caller belongs to the same organization
    if (context.auth.token.orgId !== userData.orgId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Cannot delete users from other organizations.'
      );
    }

    // Delete user from Firebase Auth
    await auth.deleteUser(userId);

    // Delete user document from Firestore
    await db.collection('users').doc(userId).delete();

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Trigger: When a new user is created in Firestore, send welcome email
 */
exports.onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const userData = snap.data();
    const userId = context.params.userId;
    
    try {
      // Get organization name if available
      let organizationName = 'the Team';
      if (userData.orgId) {
        const orgDoc = await db.collection('organizations').doc(userData.orgId).get();
        if (orgDoc.exists) {
          organizationName = orgDoc.data().name || 'the Team';
        }
      }
      
      const employeeName = userData.profile 
        ? `${userData.profile.firstName} ${userData.profile.lastName}`
        : userData.email.split('@')[0];
      
      // Send welcome email
      await sendEmail(
        userData.email,
        'welcomeEmail',
        {
          employeeName,
          email: userData.email,
          role: userData.role || 'Employee',
          organizationName
        }
      );
      
      console.log(`Welcome email sent to: ${userData.email}`);
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
    
    return null;
  });

/**
 * Trigger: When payslips are created, notify employees
 */
exports.onPayslipCreated = functions.firestore
  .document('payslips/{payslipId}')
  .onCreate(async (snap, context) => {
    const payslipData = snap.data();
    const payslipId = context.params.payslipId;
    
    try {
      // Get employee details
      const employeeDoc = await db.collection('users').doc(payslipData.userId).get();
      if (!employeeDoc.exists) {
        console.log(`User not found for payslip: ${payslipId}`);
        return null;
      }
      
      const employeeData = employeeDoc.data();
      const employeeName = employeeData.profile 
        ? `${employeeData.profile.firstName} ${employeeData.profile.lastName}`
        : employeeData.email.split('@')[0];
      
      // Send payslip notification email
      await sendEmail(
        employeeData.email,
        'payslipNotification',
        {
          employeeName,
          month: payslipData.month || 'Current Month',
          netSalary: payslipData.netSalary || payslipData.totalEarnings - payslipData.totalDeductions
        }
      );
      
      console.log(`Payslip notification sent to: ${employeeData.email}`);
    } catch (error) {
      console.error('Error sending payslip notification:', error);
    }
    
    return null;
  });

/**
 * Trigger: When a leave request is created, notify admins
 */
exports.onLeaveRequestCreated = functions.firestore
  .document('leaveRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const leaveRequest = snap.data();
    const requestId = context.params.requestId;
    
    try {
      // Get employee details
      const employeeDoc = await db.collection('users').doc(leaveRequest.userId).get();
      const employeeData = employeeDoc.data();
      const employeeName = employeeData?.profile 
        ? `${employeeData.profile.firstName} ${employeeData.profile.lastName}`
        : leaveRequest.userEmail;
      
      // Get all admins in the organization
      const adminsSnapshot = await db.collection('users')
        .where('orgId', '==', leaveRequest.organizationId)
        .where('role', '==', 'admin')
        .get();
      
      const adminEmails = adminsSnapshot.docs.map(doc => doc.data().email);
      
      // Format dates
      const startDate = new Date(leaveRequest.startDate).toLocaleDateString();
      const endDate = new Date(leaveRequest.endDate).toLocaleDateString();
      
      // Format leave type for display
      const leaveTypeMap = {
        annual: 'Annual Leave',
        sick: 'Sick Leave',
        casual: 'Casual Leave',
        maternity: 'Maternity Leave',
        paternity: 'Paternity Leave',
        emergency: 'Emergency Leave'
      };
      const formattedLeaveType = leaveTypeMap[leaveRequest.leaveType] || leaveRequest.leaveType;
      
      // Send email notification to all admins
      if (adminEmails.length > 0) {
        await sendEmail(
          adminEmails,
          'leaveRequestToAdmin',
          {
            employeeName,
            employeeEmail: leaveRequest.userEmail,
            leaveType: formattedLeaveType,
            startDate,
            endDate,
            days: leaveRequest.days,
            reason: leaveRequest.reason,
            status: leaveRequest.status,
            emergencyContact: leaveRequest.emergencyContact,
            requestId
          }
        );
        
        console.log(`Leave request notification sent to ${adminEmails.length} admin(s)`);
      } else {
        console.log('No admins found to notify');
      }
      
    } catch (error) {
      console.error('Error sending leave request notification:', error);
    }
    
    return null;
  });

/**
 * Trigger: When a leave request is updated (approved/rejected), notify employee
 */
exports.onLeaveRequestUpdated = functions.firestore
  .document('leaveRequests/{requestId}')
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const requestId = context.params.requestId;
    
    // Only send notification if status changed
    if (beforeData.status === afterData.status) {
      return null;
    }
    
    try {
      // Get employee details
      const employeeDoc = await db.collection('users').doc(afterData.userId).get();
      const employeeData = employeeDoc.data();
      const employeeName = employeeData?.profile 
        ? `${employeeData.profile.firstName} ${employeeData.profile.lastName}`
        : afterData.userEmail;
      
      // Format dates
      const startDate = new Date(afterData.startDate).toLocaleDateString();
      const endDate = new Date(afterData.endDate).toLocaleDateString();
      
      // Format leave type for display
      const leaveTypeMap = {
        annual: 'Annual Leave',
        sick: 'Sick Leave',
        casual: 'Casual Leave',
        maternity: 'Maternity Leave',
        paternity: 'Paternity Leave',
        emergency: 'Emergency Leave'
      };
      const formattedLeaveType = leaveTypeMap[afterData.leaveType] || afterData.leaveType;
      
      // Send appropriate email based on status
      const templateType = afterData.status === 'approved' 
        ? 'leaveApprovedToEmployee' 
        : 'leaveRejectedToEmployee';
      
      await sendEmail(
        afterData.userEmail,
        templateType,
        {
          employeeName,
          leaveType: formattedLeaveType,
          startDate,
          endDate,
          days: afterData.days,
          adminComment: afterData.adminComment,
          requestId
        }
      );
      
      console.log(`Leave status notification sent to: ${afterData.userEmail}`);
      
    } catch (error) {
      console.error('Error sending leave status notification:', error);
    }
    
    return null;
  });

/**
 * Scheduled function to clean up old upload files
 * Runs daily at midnight
 */
exports.cleanupOldUploads = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const bucket = admin.storage().bucket();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
      // List all files in uploads directory
      const [files] = await bucket.getFiles({ prefix: 'organizations/' });
      
      const deletePromises = [];
      
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdDate = new Date(metadata.timeCreated);
        
        // Delete files older than 30 days
        if (createdDate < thirtyDaysAgo) {
          deletePromises.push(file.delete());
        }
      }
      
      await Promise.all(deletePromises);
      console.log(`Deleted ${deletePromises.length} old upload files`);
    } catch (error) {
      console.error('Error cleaning up old uploads:', error);
    }
    
    return null;
  });

