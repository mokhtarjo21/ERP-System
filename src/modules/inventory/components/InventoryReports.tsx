import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { AlertCircle, Package } from 'lucide-react';

export function InventoryReports() {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalQuantity: 0,
    lowStockItems: 0,
    totalValue: 0,
  });
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: items, error: itemError } = await supabase
        .from('inventory_items')
        .select('quantity, unit_cost, reorder_level');
      if (itemError) throw itemError;

      const { data: lowStock, error: lowError } = await supabase
        .from('inventory_items')
        .select('id, item_code, item_name, quantity, reorder_level, unit')
        .lte('quantity', { value: 'reorder_level' });
      if (lowError) throw lowError;

      const totalQty = items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
      const totalVal = items?.reduce((sum, i) => sum + ((i.quantity || 0) * (i.unit_cost || 0)), 0) || 0;
      const lowCount = lowStock?.length || 0;

      setStats({
        totalItems: items?.length || 0,
        totalQuantity: totalQty,
        lowStockItems: lowCount,
        totalValue: totalVal,
      });
      setLowStockList(lowStock || []);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading reports...</div>;

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Inventory Reports</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalItems}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Inventory Value</p>
              <p className="text-3xl font-bold text-green-900">${stats.totalValue.toFixed(0)}</p>
            </div>
            <Package className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-lg mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-red-900 mb-2">Low Stock Alert</h4>
            <p className="text-red-700">{stats.lowStockItems} item(s) below reorder level</p>
          </div>
        </div>
      </div>

      {lowStockList.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Items Below Reorder Level</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Code</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Item Name</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Current</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Reorder</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Shortage</th>
                </tr>
              </thead>
              <tbody>
                {lowStockList.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{item.item_code}</td>
                    <td className="px-4 py-3">{item.item_name}</td>
                    <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                    <td className="px-4 py-3 text-right">{item.reorder_level} {item.unit}</td>
                    <td className="px-4 py-3 text-red-600 font-semibold">
                      {item.reorder_level - item.quantity} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
