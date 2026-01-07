import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Plus, ArrowUp, ArrowDown } from 'lucide-react';

interface InventoryItem {
  id: string;
  warehouse_id: string;
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  reorder_level: number;
}

export function InventoryItems() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    warehouse_id: '',
    item_code: '',
    item_name: '',
    item_type: '',
    quantity: '',
    unit: '',
    unit_cost: '',
    reorder_level: '',
  });
  const [movementData, setMovementData] = useState({
    movement_type: 'In',
    quantity: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: warehouses, error: whError } = await supabase
        .from('warehouses')
        .select('id, name');
      if (whError) throw whError;
      setWarehouses(warehouses || []);

      const { data: items, error: itemError } = await supabase
        .from('inventory_items')
        .select('*')
        .order('item_name');
      if (itemError) throw itemError;
      setItems(items || []);
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
        .from('inventory_items')
        .insert([{
          ...formData,
          quantity: parseInt(formData.quantity),
          unit_cost: parseFloat(formData.unit_cost),
          reorder_level: parseInt(formData.reorder_level),
        }]);
      if (error) throw error;

      setFormData({
        warehouse_id: '',
        item_code: '',
        item_name: '',
        item_type: '',
        quantity: '',
        unit: '',
        unit_cost: '',
        reorder_level: '',
      });
      setShowForm(false);
      loadData();
    } catch (err) {
      console.error('Error saving item:', err);
    }
  };

  const handleMovement = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('stock_movements')
        .insert([{
          inventory_item_id: itemId,
          movement_date: new Date().toISOString().split('T')[0],
          movement_type: movementData.movement_type,
          quantity: parseInt(movementData.quantity),
          reason: movementData.reason,
        }]);
      if (error) throw error;

      const item = items.find(i => i.id === itemId);
      if (item) {
        const quantityChange = movementData.movement_type === 'In'
          ? parseInt(movementData.quantity)
          : -parseInt(movementData.quantity);

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update({ quantity: item.quantity + quantityChange })
          .eq('id', itemId);
        if (updateError) throw updateError;
      }

      setMovementData({ movement_type: 'In', quantity: '', reason: '' });
      setShowMovement(null);
      loadData();
    } catch (err) {
      console.error('Error recording movement:', err);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Inventory Items</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <select
            value={formData.warehouse_id}
            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Item Code"
            value={formData.item_code}
            onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Item Name"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Item Type"
            value={formData.item_type}
            onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Unit (pcs, kg, liters, etc)"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="number"
            placeholder="Unit Cost"
            value={formData.unit_cost}
            onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Reorder Level"
            value={formData.reorder_level}
            onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Add Item
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Item Name</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Quantity</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Reorder Level</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.item_code}</td>
                <td className="px-4 py-3">{item.item_name}</td>
                <td className="px-4 py-3 text-right font-semibold">{item.quantity}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3 text-right">
                  <span className={item.quantity <= item.reorder_level ? 'text-red-600 font-semibold' : ''}>
                    {item.reorder_level}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setShowMovement(showMovement === item.id ? null : item.id)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    Movement
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showMovement && (
        <div className="mt-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Record Stock Movement</h4>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={movementData.movement_type}
              onChange={(e) => setMovementData({ ...movementData, movement_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>In</option>
              <option>Out</option>
              <option>Adjustment</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={movementData.quantity}
              onChange={(e) => setMovementData({ ...movementData, quantity: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Reason"
              value={movementData.reason}
              onChange={(e) => setMovementData({ ...movementData, reason: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
              rows={2}
            ></textarea>
            <div className="col-span-2 flex gap-2">
              <button
                onClick={() => handleMovement(showMovement)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {movementData.movement_type === 'In' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                Record Movement
              </button>
              <button
                onClick={() => setShowMovement(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
