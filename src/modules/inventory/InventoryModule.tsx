import { useState } from 'react';
import { Package, Building2, TrendingUp } from 'lucide-react';
import { ar } from '../../lib/ar';
import { WarehousesList } from './components/WarehousesList';
import { InventoryItems } from './components/InventoryItems';
import { InventoryReports } from './components/InventoryReports';

type InventoryTab = 'warehouses' | 'items' | 'reports';

export function InventoryModule() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('warehouses');

  const tabs = [
    { id: 'warehouses' as InventoryTab, label: ar.inventory.warehouses, icon: Building2 },
    { id: 'items' as InventoryTab, label: ar.inventory.items, icon: Package },
    { id: 'reports' as InventoryTab, label: ar.actions.export, icon: TrendingUp },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-right">{ar.nav.inventory}</h2>

      <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div>
        {activeTab === 'warehouses' && <WarehousesList />}
        {activeTab === 'items' && <InventoryItems />}
        {activeTab === 'reports' && <InventoryReports />}
      </div>
    </div>
  );
}
