import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, Briefcase, ShoppingCart, Package, Building2, LogOut, LayoutGrid } from 'lucide-react';
import { HRModule } from '../modules/hr/HRModule';
import { SuppliersModule } from '../modules/suppliers/SuppliersModule';
import { CustomersModule } from '../modules/customers/CustomersModule';
import { InventoryModule } from '../modules/inventory/InventoryModule';
import { ProjectsModule } from '../modules/projects/ProjectsModule';
import { DashboardOverview } from '../components/Dashboard';
import { ar } from '../lib/ar';

type ModuleType = 'overview' | 'hr' | 'suppliers' | 'customers' | 'inventory' | 'projects';

export function Dashboard() {
  const { signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleType>('overview');

  const modules = [
    { id: 'overview' as ModuleType, label: ar.nav.dashboard, icon: LayoutGrid },
    { id: 'customers' as ModuleType, label: ar.nav.salesUnits, icon: ShoppingCart },
    { id: 'hr' as ModuleType, label: ar.nav.hrPayroll, icon: Users },
    { id: 'inventory' as ModuleType, label: ar.nav.inventory, icon: Package },
    { id: 'suppliers' as ModuleType, label: ar.nav.suppliers, icon: Briefcase },
    { id: 'projects' as ModuleType, label: ar.nav.projects, icon: Building2 },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'overview':
        return <DashboardOverview />;
      case 'hr':
        return <HRModule />;
      case 'suppliers':
        return <SuppliersModule />;
      case 'customers':
        return <CustomersModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'projects':
        return <ProjectsModule />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ERP System</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModule(module.id)}
                  className={`p-3 rounded-lg font-medium transition flex flex-col items-center justify-center gap-1 text-center ${
                    activeModule === module.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs sm:text-sm">{module.label}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-lg shadow">
            {renderModule()}
          </div>
        </div>
      </div>
    </div>
  );
}
