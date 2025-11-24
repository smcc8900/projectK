import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';

export const createUser = async (userData, orgId) => {
  try {
    if (!userData.tempPassword || userData.tempPassword.length < 6) {
      throw new Error('Temporary password is required and must be at least 6 characters');
    }

    // Call Cloud Function to create user with auth and custom claims
    const createUserFunction = httpsCallable(functions, 'createUser');
    const result = await createUserFunction({
      email: userData.email,
      password: userData.tempPassword,
      orgId,
      role: userData.role || 'employee',
      branchId: userData.branchId || null,
      profile: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber || '',
        employeeId: userData.employeeId,
        department: userData.department,
        designation: userData.designation,
        joiningDate: userData.joiningDate || new Date(),
      },
    });

    return result.data;
  } catch (error) {
    console.error('Error creating user:', error);

    // Provide more helpful error messages
    if (error.code === 'functions/not-found') {
      throw new Error('Cloud Functions not found. Please ensure functions are deployed. Run: firebase deploy --only functions');
    }

    if (error.code === 'functions/unavailable') {
      throw new Error('Cloud Functions are unavailable. Please check your internet connection and try again.');
    }

    if (error.message?.includes('CORS') || error.code === 'functions/unauthenticated') {
      throw new Error('CORS Error: Functions may not be deployed. Please deploy functions first: firebase deploy --only functions');
    }

    // Re-throw the original error with its message
    throw new Error(error.message || 'Failed to create user. Please try again.');
  }
};

export const getUsers = async (orgId) => {
  try {
    // Import auth to check token
    const { auth } = await import('./firebase');
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated. Please log in and try again.');
    }

    // Verify user has orgId in token
    const idTokenResult = await currentUser.getIdTokenResult(true); // Force refresh
    const userOrgId = idTokenResult.claims.orgId;

    if (!userOrgId) {
      throw new Error('User missing organization ID. Please contact support to set up your account.');
    }

    if (userOrgId !== orgId) {
      throw new Error(`Permission denied. Your organization (${userOrgId}) does not match requested organization (${orgId}).`);
    }

    const usersRef = collection(db, 'users');

    // Try with orderBy first, fallback to without if index missing
    let q = query(
      usersRef,
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    try {
      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Sort in memory as fallback (in case createdAt is missing)
      return users.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
    } catch (orderByError) {
      // If orderBy fails (missing index), try without it
      if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
        console.warn('Index missing for createdAt, fetching without orderBy:', orderByError.message);
        q = query(usersRef, where('orgId', '==', orgId));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort in memory
        return users.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return new Date(bTime) - new Date(aTime);
        });
      }
      throw orderByError;
    }
  } catch (error) {
    console.error('Error getting users:', error);
    // Provide helpful error message
    if (error.code === 'permission-denied') {
      const errorMsg = 'Permission denied. This could mean:\n' +
        '1. Your account may not have custom claims set (orgId, role)\n' +
        '2. Please sign out and sign back in to refresh your token\n' +
        '3. Contact support if the issue persists';
      throw new Error(errorMsg);
    }
    if (error.code === 'failed-precondition') {
      throw new Error('Database index missing. Please check the console for the index creation link.');
    }
    throw error;
  }
};

export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email, orgId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('email', '==', email),
      where('orgId', '==', orgId)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deactivateUser = async (userId) => {
  try {
    await updateUser(userId, { isActive: false });
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

export const activateUser = async (userId) => {
  try {
    await updateUser(userId, { isActive: true });
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    // Call Cloud Function to delete user from Auth and Firestore
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    await deleteUserFunction({ userId });
  } catch (error) {
    console.error('Error deleting user:', error);

    // Provide more helpful error messages
    if (error.code === 'functions/not-found') {
      throw new Error('Cloud Functions not found. Please ensure functions are deployed. Run: firebase deploy --only functions');
    }

    if (error.code === 'functions/unavailable') {
      throw new Error('Cloud Functions are unavailable. Please check your internet connection and try again.');
    }

    if (error.message?.includes('CORS') || error.code === 'functions/unauthenticated') {
      throw new Error('CORS Error: Functions may not be deployed. Please deploy functions first: firebase deploy --only functions');
    }

    // Re-throw the original error with its message
    throw new Error(error.message || 'Failed to delete user. Please try again.');
  }
};

export const getActiveEmployees = async (orgId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('orgId', '==', orgId),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting active employees:', error);
    throw error;
  }
};

export const checkEmployeeIdUnique = async (employeeId, orgId, excludeUserId = null) => {
  try {
    if (!employeeId || !orgId) {
      return { unique: true, exists: false };
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('orgId', '==', orgId),
      where('profile.employeeId', '==', employeeId.toUpperCase())
    );

    const snapshot = await getDocs(q);
    const matchingUsers = snapshot.docs
      .filter(doc => !excludeUserId || doc.id !== excludeUserId)
      .map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      unique: matchingUsers.length === 0,
      exists: matchingUsers.length > 0,
      users: matchingUsers,
    };
  } catch (error) {
    console.error('Error checking employee ID uniqueness:', error);
    // If query fails (e.g., index missing), assume unique to allow operation
    return { unique: true, exists: false };
  }
};

/**
 * Parse and validate user Excel file
 */
export const validateUserExcelBeforeUpload = async (file) => {
  try {
    const { parseExcelFile, normalizeUserColumnNames, validateUserExcelData } = await import('../utils/excelParser');

    const rawData = await parseExcelFile(file);
    const normalizedData = normalizeUserColumnNames(rawData);
    const validationResults = validateUserExcelData(normalizedData);

    return {
      totalRows: rawData.length,
      validRows: validationResults.valid.length,
      invalidRows: validationResults.invalid.length,
      errors: validationResults.invalid,
      preview: normalizedData.slice(0, 5), // First 5 rows for preview
    };
  } catch (error) {
    console.error('Error validating user Excel:', error);
    throw error;
  }
};

/**
 * Process user Excel upload and create users in batch
 */
export const processUserExcelUpload = async (file, orgId, adminUserId) => {
  try {
    const { parseExcelFile, normalizeUserColumnNames, validateUserExcelData, transformUserData } = await import('../utils/excelParser');

    // 1. Parse Excel file
    const rawData = await parseExcelFile(file);

    if (rawData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // 2. Normalize column names
    const normalizedData = normalizeUserColumnNames(rawData);

    // 3. Validate data
    const validationResults = validateUserExcelData(normalizedData);

    if (validationResults.valid.length === 0) {
      throw new Error('No valid records found in Excel file');
    }

    // 4. Transform to user format
    const usersData = validationResults.valid.map(row => transformUserData(row));

    // 5. Create users in batch
    const results = {
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    // Process users one by one (to handle errors gracefully)
    for (let i = 0; i < usersData.length; i++) {
      const userData = usersData[i];
      try {
        await createUser(userData, orgId);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.errors.push({
          row: validationResults.valid[i].rowNumber,
          email: userData.email,
          error: error.message || 'Failed to create user',
        });
      }
    }

    // Combine validation errors with creation errors
    const allErrors = [
      ...validationResults.invalid.map(item => ({
        row: item.rowNumber,
        email: item.data.email || 'N/A',
        error: item.errors.join(', '),
      })),
      ...results.errors,
    ];

    return {
      success: true,
      totalRows: rawData.length,
      validRows: validationResults.valid.length,
      invalidRows: validationResults.invalid.length,
      successCount: results.successCount,
      failedCount: results.failedCount + validationResults.invalid.length,
      errors: allErrors,
    };
  } catch (error) {
    console.error('Error processing user Excel upload:', error);
    throw error;
  }
};

