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

const Recurrencia = ({ user }) => {
  const { transactions, loading } = useTransactions(user);
  const { allTransactions } = useAllTransactions(user);
  const { createTransaction } = useTransactionActions(user);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');

  const { showToast } = useToast();

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
        showToast(`${created} transaccion(es) recurrente(s) generada(s)`, 'success');
      } else {
        showToast('No hay transacciones pendientes por generar este mes', 'info');
      }
    } catch (err) {
      console.error('Error generating recurring transactions:', err);
      showToast('Error al generar transacciones recurrentes', 'error');
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
      <div className="flex items-center justify-between">
        <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Automatización</p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Recurrencia automática</h2>
          <p className="mt-1 text-sm text-[#6b7a99]">Controla los movimientos periódicos y genera los pendientes del mes con un solo paso.</p>
        </div>
        <button
          onClick={handleGeneratePending}
          disabled={generating}
          className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(15,159,110,0.24)] bg-[rgba(15,159,110,0.08)] px-4 py-2 text-[12px] font-medium text-[#0f9f6e] transition hover:bg-[rgba(15,159,110,0.14)] disabled:opacity-50"
        >
          {generating ? (
            <div className="h-3.5 w-3.5 rounded-full border-2 border-[#0f9f6e] border-t-transparent animate-spin" />
          ) : (
            <Play size={14} />
          )}
          Generar pendientes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Total recurrentes</p>
            <RefreshCw size={18} className="text-[#2563eb]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#2563eb]">{totalRecurring}</p>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Próximas este mes</p>
            <CalendarClock size={18} className="text-[#c98717]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#c98717]">{dueThisMonth}</p>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Monto mensual estimado</p>
            <TrendingUp size={18} className="text-[#0f9f6e]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#0f9f6e]">{formatCurrency(monthlyEstimate)}</p>
        </div>
      </div>

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
                ? 'border border-[#7aa2ff] bg-[rgba(59,130,246,0.08)] text-[#2563eb]'
                : 'border border-[#d8e3f7] bg-white/78 text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)]'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#dce6f8] bg-white/88 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Descripción</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Tipo</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Frecuencia</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Monto</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Próxima fecha</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-[#eef2fb] transition-colors hover:bg-[rgba(241,246,255,0.8)]">
                  <td className="px-4 py-3">
                    <p className="max-w-[220px] truncate text-[13px] font-medium text-[#1f2a44]">{t.description}</p>
                    <p className="text-[11px] text-[#93a0b6]">{t.project || 'Sin proyecto'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      t.type === 'income'
                        ? 'bg-[rgba(15,159,110,0.1)] text-[#0f9f6e]'
                        : 'bg-[rgba(208,76,54,0.1)] text-[#d04c36]'
                    }`}>
                      {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-[#6b7a99]">
                      {FREQUENCY_LABELS[t.recurringFrequency] || 'Mensual'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-[13px] font-semibold ${
                      t.type === 'income' ? 'text-[#0f9f6e]' : 'text-[#d04c36]'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-[#6b7a99]">
                      {formatDate(t.nextDate.toISOString())}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.isExpired ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(107,122,153,0.12)] px-2 py-0.5 text-[11px] font-medium text-[#6b7a99]">
                        <Pause size={10} /> Expirada
                      </span>
                    ) : t.isDueThisMonth ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(214,149,44,0.1)] px-2 py-0.5 text-[11px] font-medium text-[#c98717]">
                        <AlertTriangle size={10} /> Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,159,110,0.1)] px-2 py-0.5 text-[11px] font-medium text-[#0f9f6e]">
                        <CheckCircle2 size={10} /> Activa
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 text-[#93a0b6]" />
            <p className="mb-1 text-sm text-[#6b7a99]">No hay transacciones recurrentes</p>
            <p className="text-[11px] text-[#93a0b6]">Marca una transacción como recurrente al crearla o editarla.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recurrencia;
