import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, Edit2, Trash2} from 'lucide-react';
import {ar} from '../../../lib/ar';
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  status: string;
  joining_date: string;
}

export function EmployeesList() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
    status: 'Active',
    joining_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, position, department, salary, status, joining_date')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
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
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([{ name: 'Default Company', owner_id: user.id }])
          .select('id')
          .maybeSingle();
        if (companyError) throw companyError;
        company.data = newCompany;
      }

      if (editingId) {
        const { error } = await supabase
          .from('employees')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([{ ...formData, company_id: company.data?.id, salary: parseFloat(formData.salary) }]);
        if (error) throw error;
      }

      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        position: '',
        department: '',
        salary: '',
        status: 'Active',
        joining_date: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
      setEditingId(null);
      loadEmployees();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        loadEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const handleEdit = (emp: Employee) => {
    setFormData({
      first_name: emp.first_name,
      last_name: emp.last_name,
      email: emp.email || '',
      position: emp.position || '',
      department: emp.department || '',
      salary: emp.salary?.toString() || '',
      status: emp.status,
      joining_date: emp.joining_date,
    });
    setEditingId(emp.id);
    setShowForm(true);
  };

  if (loading) return <div className="text-center py-8"> {ar.hr.employees}...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{ar.hr.employees}</h3>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            if (!showForm) {
              setFormData({
                first_name: '',
                last_name: '',
                email: '',
                position: '',
                department: '',
                salary: '',
                status: 'Active',
                joining_date: new Date().toISOString().split('T')[0],
              });
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.hr.addEmployee}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="الاسم الأول"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="الاسم الأخير"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="email"
            placeholder={ar.email}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="المنصب"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="القسم"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="الراتب"
            value={formData.salary}
            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="الانضمام تاريخ"
            value={formData.joining_date}
            onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>نشط</option>
            <option>معلق</option>
            <option>استقال</option>
            <option>{ar.hr.Terminated}</option>
          </select>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {editingId ? 'Update' : 'Add'} {ar.hr.employee}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
            >
              الغاء
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">الاسم</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.email}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">المنصب</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">القسم</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">الحالة</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">اجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3">{emp.first_name} {emp.last_name}</td>
                <td className="px-4 py-3 text-gray-600">{emp.email}</td>
                <td className="px-4 py-3">{emp.position}</td>
                <td className="px-4 py-3">{emp.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    emp.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button onClick={() => handleEdit(emp)} className="p-1 hover:bg-gray-200 rounded">
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1 hover:bg-gray-200 rounded">
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
