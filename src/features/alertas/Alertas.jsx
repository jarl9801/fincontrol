import React, { useMemo, useState } from 'react';
import {
  Bell, AlertTriangle, Clock, Users, TrendingDown, CheckCircle2,
  Eye
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useReceivables } from '../../hooks/useReceivables';
import { usePayables } from '../../hooks/usePayables';
import { useTransactions } from '../../hooks/useTransactions';
import { useBudgets } from '../../hooks/useBudgets';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

const SEVERITY_STYLES = {
  critical: { bg: 'rgba(255,244,241,0.92)', border: 'rgba(208,76,54,0.22)', color: '#d04c36', icon: AlertTriangle },
  warning: { bg: 'rgba(255,248,234,0.94)', border: 'rgba(214,149,44,0.22)', color: '#c98717', icon: Clock },
  info: { bg: 'rgba(240,246,255,0.94)', border: 'rgba(59,130,246,0.22)', color: '#2563eb', icon: Bell },
};

const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

const Alertas = ({ user }) => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications(user);
  const { receivables } = useReceivables(user);
  const { payables } = usePayables(user);
  const { transactions } = useTransactions(user);
  const { budgets } = useBudgets(user);
  const { allTransactions } = useAllTransactions(user);
  const [filter, setFilter] = useState('all');

  const { showToast } = useToast();

  // Auto-generated alerts from current data
  const autoAlerts = useMemo(() => {
    const alerts = [];

    // CXC overdue (>30d)
    receivables.filter(r => r.status !== 'settled' && r.status !== 'cancelled').forEach(r => {
      const days = getDaysUntilDue(r.dueDate);
      if (days < -30) {
        alerts.push({
          id: `cxc_overdue_${r.id}`,
          type: 'cxc_overdue',
          severity: 'critical',
          title: 'CXC Vencida >30 días',
          message: `${r.client}: ${formatCurrency(r.pendingAmount)} — vencida hace ${Math.abs(days)} días`,
          auto: true,
        });
      }
    });

    // CXC due this week
    receivables.filter(r => r.status !== 'settled' && r.status !== 'cancelled').forEach(r => {
      const days = getDaysUntilDue(r.dueDate);
      if (days >= 0 && days <= 7) {
        alerts.push({
          id: `cxc_due_${r.id}`,
          type: 'cxc_due_soon',
          severity: 'warning',
          title: 'CXC por vencer',
          message: `${r.client}: ${formatCurrency(r.pendingAmount)} — vence en ${days} días`,
          auto: true,
        });
      }
    });

    // CXP overdue
    payables.filter(p => p.status !== 'settled' && p.status !== 'cancelled').forEach(p => {
      const days = getDaysUntilDue(p.dueDate);
      if (days < 0) {
        alerts.push({
          id: `cxp_overdue_${p.id}`,
          type: 'cxp_overdue',
          severity: 'critical',
          title: 'CXP Vencida',
          message: `${p.vendor}: ${formatCurrency(p.pendingAmount)} — vencida hace ${Math.abs(days)} días`,
          auto: true,
        });
      }
    });

    // Transaction-based CXC overdue (income pending/partial > 30d)
    const linkedRxIds = new Set(receivables.filter(r => r.linkedTransactionId).map(r => r.linkedTransactionId));
    transactions
      .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial') && !linkedRxIds.has(t.id))
      .forEach(t => {
        const days = getDaysUntilDue(t.date);
        if (days < -30) {
          alerts.push({
            id: `txcxc_overdue_${t.id}`,
            type: 'cxc_overdue',
            severity: 'critical',
            title: 'CXC Vencida >30 días (Transacción)',
            message: `${t.description}: ${formatCurrency((parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0))} — vencida hace ${Math.abs(days)} días`,
            auto: true,
          });
        } else if (days >= 0 && days <= 7) {
          alerts.push({
            id: `txcxc_due_${t.id}`,
            type: 'cxc_due_soon',
            severity: 'warning',
            title: 'CXC por vencer (Transacción)',
            message: `${t.description}: ${formatCurrency((parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0))} — vence en ${days} días`,
            auto: true,
          });
        }
      });

    // Transaction-based CXP overdue (expense pending/partial)
    const linkedPxIds = new Set(payables.filter(p => p.linkedTransactionId).map(p => p.linkedTransactionId));
    transactions
      .filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'partial') && !linkedPxIds.has(t.id))
      .forEach(t => {
        const days = getDaysUntilDue(t.date);
        if (days < 0) {
          alerts.push({
            id: `txcxp_overdue_${t.id}`,
            type: 'cxp_overdue',
            severity: 'critical',
            title: 'CXP Vencida (Transacción)',
            message: `${t.description}: ${formatCurrency((parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0))} — vencida hace ${Math.abs(days)} días`,
            auto: true,
          });
        }
      });

    // Budget exceeded (>80%)
    budgets.filter(b => b.year === 2026).forEach(b => {
      let actualExpense = 0;
      allTransactions.forEach(t => {
        if (t.type !== 'expense') return;
        const y = new Date(t.date).getFullYear();
        const m = new Date(t.date).getMonth() + 1;
        if (y !== b.year) return;
        if (b.month && m !== b.month) return;
        if ((t.project || '') === b.projectName || (!b.month && !b.projectId)) {
          actualExpense += t.amount;
        }
      });
      if (b.expenseLimit > 0) {
        const usage = (actualExpense / b.expenseLimit) * 100;
        if (usage > 100) {
          alerts.push({
            id: `budget_exceeded_${b.id}`,
            type: 'budget_exceeded',
            severity: 'critical',
            title: 'Presupuesto Excedido',
            message: `${b.projectName}: ${usage.toFixed(0)}% del límite de gasto (${formatCurrency(actualExpense)} / ${formatCurrency(b.expenseLimit)})`,
            auto: true,
          });
        } else if (usage > 80) {
          alerts.push({
            id: `budget_warning_${b.id}`,
            type: 'budget_warning',
            severity: 'warning',
            title: 'Presupuesto al 80%+',
            message: `${b.projectName}: ${usage.toFixed(0)}% del límite de gasto`,
            auto: true,
          });
        }
      }
    });

    // Negative cash flow projection
    const cashBalance = allTransactions.reduce((sum, t) => {
      if (t.status === 'pending') return sum;
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 28450);
    if (cashBalance < 0) {
      alerts.push({
        id: 'cashflow_negative',
        type: 'cashflow_warning',
        severity: 'critical',
        title: 'Flujo de Caja Negativo',
        message: `Saldo actual: ${formatCurrency(cashBalance)}`,
        auto: true,
      });
    }

    return alerts;
  }, [receivables, payables, transactions, budgets, allTransactions]);

  // Merge auto alerts + stored notifications
  const allAlerts = useMemo(() => {
    const stored = notifications.map(n => ({ ...n, auto: false }));
    return [...autoAlerts, ...stored];
  }, [autoAlerts, notifications]);

  const filtered = useMemo(() => {
    if (filter === 'all') return allAlerts;
    if (filter === 'unread') return allAlerts.filter(a => a.auto || !a.read);
    return allAlerts.filter(a => a.severity === filter);
  }, [allAlerts, filter]);

  const criticalCount = allAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = allAlerts.filter(a => a.severity === 'warning').length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#ff9f0a] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Seguimiento</p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Centro de alertas</h2>
          <p className="mt-1 text-sm text-[#6b7a99]">Revisa vencimientos, riesgos y avisos operativos desde una sola bandeja.</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={async () => { await markAllAsRead(); showToast('Todas marcadas como leídas'); }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d8e3f7] bg-white/88 px-4 py-2 text-[12px] font-medium text-[#2563eb] transition hover:bg-[rgba(59,130,246,0.08)]">
            <CheckCircle2 size={14} /> Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Críticas</p>
            <AlertTriangle size={18} className="text-[#d04c36]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#d04c36]">{criticalCount}</p>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Advertencias</p>
            <Clock size={18} className="text-[#c98717]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#c98717]">{warningCount}</p>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">No leídas</p>
            <Bell size={18} className="text-[#2563eb]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#2563eb]">{unreadCount}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'critical', label: 'Críticas' },
          { id: 'warning', label: 'Advertencias' },
          { id: 'unread', label: 'No leídas' },
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

      <div className="space-y-2">
        {filtered.map((alert) => {
          const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info;
          const IconComp = style.icon;
          return (
            <div key={alert.id}
              className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-colors ${!alert.auto && alert.read ? 'opacity-60' : ''}`}
              style={{ background: style.bg, borderColor: style.border }}
            >
              <IconComp size={18} style={{ color: style.color }} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1f2a44]">{alert.title}</p>
                <p className="mt-0.5 text-[12px] text-[#5f6f8d]">{alert.message}</p>
                {alert.createdAt && (
                  <p className="mt-1 text-[10px] text-[#93a0b6]">
                    {new Date(alert.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              {!alert.auto && !alert.read && (
                <button onClick={() => markAsRead(alert.id)}
                  className="flex-shrink-0 rounded-xl p-1.5 text-[#7a879d] transition-colors hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]">
                  <Eye size={14} />
                </button>
              )}
              {alert.auto && (
                <span className="flex-shrink-0 rounded-full bg-[rgba(107,122,153,0.12)] px-1.5 py-0.5 text-[9px] text-[#6b7a99]">AUTO</span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell className="mx-auto mb-3 h-8 w-8 text-[#93a0b6]" />
            <p className="text-sm text-[#6b7a99]">No hay alertas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
