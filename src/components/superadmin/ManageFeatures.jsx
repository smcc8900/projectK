import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateOrganizationFeatures } from '../../services/superadmin.service';

const AVAILABLE_FEATURES = [
  { key: 'timetable', label: 'Timetable', description: 'Class/shift scheduling for education' },
  { key: 'leaves', label: 'Leave Management', description: 'Employee leave requests and approvals' },
  { key: 'colleagues', label: 'Colleagues Directory', description: 'View and search employees' },
  { key: 'payslips', label: 'Payslips', description: 'Salary slip generation and viewing' },
  { key: 'profile', label: 'Profile Management', description: 'User profile and settings' },
  { key: 'attendance', label: 'Attendance Tracking', description: 'Basic attendance management' },
  { key: 'geofencing', label: 'Geofencing', description: 'Location-based attendance check-in' },
  { key: 'reports', label: 'Advanced Reports', description: 'Detailed analytics and reports' },
  { key: 'analytics', label: 'Analytics Dashboard', description: 'Business intelligence and insights' },
];

export const ManageFeatures = ({ organizations, selectedOrg, onUpdate }) => {
  const [selectedOrgId, setSelectedOrgId] = useState(selectedOrg?.id || '');
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (selectedOrg) {
      setSelectedOrgId(selectedOrg.id);
      loadFeatures(selectedOrg);
    }
  }, [selectedOrg]);

  const loadFeatures = (org) => {
    if (!org) return;
    
    // Load existing features or set defaults based on type
    const orgFeatures = org.features || getDefaultFeatures(org.type);
    setFeatures(orgFeatures);
    setHasChanges(false);
  };

  const getDefaultFeatures = (type) => {
    const defaults = {
      education: {
        timetable: true,
        leaves: true,
        colleagues: true,
        payslips: true,
        profile: true,
        attendance: true,
        geofencing: false,
        reports: false,
        analytics: false,
      },
      corporate: {
        timetable: false,
        leaves: true,
        colleagues: true,
        payslips: true,
        profile: true,
        attendance: true,
        geofencing: true,
        reports: false,
        analytics: false,
      },
      full: {
        timetable: true,
        leaves: true,
        colleagues: true,
        payslips: true,
        profile: true,
        attendance: true,
        geofencing: true,
        reports: true,
        analytics: true,
      },
    };
    
    return defaults[type] || defaults.full;
  };

  const handleOrgChange = (e) => {
    const orgId = e.target.value;
    setSelectedOrgId(orgId);
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      loadFeatures(org);
    }
  };

  const handleFeatureToggle = (featureKey) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey],
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedOrgId) {
      toast.error('Please select an organization');
      return;
    }

    try {
      setLoading(true);
      await updateOrganizationFeatures(selectedOrgId, features);
      toast.success('Features updated successfully!');
      setHasChanges(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating features:', error);
      toast.error('Failed to update features');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const org = organizations.find(o => o.id === selectedOrgId);
    if (org) {
      loadFeatures(org);
    }
  };

  const selectedOrgData = organizations.find(o => o.id === selectedOrgId);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Manage Customer Features</h1>
        </div>

        {/* Organization Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Customer
          </label>
          <select
            value={selectedOrgId}
            onChange={handleOrgChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Select a customer --</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.orgName} ({org.domain}) - {org.type}
              </option>
            ))}
          </select>
        </div>

        {selectedOrgData && (
          <>
            {/* Organization Info */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Organization:</span>
                  <span className="ml-2 text-gray-900">{selectedOrgData.orgName}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Domain:</span>
                  <span className="ml-2 text-gray-900">{selectedOrgData.domain}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-900 capitalize">{selectedOrgData.type || 'full'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Users:</span>
                  <span className="ml-2 text-gray-900">{selectedOrgData.userCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Features Configuration</h3>
              
              <div className="grid gap-4">
                {AVAILABLE_FEATURES.map((feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">{feature.label}</h4>
                        {features[feature.key] ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                    
                    <button
                      onClick={() => handleFeatureToggle(feature.key)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        features[feature.key] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          features[feature.key] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Message */}
            {hasChanges && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Unsaved Changes</p>
                  <p className="mt-1">Users will need to refresh their browser or re-login to see the changes.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                onClick={handleReset}
                disabled={!hasChanges || loading}
                className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={!hasChanges || loading}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {!selectedOrgId && (
          <div className="text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Select a customer to manage their features</p>
          </div>
        )}
      </div>
    </div>
  );
};
