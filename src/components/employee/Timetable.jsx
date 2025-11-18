import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, MapPin, User, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const Timetable = () => {
  const { currentUser, userClaims } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    fetchTimetable();
  }, [currentUser, userClaims]);

  const fetchTimetable = async () => {
    if (!userClaims?.orgId || !currentUser) return;

    try {
      setLoading(true);
      const timetableRef = collection(db, 'timetables');
      const q = query(
        timetableRef,
        where('organizationId', '==', userClaims.orgId),
        where('teacherId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTimetable(data);
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied: Unable to fetch timetable. Please check Firestore rules.');
        setTimetable([]);
      } else {
        console.error('Error fetching timetable:', error);
        toast.error('Failed to load timetable');
      }
    } finally {
      setLoading(false);
    }
  };

  const getClassForSlot = (day, time) => {
    return timetable.find(entry => entry.day === day && entry.time === time);
  };

  const downloadCSV = () => {
    // Build rows: Day, Time, Subject, Room, Class
    const header = ['Day', 'Time', 'Subject', 'Room', 'Class'];
    const rows = [];
    const allDays = days;
    const allTimes = timeSlots;
    allDays.forEach(day => {
      allTimes.forEach(time => {
        const cls = getClassForSlot(day, time);
        if (cls) {
          rows.push([day, time, cls.subject || '', cls.room || '', cls.class || '']);
        }
      });
    });
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable.csv';
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
          <p className="mt-1 text-sm text-gray-500">View your weekly class schedule</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadCSV}
            disabled={timetable.length === 0}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>Academic Year 2025</span>
          </div>
        </div>
      </div>

      {/* Day Selector for Mobile */}
      <div className="lg:hidden">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {days.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {/* Desktop View - Full Week */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  Time
                </th>
                {days.map(day => (
                  <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map(time => (
                <tr key={time}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {time}
                  </td>
                  {days.map(day => {
                    const classData = getClassForSlot(day, time);
                    return (
                      <td key={`${day}-${time}`} className="px-6 py-4">
                        {classData ? (
                          <div className="bg-primary-50 border-l-4 border-primary-600 p-3 rounded">
                            <p className="text-sm font-semibold text-gray-900">{classData.subject}</p>
                            <p className="text-xs text-gray-600 mt-1 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {classData.room}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{classData.class}</p>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Free</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View - Single Day */}
      <div className="lg:hidden space-y-4">
        {timeSlots.map(time => {
          const classData = getClassForSlot(selectedDay, time);
          return (
            <div key={time} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-gray-900">{time}</span>
                </div>
                <span className="text-xs text-gray-500">{selectedDay}</span>
              </div>
              {classData ? (
                <div className="bg-primary-50 border-l-4 border-primary-600 p-3 rounded">
                  <p className="text-sm font-semibold text-gray-900">{classData.subject}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-gray-600 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      Room: {classData.room}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      Class: {classData.class}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-sm">No class scheduled</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {timetable.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No timetable available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your timetable will appear here once it's created by the administrator.
          </p>
        </div>
      )}
    </div>
  );
};
