import React from 'react';
import { TrendingUp, Clock, AlertCircle, DollarSign } from 'lucide-react';
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
  // Filtrar ingresos pendientes Y parciales
  const receivables = transactions.filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial'));
  
  // Calcular métricas usando remaining amount
  const totalReceivable = receivables.reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
  const overdueReceivables = receivables.filter(t => getDaysOverdue(t.date) > 0);
  const totalOverdue = overdueReceivables.reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
  const dueThisWeek = receivables.filter(t => {
    const daysUntilDue = -getDaysOverdue(t.date);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });
  const totalDueThisWeek = dueThisWeek.reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);

  // Partial payments
  const partialReceivables = receivables.filter(t => t.status === 'partial');
  const totalPartial = partialReceivables.reduce((sum, t) => sum + (t.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Métricas CXC */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Total por Cobrar</h3>
            <TrendingUp className="text-[#30d158]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#30d158]">{formatCurrency(totalReceivable)}</p>
          <p className="text-xs text-[#636366] mt-1">{receivables.length} facturas pendientes</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Cobrado Parcialmente</h3>
            <DollarSign className="text-[#ff9f0a]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#ff9f0a]">{formatCurrency(totalPartial)}</p>
          <p className="text-xs text-[#636366] mt-1">{partialReceivables.length} facturas con abono</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Vencido</h3>
            <AlertCircle className="text-[#ff453a]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#ff453a]">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-[#636366] mt-1">{overdueReceivables.length} facturas vencidas</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Vence Esta Semana</h3>
            <Clock className="text-[#ff9f0a]" size={20} />
          </div>
          <p className="text-3xl font-bold text-[#ff9f0a]">{formatCurrency(totalDueThisWeek)}</p>
          <p className="text-xs text-[#636366] mt-1">{dueThisWeek.length} facturas próximas</p>
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
