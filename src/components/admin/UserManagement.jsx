import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUsers, createUser, updateUser, deactivateUser, activateUser, deleteUser } from '../../services/user.service';
import { Table } from '../shared/Table';
import { Modal } from '../shared/Modal';
import { FileUploader } from '../shared/FileUploader';
import { processUserExcelUpload, validateUserExcelBeforeUpload } from '../../services/user.service';
import toast from 'react-hot-toast';
import { UserPlus, Edit, UserX, UserCheck, Eye, EyeOff, Upload, FileSpreadsheet, Trash2, X } from 'lucide-react';

export const UserManagement = () => {
  const { userClaims, currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
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
            phoneNumber: formData.phoneNumber,
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

  const handleDeleteUser = async (user) => {
    if (!window.confirm(
      `Are you sure you want to delete ${user.profile?.firstName} ${user.profile?.lastName}?\n\n` +
      `This will permanently delete:\n` +
      `- User account and authentication\n` +
      `- All payslips\n` +
      `- All leave requests\n` +
      `- All attendance records\n` +
      `- All timetable entries\n` +
      `- Profile photo\n\n` +
      `This action cannot be undone!`
    )) {
      return;
    }

    try {
      await deleteUser(user.id);
      toast.success('User and all associated data deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phoneNumber: user.profile.phoneNumber || '',
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
        phoneNumber: '',
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

  const handleBulkFileSelect = async (file) => {
    setSelectedFile(file);
    setValidationResults(null);
    setUploadResults(null);

    if (file) {
      try {
        setUploadLoading(true);
        const results = await validateUserExcelBeforeUpload(file);
        setValidationResults(results);
        
        if (results.invalidRows > 0) {
          toast.error(`Found ${results.invalidRows} invalid rows. Please review before uploading.`);
        } else {
          toast.success(`File validated successfully! ${results.validRows} valid rows found.`);
        }
      } catch (error) {
        toast.error(error.message || 'Failed to validate file');
        setSelectedFile(null);
      } finally {
        setUploadLoading(false);
      }
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile || !userClaims?.orgId) return;

    try {
      setUploadLoading(true);
      const results = await processUserExcelUpload(
        selectedFile,
        userClaims.orgId,
        currentUser.uid
      );
      
      setUploadResults(results);
      
      if (results.successCount > 0) {
        toast.success(`Successfully created ${results.successCount} users!`);
        loadUsers(); // Refresh user list
      }
      
      if (results.failedCount > 0) {
        toast.error(`${results.failedCount} records failed. Check the error details below.`);
      }

      // Reset file selection after successful upload
      if (results.failedCount === 0) {
        setSelectedFile(null);
        setValidationResults(null);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to process upload');
    } finally {
      setUploadLoading(false);
    }
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
      header: 'Phone',
      render: (row) => row.profile?.phoneNumber || 'N/A',
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
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); openModal(row); }}
            className="p-1.5 sm:p-1 text-blue-600 hover:text-blue-900 active:bg-blue-50 rounded transition-colors"
            title="Edit"
            aria-label="Edit user"
          >
            <Edit className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggleStatus(row); }}
            className={`p-1.5 sm:p-1 rounded transition-colors ${
              row.isActive 
                ? 'text-red-600 hover:text-red-900 active:bg-red-50' 
                : 'text-green-600 hover:text-green-900 active:bg-green-50'
            }`}
            title={row.isActive ? 'Deactivate' : 'Activate'}
            aria-label={row.isActive ? 'Deactivate user' : 'Activate user'}
          >
            {row.isActive ? <UserX className="w-4 h-4 sm:w-4 sm:h-4" /> : <UserCheck className="w-4 h-4 sm:w-4 sm:h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeleteUser(row); }}
            className="p-1.5 sm:p-1 text-red-600 hover:text-red-900 active:bg-red-50 rounded transition-colors"
            title="Delete User"
            aria-label="Delete user"
          >
            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
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
      <div className="flex flex-col gap-3 sm:gap-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="flex items-center justify-center px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-sm hover:shadow-md text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="whitespace-nowrap">Bulk Upload</span>
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center justify-center px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm hover:shadow-md text-sm sm:text-base min-h-[44px] sm:min-h-0"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="whitespace-nowrap">Add User</span>
          </button>
        </div>
      </div>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900">Bulk Upload Users</h2>
            <button
              onClick={() => {
                setShowBulkUpload(false);
                setSelectedFile(null);
                setValidationResults(null);
                setUploadResults(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-1 -mr-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <FileUploader onFileSelect={handleBulkFileSelect} accept=".xlsx,.xls" />

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Expected Excel Format:</h3>
            <div className="bg-gray-50 p-4 rounded text-xs overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left">Email *</th>
                    <th className="px-2 py-1 text-left">First Name *</th>
                    <th className="px-2 py-1 text-left">Last Name *</th>
                    <th className="px-2 py-1 text-left">Phone Number</th>
                    <th className="px-2 py-1 text-left">Employee ID</th>
                    <th className="px-2 py-1 text-left">Department</th>
                    <th className="px-2 py-1 text-left">Designation</th>
                    <th className="px-2 py-1 text-left">Role</th>
                    <th className="px-2 py-1 text-left">Password *</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1">john@company.com</td>
                    <td className="px-2 py-1">John</td>
                    <td className="px-2 py-1">Doe</td>
                    <td className="px-2 py-1">+1234567890</td>
                    <td className="px-2 py-1">EMP001</td>
                    <td className="px-2 py-1">Engineering</td>
                    <td className="px-2 py-1">Developer</td>
                    <td className="px-2 py-1">employee</td>
                    <td className="px-2 py-1">TempPass123!</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * Required fields: Email, First Name, Last Name, Password. Role defaults to "employee" if not specified.
            </p>
          </div>

          {validationResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Rows</p>
                  <p className="text-2xl font-bold text-blue-900">{validationResults.totalRows}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Valid Rows</p>
                  <p className="text-2xl font-bold text-green-900">{validationResults.validRows}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Invalid Rows</p>
                  <p className="text-2xl font-bold text-red-900">{validationResults.invalidRows}</p>
                </div>
              </div>

              {validationResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Validation Errors</h3>
                  <div className="space-y-2">
                    {validationResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <span className="font-medium">Row {error.rowNumber}:</span> {error.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validationResults.validRows > 0 && (
                <button
                  onClick={handleBulkUpload}
                  disabled={uploadLoading}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  {uploadLoading ? 'Processing...' : `Process ${validationResults.validRows} Users`}
                </button>
              )}
            </div>
          )}

          {uploadResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg flex items-center">
                  <UserCheck className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Successful</p>
                    <p className="text-2xl font-bold text-green-900">{uploadResults.successCount}</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center">
                  <UserX className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">Failed</p>
                    <p className="text-2xl font-bold text-red-900">{uploadResults.failedCount}</p>
                  </div>
                </div>
              </div>

              {uploadResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Processing Errors</h3>
                  <div className="space-y-2">
                    {uploadResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800">
                        <span className="font-medium">{error.email || `Row ${error.row}`}:</span> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
                  {user.profile?.phoneNumber && (
                    <p className="text-xs text-gray-400 mt-1">Phone: {user.profile.phoneNumber}</p>
                  )}
                  {user.profile?.employeeId && (
                    <p className="text-xs text-gray-400 mt-1">ID: {user.profile.employeeId}</p>
                  )}
                </div>
                <div className="flex space-x-1 sm:space-x-2 ml-2 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(user); }}
                    className="p-2 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                    aria-label="Edit user"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                    className={`p-2 rounded-lg transition-colors ${
                      user.isActive 
                        ? 'text-red-600 hover:bg-red-50 active:bg-red-100' 
                        : 'text-green-600 hover:bg-green-50 active:bg-green-100'
                    }`}
                    title={user.isActive ? 'Deactivate' : 'Activate'}
                    aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
                  >
                    {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteUser(user); }}
                    className="p-2 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                    title="Delete User"
                    aria-label="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              autoComplete="off"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 min-h-[44px] sm:min-h-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
              placeholder="+1234567890"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={!!editingUser && editingUser.role === 'admin'}
              className="block w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 min-h-[44px] sm:min-h-0"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            {!editingUser && (
              <p className="mt-1.5 text-xs text-gray-500">
                You can create additional admins for your organization
              </p>
            )}
          </div>
          
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Temporary Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="User will set their own password on first login"
                  autoComplete="new-password"
                  value={formData.tempPassword || ''}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  className="block w-full px-3 py-2.5 sm:py-2 pr-10 text-base sm:text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] sm:min-h-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 active:text-gray-900"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                User will be required to change this password on first login
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px] sm:min-h-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm hover:shadow-md min-h-[44px] sm:min-h-0"
            >
              {editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

