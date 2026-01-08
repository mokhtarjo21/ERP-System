import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { ar } from '../../../lib/ar';
interface Supplier {
  id: string;
  name: string;
  classification: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
}

export function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    classification: 'Materials',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    tax_id: '',
    status: 'Active',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (error) throw error;
      setSuppliers(suppliers || []);
    } catch (err) {
      console.error('Error loading suppliers:', err);
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
          .from('suppliers')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([{ ...formData, company_id: company.id }]);
        if (error) throw error;
      }

      setFormData({
        name: '',
        classification: 'Materials',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        tax_id: '',
        status: 'Active',
      });
      setShowForm(false);
      setEditingId(null);
      loadSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
        loadSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
      }
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      classification: supplier.classification,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: '',
      tax_id: '',
      status: supplier.status,
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{ar.suppliers.title}</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            if (!showForm) {
              setFormData({
                name: '',
                classification: 'Materials',
                contact_person: '',
                email: '',
                phone: '',
                address: '',
                tax_id: '',
                status: 'Active',
              });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.suppliers.addSupplier}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={ar.suppliers.supplierName}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={formData.classification}
            onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>{ar.suppliers.Materials}</option>
            <option>{ar.suppliers.Services}</option>
          </select>
          <input
            type="text"
            placeholder={ar.suppliers.contactPerson}
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            placeholder={ar.email}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="tel"
            placeholder={ar.phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder={ar.suppliers.taxId}
            value={formData.tax_id}
            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>{ar.suppliers.active}</option>
            <option>{ar.suppliers.inactive}</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? ar.suppliers.editesupplier : ar.suppliers.addSupplier} 
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
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.suppliers.supplierName}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.suppliers.Classification}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.suppliers.contact}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.email}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.status}</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">{ar.customers.actions}</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{supplier.name}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {supplier.classification}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{supplier.contact_person}</td>
                <td className="px-4 py-3 text-gray-600">{supplier.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button onClick={() => handleEdit(supplier)} className="p-1 hover:bg-gray-200 rounded">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(supplier.id)} className="p-1 hover:bg-gray-200 rounded">
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
