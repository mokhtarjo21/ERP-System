import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2, Home } from 'lucide-react';
import { ar } from '../../../lib/ar';

interface Unit {
  id: string;
  unit_code: string;
  unit_name: string;
  unit_type: string;
  price: number;
  status: string;
  area_sqm: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  project_id: string;
}

export function RealEstateUnits() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    unit_code: '',
    unit_name: '',
    unit_type: 'Apartment',
    price: '',
    area_sqm: '',
    bedrooms: '',
    bathrooms: '',
    location: '',
    project_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: units, error: unitError } = await supabase
        .from('real_estate_units')
        .select('*')
        .order('unit_code');
      if (unitError) throw unitError;
      setUnits(units || []);

      const { data: projects, error: projError } = await supabase
        .from('real_estate_projects')
        .select('id, project_name, project_code');
      if (projError) throw projError;
      setProjects(projects || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let company = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!company.data) {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert([{ name: 'Default Company', owner_id: user.id }])
          .select('id')
          .maybeSingle();
        company.data = newCompany;
      }

      if (editingId) {
        const { error } = await supabase
          .from('real_estate_units')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('real_estate_units')
          .insert([{
            ...formData,
            company_id: company.data?.id,
            price: parseFloat(formData.price),
            area_sqm: parseFloat(formData.area_sqm),
            bedrooms: parseInt(formData.bedrooms),
            bathrooms: parseInt(formData.bathrooms),
          }]);
        if (error) throw error;
      }

      setFormData({
        unit_code: '',
        unit_name: '',
        unit_type: 'Apartment',
        price: '',
        area_sqm: '',
        bedrooms: '',
        bathrooms: '',
        location: '',
        project_id: '',
      });
      setShowForm(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(ar.messages.confirmDelete)) {
      try {
        const { error } = await supabase.from('real_estate_units').delete().eq('id', id);
        if (error) throw error;
        loadData();
      } catch (err) {
        console.error('Error:', err);
      }
    }
  };

  if (loading) return <div className="text-center py-8">{ar.messages.loading}</div>;

  const statusMap: { [key: string]: string } = {
    Available: ar.units.available,
    Reserved: ar.units.reserved,
    Sold: ar.units.sold,
  };

  const statusColors: { [key: string]: string } = {
    Available: 'bg-green-100 text-green-800',
    Reserved: 'bg-yellow-100 text-yellow-800',
    Sold: 'bg-blue-100 text-blue-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 text-right flex-1">{ar.units.title}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.units.addUnit}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={ar.units.unitCode}
            value={formData.unit_code}
            onChange={(e) => setFormData({ ...formData, unit_code: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder={ar.units.unitName}
            value={formData.unit_name}
            onChange={(e) => setFormData({ ...formData, unit_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={formData.unit_type}
            onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>{ar.units.apartment}</option>
            <option>{ar.units.villa}</option>
            <option>{ar.units.land}</option>
          </select>
          <input
            type="number"
            placeholder={ar.units.price}
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder={ar.units.area}
            value={formData.area_sqm}
            onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder={ar.units.bedrooms}
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder={ar.units.bathrooms}
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder={ar.units.location}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.project_id}
            onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{ar.units.selectProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {ar.units.saveUnit}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg"
            >
              {ar.units.cancel}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((unit) => (
          <div key={unit.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start gap-2">
                <Home className="w-5 h-5 text-blue-600 mt-1" />
                <div className="text-right flex-1">
                  <h4 className="font-semibold text-gray-900">{unit.unit_name}</h4>
                  <p className="text-xs text-gray-600">{unit.unit_code}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[unit.status] || 'bg-gray-100'}`}>
                {statusMap[unit.status] || unit.status}
              </span>
            </div>

            <div className="space-y-1 mb-4 text-sm text-right">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">${unit.price.toLocaleString()}</span>
                <span className="text-gray-600">{unit.unit_type}</span>
              </div>
              {unit.area_sqm && (
                <div className="text-gray-600">{unit.bedrooms}BR · {unit.bathrooms}BA · {unit.area_sqm} {ar.units.sqm}</div>
              )}
              {unit.location && (
                <div className="text-gray-600">{unit.location}</div>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button className="flex-1 px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                {ar.units.view}
              </button>
              <button className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded" onClick={() => setEditingId(unit.id)}>
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="px-2 py-1 text-sm text-red-700 hover:bg-red-50 rounded" onClick={() => handleDelete(unit.id)}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
