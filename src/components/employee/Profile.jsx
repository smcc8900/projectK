import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserById, updateUser, checkEmployeeIdUnique } from '../../services/user.service';
import { updatePassword, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../services/firebase';
import toast from 'react-hot-toast';
import { User, Lock, Mail, Badge, Eye, EyeOff, Save, Upload } from 'lucide-react';
import { storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const Profile = () => {
  const { currentUser, userClaims } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    email: '',
    employeeId: '',
    firstName: '',
    lastName: '',
    department: '',
    designation: '',
    photoURL: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      if (!currentUser) return;
      
      const userData = await getUserById(currentUser.uid);
      if (userData) {
        setProfileData({
          email: userData.email || currentUser.email || '',
          employeeId: userData.profile?.employeeId || '',
          firstName: userData.profile?.firstName || '',
          lastName: userData.profile?.lastName || '',
          department: userData.profile?.department || '',
          designation: userData.profile?.designation || '',
          photoURL: userData.profile?.photoURL || currentUser.photoURL || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value,
    }));
  };


  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setSaving(true);
    
    try {
      // Note: Only email, firstName, lastName are editable by employees.

      // Update email if changed
      if (profileData.email !== currentUser.email) {
        try {
          await updateEmail(currentUser, profileData.email);
          toast.success('Email updated successfully');
        } catch (error) {
          if (error.code === 'auth/requires-recent-login') {
            toast.error('For security, please log out and log back in before changing your email.');
          } else if (error.code === 'auth/email-already-in-use') {
            toast.error('Email is already in use by another account.');
          } else {
            toast.error(`Failed to update email: ${error.message}`);
          }
          setSaving(false);
          return;
        }
      }

      // Update profile in Firestore
      await updateUser(currentUser.uid, {
        profile: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          // Keep non-editables as-is
          employeeId: profileData.employeeId,
          department: profileData.department,
          designation: profileData.designation,
          photoURL: profileData.photoURL || '',
        },
      });

      toast.success('Profile updated successfully');
      loadProfile(); // Reload to get fresh data
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, passwordData.newPassword);
      
      toast.success('Password updated successfully');
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('For security, please log out and log back in before changing your password.');
      } else {
        toast.error(`Failed to update password: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Manage your account settings and personal information</p>
      </div>

      {/* Main Content - Better layout for all screen sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-none">
        {/* Profile Photo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Photo</h2>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-4">
              <img
                src={profileData.photoURL || 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + encodeURIComponent(`${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'User')}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border"
                onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + encodeURIComponent(profileData.firstName || 'U'); }}
              />
              <div>
                <label className="block">
                  <span className="sr-only">Choose profile photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !currentUser || !userClaims?.orgId) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('Please upload an image smaller than 5MB');
                        return;
                      }
                      try {
                        setUploadingPhoto(true);
                        const path = `organizations/${userClaims.orgId}/users/${currentUser.uid}/profile.jpg`;
                        const storageRef = ref(storage, path);
                        await uploadBytes(storageRef, file, { contentType: file.type });
                        const url = await getDownloadURL(storageRef);
                        await updateUser(currentUser.uid, { profile: { ...profileData, photoURL: url } });
                        setProfileData(prev => ({ ...prev, photoURL: url }));
                        toast.success('Profile photo updated');
                      } catch (err) {
                        console.error('Photo upload failed:', err);
                        toast.error('Failed to upload photo');
                      } finally {
                        setUploadingPhoto(false);
                      }
                    }}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">JPG/PNG up to 5MB</p>
                {uploadingPhoto && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            </div>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileData.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                required
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-h-[44px] sm:min-h-0"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                You may need to log out and log back in after changing your email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Badge className="w-4 h-4 inline mr-1" />
                Employee ID
              </label>
              <input
                type="text"
                value={profileData.employeeId}
                readOnly
                disabled
                className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-200 bg-gray-50 rounded-lg shadow-sm text-gray-500 min-h-[44px] sm:min-h-0"
                placeholder="EMP001"
              />
              <p className="mt-1.5 text-xs text-gray-400">Contact admin to change Employee ID</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={profileData.department}
                  readOnly
                  disabled
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-200 bg-gray-50 rounded-lg shadow-sm text-gray-500 min-h-[44px] sm:min-h-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Designation
                </label>
                <input
                  type="text"
                  value={profileData.designation}
                  readOnly
                  disabled
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-200 bg-gray-50 rounded-lg shadow-sm text-gray-500 min-h-[44px] sm:min-h-0"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium min-h-[44px] sm:min-h-0"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg mr-3">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
            </div>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                  placeholder="Minimum 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors sm:text-sm"
                  placeholder="Re-enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md font-medium"
              >
                <Lock className="w-4 h-4 mr-2" />
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

