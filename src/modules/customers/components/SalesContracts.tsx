import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, FileText, DollarSign } from 'lucide-react';
import { ar } from '../../../lib/ar';

interface Contract {
  id: string;
  contract_number: string;
  customer_id: string;
  unit_id: string;
  unit_price: number;
  down_payment_amount: number;
  remaining_amount: number;
  contract_status: string;
  contract_date: string;
}

export function SalesContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    unit_id: '',
    contract_number: '',
    contract_date: new Date().toISOString().split('T')[0],
    down_payment_percent: '20',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: contracts, error: conError } = await supabase
        .from('sales_contracts')
        .select('*')
        .order('contract_date', { ascending: false });
      if (conError) throw conError;
      setContracts(contracts || []);

      const { data: customers, error: custError } = await supabase
        .from('customers')
        .select('id, name');
      if (custError) throw custError;
      setCustomers(customers || []);

      const { data: units, error: unitError } = await supabase
        .from('real_estate_units')
        .select('id, unit_code, unit_name, price, status');
      if (unitError) throw unitError;
      setUnits(units || []);
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

      const selectedUnit = units.find(u => u.id === formData.unit_id);
      const downPaymentPercent = parseFloat(formData.down_payment_percent);
      const downPaymentAmount = selectedUnit.price * (downPaymentPercent / 100);
      const remainingAmount = selectedUnit.price - downPaymentAmount;

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

      const { error } = await supabase
        .from('sales_contracts')
        .insert([{
          company_id: company.data?.id,
          ...formData,
          unit_price: selectedUnit.price,
          down_payment_amount: downPaymentAmount,
          remaining_amount: remainingAmount,
          contract_status: 'Active',
        }]);
      if (error) throw error;

      await supabase
        .from('real_estate_units')
        .update({ status: 'Reserved' })
        .eq('id', formData.unit_id);

      setFormData({
        customer_id: '',
        unit_id: '',
        contract_number: '',
        contract_date: new Date().toISOString().split('T')[0],
        down_payment_percent: '20',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) return <div className="text-center py-8">{ar.messages.loading}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 text-right flex-1">{ar.contracts.title}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          {ar.contracts.newContract}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={ar.contracts.contractNumber}
            value={formData.contract_number}
            onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="date"
            value={formData.contract_date}
            onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{ar.contracts.selectCustomer}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={formData.unit_id}
            onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">{ar.contracts.selectUnit}</option>
            {units.filter(u => u.status === 'Available').map((u) => (
              <option key={u.id} value={u.id}>{u.unit_name} - ${u.price}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder={ar.contracts.downPaymentPercent}
            value={formData.down_payment_percent}
            onChange={(e) => setFormData({ ...formData, down_payment_percent: e.target.value })}
            min="0"
            max="100"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {ar.contracts.createContract}
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

      <div className="space-y-4">
        {contracts.map((contract) => {
          const customer = customers.find(c => c.id === contract.customer_id);
          const unit = units.find(u => u.id === contract.unit_id);
          const collectionPercent = contract.unit_price > 0
            ? Math.round((contract.down_payment_amount / contract.unit_price) * 100)
            : 0;

          return (
            <div key={contract.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    {contract.contract_number}
                  </h4>
                  <p className="text-sm text-gray-600">{customer?.name} - {unit?.unit_name}</p>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${
                  contract.contract_status === 'Active' ? 'bg-green-100 text-green-800' :
                  contract.contract_status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contract.contract_status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-right">
                <div>
                  <p className="text-xs text-gray-600">{ar.contracts.unitPrice}</p>
                  <p className="text-lg font-semibold">${contract.unit_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{ar.contracts.downPayment}</p>
                  <p className="text-lg font-semibold text-green-600">${contract.down_payment_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{ar.contracts.remaining}</p>
                  <p className="text-lg font-semibold text-orange-600">${contract.remaining_amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{ar.contracts.collection}</p>
                  <p className="text-lg font-semibold">{collectionPercent}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${collectionPercent}%` }}
                ></div>
              </div>

              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {ar.contracts.viewInstallments}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
