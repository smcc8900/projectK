import React, { useState } from 'react';
import { Building2, Mail, Lock, User, Globe, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const OnboardCustomer = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    domain: '',
    orgType: 'corporate',
    adminEmail: '',
    adminPassword: '',
    firstName: '',
    lastName: '',
  });
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const functions = getFunctions();
      const createOrgAdmin = httpsCallable(functions, 'createOrganizationAdmin');
      
      const response = await createOrgAdmin({
        orgName: formData.orgName,
        domain: formData.domain,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        firstName: formData.firstName,
        lastName: formData.lastName,
        orgType: formData.orgType,
        currency: 'USD',
        timezone: 'America/New_York',
      });

      setResult(response.data);
      toast.success('Customer onboarded successfully!');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setFormData({
        orgName: '',
        domain: '',
        orgType: 'corporate',
        adminEmail: '',
        adminPassword: '',
        firstName: '',
        lastName: '',
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to onboard customer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Building2 className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Onboard New Customer</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Details */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., OFD Labs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="domain"
                    value={formData.domain}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ofdlabs.store"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Type *
                </label>
                <select
                  name="orgType"
                  value={formData.orgType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="education">Education (includes Timetable)</option>
                  <option value="corporate">Corporate (no Timetable)</option>
                  <option value="full">Full (all features)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin User Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin User Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="User"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="adminEmail"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="admin@ofdlabs.store"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="adminPassword"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => setFormData({
                orgName: '',
                domain: '',
                orgType: 'corporate',
                adminEmail: '',
                adminPassword: '',
                firstName: '',
                lastName: '',
              })}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Create Customer</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Success Result */}
        {result && (
          <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2" />
              Customer Created Successfully!
            </h3>
            
            <div className="bg-white p-4 rounded border border-green-200">
              <h4 className="font-semibold text-gray-900 mb-2">Send to Customer:</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Login URL:</strong> https://projectk-618c3.web.app/login</p>
                <p><strong>Email:</strong> {result.adminEmail}</p>
                <p><strong>Password:</strong> {formData.adminPassword}</p>
                <p><strong>Organization:</strong> {result.orgName}</p>
                <p className="text-orange-600 mt-3">⚠️ Admin should change password after first login</p>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Organization ID:</strong> {result.orgId}</p>
              <p><strong>Admin UID:</strong> {result.adminUid}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
