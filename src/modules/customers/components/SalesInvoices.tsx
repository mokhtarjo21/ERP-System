import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, DollarSign } from 'lucide-react';

interface SalesInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  amount: number;
  paid_amount: number;
  status: string;
}

export function SalesInvoices() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, name');
      if (custError) throw custError;
      setCustomers(customers || []);

      const { data: invoices, error: invError } = await supabase
        .from('sales_invoices')
        .select('*')
        .order('invoice_date', { ascending: false });
      if (invError) throw invError;
      setInvoices(invoices || []);
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

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('sales_invoices')
        .insert([{
          ...formData,
          company_id: company?.id,
          amount: parseFloat(formData.amount),
        }]);
      if (error) throw error;

      setFormData({
        customer_id: '',
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        amount: '',
        description: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving invoice:', err);
    }
  };

  const handlePayment = async (invoiceId: string, invoiceAmount: number) => {
    const paymentAmount = prompt('Enter payment amount:', invoiceAmount.toString());
    if (!paymentAmount) return;

    try {
      const { error } = await supabase
        .from('customer_payments')
        .insert([{
          invoice_id: invoiceId,
          payment_date: new Date().toISOString().split('T')[0],
          payment_amount: parseFloat(paymentAmount),
        }]);
      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const getPaidPercentage = (paid: number, total: number) => {
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Sales Invoices</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Invoice
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <select
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Customer</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.id}>{cust.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Invoice Number"
            value={formData.invoice_number}
            onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            value={formData.invoice_date}
            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            placeholder="Due Date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
            rows={2}
          ></textarea>
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Invoice
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

      <div className="space-y-4">
        {invoices.map((invoice) => {
          const customer = customers.find(c => c.id === invoice.customer_id);
          const outstanding = invoice.amount - invoice.paid_amount;
          const paidPercent = getPaidPercentage(invoice.paid_amount, invoice.amount);

          return (
            <div key={invoice.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{customer?.name}</h4>
                  <p className="text-sm text-gray-600">Invoice: {invoice.invoice_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  invoice.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {invoice.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Total Amount</p>
                  <p className="text-lg font-semibold">${invoice.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="text-lg font-semibold text-green-600">${invoice.paid_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Outstanding</p>
                  <p className="text-lg font-semibold text-red-600">${outstanding.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Progress</p>
                  <p className="text-lg font-semibold">{paidPercent}%</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${paidPercent}%` }}
                  ></div>
                </div>
              </div>

              {outstanding > 0 && (
                <button
                  onClick={() => handlePayment(invoice.id, outstanding)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
