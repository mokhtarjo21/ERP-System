import { useState } from 'react';
import { Briefcase, FileText, DollarSign } from 'lucide-react';
import { ar } from '../../lib/ar';
import { SuppliersList } from './components/SuppliersList';
import { ContractorsList } from './components/ContractorsList';
import { PurchaseInvoices } from './components/PurchaseInvoices';
import { ContractorStatements } from './components/ContractorStatements';

type SupplierTab = 'suppliers' | 'contractors' | 'invoices' | 'statements';

export function SuppliersModule() {
  const [activeTab, setActiveTab] = useState<SupplierTab>('suppliers');

  const tabs = [
    { id: 'suppliers' as SupplierTab, label: ar.suppliers.suppliers, icon: Briefcase },
    { id: 'contractors' as SupplierTab, label: ar.suppliers.contractors, icon: Briefcase },
    { id: 'invoices' as SupplierTab, label: ar.suppliers.purchaseInvoices, icon: FileText },
    { id: 'statements' as SupplierTab, label: ar.suppliers.contractorStatements, icon: DollarSign },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-right">{ar.nav.suppliers}</h2>

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
        {activeTab === 'suppliers' && <SuppliersList />}
        {activeTab === 'contractors' && <ContractorsList />}
        {activeTab === 'invoices' && <PurchaseInvoices />}
        {activeTab === 'statements' && <ContractorStatements />}
      </div>
    </div>
  );
}
