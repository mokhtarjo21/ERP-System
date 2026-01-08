import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ar } from '../../../lib/ar';
interface Project {
  id: string;
  project_code: string;
  project_name: string;
  location: string;
  status: string;
  start_date: string;
  expected_completion_date: string;
  total_budget: number;
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    description: '',
    location: '',
    project_type: '',
    status: 'Planning',
    start_date: '',
    expected_completion_date: '',
    total_budget: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: projects, error } = await supabase
        .from('real_estate_projects')
        .select('*')
        .order('project_name');
      if (error) throw error;
      setProjects(projects || []);
    } catch (err) {
      console.error('Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!company) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert([{ name: 'Default Company', owner_id: user.id }])
          .select('id')
          .maybeSingle();
        company = newCompany;
      }

      if (editingId) {
        const { error } = await supabase
          .from('real_estate_projects')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('real_estate_projects')
          .insert([{
            ...formData,
            company_id: company.id,
            total_budget: parseFloat(formData.total_budget),
          }]);
        if (error) throw error;
      }

      setFormData({
        project_code: '',
        project_name: '',
        description: '',
        location: '',
        project_type: '',
        status: 'Planning',
        start_date: '',
        expected_completion_date: '',
        total_budget: '',
      });
      setShowForm(false);
      setEditingId(null);
      loadProjects();
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        const { error } = await supabase.from('real_estate_projects').delete().eq('id', id);
        if (error) throw error;
        loadProjects();
      } catch (err) {
        console.error('Error deleting project:', err);
      }
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      project_code: project.project_code,
      project_name: project.project_name,
      description: '',
      location: project.location,
      project_type: '',
      status: project.status,
      start_date: project.start_date || '',
      expected_completion_date: project.expected_completion_date || '',
      total_budget: project.total_budget?.toString() || '',
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{ar.projects.RealEstateProjects}</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.projects.newProject}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={ar.projects.projectCode}
            value={formData.project_code}
            onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder={ar.projects.projectName}
            value={formData.project_name}
            onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder={ar.projects.location}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder={ar.projects.projectType}
            value={formData.project_type}
            onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
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
            value={formData.expected_completion_date}
            onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder={ar.projects.totalBudget}
            value={formData.total_budget}
            onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value='Planning'>{ar.projects.planning}</option>
            <option value='Active'>{ar.projects.active}</option>
            <option value='OnHold'>{ar.projects.onHold}</option>
            <option value='Completed'>{ar.projects.completed}</option>
            <option value='Cancelled'>{ar.projects.cancelled}</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? ar.projects.update : ar.projects.createProject}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              {ar.Cancel}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{project.project_name}</h4>
                <p className="text-sm text-gray-600">{project.project_code}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                project.status === 'Planning' ? 'bg-gray-100 text-gray-800' :
                project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {project.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600"><span className="font-medium">{ar.projects.location}:</span> {project.location}</p>
              <p className="text-sm text-gray-600"><span className="font-medium">{ar.projects.budget}:</span> ${project.total_budget?.toFixed(2)}</p>
              {project.start_date && (
                <p className="text-sm text-gray-600"><span className="font-medium">{ar.projects.startDate}:</span> {project.start_date}</p>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleEdit(project)} className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center justify-center gap-1">
                <Edit2 className="w-4 h-4" />
                {ar.edit}
              </button>
              <button onClick={() => handleDelete(project.id)} className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center justify-center gap-1">
                <Trash2 className="w-4 h-4" />
                {ar.delete}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
