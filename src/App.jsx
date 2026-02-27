import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useAllTransactions } from './hooks/useAllTransactions';
import { useTransactionActions } from './hooks/useTransactionActions';
import { useFilters } from './hooks/useFilters';
import { useCategories } from './hooks/useCategories';
import { useCostCenters } from './hooks/useCostCenters';
import Login from './features/auth/Login';
import Sidebar from './components/layout/Sidebar';
import MobileMenu, { MobileMenuButton } from './components/layout/MobileMenu';
import Dashboard from './features/dashboard/Dashboard';
import TransactionList from './features/transactions/TransactionList';
import CXP from './features/cxp/CXP';
import CXC from './features/cxc/CXC';
import Reports from './features/reports/Reports';
import ExecutiveSummary from './features/reports/ExecutiveSummary';
import FinancialRatios from './features/reports/FinancialRatios';
import ReportCXCXP from './features/reports/ReportCXCXP';
import CashFlow from './features/cashflow/CashFlow';
import Categories from './features/settings/Categories';
import CostCenters from './features/settings/CostCenters';
import Projects from './features/settings/Projects';
import BankAccount from './features/settings/BankAccount';
import TransactionFormModal from './components/ui/TransactionFormModal';
import Toast from './components/ui/Toast';
import { Loader2 } from 'lucide-react';

const VIEW_TITLES = {
  'dashboard': 'Dashboard Financiero',
  'transactions': 'Todas las Transacciones',
  'cxp': 'Cuentas por Pagar (CXP)',
  'cxc': 'Cuentas por Cobrar (CXC)',
  'executive-summary': 'Resumen Ejecutivo',
  'reports': 'Estado de Resultados',
  'financial-ratios': 'Ratios Financieros',
  'report-cxp': 'Reporte CXP',
  'report-cxc': 'Reporte CXC',
  'cashflow': 'Flujo de Caja',
  'categories': 'Categorías',
  'cost-centers': 'Centros de Costo',
  'projects': 'Gestión de Proyectos',
  'bank-account': 'Cuenta Bancaria'
};

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="bg-[rgba(28,28,30,0.8)] p-5 rounded-2xl border border-[rgba(255,255,255,0.06)]" style={{ backdropFilter: 'blur(40px)' }}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="skeleton h-3 w-20 mb-2"></div>
        <div className="skeleton h-7 w-28"></div>
      </div>
      <div className="skeleton w-10 h-10 rounded-xl"></div>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="w-8 h-8 text-[#30d158] animate-spin" />
        </div>
        <p className="text-[#8e8e93] text-sm">Cargando datos financieros...</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
      <div className="skeleton h-6 w-48 mb-6"></div>
      <div className="space-y-3">
        <div className="skeleton h-12 w-full rounded-lg"></div>
        <div className="skeleton h-12 w-full rounded-lg"></div>
        <div className="skeleton h-12 w-full rounded-lg"></div>
      </div>
    </div>
  </div>
);

function App() {
  const { user, userRole, hasPermission, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions(user);
  const { allTransactions, loading: allTxLoading } = useAllTransactions(user);
  const { createTransaction } = useTransactionActions(user);
  const { expenseCategories, incomeCategories } = useCategories(user);
  const { costCenters } = useCostCenters(user);
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    applyFilters,
    filteredTransactions
  } = useFilters(transactions);

  const [view, setView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const loading = authLoading || transactionsLoading;

  // Login screen
  if (!user) {
    return <Login />;
  }

  const handleNewTransaction = () => {
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (formData) => {
    const result = await createTransaction(formData);
    if (result.success) {
      setToast({ message: 'Transacción creada exitosamente', type: 'success' });
    } else {
      setToast({ message: 'Error al crear la transacción', type: 'error' });
    }
    setIsModalOpen(false);
  };

  const renderView = () => {
    if (loading) {
      return <LoadingState />;
    }

    const commonProps = {
      transactions: filteredTransactions,
      userRole,
      user,
      searchTerm,
      setSearchTerm,
      filters,
      setFilters,
      applyFilters
    };

    switch (view) {
      case 'dashboard':
        return hasPermission('dashboard') ? <Dashboard transactions={filteredTransactions} allTransactions={allTransactions} user={user} /> : null;
      case 'transactions':
        return <TransactionList {...commonProps} />;
      case 'cxp':
        return <CXP {...commonProps} />;
      case 'cxc':
        return <CXC {...commonProps} />;
      case 'executive-summary':
        return <ExecutiveSummary transactions={filteredTransactions} allTransactions={allTransactions} />;
      case 'reports':
        return <Reports transactions={filteredTransactions} allTransactions={allTransactions} />;
      case 'financial-ratios':
        return <FinancialRatios transactions={filteredTransactions} allTransactions={allTransactions} />;
      case 'report-cxp':
        return <ReportCXCXP transactions={filteredTransactions} type="cxp" />;
      case 'report-cxc':
        return <ReportCXCXP transactions={filteredTransactions} type="cxc" />;
      case 'cashflow':
        return <CashFlow user={user} />;
      case 'categories':
        return <Categories user={user} />;
      case 'cost-centers':
        return <CostCenters user={user} />;
      case 'projects':
        return <Projects user={user} />;
      case 'bank-account':
        return <BankAccount user={user} transactions={filteredTransactions} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-black font-sans text-white overflow-hidden">
      <Sidebar
        user={user}
        userRole={userRole}
        hasPermission={hasPermission}
        view={view}
        setView={setView}
        onNewTransaction={handleNewTransaction}
      />

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header */}
        <div className="flex-shrink-0 bg-[rgba(28,28,30,0.85)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] px-4 md:px-8 py-3 z-30">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />
              <div>
                <h2 className="text-[17px] md:text-[20px] font-semibold text-white tracking-tight">
                  {VIEW_TITLES[view] || 'Dashboard'}
                </h2>
                <p className="text-[11px] text-[#8e8e93] hidden md:block mt-0.5">
                  {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {!loading && (
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[rgba(255,255,255,0.06)] rounded-lg">
                  <div className="w-1.5 h-1.5 bg-[#30d158] rounded-full animate-pulse"></div>
                  <span className="text-[12px] text-[#8e8e93]">
                    {filteredTransactions.length} transacciones
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content - scrollable area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>

      {/* New Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        editingTransaction={null}
        user={user}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        costCenters={costCenters}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        userRole={userRole}
        hasPermission={hasPermission}
        view={view}
        setView={setView}
        onNewTransaction={handleNewTransaction}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
