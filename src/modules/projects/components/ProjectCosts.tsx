import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus } from 'lucide-react';

interface ProjectCost {
  id: string;
  project_id: string;
  cost_category: string;
  estimated_cost: number;
  actual_cost: number;
  status: string;
}

export function ProjectCosts() {
  const [costs, setCosts] = useState<ProjectCost[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    cost_category: '',
    cost_description: '',
    estimated_cost: '',
    actual_cost: '',
    status: 'Estimated',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: projects, error: projError } = await supabase
        .from('real_estate_projects')
        .select('id, project_name, project_code');
      if (projError) throw projError;
      setProjects(projects || []);

      const { data: costs, error: costError } = await supabase
        .from('project_costs')
        .select('*')
        .order('cost_category');
      if (costError) throw costError;
      setCosts(costs || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('project_costs')
        .insert([{
          ...formData,
          estimated_cost: parseFloat(formData.estimated_cost),
          actual_cost: parseFloat(formData.actual_cost),
        }]);
      if (error) throw error;

      setFormData({
        project_id: '',
        cost_category: '',
        cost_description: '',
        estimated_cost: '',
        actual_cost: '',
        status: 'Estimated',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving cost:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const totalEstimated = costs.reduce((sum, c) => sum + (c.estimated_cost || 0), 0);
  const totalActual = costs.reduce((sum, c) => sum + (c.actual_cost || 0), 0);
  const variance = totalActual - totalEstimated;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Project Costs</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Cost
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Estimated</p>
          <p className="text-2xl font-bold text-blue-900">${totalEstimated.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Actual</p>
          <p className="text-2xl font-bold text-green-900">${totalActual.toFixed(2)}</p>
        </div>
        <div className={`border p-4 rounded-lg ${variance > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-sm text-gray-600">Variance</p>
          <p className={`text-2xl font-bold ${variance > 0 ? 'text-red-900' : 'text-green-900'}`}>
            ${variance.toFixed(2)}
          </p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <select
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>{proj.project_name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Cost Category"
            value={formData.cost_category}
            onChange={(e) => setFormData({ ...formData, cost_category: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.cost_description}
            onChange={(e) => setFormData({ ...formData, cost_description: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
            rows={2}
          ></textarea>
          <input
            type="number"
            placeholder="Estimated Cost"
            value={formData.estimated_cost}
            onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Actual Cost"
            value={formData.actual_cost}
            onChange={(e) => setFormData({ ...formData, actual_cost: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Estimated</option>
            <option>Incurred</option>
            <option>Paid</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Cost
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Project</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Estimated</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Actual</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Variance</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((cost) => {
              const project = projects.find(p => p.id === cost.project_id);
              const costVariance = cost.actual_cost - cost.estimated_cost;
              return (
                <tr key={cost.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{project?.project_name}</td>
                  <td className="px-4 py-3">{cost.cost_category}</td>
                  <td className="px-4 py-3 text-right">${cost.estimated_cost?.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">${cost.actual_cost?.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${costVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${costVariance.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cost.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      cost.status === 'Incurred' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {cost.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
