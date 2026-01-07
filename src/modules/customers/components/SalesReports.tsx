import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { TrendingUp, BarChart3 } from 'lucide-react';
import {ar} from '../../../lib/ar';
export function SalesReports() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalSales: 0,
    totalReceived: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, status');
      if (custError) throw custError;

      const { data: invoices, error: invError } = await supabase
        .from('sales_invoices')
        .select('amount, paid_amount');
      if (invError) throw invError;

      const activeCount = customers?.filter(c => c.status === 'Active').length || 0;
      const totalSalesAmount = invoices?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
      const totalReceivedAmount = invoices?.reduce((sum, i) => sum + (i.paid_amount || 0), 0) || 0;
      const totalOutstandingAmount = totalSalesAmount - totalReceivedAmount;

      setStats({
        totalCustomers: customers?.length || 0,
        activeCustomers: activeCount,
        totalSales: totalSalesAmount,
        totalReceived: totalReceivedAmount,
        totalOutstanding: totalOutstandingAmount,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  const collectionRate = stats.totalSales > 0 ? Math.round((stats.totalReceived / stats.totalSales) * 100) : 0;

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{ar.SalesReceivablesReports}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.customers.totalcustomers}</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalCustomers}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.customers.totalsales}</p>
              <p className="text-3xl font-bold text-green-900">${stats.totalSales.toFixed(0)}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.CollectionRate}</p>
              <p className="text-3xl font-bold text-purple-900">{collectionRate}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">{ar.CashFlowSummary}</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{ar.customers.totalsales}</span>
              <span className="font-semibold text-lg">${stats.totalSales.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-gray-700 font-medium">{ar.customers.totalreceived}</span>
              <span className="font-semibold text-lg text-green-600">${stats.totalReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">{ar.customers.totaloutstanding}</span>
              <span className="font-semibold text-lg text-red-600">${stats.totalOutstanding.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">{ar.CustomerDistribution}</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{ar.customers.activecustomers}</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: stats.totalCustomers ? `${(stats.activeCustomers / stats.totalCustomers) * 100}%` : '0%' }}
                  ></div>
                </div>
                <span className="font-semibold">{stats.activeCustomers}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{ar.customers.inactivecustomers}</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: stats.totalCustomers ? `${((stats.totalCustomers - stats.activeCustomers) / stats.totalCustomers) * 100}%` : '0%' }}
                  ></div>
                </div>
                <span className="font-semibold">{stats.totalCustomers - stats.activeCustomers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
