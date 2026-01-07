import { useState } from 'react';
import { Users, Clock, DollarSign, FileText } from 'lucide-react';
import { ar } from '../../lib/ar';
import { EmployeesList } from './components/EmployeesList';
import { AttendanceTracking } from './components/AttendanceTracking';
import { PayrollManagement } from './components/PayrollManagement';
import { ReportsSection } from './components/ReportsSection';

type HRTab = 'employees' | 'attendance' | 'payroll' | 'reports';

export function HRModule() {
  const [activeTab, setActiveTab] = useState<HRTab>('employees');

  const tabs = [
    { id: 'employees' as HRTab, label: ar.hr.employees, icon: Users },
    { id: 'attendance' as HRTab, label: ar.hr.attendance, icon: Clock },
    { id: 'payroll' as HRTab, label: ar.hr.payroll, icon: DollarSign },
    { id: 'reports' as HRTab, label: ar.actions.export, icon: FileText },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-right">{ar.nav.hrPayroll}</h2>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition ${
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
        {activeTab === 'employees' && <EmployeesList />}
        {activeTab === 'attendance' && <AttendanceTracking />}
        {activeTab === 'payroll' && <PayrollManagement />}
        {activeTab === 'reports' && <ReportsSection />}
      </div>
    </div>
  );
}
