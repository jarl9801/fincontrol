import React, { useState, useMemo } from 'react';
import {
  Bell, AlertTriangle, Clock, Users, TrendingDown, CheckCircle2,
  Filter, Trash2, Eye
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
  critical: { bg: 'rgba(255,69,58,0.08)', border: 'rgba(255,69,58,0.2)', color: '#ff453a', icon: AlertTriangle },
  warning: { bg: 'rgba(255,159,10,0.08)', border: 'rgba(255,159,10,0.2)', color: '#ff9f0a', icon: Clock },
  info: { bg: 'rgba(10,132,255,0.08)', border: 'rgba(10,132,255,0.2)', color: '#0a84ff', icon: Bell },
};

const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

const Alertas = ({ user, userRole }) => {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead, createNotification } = useNotifications(user);
  const { receivables } = useReceivables(user);
  const { payables } = usePayables(user);
  const { transactions } = useTransactions(user);
  const { budgets } = useBudgets(user);
  const { allTransactions } = useAllTransactions(user);
  const [filter, setFilter] = useState('all');

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

  // Auto-generated alerts from current data
  const autoAlerts = useMemo(() => {
    const alerts = [];

    // CXC overdue (>30d)
    receivables.filter(r => r.status !== 'paid').forEach(r => {
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
    receivables.filter(r => r.status !== 'paid').forEach(r => {
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
    payables.filter(p => p.status !== 'paid').forEach(p => {
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
      const key = b.month ? `${b.projectName}_${b.month}` : `${b.projectName}_annual`;
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
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Centro de Alertas</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">Notificaciones y alertas automáticas</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={async () => { await markAllAsRead(); showToast?.('Todas marcadas como leídas'); }}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium text-[#0a84ff] hover:bg-[rgba(10,132,255,0.08)] rounded-lg transition-colors">
            <CheckCircle2 size={14} /> Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,69,58,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Críticas</p>
            <AlertTriangle size={18} className="text-[#ff453a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff453a]">{criticalCount}</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Advertencias</p>
            <Clock size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">{warningCount}</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(10,132,255,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">No Leídas</p>
            <Bell size={18} className="text-[#0a84ff]" />
          </div>
          <p className="text-[28px] font-bold text-[#0a84ff]">{unreadCount}</p>
        </div>
      </div>

      {/* Filter */}
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
                ? 'bg-[rgba(10,132,255,0.15)] text-[#0a84ff] border border-[rgba(10,132,255,0.3)]'
                : 'text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert List */}
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
                <p className="text-[13px] font-semibold text-white">{alert.title}</p>
                <p className="text-[12px] text-[#8e8e93] mt-0.5">{alert.message}</p>
                {alert.createdAt && (
                  <p className="text-[10px] text-[#636366] mt-1">
                    {new Date(alert.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
              {!alert.auto && !alert.read && (
                <button onClick={() => markAsRead(alert.id)}
                  className="p-1.5 text-[#636366] hover:text-[#0a84ff] transition-colors flex-shrink-0">
                  <Eye size={14} />
                </button>
              )}
              {alert.auto && (
                <span className="text-[9px] text-[#636366] bg-[rgba(255,255,255,0.05)] px-1.5 py-0.5 rounded flex-shrink-0">AUTO</span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Bell className="w-8 h-8 text-[#636366] mx-auto mb-3" />
            <p className="text-sm text-[#636366]">No hay alertas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alertas;
