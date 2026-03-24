import React, { useState } from 'react';
import { Tag, Building2, FolderOpen, Landmark } from 'lucide-react';
import Categories from '../settings/Categories';
import CostCenters from '../settings/CostCenters';
import Projects from '../settings/Projects';
import BankAccount from '../settings/BankAccount';

const TABS = [
  { key: 'projects', label: 'Proyectos', icon: FolderOpen },
  { key: 'categories', label: 'Categorías', icon: Tag },
  { key: 'cost-centers', label: 'Centros de Costo', icon: Building2 },
  { key: 'bank-account', label: 'Cuenta Bancaria', icon: Landmark },
];

const ConfiguracionUnified = ({ user, transactions }) => {
  const [activeTab, setActiveTab] = useState('projects');

  const renderTab = () => {
    switch (activeTab) {
      case 'projects':
        return <Projects user={user} />;
      case 'categories':
        return <Categories user={user} />;
      case 'cost-centers':
        return <CostCenters user={user} />;
      case 'bank-account':
        return <BankAccount user={user} transactions={transactions} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-[24px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(244,248,255,0.84))] p-2 shadow-[0_20px_48px_rgba(126,147,190,0.1)]">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'border border-[rgba(90,141,221,0.28)] bg-[rgba(90,141,221,0.12)] text-[#3156d3] shadow-[0_10px_24px_rgba(90,141,221,0.12)]'
                    : 'text-[#6b7a96] hover:text-[#101938] hover:bg-white'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {renderTab()}
    </div>
  );
};

export default ConfiguracionUnified;
