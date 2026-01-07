import { useState } from 'react';
import { Building2, Map, DollarSign, TrendingUp } from 'lucide-react';
import { ar } from '../../lib/ar';
import { ProjectsList } from './components/ProjectsList';
import { ProjectPhases } from './components/ProjectPhases';
import { ProjectCosts } from './components/ProjectCosts';
import { ProjectsReports } from './components/ProjectsReports';

type ProjectTab = 'projects' | 'phases' | 'costs' | 'reports';

export function ProjectsModule() {
  const [activeTab, setActiveTab] = useState<ProjectTab>('projects');

  const tabs = [
    { id: 'projects' as ProjectTab, label: ar.projects.projects, icon: Building2 },
    { id: 'phases' as ProjectTab, label: ar.projects.phases, icon: Map },
    { id: 'costs' as ProjectTab, label: ar.projects.costs, icon: DollarSign },
    { id: 'reports' as ProjectTab, label: ar.actions.export, icon: TrendingUp },
  ];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-right">{ar.nav.projects}</h2>

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
        {activeTab === 'projects' && <ProjectsList />}
        {activeTab === 'phases' && <ProjectPhases />}
        {activeTab === 'costs' && <ProjectCosts />}
        {activeTab === 'reports' && <ProjectsReports />}
      </div>
    </div>
  );
}
