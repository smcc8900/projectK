import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CalendarCheck, Clock, CheckCircle, XCircle, AlertCircle, FileText, Calendar, Info, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export const LeaveManagement = () => {
  const { currentUser, organization } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('apply'); // 'apply' or 'policy'
  
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: ''
  });

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeavePolicy();
  }, [currentUser, organization]);

  const fetchLeavePolicy = async () => {
    if (!organization?.id) return;

    try {
      const policyDoc = await getDoc(doc(db, 'leavePolicies', organization.id));
      
      if (policyDoc.exists()) {
        setPolicy(policyDoc.data());
      } else {
        // Default policy if none exists
        setPolicy({
          annualLeave: 20,
          sickLeave: 10,
          casualLeave: 7,
          maternityLeave: 90,
          paternityLeave: 15,
          rules: [
            'Leave requests must be submitted at least 3 days in advance',
            'Emergency leave can be applied on the same day with proper justification',
            'Maximum 3 consecutive casual leaves without prior approval',
            'Sick leave requires medical certificate for more than 2 days',
            'Annual leave must be planned and approved by your supervisor'
          ],
          holidays: [
            { date: '2025-01-01', name: 'New Year\'s Day' },
            { date: '2025-01-26', name: 'Republic Day' },
            { date: '2025-08-15', name: 'Independence Day' },
            { date: '2025-10-02', name: 'Gandhi Jayanti' },
            { date: '2025-12-25', name: 'Christmas' }
          ]
        });
      }
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied: Unable to fetch leave policy. Using default policy.');
        // Set default policy on permission error
        setPolicy({
          annualLeave: 20,
          sickLeave: 10,
          casualLeave: 7,
          maternityLeave: 90,
          paternityLeave: 15,
          rules: [
            'Leave requests must be submitted at least 3 days in advance',
            'Emergency leave can be applied on the same day with proper justification',
            'Maximum 3 consecutive casual leaves without prior approval',
            'Sick leave requires medical certificate for more than 2 days',
            'Annual leave must be planned and approved by your supervisor'
          ],
          holidays: [
            { date: '2025-01-01', name: 'New Year\'s Day' },
            { date: '2025-01-26', name: 'Republic Day' },
            { date: '2025-08-15', name: 'Independence Day' },
            { date: '2025-10-02', name: 'Gandhi Jayanti' },
            { date: '2025-12-25', name: 'Christmas' }
          ]
        });
      } else {
        console.error('Error fetching leave policy:', error);
      }
    }
  };

  const fetchLeaveRequests = async () => {
    if (!organization?.id || !currentUser?.uid) return;

    try {
      setLoading(true);
      const leavesRef = collection(db, 'leaveRequests');
      
      // Query without orderBy to avoid index requirement
      const q = query(
        leavesRef,
        where('organizationId', '==', organization.id),
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory by createdAt (newest first)
      data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setSubmitting(true);
      
      const leaveData = {
        ...formData,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        organizationId: organization.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        days: calculateDays(formData.startDate, formData.endDate)
      };

      await addDoc(collection(db, 'leaveRequests'), leaveData);
      
      toast.success('Leave request submitted successfully!');
      setFormData({
        leaveType: 'annual',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: ''
      });
      
      fetchLeaveRequests();
    } catch (error) {
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please contact your administrator.');
      } else {
        console.error('Error submitting leave request:', error);
        toast.error('Failed to submit leave request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Apply for leave and review leave policies
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('apply')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'apply'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <CalendarCheck className="w-5 h-5" />
                <span>Apply Leave</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'policy'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Leave Policy</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'apply' ? (
            <div className="space-y-6">
              {/* Leave Application Form */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">New Leave Request</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.leaveType}
                        onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="annual">Annual Leave</option>
                        <option value="sick">Sick Leave</option>
                        <option value="casual">Casual Leave</option>
                        <option value="maternity">Maternity Leave</option>
                        <option value="paternity">Paternity Leave</option>
                        <option value="emergency">Emergency Leave</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="tel"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Please provide a detailed reason for your leave request..."
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                      {formData.startDate && formData.endDate && (
                        <span>Total days: <strong>{calculateDays(formData.startDate, formData.endDate)}</strong></span>
                      )}
                    </p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Leave Requests History */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Request History</h2>
                
                <div className="space-y-4">
                  {loading ? (
                    <div className="p-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    </div>
                  ) : leaveRequests.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 rounded-lg">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
                      <p className="mt-1 text-sm text-gray-500">You haven't submitted any leave requests yet.</p>
                    </div>
                  ) : (
                    leaveRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                              {getLeaveTypeLabel(request.leaveType)}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <span className="text-xs text-gray-500">{request.days} days</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </span>
                          <span>Applied on {new Date(request.createdAt).toLocaleDateString()}</span>
                        </div>
                        {request.adminComment && (
                          <div className="mt-3 p-3 bg-white rounded-lg border-l-4 border-blue-400">
                            <div className="flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-blue-900">Admin Comment:</p>
                                <p className="text-xs text-blue-800 mt-1">{request.adminComment}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Leave Entitlements */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Entitlements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Annual Leave</p>
                        <p className="text-3xl font-bold text-blue-700 mt-2">{policy?.annualLeave || 0}</p>
                        <p className="text-xs text-blue-600 mt-1">days per year</p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-900">Sick Leave</p>
                        <p className="text-3xl font-bold text-red-700 mt-2">{policy?.sickLeave || 0}</p>
                        <p className="text-xs text-red-600 mt-1">days per year</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Casual Leave</p>
                        <p className="text-3xl font-bold text-green-700 mt-2">{policy?.casualLeave || 0}</p>
                        <p className="text-xs text-green-600 mt-1">days per year</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-900">Maternity Leave</p>
                        <p className="text-3xl font-bold text-purple-700 mt-2">{policy?.maternityLeave || 0}</p>
                        <p className="text-xs text-purple-600 mt-1">days</p>
                      </div>
                      <Calendar className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Paternity Leave</p>
                        <p className="text-3xl font-bold text-indigo-700 mt-2">{policy?.paternityLeave || 0}</p>
                        <p className="text-xs text-indigo-600 mt-1">days</p>
                      </div>
                      <Calendar className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Leave Rules */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Leave Rules & Guidelines</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-3">
                    {policy?.rules?.map((rule, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-600">{index + 1}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700">{rule}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Public Holidays */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Public Holidays 2025</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {policy?.holidays?.map((holiday, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs font-semibold text-primary-600">
                            {new Date(holiday.date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className="text-lg font-bold text-primary-600">
                            {new Date(holiday.date).getDate()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{holiday.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Important Note</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Please ensure you review and understand the leave policy before applying for leave.
                      For any clarifications, contact your HR department or supervisor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
