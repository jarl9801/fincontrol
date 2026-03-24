import React, { Suspense, lazy, useState } from 'react';
import { FileText, TrendingUp, Activity, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const ExecutiveSummary = lazy(() => import('../reports/ExecutiveSummary'));
const Reports = lazy(() => import('../reports/Reports'));
const FinancialRatios = lazy(() => import('../reports/FinancialRatios'));
const ReportCXCXP = lazy(() => import('../reports/ReportCXCXP'));

const TABS = [
  { key: 'executive', label: 'Resumen Ejecutivo', icon: FileText },
  { key: 'results', label: 'Estado de Resultados', icon: TrendingUp },
  { key: 'ratios', label: 'Ratios Financieros', icon: Activity },
  { key: 'cxc', label: 'Reporte CXC', icon: ArrowUpCircle },
  { key: 'cxp', label: 'Reporte CXP', icon: ArrowDownCircle },
];

const ReportesUnified = ({ user }) => {
  const [activeTab, setActiveTab] = useState('executive');

  const renderTab = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveSummary user={user} />;
      case 'results':
        return <Reports user={user} />;
      case 'ratios':
        return <FinancialRatios user={user} />;
      case 'cxc':
        return <ReportCXCXP user={user} type="cxc" />;
      case 'cxp':
        return <ReportCXCXP user={user} type="cxp" />;
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
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center rounded-[24px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] py-16 shadow-[0_20px_48px_rgba(126,147,190,0.1)]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
              <p className="text-sm text-[#6b7a96]">Cargando reporte...</p>
            </div>
          </div>
        }
      >
        {renderTab()}
      </Suspense>
    </div>
  );
};

export default ReportesUnified;
