import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers, createUser, updateUser, deactivateUser, activateUser } from '../../services/user.service';
import { Table } from '../shared/Table';
import { Modal } from '../shared/Modal';
import toast from 'react-hot-toast';
import { UserPlus, Edit, UserX, UserCheck, Eye, EyeOff } from 'lucide-react';

export const UserManagement = () => {
  const { userClaims } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    employeeId: '',
    department: '',
    designation: '',
    role: 'employee',
    tempPassword: '',
  });

  // Generate unique employee ID based on name
  const generateEmployeeId = (firstName, lastName) => {
    if (!firstName || !lastName) return '';
    
    const firstInitial = firstName.substring(0, 2).toUpperCase();
    const lastInitial = lastName.substring(0, 2).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    
    return `EMP${firstInitial}${lastInitial}${randomNum}`;
  };

  // Auto-generate employee ID when name changes (only for new users)
  useEffect(() => {
    if (!editingUser && formData.firstName && formData.lastName) {
      const newEmpId = generateEmployeeId(formData.firstName, formData.lastName);
      setFormData(prev => ({ ...prev, employeeId: newEmpId }));
    }
  }, [formData.firstName, formData.lastName, editingUser]);

  useEffect(() => {
    loadUsers();
  }, [userClaims]);

  const loadUsers = async () => {
    try {
      if (!userClaims?.orgId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await getUsers(userClaims.orgId);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      const errorMessage = error.message || 'Failed to load users';
      toast.error(errorMessage);
      // Check if it's a Firestore index error
      if (errorMessage.includes('index') || errorMessage.includes('requires an index')) {
        toast.error('Database index missing. Please check browser console for index creation link.', { duration: 5000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            employeeId: formData.employeeId,
            department: formData.department,
            designation: formData.designation,
          },
        });
        toast.success('User updated successfully');
      } else {
        await createUser(formData, userClaims.orgId);
        toast.success('User created successfully');
      }
      
      closeModal();
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to save user');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      if (user.isActive) {
        await deactivateUser(user.id);
        toast.success('User deactivated');
      } else {
        await activateUser(user.id);
        toast.success('User activated');
      }
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        employeeId: user.profile.employeeId,
        department: user.profile.department,
        designation: user.profile.designation,
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        employeeId: '',
        department: '',
        designation: '',
        role: 'employee',
        tempPassword: '',
      });
      setShowPassword(false);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setShowPassword(false);
  };

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'profile.employeeId',
      render: (row) => row.profile?.employeeId || 'N/A',
    },
    {
      header: 'Name',
      render: (row) => `${row.profile?.firstName} ${row.profile?.lastName}`,
    },
    {
      header: 'Email',
      accessor: 'email',
    },
    {
      header: 'Department',
      render: (row) => row.profile?.department || 'N/A',
    },
    {
      header: 'Designation',
      render: (row) => row.profile?.designation || 'N/A',
    },
    {
      header: 'Role',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.role}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); openModal(row); }}
            className="text-blue-600 hover:text-blue-900"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
            className={row.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          <span className="whitespace-nowrap">Add User</span>
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <Table columns={columns} data={users} />
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No users found
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-white rounded-lg shadow p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {user.profile?.firstName} {user.profile?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.profile?.employeeId && (
                    <p className="text-xs text-gray-400 mt-1">ID: {user.profile.employeeId}</p>
                  )}
                </div>
                <div className="flex space-x-2 ml-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(user); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                    className={`p-2 rounded-lg transition-colors ${
                      user.isActive 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.profile?.department || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Designation</p>
                  <p className="text-sm font-medium text-gray-900">
                    {user.profile?.designation || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              autoComplete="off"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={!!editingUser && editingUser.role === 'admin'}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            {!editingUser && (
              <p className="mt-1 text-xs text-gray-500">
                You can create additional admins for your organization
              </p>
            )}
          </div>
          
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Temporary Password *</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="User will set their own password on first login"
                  autoComplete="new-password"
                  value={formData.tempPassword || ''}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                User will be required to change this password on first login
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
            >
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

