import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getOrganizationAttendance } from '../../services/attendance.service';
import { getUsers } from '../../services/user.service';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { format } from 'date-fns';
import { Clock, Users, CheckCircle, XCircle, Calendar, Plane } from 'lucide-react';
import toast from 'react-hot-toast';

export const AttendanceManagement = () => {
  const { userClaims } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState({
    checkedIn: 0,
    checkedOut: 0,
    onLeave: 0,
    absent: 0,
  });

  useEffect(() => {
    loadData();
  }, [userClaims, selectedDate]);

  const loadData = async () => {
    try {
      if (!userClaims?.orgId) return;

      setLoading(true);

      // Load employees
      const employeeList = await getUsers(userClaims.orgId);
      const activeEmployees = employeeList.filter(emp => emp.isActive);
      setEmployees(activeEmployees);

      // Load attendance for selected date
      const attendance = await getOrganizationAttendance(userClaims.orgId, {
        date: selectedDate,
      });
      setAttendanceRecords(attendance);

      // Load leave requests for selected date
      const selectedDateObj = new Date(selectedDate);
      const leavesRef = collection(db, 'leaveRequests');
      const leaveQuery = query(
        leavesRef,
        where('organizationId', '==', userClaims.orgId),
        where('status', '==', 'approved')
      );
      const leaveSnapshot = await getDocs(leaveQuery);
      
      // Filter leaves that include the selected date
      const leavesOnDate = leaveSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(leave => {
          const startDate = leave.startDate?.toDate ? leave.startDate.toDate() : new Date(leave.startDate);
          const endDate = leave.endDate?.toDate ? leave.endDate.toDate() : new Date(leave.endDate);
          return selectedDateObj >= startDate && selectedDateObj <= endDate;
        });
      setLeaveRequests(leavesOnDate);

      // Calculate stats
      const checkedInCount = attendance.filter(a => a.status === 'checked-in').length;
      const checkedOutCount = attendance.filter(a => a.status === 'checked-out').length;
      const onLeaveCount = leavesOnDate.length;
      const absentCount = activeEmployees.length - attendance.length - onLeaveCount;

      setStats({
        checkedIn: checkedInCount,
        checkedOut: checkedOutCount,
        onLeave: onLeaveCount,
        absent: Math.max(0, absentCount),
      });
    } catch (error) {
      console.error('Error loading attendance data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeById = (userId) => {
    return employees.find(emp => emp.id === userId);
  };

  const isEmployeeOnLeave = (userId) => {
    return leaveRequests.some(leave => leave.userId === userId);
  };

  const getEmployeeStatus = (employee) => {
    const attendance = attendanceRecords.find(a => a.userId === employee.id);
    const onLeave = isEmployeeOnLeave(employee.id);

    if (onLeave) return { status: 'On Leave', color: 'text-purple-600', icon: Plane };
    if (attendance?.status === 'checked-in') return { status: 'Checked In', color: 'text-green-600', icon: CheckCircle };
    if (attendance?.status === 'checked-out') return { status: 'Checked Out', color: 'text-blue-600', icon: XCircle };
    return { status: 'Absent', color: 'text-red-600', icon: XCircle };
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance data...</p>
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
            Attendance Management
          </h1>
          <p className="text-gray-600 mt-1">Track employee attendance and leaves</p>
        </div>
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Select Date
          </label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={CheckCircle}
          title="Checked In"
          value={stats.checkedIn}
          color="bg-green-500"
        />
        <StatCard
          icon={XCircle}
          title="Checked Out"
          value={stats.checkedOut}
          color="bg-blue-500"
        />
        <StatCard
          icon={Plane}
          title="On Leave"
          value={stats.onLeave}
          color="bg-purple-500"
        />
        <StatCard
          icon={Users}
          title="Absent"
          value={stats.absent}
          color="bg-red-500"
        />
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Employee Status</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing attendance for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check Out
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const attendance = attendanceRecords.find(a => a.userId === employee.id);
                  const statusInfo = getEmployeeStatus(employee);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.displayName || employee.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{employee.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center text-sm font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {statusInfo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {attendance?.checkIn?.toDate 
                          ? format(attendance.checkIn.toDate(), 'hh:mm a')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {attendance?.checkOut?.toDate 
                          ? format(attendance.checkOut.toDate(), 'hh:mm a')
                          : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* On Leave Details */}
      {leaveRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Plane className="w-5 h-5 mr-2 text-purple-600" />
              Employees on Leave
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {leaveRequests.map((leave) => {
                const employee = getEmployeeById(leave.userId);
                return (
                  <div key={leave.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {employee?.displayName || employee?.name || 'Unknown Employee'}
                      </p>
                      <p className="text-sm text-gray-600">{leave.leaveType || 'Leave'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {leave.startDate?.toDate && leave.endDate?.toDate
                          ? `${format(leave.startDate.toDate(), 'MMM dd')} - ${format(leave.endDate.toDate(), 'MMM dd')}`
                          : 'Date not available'}
                      </p>
                      <p className="text-xs text-gray-500">{leave.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
