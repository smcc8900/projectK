import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getPayslips } from '../../services/payslip.service';
import { DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { currentUser, userClaims } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    latestPayslip: null,
    totalPayslips: 0,
    yearToDateEarnings: 0,
    yearToDateTax: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, userClaims]);

  const loadDashboardData = async () => {
    try {
      if (!userClaims?.orgId || !currentUser) return;

      // Get all payslips for current user
      const payslips = await getPayslips(userClaims.orgId, {
        userId: currentUser.uid,
      });

      // Get current year payslips
      const currentYear = new Date().getFullYear();
      const yearPayslips = payslips.filter(p => p.year === currentYear);

      const yearToDateEarnings = yearPayslips.reduce(
        (sum, p) => sum + (p.grossSalary || 0),
        0
      );

      const yearToDateTax = yearPayslips.reduce(
        (sum, p) => sum + (p.deductions?.tax || 0),
        0
      );

      setStats({
        latestPayslip: payslips[0] || null,
        totalPayslips: payslips.length,
        yearToDateEarnings,
        yearToDateTax,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-full ${color} bg-opacity-10 flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 break-words">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600">Welcome back, {currentUser?.displayName || currentUser?.email}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          title="Total Payslips"
          value={stats.totalPayslips}
          color="bg-blue-500"
        />
        <StatCard
          icon={DollarSign}
          title="YTD Earnings"
          value={`$${stats.yearToDateEarnings.toLocaleString()}`}
          color="bg-green-500"
          subtitle={`${new Date().getFullYear()} Total`}
        />
        <StatCard
          icon={TrendingUp}
          title="YTD Tax Paid"
          value={`$${stats.yearToDateTax.toLocaleString()}`}
          color="bg-red-500"
          subtitle={`${new Date().getFullYear()} Total`}
        />
        <StatCard
          icon={Calendar}
          title="Latest Month"
          value={stats.latestPayslip?.month || 'N/A'}
          color="bg-purple-500"
        />
      </div>

      {/* Latest Payslip */}
      {stats.latestPayslip && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Latest Payslip</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Pay Period</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats.latestPayslip.month}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Gross Salary</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${stats.latestPayslip.grossSalary?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Salary</p>
                <p className="text-lg font-semibold text-green-600">
                  ${stats.latestPayslip.netSalary?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Earnings Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Basic Salary</p>
                  <p className="font-medium">${stats.latestPayslip.earnings?.basicSalary?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">HRA</p>
                  <p className="font-medium">${stats.latestPayslip.earnings?.hra?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Allowances</p>
                  <p className="font-medium">${stats.latestPayslip.earnings?.allowances?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Bonus</p>
                  <p className="font-medium">${stats.latestPayslip.earnings?.bonus?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Deductions Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Tax</p>
                  <p className="font-medium text-red-600">${stats.latestPayslip.deductions?.tax?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Provident Fund</p>
                  <p className="font-medium text-red-600">${stats.latestPayslip.deductions?.providentFund?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Insurance</p>
                  <p className="font-medium text-red-600">${stats.latestPayslip.deductions?.insurance?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => navigate('/employee/payslips')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                View All Payslips
              </button>
            </div>
          </div>
        </div>
      )}

      {!stats.latestPayslip && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No payslips available yet</p>
        </div>
      )}
    </div>
  );
};

