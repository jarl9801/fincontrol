import React from 'react';
import { TrendingUp, Clock, AlertCircle } from 'lucide-react';
import TransactionList from '../transactions/TransactionList';
import { formatCurrency, getDaysOverdue } from '../../utils/formatters';

const CXC = ({
  transactions,
  userRole,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  applyFilters,
  user
}) => {
  // Filtrar solo ingresos pendientes
  const receivables = transactions.filter(t => t.type === 'income' && t.status === 'pending');
  
  // Calcular métricas
  const totalReceivable = receivables.reduce((sum, t) => sum + t.amount, 0);
  const overdueReceivables = receivables.filter(t => getDaysOverdue(t.date) > 0);
  const totalOverdue = overdueReceivables.reduce((sum, t) => sum + t.amount, 0);
  const dueThisWeek = receivables.filter(t => {
    const daysUntilDue = -getDaysOverdue(t.date);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });
  const totalDueThisWeek = dueThisWeek.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Métricas CXC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Total por Cobrar</h3>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalReceivable)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{receivables.length} facturas pendientes</p>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Vencido</h3>
            <AlertCircle className="text-rose-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-rose-600">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{overdueReceivables.length} facturas vencidas</p>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Vence Esta Semana</h3>
            <Clock className="text-amber-500" size={20} />
          </div>
          <p className="text-3xl font-bold text-amber-600">{formatCurrency(totalDueThisWeek)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{dueThisWeek.length} facturas próximas</p>
        </div>
      </div>

      {/* Lista de transacciones filtrada */}
      <TransactionList
        transactions={receivables}
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

export default CXC;
