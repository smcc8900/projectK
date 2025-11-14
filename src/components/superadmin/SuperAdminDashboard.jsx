import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Activity,
  Settings,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  getAllOrganizations, 
  getOrganizationStats,
  getUserCountByOrg,
  deleteOrganization
} from '../../services/superadmin.service';
import { OnboardCustomer } from './OnboardCustomer';
import { ManageFeatures } from './ManageFeatures';

export const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [organizations, setOrganizations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [orgsData, statsData] = await Promise.all([
        getAllOrganizations(),
        getOrganizationStats(),
      ]);
      
      // Get user counts for each org
      const orgsWithCounts = await Promise.all(
        orgsData.map(async (org) => {
          const userCount = await getUserCountByOrg(org.id);
          return { ...org, userCount };
        })
      );
      
      setOrganizations(orgsWithCounts);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (org) => {
    if (org.id === 'ofdlabs') {
      toast.error('Cannot delete OFD Labs organization!');
      return;
    }
    
    try {
      setDeleting(true);
      const result = await deleteOrganization(org.id);
      
      toast.success(
        `Successfully deleted ${org.orgName}!\n` +
        `Removed: ${result.deletedUsers} users, ${result.deletedPayslips} payslips, ` +
        `${result.deletedUploads} uploads, ${result.deletedTimetables} timetables, ` +
        `${result.deletedLeaves} leaves, ${result.deletedAttendance} attendance records`,
        { duration: 6000 }
      );
      
      setDeleteConfirm(null);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast.error('Failed to delete organization: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredOrgs = organizations.filter(org =>
    org.orgName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          label="Total Customers"
          value={stats?.total || 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={Activity}
          label="Active Customers"
          value={stats?.active || 0}
          color="bg-green-500"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={organizations.reduce((sum, org) => sum + (org.userCount || 0), 0)}
          color="bg-purple-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Growth Rate"
          value="+12%"
          color="bg-orange-500"
        />
      </div>

      {/* Organization Type Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizations by Type</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.byType?.education || 0}</p>
            <p className="text-sm text-gray-600">Education</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.byType?.corporate || 0}</p>
            <p className="text-sm text-gray-600">Corporate</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats?.byType?.full || 0}</p>
            <p className="text-sm text-gray-600">Full Access</p>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{org.orgName}</div>
                        <div className="text-xs text-gray-500">{org.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {org.domain}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      org.type === 'education' ? 'bg-blue-100 text-blue-800' :
                      org.type === 'corporate' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {org.type || 'full'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {org.userCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {org.subscription?.status === 'active' ? (
                      <span className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 text-sm">
                        <XCircle className="w-4 h-4 mr-1" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedOrg(org);
                          setActiveTab('features');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Manage Features
                      </button>
                      {org.id !== 'ofdlabs' && (
                        <button
                          onClick={() => setDeleteConfirm(org)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete Organization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-500">OFD Labs - Customer Management</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('onboard')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>New Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('onboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'onboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Onboard Customer
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'features'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Features
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'onboard' && (
          <OnboardCustomer onSuccess={loadData} />
        )}
        {activeTab === 'features' && (
          <ManageFeatures 
            organizations={organizations}
            selectedOrg={selectedOrg}
            onUpdate={loadData}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Organization</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <strong>{deleteConfirm.orgName}</strong>?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium mb-2">This will permanently delete:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• All users ({deleteConfirm.userCount || 0} users)</li>
                  <li>• All payslips and salary data</li>
                  <li>• All upload history</li>
                  <li>• All timetables</li>
                  <li>• All leave records</li>
                  <li>• All attendance records</li>
                  <li>• The organization itself</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Firebase Auth users will remain. You may need to manually delete them from Firebase Console if needed.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrganization(deleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
