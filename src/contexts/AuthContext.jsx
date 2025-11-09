import { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { getOrganization } from '../services/organization.service';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userClaims, setUserClaims] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch organization data when orgId is available
  useEffect(() => {
    const fetchOrganization = async (orgId) => {
      if (!orgId) {
        setOrganization(null);
        return;
      }

      try {
        const orgData = await getOrganization(orgId);
        setOrganization(orgData);
      } catch (error) {
        console.error('Error fetching organization:', error);
        // Set default organization name if fetch fails
        setOrganization({ orgName: 'Enterprise Payroll' });
      }
    };

    if (userClaims?.orgId) {
      fetchOrganization(userClaims.orgId);
    } else {
      setOrganization(null);
    }
  }, [userClaims?.orgId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get custom claims (orgId, role)
        const idTokenResult = await user.getIdTokenResult();
        setUserClaims({
          orgId: idTokenResult.claims.orgId || null,
          role: idTokenResult.claims.role || null,
        });
      } else {
        setUserClaims(null);
        setOrganization(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setCurrentUser(null);
    setUserClaims(null);
    setOrganization(null);
  };

  const refreshClaims = async () => {
    if (currentUser) {
      await currentUser.getIdToken(true); // Force refresh
      const idTokenResult = await currentUser.getIdTokenResult();
      setUserClaims({
        orgId: idTokenResult.claims.orgId || null,
        role: idTokenResult.claims.role || null,
      });
    }
  };

  const isAdmin = () => {
    return userClaims?.role === 'admin';
  };

  const isEmployee = () => {
    return userClaims?.role === 'employee';
  };

  const isSuperAdmin = () => {
    return userClaims?.role === 'superadmin';
  };

  const refreshOrganization = async () => {
    if (userClaims?.orgId) {
      try {
        const orgData = await getOrganization(userClaims.orgId);
        setOrganization(orgData);
      } catch (error) {
        console.error('Error refreshing organization:', error);
      }
    }
  };

  // Feature flags based on organization type
  const getFeatures = () => {
    const orgType = organization?.type || 'full'; // 'education', 'corporate', 'full'
    
    const features = {
      education: {
        timetable: true,
        leaves: true,
        colleagues: true,
        payslips: true,
        profile: true,
      },
      corporate: {
        timetable: false,
        leaves: true,
        colleagues: true,
        payslips: true,
        profile: true,
      },
      full: {
        timetable: true,
        leaves: true,
        colleagues: true,
        payslips: true,
        profile: true,
      },
    };

    return features[orgType] || features.full;
  };

  const hasFeature = (featureName) => {
    const features = getFeatures();
    return features[featureName] !== false;
  };

  const value = {
    currentUser,
    userClaims,
    organization,
    loading,
    signOut,
    refreshClaims,
    refreshOrganization,
    isAdmin,
    isEmployee,
    isSuperAdmin,
    hasFeature,
    getFeatures,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

