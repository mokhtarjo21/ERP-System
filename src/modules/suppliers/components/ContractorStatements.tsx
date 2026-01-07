import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, DollarSign } from 'lucide-react';

interface Statement {
  id: string;
  contractor_id: string;
  contract_id: string;
  statement_date: string;
  progress_percentage: number;
  amount_claimed: number;
  amount_paid: number;
  status: string;
}

export function ContractorStatements() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    contractor_id: '',
    contract_id: '',
    statement_date: new Date().toISOString().split('T')[0],
    progress_percentage: '',
    amount_claimed: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: contractors, error: contrError } = await supabase
        .from('contractors')
        .select('id, name');
      if (contrError) throw contrError;
      setContractors(contractors || []);

      const { data: contracts, error: conError } = await supabase
        .from('contractor_contracts')
        .select('id, contract_number, contract_amount, contractor_id');
      if (conError) throw conError;
      setContracts(contracts || []);

      const { data: statements, error: stError } = await supabase
        .from('contractor_statements')
        .select('*')
        .order('statement_date', { ascending: false });
      if (stError) throw stError;
      setStatements(statements || []);
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
        .from('contractor_statements')
        .insert([{
          ...formData,
          progress_percentage: parseInt(formData.progress_percentage),
          amount_claimed: parseFloat(formData.amount_claimed),
        }]);
      if (error) throw error;

      setFormData({
        contractor_id: '',
        contract_id: '',
        statement_date: new Date().toISOString().split('T')[0],
        progress_percentage: '',
        amount_claimed: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving statement:', err);
    }
  };

  const handlePayment = async (statementId: string, claimedAmount: number, paidAmount: number) => {
    const outstanding = claimedAmount - paidAmount;
    const paymentAmount = prompt(`Outstanding: $${outstanding.toFixed(2)}\nEnter payment amount:`, outstanding.toString());
    if (!paymentAmount) return;

    try {
      const { data: statement } = await supabase
        .from('contractor_statements')
        .select('amount_paid')
        .eq('id', statementId)
        .maybeSingle();

      const newPaidAmount = (statement?.amount_paid || 0) + parseFloat(paymentAmount);
      const newStatus = newPaidAmount >= claimedAmount ? 'Paid' : 'Partial Payment';

      const { error } = await supabase
        .from('contractor_statements')
        .update({
          amount_paid: newPaidAmount,
          status: newStatus,
        })
        .eq('id', statementId);

      if (error) throw error;
      loadData();
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const filteredContracts = formData.contractor_id
    ? contracts.filter(c => c.contractor_id === formData.contractor_id)
    : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Contractor Statements</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Statement
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <select
            value={formData.contractor_id}
            onChange={(e) => setFormData({ ...formData, contractor_id: e.target.value, contract_id: '' })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Contractor</option>
            {contractors.map((cont) => (
              <option key={cont.id} value={cont.id}>{cont.name}</option>
            ))}
          </select>
          <select
            value={formData.contract_id}
            onChange={(e) => setFormData({ ...formData, contract_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Contract</option>
            {filteredContracts.map((con) => (
              <option key={con.id} value={con.id}>{con.contract_number}</option>
            ))}
          </select>
          <input
            type="date"
            value={formData.statement_date}
            onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Progress %"
            value={formData.progress_percentage}
            onChange={(e) => setFormData({ ...formData, progress_percentage: e.target.value })}
            min="0"
            max="100"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Amount Claimed"
            value={formData.amount_claimed}
            onChange={(e) => setFormData({ ...formData, amount_claimed: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
            required
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Statement
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
        {statements.map((statement) => {
          const contractor = contractors.find(c => c.id === statement.contractor_id);
          const contract = contracts.find(con => con.id === statement.contract_id);
          const outstanding = statement.amount_claimed - statement.amount_paid;
          const paidPercent = statement.amount_claimed > 0
            ? Math.round((statement.amount_paid / statement.amount_claimed) * 100)
            : 0;

          return (
            <div key={statement.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{contractor?.name}</h4>
                  <p className="text-sm text-gray-600">Contract: {contract?.contract_number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statement.status === 'Paid' ? 'bg-green-100 text-green-800' :
                  statement.status === 'Partial Payment' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {statement.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Progress</p>
                  <p className="text-lg font-semibold">{statement.progress_percentage}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Amount Claimed</p>
                  <p className="text-lg font-semibold">${statement.amount_claimed.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Amount Paid</p>
                  <p className="text-lg font-semibold text-green-600">${statement.amount_paid.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Outstanding</p>
                  <p className="text-lg font-semibold text-red-600">${outstanding.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Date</p>
                  <p className="text-sm font-semibold">{statement.statement_date}</p>
                </div>
              </div>

              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${paidPercent}%` }}
                  ></div>
                </div>
              </div>

              {outstanding > 0 && (
                <button
                  onClick={() => handlePayment(statement.id, statement.amount_claimed, statement.amount_paid)}
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
