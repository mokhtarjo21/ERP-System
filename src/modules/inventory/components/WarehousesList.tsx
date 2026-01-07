import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ar } from '../../../lib/ar';
interface Warehouse {
  id: string;
  name: string;
  location: string;
  manager_name: string;
  contact_phone: string;
  status: string;
}

export function WarehousesList() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manager_name: '',
    contact_phone: '',
    capacity_tons: '',
    status: 'Active',
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const { data: warehouses, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      if (error) throw error;
      setWarehouses(warehouses || []);
    } catch (err) {
      console.error('Error loading warehouses:', err);
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
          .from('warehouses')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('warehouses')
          .insert([{ ...formData, company_id: company.id }]);
        if (error) throw error;
      }

      setFormData({
        name: '',
        location: '',
        manager_name: '',
        contact_phone: '',
        capacity_tons: '',
        status: 'Active',
      });
      setShowForm(false);
      setEditingId(null);
      loadWarehouses();
    } catch (err) {
      console.error('Error saving warehouse:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        const { error } = await supabase.from('warehouses').delete().eq('id', id);
        if (error) throw error;
        loadWarehouses();
      } catch (err) {
        console.error('Error deleting warehouse:', err);
      }
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      manager_name: warehouse.manager_name || '',
      contact_phone: warehouse.contact_phone || '',
      capacity_tons: '',
      status: warehouse.status,
    });
    setEditingId(warehouse.id);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{ar.inventory.warehouses}</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.inventory.addWarehouse}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={ar.inventory.warehouseName}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder={ar.inventory.location}
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder={ar.inventory.manager}
            value={formData.manager_name}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder={ar.inventory.contactperson}
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder={ar.inventory.capacity}
            value={formData.capacity_tons}
            onChange={(e) => setFormData({ ...formData, capacity_tons: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>{ar.inventory.active}</option>
            <option>{ar.inventory.inactive}</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? 'تعديل' : 'اضافة'} {ar.inventory.warehouse}
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.inventory.warehouseName}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.inventory.location}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.inventory.manager}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.inventory.contactperson}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.inventory.status}</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">{ar.inventory.actions}</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((warehouse) => (
              <tr key={warehouse.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{warehouse.name}</td>
                <td className="px-4 py-3 text-gray-600">{warehouse.location}</td>
                <td className="px-4 py-3 text-gray-600">{warehouse.manager_name}</td>
                <td className="px-4 py-3 text-gray-600">{warehouse.contact_phone}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    warehouse.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {warehouse.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button onClick={() => handleEdit(warehouse)} className="p-1 hover:bg-gray-200 rounded">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(warehouse.id)} className="p-1 hover:bg-gray-200 rounded">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
