import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPayslips } from '../../services/payslip.service';
import { getUsers } from '../../services/user.service';
import { Table } from '../shared/Table';
import { format } from 'date-fns';
import { Filter } from 'lucide-react';

export const PayslipList = () => {
  const { userClaims } = useAuth();
  const [payslips, setPayslips] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: format(new Date(), 'yyyy-MM'),
    userId: '',
    status: '',
  });

  useEffect(() => {
    loadData();
  }, [userClaims, filters]);

  const loadData = async () => {
    try {
      if (!userClaims?.orgId) return;
      
      // Load users for filter dropdown
      if (users.length === 0) {
        const usersData = await getUsers(userClaims.orgId);
        setUsers(usersData);
      }

      // Load payslips with filters
      const data = await getPayslips(userClaims.orgId, filters);
      setPayslips(data);
    } catch (error) {
      console.error('Failed to load payslips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.profile?.firstName} ${user.profile?.lastName}` : 'Unknown';
  };

  const getUserEmail = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.email || 'N/A';
  };

  const columns = [
    {
      header: 'Month',
      accessor: 'month',
    },
    {
      header: 'Employee',
      render: (row) => (
        <div>
          <p className="font-medium">{getUserName(row.userId)}</p>
          <p className="text-xs text-gray-500">{getUserEmail(row.userId)}</p>
        </div>
      ),
    },
    {
      header: 'Employee ID',
      accessor: 'employeeId',
    },
    {
      header: 'Gross Salary',
      render: (row) => `$${row.grossSalary?.toLocaleString() || 0}`,
    },
    {
      header: 'Deductions',
      render: (row) => `$${row.totalDeductions?.toLocaleString() || 0}`,
    },
    {
      header: 'Net Salary',
      render: (row) => (
        <span className="font-semibold text-green-600">
          ${row.netSalary?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            row.status === 'paid'
              ? 'bg-green-100 text-green-800'
              : row.status === 'approved'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Generated Date',
      render: (row) =>
        row.generatedAt?.toDate
          ? format(row.generatedAt.toDate(), 'MMM dd, yyyy')
          : 'N/A',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payslips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">All Payslips</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Employees</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.profile?.firstName} {user.profile?.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="generated">Generated</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <Table 
          columns={columns} 
          data={payslips}
          emptyMessage="No payslips found for the selected filters"
        />
      </div>
    </div>
  );
};

