import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Building2, TrendingUp } from 'lucide-react';
import { ar } from '../../../lib/ar';
export function ProjectsReports() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: projects, error: projError } = await supabase
        .from('real_estate_projects')
        .select('status, total_budget');
      if (projError) throw projError;

      const { data: costs, error: costError } = await supabase
        .from('project_costs')
        .select('actual_cost');
      if (costError) throw costError;

      const activeCount = projects?.filter(p => p.status === 'Active').length || 0;
      const completedCount = projects?.filter(p => p.status === 'Completed').length || 0;
      const totalBud = projects?.reduce((sum, p) => sum + (p.total_budget || 0), 0) || 0;
      const totalSpend = costs?.reduce((sum, c) => sum + (c.actual_cost || 0), 0) || 0;

      setStats({
        totalProjects: projects?.length || 0,
        activeProjects: activeCount,
        completedProjects: completedCount,
        totalBudget: totalBud,
        totalSpent: totalSpend,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  const budgetUtilization = stats.totalBudget > 0 ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0;
  const remaining = stats.totalBudget - stats.totalSpent;

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">{ar.projects.ProjectReportsAnalytics}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.projects.totalproject}</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalProjects}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.projects.totalBudget}</p>
              <p className="text-3xl font-bold text-green-900">${stats.totalBudget.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{ar.projects.budgetUtilization}</p>
              <p className="text-3xl font-bold text-purple-900">{budgetUtilization}%</p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">{ar.projects.status}</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{ar.projects.activeProjects}</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: stats.totalProjects ? `${(stats.activeProjects / stats.totalProjects) * 100}%` : '0%' }}
                  ></div>
                </div>
                <span className="font-semibold">{stats.activeProjects}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{ar.projects.completedProjects}</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: stats.totalProjects ? `${(stats.completedProjects / stats.totalProjects) * 100}%` : '0%' }}
                  ></div>
                </div>
                <span className="font-semibold">{stats.completedProjects}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">{ar.projects.summaryproject}</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-700">{ar.projects.totalBudget}</span>
              <span className="font-semibold text-lg">${stats.totalBudget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-700">{ar.projects.AmountSpent}</span>
              <span className="font-semibold text-lg text-orange-600">${stats.totalSpent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">{ar.projects.Remaining}</span>
              <span className={`font-semibold text-lg ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${remaining.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
