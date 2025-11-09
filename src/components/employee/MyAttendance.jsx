import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAttendance } from '../../services/attendance.service';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Clock, Calendar, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export const MyAttendance = () => {
  const { currentUser, userClaims } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    attendancePercentage: 0,
  });

  useEffect(() => {
    loadAttendance();
  }, [currentUser, userClaims, selectedMonth]);

  const loadAttendance = async () => {
    try {
      if (!currentUser || !userClaims?.orgId) return;

      setLoading(true);

      // Parse selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));

      // Load attendance records
      const records = await getUserAttendance(currentUser.uid, userClaims.orgId, {
        startDate,
        endDate,
      });

      setAttendanceRecords(records);

      // Calculate stats
      const totalDays = records.length;
      const presentDays = records.filter(r => r.status === 'checked-out').length;
      const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

      setStats({
        totalDays,
        presentDays,
        attendancePercentage,
      });
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    
    const checkInTime = checkIn.toDate ? checkIn.toDate() : new Date(checkIn);
    const checkOutTime = checkOut.toDate ? checkOut.toDate() : new Date(checkOut);
    
    const diffMs = checkOutTime - checkInTime;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    const hours = Math.floor(diffHours);
    const minutes = Math.floor((diffHours - hours) * 60);
    
    return `${hours}h ${minutes}m`;
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Clock className="w-8 h-8 mr-3 text-primary-600" />
            My Attendance
          </h1>
          <p className="text-gray-600 mt-1">View your attendance history and statistics</p>
        </div>
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <input
            id="month"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            max={format(new Date(), 'yyyy-MM')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard
          icon={Calendar}
          title="Total Days"
          value={stats.totalDays}
          color="bg-blue-500"
          subtitle="Attendance marked"
        />
        <StatCard
          icon={CheckCircle}
          title="Present Days"
          value={stats.presentDays}
          color="bg-green-500"
          subtitle="Completed check-out"
        />
        <StatCard
          icon={TrendingUp}
          title="Attendance %"
          value={`${stats.attendancePercentage}%`}
          color="bg-purple-500"
          subtitle="This month"
        />
      </div>

      {/* Attendance Records Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Attendance Records</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing records for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p>No attendance records found for this month</p>
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.date?.toDate 
                          ? format(record.date.toDate(), 'MMM dd, yyyy')
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.date?.toDate 
                          ? format(record.date.toDate(), 'EEEE')
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.checkIn?.toDate 
                        ? format(record.checkIn.toDate(), 'hh:mm a')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.checkOut?.toDate 
                        ? format(record.checkOut.toDate(), 'hh:mm a')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {calculateWorkHours(record.checkIn, record.checkOut)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.status === 'checked-out' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Incomplete
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
