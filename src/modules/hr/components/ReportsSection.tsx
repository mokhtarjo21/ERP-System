import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { BarChart3, TrendingUp } from 'lucide-react';
import {ar} from '../../../lib/ar';
export function ReportsSection() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    suspendedEmployees: 0,
    resignedEmployees: 0,
    totalPayrollAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, status');
      if (empError) throw empError;

      const { data: payroll, error: payError } = await supabase
        .from('payroll')
        .select('net_salary');
      if (payError) throw payError;

      const activeCount = employees?.filter(e => e.status === 'Active').length || 0;
      const suspendedCount = employees?.filter(e => e.status === 'Suspended').length || 0;
      const resignedCount = employees?.filter(e => e.status === 'Resigned').length || 0;
      const totalPayroll = payroll?.reduce((sum, p) => sum + (p.net_salary || 0), 0) || 0;

      setStats({
        totalEmployees: employees?.length || 0,
        activeEmployees: activeCount,
        suspendedEmployees: suspendedCount,
        resignedEmployees: resignedCount,
        totalPayrollAmount: totalPayroll,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{ar.hrReportsAnalytics}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.hr.totalEmployees}</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalEmployees}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.hr.activeEmployees}</p>
              <p className="text-3xl font-bold text-green-900">{stats.activeEmployees}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.hr.totalPayrollAmount}</p>
              <p className="text-3xl font-bold text-purple-900">${stats.totalPayrollAmount.toFixed(0)}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">{ar.hr.employeeStatusSummary}</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{ar.hr.activeEmployees}</span>
            <div className="flex items-center gap-2">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: stats.totalEmployees ? `${(stats.activeEmployees / stats.totalEmployees) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="font-semibold">{stats.activeEmployees}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{ar.hr.suspendedEmployees}</span>
            <div className="flex items-center gap-2">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full"
                  style={{ width: stats.totalEmployees ? `${(stats.suspendedEmployees / stats.totalEmployees) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="font-semibold">{stats.suspendedEmployees}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{ar.hr.resignedEmployees}</span>
            <div className="flex items-center gap-2">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: stats.totalEmployees ? `${(stats.resignedEmployees / stats.totalEmployees) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="font-semibold">{stats.resignedEmployees}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
