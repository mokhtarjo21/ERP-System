import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, FileText } from 'lucide-react';
import {ar} from '../../../lib/ar';
interface Payroll {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_salary: number;
  status: string;
}

export function PayrollManagement() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    pay_period_start: '',
    pay_period_end: '',
    base_salary: '',
    bonuses: '',
    deductions: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, salary');
      if (empError) throw empError;
      setEmployees(empData || []);

      const { data: payData, error: payError } = await supabase
        .from('payroll')
        .select('*')
        .order('pay_period_start', { ascending: false });
      if (payError) throw payError;
      setPayrolls(payData || []);
    } catch (err) {
      console.error('Error loading payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateNetSalary = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const bonus = parseFloat(formData.bonuses) || 0;
    const deduct = parseFloat(formData.deductions) || 0;
    return base + bonus - deduct;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('payroll')
        .insert([{
          ...formData,
          base_salary: parseFloat(formData.base_salary),
          bonuses: parseFloat(formData.bonuses),
          deductions: parseFloat(formData.deductions),
          net_salary: calculateNetSalary(),
          status: 'Draft',
        }]);
      if (error) throw error;

      setFormData({
        employee_id: '',
        pay_period_start: '',
        pay_period_end: '',
        base_salary: '',
        bonuses: '',
        deductions: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving payroll:', err);
    }
  };

  if (loading) return <div className="text-center py-8">تحميل...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900"> {ar.hr.payrollManagement}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.hr.createPayroll}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <select
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{ar.hr.selectEmployee}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
          <div className="col-span-2 grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.pay_period_start}
              onChange={(e) => setFormData({ ...formData, pay_period_start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="date"
              value={formData.pay_period_end}
              onChange={(e) => setFormData({ ...formData, pay_period_end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <input
            type="number"
            placeholder={ar.hr.baseSalary}
            value={formData.base_salary}
            onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder={ar.hr.bonuses}
            value={formData.bonuses}
            onChange={(e) => setFormData({ ...formData, bonuses: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder={ar.hr.deductions}
            value={formData.deductions}
            onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg flex items-center">
            <span className="text-sm font-medium text-gray-700">{ar.hr.net}: ${calculateNetSalary().toFixed(2)}</span>
          </div>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              انشاء رصيد الراتب
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
              <th className="px-4 py-3 text-left font-semibold text-gray-700">الموظف</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.hr.Period}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">{ar.hr.Base}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">{ar.hr.Bonus}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">{ar.hr.Deductions}</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">{ar.hr.net}</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">{ar.hr.status}</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll) => {
              const emp = employees.find(e => e.id === payroll.employee_id);
              return (
                <tr key={payroll.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">{emp?.first_name} {emp?.last_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{payroll.pay_period_start} to {payroll.pay_period_end}</td>
                  <td className="px-4 py-3 text-right">${payroll.base_salary.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-green-600">${payroll.bonuses.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-red-600">${payroll.deductions.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-semibold">${payroll.net_salary.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      payroll.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {payroll.status}
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
