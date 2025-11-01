import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';

export const registerOrganization = async (orgData, adminData) => {
  try {
    // Create organization document
    const orgRef = doc(db, 'organizations', orgData.orgId || crypto.randomUUID());
    await setDoc(orgRef, {
      orgName: orgData.orgName,
      domain: orgData.domain,
      subscription: {
        plan: orgData.plan || 'enterprise',
        status: 'active',
        startDate: serverTimestamp(),
      },
      settings: {
        currency: orgData.currency || 'USD',
        timezone: orgData.timezone || 'America/New_York',
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      adminData.email,
      adminData.password
    );

    // Update profile
    await updateProfile(userCredential.user, {
      displayName: `${adminData.firstName} ${adminData.lastName}`,
    });

    // Create user document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      userId: userCredential.user.uid,
      email: adminData.email,
      orgId: orgRef.id,
      role: 'admin',
      profile: {
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        employeeId: adminData.employeeId || 'ADMIN001',
        department: 'Administration',
        designation: 'Administrator',
        joiningDate: serverTimestamp(),
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Call Cloud Function to set custom claims
    try {
      const setCustomClaims = httpsCallable(functions, 'setUserClaims');
      await setCustomClaims({
        userId: userCredential.user.uid,
        orgId: orgRef.id,
        role: 'admin',
      });

      // Force token refresh to get new claims
      await userCredential.user.getIdToken(true);
    } catch (error) {
      console.error('Error setting custom claims:', error);
      
      // Provide more helpful error messages
      if (error.code === 'functions/not-found') {
        throw new Error('Cloud Functions not found. Please ensure functions are deployed. Run: firebase deploy --only functions');
      }
      
      if (error.code === 'functions/unavailable' || error.message?.includes('CORS')) {
        throw new Error('CORS Error: Functions may not be deployed. Please deploy functions first: firebase deploy --only functions');
      }
      
      // Re-throw to be caught by outer catch
      throw error;
    }

    return {
      user: userCredential.user,
      orgId: orgRef.id,
    };
  } catch (error) {
    console.error('Error registering organization:', error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verify user has claims
    const idTokenResult = await userCredential.user.getIdTokenResult();
    if (!idTokenResult.claims.orgId || !idTokenResult.claims.role) {
      throw new Error('User account not properly configured. Missing organization or role. Please contact support.');
    }

    return userCredential;
  } catch (error) {
    console.error('Error logging in:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const getCurrentUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

