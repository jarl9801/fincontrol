import React from 'react';
import { TrendingDown, Clock, AlertCircle } from 'lucide-react';
import TransactionList from '../transactions/TransactionList';
import { formatCurrency, getDaysOverdue } from '../../utils/formatters';

const CXP = ({
  transactions,
  userRole,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  applyFilters,
  user
}) => {
  // Filtrar solo gastos pendientes
  const payables = transactions.filter(t => t.type === 'expense' && t.status === 'pending');
  
  // Calcular métricas
  const totalPayable = payables.reduce((sum, t) => sum + t.amount, 0);
  const overduePayables = payables.filter(t => getDaysOverdue(t.date) > 0);
  const totalOverdue = overduePayables.reduce((sum, t) => sum + t.amount, 0);
  const dueThisWeek = payables.filter(t => {
    const daysUntilDue = -getDaysOverdue(t.date);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });
  const totalDueThisWeek = dueThisWeek.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Métricas CXP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Total por Pagar</h3>
            <TrendingDown className="text-[#f87171]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#f87171]">{formatCurrency(totalPayable)}</p>
          <p className="text-xs text-[#636366] mt-1">{payables.length} facturas pendientes</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Vencido</h3>
            <AlertCircle className="text-[#f87171]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#f87171]">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-[#636366] mt-1">{overduePayables.length} facturas vencidas</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Vence Esta Semana</h3>
            <Clock className="text-[#fbbf24]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#fbbf24]">{formatCurrency(totalDueThisWeek)}</p>
          <p className="text-xs text-[#636366] mt-1">{dueThisWeek.length} facturas próximas</p>
        </div>
      </div>

      {/* Lista de transacciones filtrada */}
      <TransactionList
        transactions={payables}
        userRole={userRole}
        user={user}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
      />
    </div>
  );
};

export default CXP;
