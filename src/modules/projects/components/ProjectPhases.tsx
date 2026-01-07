import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus } from 'lucide-react';

interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: string;
  phase_number: number;
  budget: number;
  status: string;
  start_date: string;
}

export function ProjectPhases() {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    project_id: '',
    phase_name: '',
    phase_number: '',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'Planned',
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

      const { data: phases, error: phaseError } = await supabase
        .from('project_phases')
        .select('*')
        .order('phase_number');
      if (phaseError) throw phaseError;
      setPhases(phases || []);
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
        .from('project_phases')
        .insert([{
          ...formData,
          phase_number: parseInt(formData.phase_number),
          budget: parseFloat(formData.budget),
        }]);
      if (error) throw error;

      setFormData({
        project_id: '',
        phase_name: '',
        phase_number: '',
        start_date: '',
        end_date: '',
        budget: '',
        status: 'Planned',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving phase:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Project Phases</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Phase
        </button>
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
            placeholder="Phase Name"
            value={formData.phase_name}
            onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Phase Number"
            value={formData.phase_number}
            onChange={(e) => setFormData({ ...formData, phase_number: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Budget"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Phase
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
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Phase</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Budget</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {phases.map((phase) => {
              const project = projects.find(p => p.id === phase.project_id);
              return (
                <tr key={phase.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{project?.project_name}</td>
                  <td className="px-4 py-3">{phase.phase_name}</td>
                  <td className="px-4 py-3 text-right">${phase.budget?.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      phase.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      phase.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {phase.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {phase.start_date ? `${phase.start_date} to ${phase.end_date || 'TBD'}` : 'Not scheduled'}
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
