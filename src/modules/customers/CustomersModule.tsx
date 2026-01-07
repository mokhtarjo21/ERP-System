import { useState } from 'react';
import { Users, Building2, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { ar } from '../../lib/ar';
import { CustomersList } from './components/CustomersList';
import { RealEstateUnits } from './components/RealEstateUnits';
import { SalesContracts } from './components/SalesContracts';
import { CustomerPayments } from './components/CustomerPayments';
import { SalesReports } from './components/SalesReports';

type CustomerTab = 'customers' | 'units' | 'contracts' | 'payments' | 'reports';

export function CustomersModule() {
  const [activeTab, setActiveTab] = useState<CustomerTab>('units');

  const tabs = [
    { id: 'units' as CustomerTab, label: ar.units.title, icon: Building2 },
    { id: 'customers' as CustomerTab, label: ar.customers.title, icon: Users },
    { id: 'contracts' as CustomerTab, label: ar.contracts.title, icon: FileText },
    { id: 'payments' as CustomerTab, label: ar.payments.title, icon: DollarSign },
    { id: 'reports' as CustomerTab, label: ar.actions.export, icon: TrendingUp },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-right">{ar.nav.salesUnits}</h2>

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
        {activeTab === 'units' && <RealEstateUnits />}
        {activeTab === 'customers' && <CustomersList />}
        {activeTab === 'contracts' && <SalesContracts />}
        {activeTab === 'payments' && <CustomerPayments />}
        {activeTab === 'reports' && <SalesReports />}
      </div>
    </div>
  );
}
