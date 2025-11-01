import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Get leave policy for an organization
 */
export const getLeavePolicy = async (orgId) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    const policyRef = doc(db, 'leavePolicies', orgId);
    const policySnap = await getDoc(policyRef);

    if (!policySnap.exists()) {
      // Return default policy if none exists
      return {
        annualLeave: 20,
        sickLeave: 10,
        casualLeave: 7,
        maternityLeave: 90,
        paternityLeave: 15,
        rules: [
          'Leave requests must be submitted at least 3 days in advance',
          'Emergency leave can be applied on the same day with proper justification',
          'Maximum 3 consecutive casual leaves without prior approval',
          'Sick leave requires medical certificate for more than 2 days',
          'Annual leave must be planned and approved by your supervisor'
        ],
        holidays: [
          { date: '2025-01-01', name: 'New Year\'s Day' },
          { date: '2025-01-26', name: 'Republic Day' },
          { date: '2025-08-15', name: 'Independence Day' },
          { date: '2025-10-02', name: 'Gandhi Jayanti' },
          { date: '2025-12-25', name: 'Christmas' }
        ]
      };
    }

    return {
      id: policySnap.id,
      ...policySnap.data(),
    };
  } catch (error) {
    console.error('Error getting leave policy:', error);
    throw error;
  }
};

/**
 * Update leave policy for an organization
 */
export const updateLeavePolicy = async (orgId, policyData) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    const policyRef = doc(db, 'leavePolicies', orgId);
    
    const updateData = {
      ...policyData,
      updatedAt: serverTimestamp(),
    };

    // Check if document exists
    const policySnap = await getDoc(policyRef);
    
    if (policySnap.exists()) {
      await updateDoc(policyRef, updateData);
    } else {
      // Create new policy document
      await setDoc(policyRef, {
        ...updateData,
        createdAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating leave policy:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update leave policy');
    }
    
    throw error;
  }
};

/**
 * Update leave balances for all employees in the organization
 * This function updates the leave entitlements for all active employees
 */
export const updateAllEmployeeLeaves = async (orgId, leavePolicy) => {
  try {
    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    // Get all active employees in the organization
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('orgId', '==', orgId),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: true, updatedCount: 0 };
    }

    // Use batch write for atomic updates
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.docs.forEach((userDoc) => {
      const userRef = doc(db, 'users', userDoc.id);
      
      // Update leave balances based on new policy
      batch.update(userRef, {
        'leaveBalance.annual': leavePolicy.annualLeave || 20,
        'leaveBalance.sick': leavePolicy.sickLeave || 10,
        'leaveBalance.casual': leavePolicy.casualLeave || 7,
        'leaveBalance.maternity': leavePolicy.maternityLeave || 90,
        'leaveBalance.paternity': leavePolicy.paternityLeave || 15,
        'leaveBalance.updatedAt': serverTimestamp(),
      });
      
      updateCount++;
    });

    // Commit the batch
    await batch.commit();

    return { 
      success: true, 
      updatedCount: updateCount,
      message: `Successfully updated leave balances for ${updateCount} employee(s)`
    };
  } catch (error) {
    console.error('Error updating employee leaves:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update employee leaves');
    }
    
    throw new Error(error.message || 'Failed to update employee leaves');
  }
};

/**
 * Initialize leave balances for a new employee based on org policy
 */
export const initializeEmployeeLeaves = async (userId, orgId) => {
  try {
    if (!userId || !orgId) {
      throw new Error('User ID and Organization ID are required');
    }

    // Get the organization's leave policy
    const policy = await getLeavePolicy(orgId);
    
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      'leaveBalance.annual': policy.annualLeave || 20,
      'leaveBalance.sick': policy.sickLeave || 10,
      'leaveBalance.casual': policy.casualLeave || 7,
      'leaveBalance.maternity': policy.maternityLeave || 90,
      'leaveBalance.paternity': policy.paternityLeave || 15,
      'leaveBalance.updatedAt': serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error initializing employee leaves:', error);
    throw error;
  }
};
