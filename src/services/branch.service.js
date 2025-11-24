import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Add a new branch to an organization
 */
export const addBranch = async (orgId, branchData) => {
    try {
        if (!orgId) throw new Error('Organization ID is required');
        if (!branchData.name) throw new Error('Branch name is required');

        const branchesRef = collection(db, 'organizations', orgId, 'branches');

        const newBranch = {
            ...branchData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            active: true
        };

        const docRef = await addDoc(branchesRef, newBranch);

        return {
            id: docRef.id,
            ...newBranch
        };
    } catch (error) {
        console.error('Error adding branch:', error);
        throw error;
    }
};

/**
 * Get all branches for an organization
 */
export const getBranches = async (orgId) => {
    try {
        if (!orgId) throw new Error('Organization ID is required');

        const branchesRef = collection(db, 'organizations', orgId, 'branches');
        const q = query(branchesRef, where('active', '==', true));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting branches:', error);
        throw error;
    }
};

/**
 * Update a branch
 */
export const updateBranch = async (orgId, branchId, updates) => {
    try {
        if (!orgId || !branchId) throw new Error('Organization ID and Branch ID are required');

        const branchRef = doc(db, 'organizations', orgId, 'branches', branchId);

        await updateDoc(branchRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error updating branch:', error);
        throw error;
    }
};

/**
 * Soft delete a branch (set active: false)
 */
export const deleteBranch = async (orgId, branchId) => {
    try {
        if (!orgId || !branchId) throw new Error('Organization ID and Branch ID are required');

        const branchRef = doc(db, 'organizations', orgId, 'branches', branchId);

        await updateDoc(branchRef, {
            active: false,
            updatedAt: serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting branch:', error);
        throw error;
    }
};
