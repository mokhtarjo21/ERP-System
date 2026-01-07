import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { ar } from '../../../lib/ar';

interface Installment {
  id: string;
  contract_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: string;
}

export function CustomerPayments() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contract_id: '',
    installment_number: '',
    due_date: '',
    amount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: installments, error: instError } = await supabase
        .from('installment_plans')
        .select('*')
        .order('due_date');
      if (instError) throw instError;
      setInstallments(installments || []);

      const { data: contracts, error: conError } = await supabase
        .from('sales_contracts')
        .select('id, contract_number, customer_id, unit_id, remaining_amount');
      if (conError) throw conError;
      setContracts(contracts || []);

      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, name');
      if (custError) throw custError;
      setCustomers(customers || []);
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
        .from('installment_plans')
        .insert([{
          ...formData,
          installment_number: parseInt(formData.installment_number),
          amount: parseFloat(formData.amount),
          status: 'Pending',
        }]);
      if (error) throw error;

      setFormData({
        contract_id: '',
        installment_number: '',
        due_date: '',
        amount: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const recordPayment = async (installmentId: string, amount: number) => {
    const paymentAmount = prompt(`Record payment (Max: $${amount.toFixed(2)}):`, amount.toString());
    if (!paymentAmount) return;

    try {
      await supabase
        .from('unit_payments')
        .insert([{
          installment_id: installmentId,
          payment_date: new Date().toISOString().split('T')[0],
          amount: parseFloat(paymentAmount),
          payment_method: 'Bank Transfer',
        }]);

      const inst = installments.find(i => i.id === installmentId);
      const newPaidAmount = (inst?.paid_amount || 0) + parseFloat(paymentAmount);
      const newStatus = newPaidAmount >= amount ? 'Paid' : 'Pending';

      await supabase
        .from('installment_plans')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
        })
        .eq('id', installmentId);

      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) return <div className="text-center py-8">{ar.messages.loading}</div>;

  const today = new Date().toISOString().split('T')[0];
  const overdueInstallments = installments.filter(i => i.status === 'Pending' && i.due_date < today);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 text-right flex-1">{ar.payments.title}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.payments.newInstallment}
        </button>
      </div>

      {overdueInstallments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-right">
            <p className="font-semibold text-red-900">{ar.payments.overduAlert}</p>
            <p className="text-sm text-red-700">{overdueInstallments.length} {ar.payments.overdueInstallments}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <select
            value={formData.contract_id}
            onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">اختر العقد</option>
            {contracts.map((c) => {
              const customer = customers.find(cu => cu.id === c.customer_id);
              return (
                <option key={c.id} value={c.id}>
                  {c.contract_number} - {customer?.name}
                </option>
              );
            })}
          </select>
          <input
            type="number"
            placeholder={ar.payments.installmentNum}
            value={formData.installment_number}
            onChange={(e) => setFormData({ ...formData, installment_number: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder={ar.payments.amount}
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {ar.payments.createInstallment}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg"
            >
              {ar.actions.cancel}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {installments.map((inst) => {
          const contract = contracts.find(c => c.id === inst.contract_id);
          const customer = customers.find(c => c.id === contract?.customer_id);
          const outstanding = inst.amount - inst.paid_amount;
          const paidPercent = inst.amount > 0 ? Math.round((inst.paid_amount / inst.amount) * 100) : 0;
          const isOverdue = inst.status === 'Pending' && inst.due_date < today;

          return (
            <div key={inst.id} className={`border rounded-lg p-4 ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="text-right flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {customer?.name} - {ar.payments.installmentNum} #{inst.installment_number}
                  </h4>
                  <p className="text-sm text-gray-600">{contract?.contract_number}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-1 ${
                  inst.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  isOverdue ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {inst.status === 'Paid' && <CheckCircle className="w-4 h-4" />}
                  {inst.status === 'Paid' ? ar.payments.paid : isOverdue ? ar.payments.overdue : ar.payments.pending}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3 text-right">
                <div>
                  <p className="text-xs text-gray-600">{ar.contracts.dueDate}</p>
                  <p className="font-semibold">{inst.due_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{ar.payments.amount}</p>
                  <p className="font-semibold">${inst.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{ar.payments.outstanding}</p>
                  <p className="font-semibold text-orange-600">${outstanding.toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${paidPercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">{paidPercent}% {ar.payments.paid}</p>
              </div>

              {outstanding > 0 && inst.status !== 'Paid' && (
                <button
                  onClick={() => recordPayment(inst.id, outstanding)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {ar.payments.recordPayment}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
