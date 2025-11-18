import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import { getOrganization, getOrganizationByDomain } from '../../services/organization.service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import toast from 'react-hot-toast';
import { LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getCurrentDomain, isCustomDomain } from '../../utils/domainDetection';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgName, setOrgName] = useState('Payroll System');
  const [allowedDomain, setAllowedDomain] = useState(null);
  const [domainOrg, setDomainOrg] = useState(null);
  const [domainError, setDomainError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshClaims, isAdmin, organization, logout } = useAuth();

  // Check if on custom domain and restrict access
  useEffect(() => {
    const checkDomain = async () => {
      const currentDomain = getCurrentDomain();
      
      if (currentDomain) {
        // On custom domain - restrict to this org only
        try {
          const org = await getOrganizationByDomain(currentDomain);
          setDomainOrg(org);
          setAllowedDomain(currentDomain);
          setOrgName(org.orgName);
        } catch (error) {
          console.error('Domain not configured:', error);
          setDomainError(true);
        }
      }
    };
    
    checkDomain();
  }, []);

  // Try to get org name from URL param or fetch after email is entered
  useEffect(() => {
    const fetchOrgName = async () => {
      // Skip if on custom domain (already set)
      if (allowedDomain) return;
      
      const orgIdParam = searchParams.get('orgId');
      
      if (orgIdParam) {
        try {
          const org = await getOrganization(orgIdParam);
          setOrgName(org.orgName || 'Payroll System');
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      } else if (email) {
        // Try to find organization by email domain
        try {
          const emailDomain = email.split('@')[1];
          if (emailDomain) {
            const orgsRef = collection(db, 'organizations');
            const q = query(orgsRef, where('domain', '==', emailDomain));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const orgData = snapshot.docs[0].data();
              setOrgName(orgData.orgName || 'Payroll System');
            }
          }
        } catch (error) {
          // Silently fail, keep default name
          console.error('Error fetching org by domain:', error);
        }
      }
    };

    fetchOrgName();
  }, [email, searchParams]);

  // Update org name when organization is available from auth context (after login)
  useEffect(() => {
    if (organization?.orgName) {
      setOrgName(organization.orgName);
    }
  }, [organization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, check if domain is configured (if on custom domain)
      const currentDomain = getCurrentDomain();
      if (currentDomain && domainError) {
        toast.error(
          `This domain (${currentDomain}) is not configured in our system. Please contact your administrator or use your organization's correct URL.`,
          { duration: 5000 }
        );
        setLoading(false);
        return;
      }

      // Attempt login
      const userCredential = await login(email, password);
      
      // Get fresh token with claims
      const idTokenResult = await userCredential.user.getIdTokenResult(true);
      const userRole = idTokenResult.claims.role;
      const userOrgId = idTokenResult.claims.orgId;
      
      // If on custom domain, verify user belongs to this organization
      // Exception: Super admins can login from any domain
      if (allowedDomain && domainOrg && userRole !== 'superadmin') {
        if (userOrgId !== domainOrg.id) {
          // User doesn't belong to this organization - sign them out (don't delete!)
          await logout();
          toast.error(
            `Access Denied: This login portal is exclusively for ${domainOrg.orgName} employees. Please visit your organization's URL to login.`,
            { duration: 6000 }
          );
          setLoading(false);
          return;
        }
      }
      
      toast.success('Login successful!');
      
      // If not superadmin, ensure organization is active
      if (userRole !== 'superadmin' && userOrgId) {
        try {
          const org = await getOrganization(userOrgId);
          const status = org?.subscription?.status || 'active';
          if (status !== 'active') {
            await logout();
            toast.error(`Your organization (${org.orgName}) is currently inactive. Please contact your administrator.`, { duration: 6000 });
            setLoading(false);
            return;
          }
        } catch (e) {
          // If we cannot fetch org, block login defensively
          await logout();
          toast.error('Unable to verify organization status. Please try again later.', { duration: 6000 });
          setLoading(false);
          return;
        }
      }
      
      // Redirect based on role from fresh token
      if (userRole === 'superadmin') {
        navigate('/superadmin/dashboard', { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/employee/dashboard', { replace: true });
      }
    } catch (error) {
      // Show user-friendly error messages
      let errorMessage = 'Failed to login';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Contact your administrator.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large circles */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-blue-400/10 rounded-lg rotate-12 animate-float"></div>
        <div className="absolute top-40 right-32 w-12 h-12 bg-purple-400/10 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-indigo-400/10 rounded-lg -rotate-12 animate-float"></div>
        <div className="absolute bottom-20 right-20 w-14 h-14 bg-pink-400/10 rounded-full animate-float-delayed"></div>
      </div>

      {/* Login card */}
      <div className="max-w-md w-full relative z-10">
        {/* Warning for default domain */}
        {!allowedDomain && !domainError && (
          <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Note:</strong> For production use, access your organization's custom domain (e.g., yourcompany.com)
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Error for unconfigured domain */}
        {domainError && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> This domain is not configured. Please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 sm:p-10">
          <div className="text-center mb-8">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {orgName}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account
            </p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none relative block w-full px-4 py-3 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all sm:text-sm"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                  <LogIn className="h-5 w-5 text-white/80 group-hover:text-white" />
                </span>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">
                Contact your administrator to get access
              </p>
            </div>
          </form>
        </div>
        
        {/* Additional info card */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Secure payroll management system
          </p>
        </div>
      </div>
    </div>
  );
};

