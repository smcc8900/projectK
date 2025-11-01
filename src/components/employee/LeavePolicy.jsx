import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Calendar, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const LeavePolicy = () => {
  const { organization } = useAuth();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeavePolicy();
  }, [organization]);

  const fetchLeavePolicy = async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);
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
      console.error('Error fetching leave policy:', error);
      toast.error('Failed to load leave policy');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Leave Policy</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review the organization's leave policies and entitlements
        </p>
      </div>

      {/* Leave Entitlements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Annual Leave</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">{policy?.annualLeave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days per year</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <Calendar className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sick Leave</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{policy?.sickLeave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days per year</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Casual Leave</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{policy?.casualLeave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days per year</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maternity Leave</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{policy?.maternityLeave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paternity Leave</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{policy?.paternityLeave || 0}</p>
              <p className="text-xs text-gray-500 mt-1">days</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Rules */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FileText className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Leave Rules & Guidelines</h2>
        </div>
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

      {/* Public Holidays */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Public Holidays 2025</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policy?.holidays?.map((holiday, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
  );
};
