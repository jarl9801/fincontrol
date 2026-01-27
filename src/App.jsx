import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useTransactionActions } from './hooks/useTransactionActions';
import { useFilters } from './hooks/useFilters';
import Login from './features/auth/Login';
import Sidebar from './components/layout/Sidebar';
import MobileMenu, { MobileMenuButton } from './components/layout/MobileMenu';
import Dashboard from './features/dashboard/Dashboard';
import TransactionList from './features/transactions/TransactionList';
import CXP from './features/cxp/CXP';
import CXC from './features/cxc/CXC';
import Reports from './features/reports/Reports';
import ReportCXP from './features/reports/ReportCXP';
import ReportCXC from './features/reports/ReportCXC';
import CashFlow from './features/cashflow/CashFlow';
import Categories from './features/settings/Categories';
import CostCenters from './features/settings/CostCenters';
import TransactionFormModal from './components/ui/TransactionFormModal';

const VIEW_TITLES = {
  'dashboard': 'Dashboard Financiero',
  'transactions': 'Todas las Transacciones',
  'cxp': 'Cuentas por Pagar (CXP)',
  'cxc': 'Cuentas por Cobrar (CXC)',
  'reports': 'Estado de Resultados',
  'report-cxp': 'Reporte CXP',
  'report-cxc': 'Reporte CXC',
  'cashflow': 'Flujo de Caja',
  'categories': 'Categorias',
  'cost-centers': 'Centros de Costo'
};

function App() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { transactions, loading: transactionsLoading } = useTransactions(user);
  const { createTransaction } = useTransactionActions(user);
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

  const loading = authLoading || transactionsLoading;

  // Login screen
  if (!user) {
    return <Login />;
  }

  const handleNewTransaction = () => {
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (formData) => {
    await createTransaction(formData);
    setIsModalOpen(false);
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64 text-slate-400">
          Cargando datos financieros...
        </div>
      );
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
        return userRole === 'admin' ? <Dashboard transactions={filteredTransactions} /> : null;
      case 'transactions':
        return <TransactionList {...commonProps} />;
      case 'cxp':
        return <CXP {...commonProps} />;
      case 'cxc':
        return <CXC {...commonProps} />;
      case 'reports':
        return <Reports transactions={filteredTransactions} />;
      case 'report-cxp':
        return <ReportCXP transactions={filteredTransactions} />;
      case 'report-cxc':
        return <ReportCXC transactions={filteredTransactions} />;
      case 'cashflow':
        return <CashFlow transactions={filteredTransactions} />;
      case 'categories':
        return <Categories />;
      case 'cost-centers':
        return <CostCenters />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        user={user}
        userRole={userRole}
        view={view}
        setView={setView}
        onNewTransaction={handleNewTransaction}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <MobileMenuButton onClick={() => setIsMobileMenuOpen(true)} />
              <h2 className="text-2xl font-bold text-slate-800">
                {VIEW_TITLES[view] || 'Dashboard'}
              </h2>
            </div>
          </div>

          {renderView()}
        </div>
      </main>

      {/* New Transaction Modal */}
      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        editingTransaction={null}
        user={user}
      />

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        userRole={userRole}
        view={view}
        setView={setView}
        onNewTransaction={handleNewTransaction}
      />
    </div>
  );
}

export default App;
