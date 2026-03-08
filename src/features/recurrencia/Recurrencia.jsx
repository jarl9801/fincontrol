import React, { useState, useMemo } from 'react';
import {
  RefreshCw, CalendarClock, TrendingUp, Play, CheckCircle2,
  Clock, AlertTriangle, Pause
} from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

const FREQUENCY_LABELS = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

const FREQUENCY_DAYS = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

const getNextOccurrence = (lastDate, frequency) => {
  const date = new Date(lastDate);
  switch (frequency) {
    case 'weekly': date.setDate(date.getDate() + 7); break;
    case 'biweekly': date.setDate(date.getDate() + 14); break;
    case 'monthly': date.setMonth(date.getMonth() + 1); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'yearly': date.setFullYear(date.getFullYear() + 1); break;
    default: date.setMonth(date.getMonth() + 1);
  }
  return date;
};

const isInCurrentMonth = (date) => {
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const Recurrencia = ({ user, userRole }) => {
  const { transactions, loading } = useTransactions(user);
  const { allTransactions } = useAllTransactions(user);
  const { createTransaction } = useTransactionActions(user);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

  const recurringTransactions = useMemo(() => {
    return transactions.filter(t => t.isRecurring === true);
  }, [transactions]);

  const enriched = useMemo(() => {
    return recurringTransactions.map(t => {
      const nextDate = getNextOccurrence(t.date, t.recurringFrequency || 'monthly');
      const isExpired = t.recurringEndDate && new Date(t.recurringEndDate) < new Date();
      const isDueThisMonth = isInCurrentMonth(nextDate);
      return { ...t, nextDate, isExpired, isDueThisMonth };
    });
  }, [recurringTransactions]);

  const filtered = useMemo(() => {
    if (filter === 'all') return enriched;
    if (filter === 'active') return enriched.filter(t => !t.isExpired);
    if (filter === 'this_month') return enriched.filter(t => t.isDueThisMonth);
    if (filter === 'expired') return enriched.filter(t => t.isExpired);
    return enriched;
  }, [enriched, filter]);

  // KPIs
  const totalRecurring = enriched.length;
  const dueThisMonth = enriched.filter(t => t.isDueThisMonth && !t.isExpired).length;
  const monthlyEstimate = useMemo(() => {
    return enriched
      .filter(t => !t.isExpired)
      .reduce((sum, t) => {
        const freq = t.recurringFrequency || 'monthly';
        const daysInFreq = FREQUENCY_DAYS[freq] || 30;
        const monthlyFactor = 30 / daysInFreq;
        return sum + (t.amount * monthlyFactor);
      }, 0);
  }, [enriched]);

  const handleGeneratePending = async () => {
    if (generating) return;
    setGenerating(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let created = 0;

    try {
      for (const t of enriched) {
        if (t.isExpired) continue;
        if (!t.isDueThisMonth) continue;

        // Check if already generated this month
        const alreadyExists = allTransactions.some(existing => {
          if (existing.id === t.id) return false;
          const existingDate = new Date(existing.date);
          return (
            existing.description === t.description &&
            existing.amount === t.amount &&
            existingDate.getMonth() === today.getMonth() &&
            existingDate.getFullYear() === today.getFullYear()
          );
        });

        if (alreadyExists) continue;

        const nextDateStr = t.nextDate.toISOString().split('T')[0];
        const result = await createTransaction({
          date: nextDateStr,
          description: t.description,
          amount: t.amount,
          type: t.type,
          category: t.category || '',
          project: t.project || '',
          costCenter: t.costCenter || 'Sin asignar',
          status: 'pending',
          isRecurring: false,
          comment: `Generada automaticamente desde recurrencia: ${t.description}`,
        });

        if (result?.success) created++;
      }

      if (created > 0) {
        showToast?.(`${created} transaccion(es) recurrente(s) generada(s)`, 'success');
      } else {
        showToast?.('No hay transacciones pendientes por generar este mes', 'info');
      }
    } catch (err) {
      console.error('Error generating recurring transactions:', err);
      showToast?.('Error al generar transacciones recurrentes', 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Recurrencia Automatica</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">Gestiona transacciones recurrentes y genera pendientes</p>
        </div>
        <button
          onClick={handleGeneratePending}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.3)] rounded-lg hover:bg-[rgba(48,209,88,0.2)] transition-colors disabled:opacity-50"
        >
          {generating ? (
            <div className="w-3.5 h-3.5 border-2 border-[#30d158] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play size={14} />
          )}
          Generar Pendientes
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(10,132,255,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Total Recurrentes</p>
            <RefreshCw size={18} className="text-[#0a84ff]" />
          </div>
          <p className="text-[28px] font-bold text-[#0a84ff]">{totalRecurring}</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Proximas Este Mes</p>
            <CalendarClock size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">{dueThisMonth}</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(48,209,88,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Monto Mensual Estimado</p>
            <TrendingUp size={18} className="text-[#30d158]" />
          </div>
          <p className="text-[28px] font-bold text-[#30d158]">{formatCurrency(monthlyEstimate)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'active', label: 'Activas' },
          { id: 'this_month', label: 'Este Mes' },
          { id: 'expired', label: 'Expiradas' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              filter === tab.id
                ? 'bg-[rgba(10,132,255,0.15)] text-[#0a84ff] border border-[rgba(10,132,255,0.3)]'
                : 'text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Descripcion</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Frecuencia</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider text-right">Monto</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Proxima Fecha</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-white truncate max-w-[220px]">{t.description}</p>
                    <p className="text-[11px] text-[#636366]">{t.project || 'Sin proyecto'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      t.type === 'income'
                        ? 'bg-[rgba(48,209,88,0.1)] text-[#30d158]'
                        : 'bg-[rgba(255,69,58,0.1)] text-[#ff453a]'
                    }`}>
                      {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-[#8e8e93]">
                      {FREQUENCY_LABELS[t.recurringFrequency] || 'Mensual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[13px] font-semibold ${
                      t.type === 'income' ? 'text-[#30d158]' : 'text-[#ff453a]'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-[#8e8e93]">
                      {formatDate(t.nextDate.toISOString())}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#636366] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">
                        <Pause size={10} /> Expirada
                      </span>
                    ) : t.isDueThisMonth ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#ff9f0a] bg-[rgba(255,159,10,0.1)] px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} /> Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#30d158] bg-[rgba(48,209,88,0.1)] px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={10} /> Activa
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <RefreshCw className="w-8 h-8 text-[#636366] mx-auto mb-3" />
            <p className="text-sm text-[#636366] mb-1">No hay transacciones recurrentes</p>
            <p className="text-[11px] text-[#48484a]">Marca una transaccion como recurrente al crearla o editarla</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recurrencia;
