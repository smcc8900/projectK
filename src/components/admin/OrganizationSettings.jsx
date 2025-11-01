import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateOrganizationName, getOrganization } from '../../services/organization.service';
import { getLeavePolicy, updateLeavePolicy, updateAllEmployeeLeaves } from '../../services/leavePolicy.service';
import toast from 'react-hot-toast';
import { Settings, Save, Calendar, Users, AlertCircle } from 'lucide-react';

export const OrganizationSettings = () => {
  const { userClaims, organization, refreshOrganization } = useAuth();
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'leaves'
  
  // Leave policy state
  const [leavePolicy, setLeavePolicy] = useState({
    annualLeave: 20,
    sickLeave: 10,
    casualLeave: 7,
    maternityLeave: 90,
    paternityLeave: 15,
  });
  const [leavePolicyLoading, setLeavePolicyLoading] = useState(false);
  const [applyToAllLoading, setApplyToAllLoading] = useState(false);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!userClaims?.orgId) {
        setInitialLoading(false);
        return;
      }

      try {
        const org = await getOrganization(userClaims.orgId);
        setOrgName(org.orgName || '');
        
        // Load leave policy
        const policy = await getLeavePolicy(userClaims.orgId);
        setLeavePolicy({
          annualLeave: policy.annualLeave || 20,
          sickLeave: policy.sickLeave || 10,
          casualLeave: policy.casualLeave || 7,
          maternityLeave: policy.maternityLeave || 90,
          paternityLeave: policy.paternityLeave || 15,
        });
      } catch (error) {
        console.error('Error loading organization:', error);
        toast.error('Failed to load organization settings');
      } finally {
        setInitialLoading(false);
      }
    };

    loadOrganization();
  }, [userClaims?.orgId]);

  // Update local state when organization from context changes
  useEffect(() => {
    if (organization?.orgName) {
      setOrgName(organization.orgName);
    }
  }, [organization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orgName.trim()) {
      toast.error('Organization name cannot be empty');
      return;
    }

    if (!userClaims?.orgId) {
      toast.error('Organization ID not found');
      return;
    }

    setLoading(true);

    try {
      await updateOrganizationName(userClaims.orgId, orgName.trim());
      await refreshOrganization();
      toast.success('Organization name updated successfully!');
    } catch (error) {
      console.error('Error updating organization name:', error);
      toast.error(error.message || 'Failed to update organization name');
    } finally {
      setLoading(false);
    }
  };

  const handleLeavePolicySubmit = async (e) => {
    e.preventDefault();
    
    if (!userClaims?.orgId) {
      toast.error('Organization ID not found');
      return;
    }

    // Validate leave values
    if (Object.values(leavePolicy).some(val => val < 0)) {
      toast.error('Leave values cannot be negative');
      return;
    }

    setLeavePolicyLoading(true);

    try {
      await updateLeavePolicy(userClaims.orgId, leavePolicy);
      toast.success('Leave policy updated successfully!');
    } catch (error) {
      console.error('Error updating leave policy:', error);
      toast.error(error.message || 'Failed to update leave policy');
    } finally {
      setLeavePolicyLoading(false);
    }
  };

  const handleApplyToAllEmployees = async () => {
    if (!userClaims?.orgId) {
      toast.error('Organization ID not found');
      return;
    }

    const confirmed = window.confirm(
      'This will update leave balances for ALL active employees in the organization. Are you sure you want to continue?'
    );

    if (!confirmed) return;

    setApplyToAllLoading(true);

    try {
      const result = await updateAllEmployeeLeaves(userClaims.orgId, leavePolicy);
      toast.success(result.message || 'Leave balances updated for all employees!');
    } catch (error) {
      console.error('Error applying leaves to all employees:', error);
      toast.error(error.message || 'Failed to update employee leaves');
    } finally {
      setApplyToAllLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Settings className="w-4 h-4" />
            <span>General</span>
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`${
              activeTab === 'leaves'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <Calendar className="w-4 h-4" />
            <span>Leave Policy</span>
          </button>
        </nav>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  This name will be displayed on the login page, header, and payslip documents.
                </p>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Preview</h3>
                <p className="text-sm text-blue-700">
                  The organization name will appear as: <strong>{orgName || 'Organization Name'}</strong>
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setOrgName(organization?.orgName || '')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={loading || !orgName.trim() || orgName.trim() === organization?.orgName}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Note</h3>
            <p className="text-sm text-yellow-700">
              Changes to the organization name will be reflected immediately in:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Login page header</li>
                <li>Application navigation bar</li>
                <li>Payslip PDF documents</li>
              </ul>
            </p>
          </div>
        </>
      )}

      {/* Leave Policy Tab */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleLeavePolicySubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Entitlements</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Configure the default leave entitlements for employees in your organization.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="annualLeave" className="block text-sm font-medium text-gray-700 mb-2">
                      Annual Leave (days/year)
                    </label>
                    <input
                      id="annualLeave"
                      type="number"
                      min="0"
                      value={leavePolicy.annualLeave}
                      onChange={(e) => setLeavePolicy({ ...leavePolicy, annualLeave: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="sickLeave" className="block text-sm font-medium text-gray-700 mb-2">
                      Sick Leave (days/year)
                    </label>
                    <input
                      id="sickLeave"
                      type="number"
                      min="0"
                      value={leavePolicy.sickLeave}
                      onChange={(e) => setLeavePolicy({ ...leavePolicy, sickLeave: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="casualLeave" className="block text-sm font-medium text-gray-700 mb-2">
                      Casual Leave (days/year)
                    </label>
                    <input
                      id="casualLeave"
                      type="number"
                      min="0"
                      value={leavePolicy.casualLeave}
                      onChange={(e) => setLeavePolicy({ ...leavePolicy, casualLeave: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="maternityLeave" className="block text-sm font-medium text-gray-700 mb-2">
                      Maternity Leave (days)
                    </label>
                    <input
                      id="maternityLeave"
                      type="number"
                      min="0"
                      value={leavePolicy.maternityLeave}
                      onChange={(e) => setLeavePolicy({ ...leavePolicy, maternityLeave: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="paternityLeave" className="block text-sm font-medium text-gray-700 mb-2">
                      Paternity Leave (days)
                    </label>
                    <input
                      id="paternityLeave"
                      type="number"
                      min="0"
                      value={leavePolicy.paternityLeave}
                      onChange={(e) => setLeavePolicy({ ...leavePolicy, paternityLeave: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="submit"
                  disabled={leavePolicyLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {leavePolicyLoading ? 'Saving...' : 'Save Leave Policy'}
                </button>
              </div>
            </form>
          </div>

          {/* Apply to All Employees Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Apply Leave Policy to All Employees
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Update leave balances for all active employees in your organization based on the current leave policy settings.
                  This will reset their leave balances to match the policy values above.
                </p>
                <button
                  onClick={handleApplyToAllEmployees}
                  disabled={applyToAllLoading || leavePolicyLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {applyToAllLoading ? 'Applying...' : 'Apply to All Employees'}
                </button>
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-orange-800">Important</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Applying the leave policy to all employees will update their leave balances immediately.
                  This action cannot be undone. Make sure to save the leave policy first before applying it to employees.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

