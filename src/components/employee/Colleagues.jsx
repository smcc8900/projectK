import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Mail, Search, UserCheck, Phone, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export const Colleagues = () => {
  const { userClaims } = useAuth();
  const [colleagues, setColleagues] = useState([]);
  const [filteredColleagues, setFilteredColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchColleagues();
  }, [userClaims]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredColleagues(colleagues);
    } else {
      const filtered = colleagues.filter(colleague =>
        colleague.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (colleague.displayName && colleague.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredColleagues(filtered);
    }
  }, [searchTerm, colleagues]);

  const fetchColleagues = async () => {
    if (!userClaims?.orgId) return;

    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('orgId', '==', userClaims.orgId));
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by name
      data.sort((a, b) => {
        const nameA = a.displayName || a.email;
        const nameB = b.displayName || b.email;
        return nameA.localeCompare(nameB);
      });
      
      setColleagues(data);
      setFilteredColleagues(data);
    } catch (error) {
      if (error.code === 'permission-denied') {
        console.warn('Permission denied: Unable to fetch colleagues. Please check Firestore rules.');
        setColleagues([]);
        setFilteredColleagues([]);
      } else {
        console.error('Error fetching colleagues:', error);
        toast.error('Failed to load colleagues');
      }
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (email, displayName) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRandomColor = (email) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
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
          <h1 className="text-2xl font-bold text-gray-900">Colleagues</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect with your fellow team members
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <UserCheck className="w-5 h-5" />
          <span>{colleagues.length} members</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Colleagues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredColleagues.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No colleagues found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No team members available'}
            </p>
          </div>
        ) : (
          filteredColleagues.map((colleague) => (
            <div
              key={colleague.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-16 h-16 ${getRandomColor(colleague.email)} rounded-full flex items-center justify-center text-white font-bold text-xl`}>
                  {getInitials(colleague.email, colleague.displayName)}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {colleague.displayName || colleague.email.split('@')[0]}
                  </h3>
                  
                  {colleague.role && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Briefcase className="w-3 h-3 mr-1" />
                      <span className="capitalize">{colleague.role}</span>
                    </div>
                  )}
                  
                  <div className="mt-3 space-y-2">
                    <a
                      href={`mailto:${colleague.email}`}
                      className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors group"
                    >
                      <Mail className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary-600" />
                      <span className="truncate">{colleague.email}</span>
                    </a>
                    
                    {colleague.phone && (
                      <a
                        href={`tel:${colleague.phone}`}
                        className="flex items-center text-sm text-gray-600 hover:text-primary-600 transition-colors group"
                      >
                        <Phone className="w-4 h-4 mr-2 text-gray-400 group-hover:text-primary-600" />
                        <span>{colleague.phone}</span>
                      </a>
                    )}
                  </div>
                  
                  {colleague.department && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {colleague.department}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
