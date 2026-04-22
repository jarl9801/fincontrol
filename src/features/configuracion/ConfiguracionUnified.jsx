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
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 ">
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
 ? 'border border-[var(--border-visible)] bg-[var(--surface)] text-[var(--text-primary)] '
 : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
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
