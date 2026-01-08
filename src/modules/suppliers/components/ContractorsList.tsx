import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {ar} from '../../../lib/ar';
interface Contractor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  status: string;
}

export function ContractorsList() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    license_number: '',
    insurance_info: '',
    status: 'Active',
  });

  useEffect(() => {
    loadContractors();
  }, []);

  const loadContractors = async () => {
    try {
      const { data: contractors, error } = await supabase
        .from('contractors')
        .select('*')
        .order('name');
      if (error) throw error;
      setContractors(contractors || []);
    } catch (err) {
      console.error('Error loading contractors:', err);
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
          .from('contractors')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contractors')
          .insert([{ ...formData, company_id: company.id }]);
        if (error) throw error;
      }

      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        license_number: '',
        insurance_info: '',
        status: 'Active',
      });
      setShowForm(false);
      setEditingId(null);
      loadContractors();
    } catch (err) {
      console.error('Error saving contractor:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        const { error } = await supabase.from('contractors').delete().eq('id', id);
        if (error) throw error;
        loadContractors();
      } catch (err) {
        console.error('Error deleting contractor:', err);
      }
    }
  };

  const handleEdit = (contractor: Contractor) => {
    setFormData({
      name: contractor.name,
      contact_person: contractor.contact_person || '',
      email: contractor.email || '',
      phone: contractor.phone || '',
      address: '',
      license_number: '',
      insurance_info: '',
      status: contractor.status,
    });
    setEditingId(contractor.id);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8">{ar.loading}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{ar.suppliers.contractors}</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.suppliers.addContractor}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={ar.suppliers.contractorName}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder={ar.suppliers.licenseNumber}
            value={formData.license_number}
            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder={ar.suppliers.contact}
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
            placeholder={ar.suppliers.insuranceInfo}
            value={formData.insurance_info}
            onChange={(e) => setFormData({ ...formData, insurance_info: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>{ar.suppliers.active}</option>
            <option>{ar.suppliers.inactive}</option>
            <option>{ar.suppliers.blacklisted}</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? ar.suppliers.editcontractor : ar.suppliers.addContractor} 
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
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.suppliers.contractorName}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.suppliers.licenseNumber}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.suppliers.contact}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.email}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.phone}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.status}</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">{ar.customers.actions}</th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((contractor) => (
              <tr key={contractor.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{contractor.name}</td>
                <td className="px-4 py-3 text-gray-600">-</td>
                <td className="px-4 py-3 text-gray-600">{contractor.contact_person}</td>
                <td className="px-4 py-3 text-gray-600">{contractor.email}</td>
                <td className="px-4 py-3 text-gray-600">{contractor.phone}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    contractor.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {contractor.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button onClick={() => handleEdit(contractor)} className="p-1 hover:bg-gray-200 rounded">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(contractor.id)} className="p-1 hover:bg-gray-200 rounded">
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
