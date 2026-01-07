import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Users, Building2, Package, Zap } from 'lucide-react';
import { ar } from '../lib/ar';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalUnits: number;
  unitsAvailable: number;
  unitsSold: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  pendingPayments: number;
  overduePayments: number;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalUnits: 0,
    unitsAvailable: 0,
    unitsSold: 0,
    totalRevenue: 0,
    totalCosts: 0,
    totalProfit: 0,
    pendingPayments: 0,
    overduePayments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: projects } = await supabase
        .from('real_estate_projects')
        .select('id, status, total_budget');

      const { data: units } = await supabase
        .from('real_estate_units')
        .select('status, price');

      const { data: contracts } = await supabase
        .from('sales_contracts')
        .select('down_payment_amount, remaining_amount');

      const { data: installments } = await supabase
        .from('installment_plans')
        .select('amount, paid_amount, due_date, status');

      const { data: costs } = await supabase
        .from('project_costs')
        .select('actual_cost');

      const activeProj = projects?.filter(p => p.status === 'Active').length || 0;
      const availableUnits = units?.filter(u => u.status === 'Available').length || 0;
      const soldUnits = units?.filter(u => u.status === 'Sold').length || 0;

      const totalRev = (contracts?.reduce((sum, c) => sum + (c.down_payment_amount || 0), 0) || 0) +
                       (installments?.filter(i => i.paid_amount).reduce((sum, i) => sum + (i.paid_amount || 0), 0) || 0);
      const totalCost = costs?.reduce((sum, c) => sum + (c.actual_cost || 0), 0) || 0;

      const today = new Date().toISOString().split('T')[0];
      const pendingInst = installments?.filter(i => i.status === 'Pending').length || 0;
      const overdueInst = installments?.filter(i => i.status === 'Overdue' || (i.status === 'Pending' && i.due_date < today)).length || 0;

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects: activeProj,
        totalUnits: units?.length || 0,
        unitsAvailable: availableUnits,
        unitsSold: soldUnits,
        totalRevenue: totalRev,
        totalCosts: totalCost,
        totalProfit: totalRev - totalCost,
        pendingPayments: pendingInst,
        overduePayments: overdueInst,
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">{ar.messages.loading}</div>;

  const profitMargin = stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 text-right">{ar.dashboard.title}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 text-right">
          <div className="flex items-center justify-between">
            <Building2 className="w-8 h-8 text-blue-600 opacity-30" />
            <div>
              <p className="text-xs font-medium text-blue-600">{ar.dashboard.activeProjects}</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.activeProjects}</p>
              <p className="text-xs text-blue-600 mt-1">{ar.dashboard.of} {stats.totalProjects} {ar.dashboard.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200 text-right">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-green-600 opacity-30" />
            <div>
              <p className="text-xs font-medium text-green-600">{ar.dashboard.unitsSold}</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.unitsSold}</p>
              <p className="text-xs text-green-600 mt-1">{ar.dashboard.of} {stats.totalUnits} {ar.dashboard.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 text-right">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-blue-600 opacity-30" />
            <div>
              <p className="text-xs font-medium text-blue-600">{ar.dashboard.totalRevenue}</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">${(stats.totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-xs text-blue-600 mt-1">{ar.dashboard.collected}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200 text-right">
          <div className="flex items-center justify-between">
            <Package className="w-8 h-8 text-orange-600 opacity-30" />
            <div>
              <p className="text-xs font-medium text-orange-600">{ar.dashboard.totalCosts}</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">${(stats.totalCosts / 1000).toFixed(0)}K</p>
              <p className="text-xs text-orange-600 mt-1">{ar.dashboard.invested}</p>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${stats.totalProfit >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100'} p-6 rounded-lg border ${stats.totalProfit >= 0 ? 'border-green-200' : 'border-red-200'} text-right`}>
          <div className="flex items-center justify-between">
            <Zap className={`w-8 h-8 opacity-30 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div>
              <p className="text-xs font-medium text-gray-600">{ar.dashboard.grossProfit}</p>
              <p className={`text-2xl font-bold mt-1 ${stats.totalProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                ${(stats.totalProfit / 1000).toFixed(0)}K
              </p>
              <p className={`text-xs mt-1 ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ar.dashboard.margin}: {profitMargin}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-right">
          <h3 className="font-semibold text-gray-900 mb-4">{ar.dashboard.unitInventory}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-lg font-semibold text-green-600">{stats.unitsAvailable}</span>
              <span className="text-gray-700">{ar.dashboard.available}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="text-lg font-semibold text-yellow-600">{stats.totalUnits - stats.unitsAvailable - stats.unitsSold}</span>
              <span className="text-gray-700">{ar.dashboard.reserved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-600">{stats.unitsSold}</span>
              <span className="text-gray-700">{ar.dashboard.sold}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-right">
          <h3 className="font-semibold text-gray-900 mb-4">{ar.dashboard.paymentStatus}</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                {stats.pendingPayments}
              </span>
              <span className="text-gray-700">{ar.dashboard.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                {stats.overduePayments}
              </span>
              <span className="text-gray-700">{ar.dashboard.overdue}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-right">
          <h3 className="font-semibold text-gray-900 mb-4">{ar.dashboard.financialSummary}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="font-semibold">${stats.totalRevenue.toFixed(0)}</span>
              <span className="text-gray-600">{ar.dashboard.revenue}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">${stats.totalCosts.toFixed(0)}</span>
              <span className="text-gray-600">{ar.dashboard.costs}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
              <span className={`font-bold text-lg ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.totalProfit.toFixed(0)}
              </span>
              <span className="text-gray-900 font-medium">{ar.dashboard.netProfit}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
