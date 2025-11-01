import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ClipboardList, CheckCircle, XCircle, Clock, Calendar, User, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const LeaveManagement = () => {
  const { userClaims } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, [userClaims]);

  const fetchLeaveRequests = async () => {
    if (!userClaims?.orgId) return;

    try {
      setLoading(true);
      const leavesRef = collection(db, 'leaveRequests');
      const q = query(leavesRef, where('organizationId', '==', userClaims.orgId));
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by creation date, newest first
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setLeaveRequests(data);
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied: Unable to fetch leave requests. Please check Firestore rules.');
        setLeaveRequests([]);
      } else {
        console.error('Error fetching leave requests:', error);
        toast.error('Failed to load leave requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      await updateDoc(doc(db, 'leaveRequests', requestId), {
        status: 'approved',
        adminComment: adminComment || 'Leave approved',
        approvedAt: new Date().toISOString()
      });
      
      toast.success('Leave request approved!');
      setSelectedRequest(null);
      setAdminComment('');
      fetchLeaveRequests();
    } catch (error) {
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please contact your administrator.');
      } else {
        console.error('Error approving leave:', error);
        toast.error('Failed to approve leave request');
      }
    }
  };

  const handleReject = async (requestId) => {
    if (!adminComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await updateDoc(doc(db, 'leaveRequests', requestId), {
        status: 'rejected',
        adminComment: adminComment,
        rejectedAt: new Date().toISOString()
      });
      
      toast.success('Leave request rejected');
      setSelectedRequest(null);
      setAdminComment('');
      fetchLeaveRequests();
    } catch (error) {
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please contact your administrator.');
      } else {
        console.error('Error rejecting leave:', error);
        toast.error('Failed to reject leave request');
      }
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return leaveRequests;
    return leaveRequests.filter(req => req.status === filter);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Rejected' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </span>
    );
  };

  const getLeaveTypeLabel = (type) => {
    const types = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      casual: 'Casual Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      emergency: 'Emergency Leave'
    };
    return types[type] || type;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      casual: 'bg-green-100 text-green-800',
      maternity: 'bg-purple-100 text-purple-800',
      paternity: 'bg-indigo-100 text-indigo-800',
      emergency: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage employee leave requests
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {getFilteredRequests().length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? 'No leave requests have been submitted yet.'
                : `No ${filter} leave requests.`}
            </p>
          </div>
        ) : (
          getFilteredRequests().map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                      {getLeaveTypeLabel(request.leaveType)}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{request.userEmail}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      <span className="ml-2 text-gray-500">({request.days} days)</span>
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700">{request.reason}</p>
                  </div>
                  
                  {request.emergencyContact && (
                    <p className="text-xs text-gray-500">
                      Emergency Contact: {request.emergencyContact}
                    </p>
                  )}
                  
                  {request.adminComment && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-blue-900">Admin Comment:</p>
                          <p className="text-sm text-blue-800 mt-1">{request.adminComment}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-3">
                    Submitted on {new Date(request.createdAt).toLocaleString()}
                  </p>
                </div>
                
                {request.status === 'pending' && (
                  <div className="ml-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Leave Request</h2>
              
              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Employee</p>
                  <p className="text-sm text-gray-900">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Leave Type</p>
                  <p className="text-sm text-gray-900">{getLeaveTypeLabel(selectedRequest.leaveType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Duration</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()} ({selectedRequest.days} days)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Reason</p>
                  <p className="text-sm text-gray-900">{selectedRequest.reason}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Comment
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add your comment here..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminComment('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
