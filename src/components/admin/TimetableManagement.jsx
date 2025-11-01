import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const TimetableManagement = () => {
  const { userClaims } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  
  const [formData, setFormData] = useState({
    teacherId: '',
    teacherName: '',
    day: 'Monday',
    time: '09:00 AM',
    subject: '',
    class: '',
    room: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    fetchTeachers();
    fetchTimetable();
  }, [userClaims]);

  const fetchTeachers = async () => {
    if (!userClaims?.orgId) return;

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('orgId', '==', userClaims.orgId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeachers(data);
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied: Unable to fetch teachers');
        setTeachers([]);
      } else {
        console.error('Error fetching teachers:', error);
      }
    }
  };

  const fetchTimetable = async () => {
    if (!userClaims?.orgId) return;

    try {
      setLoading(true);
      const timetableRef = collection(db, 'timetables');
      const q = query(timetableRef, where('organizationId', '==', userClaims.orgId));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.teacherId || !formData.subject || !formData.class || !formData.room) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      const teacherDisplayName = selectedTeacher?.profile?.firstName && selectedTeacher?.profile?.lastName
        ? `${selectedTeacher.profile.firstName} ${selectedTeacher.profile.lastName}`
        : selectedTeacher?.email || formData.teacherName;
      
      const entryData = {
        ...formData,
        teacherName: teacherDisplayName,
        organizationId: userClaims.orgId,
        createdAt: new Date().toISOString()
      };

      if (editingEntry) {
        await updateDoc(doc(db, 'timetables', editingEntry.id), entryData);
        toast.success('Timetable entry updated successfully!');
      } else {
        await addDoc(collection(db, 'timetables'), entryData);
        toast.success('Timetable entry added successfully!');
      }
      
      setShowAddModal(false);
      setEditingEntry(null);
      setFormData({
        teacherId: '',
        teacherName: '',
        day: 'Monday',
        time: '09:00 AM',
        subject: '',
        class: '',
        room: ''
      });
      fetchTimetable();
    } catch (error) {
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please contact your administrator.');
      } else {
        console.error('Error saving timetable entry:', error);
        toast.error('Failed to save timetable entry');
      }
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      teacherId: entry.teacherId,
      teacherName: entry.teacherName,
      day: entry.day,
      time: entry.time,
      subject: entry.subject,
      class: entry.class,
      room: entry.room
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await deleteDoc(doc(db, 'timetables', id));
      toast.success('Timetable entry deleted successfully!');
      fetchTimetable();
    } catch (error) {
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please contact your administrator.');
      } else {
        console.error('Error deleting timetable entry:', error);
        toast.error('Failed to delete timetable entry');
      }
    }
  };

  const getEntriesForSlot = (day, time) => {
    return timetable.filter(entry => entry.day === day && entry.time === time);
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
          <h1 className="text-2xl font-bold text-gray-900">Timetable Management</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage class schedules for teachers</p>
        </div>
        <button
          onClick={() => {
            setEditingEntry(null);
            setFormData({
              teacherId: '',
              teacherName: '',
              day: 'Monday',
              time: '09:00 AM',
              subject: '',
              class: '',
              room: ''
            });
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Entry</span>
        </button>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    const entries = getEntriesForSlot(day, time);
                    return (
                      <td key={`${day}-${time}`} className="px-6 py-4">
                        <div className="space-y-2">
                          {entries.map(entry => (
                            <div key={entry.id} className="bg-primary-50 border-l-4 border-primary-600 p-3 rounded group relative">
                              <p className="text-sm font-semibold text-gray-900">{entry.subject}</p>
                              <p className="text-xs text-gray-600 mt-1">{entry.class}</p>
                              <p className="text-xs text-gray-500">Room: {entry.room}</p>
                              <p className="text-xs text-gray-500">Teacher: {entry.teacherName}</p>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                <button
                                  onClick={() => handleEdit(entry)}
                                  className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id)}
                                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEntry(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.profile?.firstName && teacher.profile?.lastName
                          ? `${teacher.profile.firstName} ${teacher.profile.lastName} (${teacher.email})`
                          : teacher.email}
                      </option>
                    ))}
                  </select>
                  {teachers.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No teachers available. Please add users first in User Management.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      {days.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Mathematics"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Grade 10-A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Room 101"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEntry(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingEntry ? 'Update' : 'Add'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
