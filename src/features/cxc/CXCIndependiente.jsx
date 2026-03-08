import React, { useState, useMemo } from 'react';
import {
  TrendingUp, Clock, AlertCircle, DollarSign, CheckCircle2,
  Circle, ArrowUpCircle, Plus, FileText
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useReceivables } from '../../hooks/useReceivables';
import { useTransactions } from '../../hooks/useTransactions';
import { useProjects } from '../../hooks/useProjects';
import PartialPaymentModal from '../../components/ui/PartialPaymentModal';
import { useToast } from '../../contexts/ToastContext';

const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
};

const AGING_BUCKETS = ['0-30d', '30-60d', '60-90d', '>90d'];

const AgingBar = ({ receivables }) => {
  const buckets = useMemo(() => {
    const b = [0, 0, 0, 0];
    receivables.filter(r => r.status !== 'paid').forEach(r => {
      const days = -getDaysUntilDue(r.dueDate);
      if (days <= 0) return; // not overdue
      if (days <= 30) b[0] += r.pendingAmount;
      else if (days <= 60) b[1] += r.pendingAmount;
      else if (days <= 90) b[2] += r.pendingAmount;
      else b[3] += r.pendingAmount;
    });
    return b;
  }, [receivables]);

  const total = buckets.reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const colors = ['#ff9f0a', '#ff6723', '#ff453a', '#d70015'];

  return (
    <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
      <h4 className="text-[13px] font-semibold text-[#c7c7cc] mb-3">Antigüedad de Cartera</h4>
      <div className="flex rounded-lg overflow-hidden h-5 mb-3">
        {buckets.map((val, i) => val > 0 && (
          <div
            key={i}
            className="h-full transition-all"
            style={{ width: `${(val / total) * 100}%`, backgroundColor: colors[i] }}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {AGING_BUCKETS.map((label, i) => (
          <div key={label} className="text-center">
            <div className="w-2.5 h-2.5 rounded-full mx-auto mb-1" style={{ backgroundColor: colors[i] }} />
            <p className="text-[10px] text-[#636366]">{label}</p>
            <p className="text-[12px] font-semibold text-[#c7c7cc]">{formatCurrency(buckets[i])}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CreateReceivableModal = ({ isOpen, onClose, onSubmit, projects }) => {
  const [form, setForm] = useState({
    invoiceNumber: '', client: '', projectId: '', description: '',
    amount: '', issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', paymentTerms: 'net30', notes: '',
  });

  if (!isOpen) return null;

  const handleTermsChange = (terms) => {
    setForm(prev => {
      const days = parseInt(terms.replace('net', '')) || 30;
      const issue = new Date(prev.issueDate);
      issue.setDate(issue.getDate() + days);
      return { ...prev, paymentTerms: terms, dueDate: issue.toISOString().split('T')[0] };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.client || !form.amount || !form.dueDate) return;
    onSubmit(form);
    setForm({ invoiceNumber: '', client: '', projectId: '', description: '', amount: '', issueDate: new Date().toISOString().split('T')[0], dueDate: '', paymentTerms: 'net30', notes: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1c1c1e] rounded-2xl border border-[rgba(255,255,255,0.1)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <h3 className="text-lg font-bold text-white mb-5">Nueva Cuenta por Cobrar</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Nro. Factura</label>
              <input value={form.invoiceNumber} onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" placeholder="INV-001" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Cliente *</label>
              <input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))} required
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" placeholder="Nombre del cliente" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Descripción</label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" placeholder="Concepto de la factura" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Monto (EUR) *</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Proyecto</label>
              <select value={form.projectId} onChange={e => setForm(p => ({ ...p, projectId: e.target.value }))}
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none">
                <option value="">Sin proyecto</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.code}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Fecha Emisión</label>
              <input type="date" value={form.issueDate} onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))}
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Condiciones</label>
              <select value={form.paymentTerms} onChange={e => handleTermsChange(e.target.value)}
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none">
                <option value="net15">Neto 15</option>
                <option value="net20">Neto 20</option>
                <option value="net30">Neto 30</option>
                <option value="net60">Neto 60</option>
                <option value="net90">Neto 90</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Vencimiento *</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#30d158] hover:bg-[#28c74e] transition-colors shadow-sm">
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CXCIndependiente = ({ user, userRole }) => {
  const { receivables, loading: rxLoading, createReceivable, registerPayment, markAsPaid } = useReceivables(user);
  const { transactions, loading: txLoading } = useTransactions(user);
  const { projects } = useProjects(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, issued, partial, overdue, paid
  const loading = rxLoading || txLoading;

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

  // Merge receivables collection + income transactions with pending/partial status
  const allReceivables = useMemo(() => {
    // IDs of transactions already linked to a receivable doc
    const linkedIds = new Set(
      receivables.filter(r => r.linkedTransactionId).map(r => r.linkedTransactionId)
    );

    // Map pending/partial income transactions to receivable shape
    const fromTx = transactions
      .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial') && !linkedIds.has(t.id))
      .map(t => ({
        id: `tx_${t.id}`,
        invoiceNumber: '',
        client: t.description || 'Sin descripción',
        description: t.category || '',
        amount: parseFloat(t.amount) || 0,
        pendingAmount: (parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0),
        issueDate: t.date,
        dueDate: t.date,
        status: t.status === 'partial' ? 'partial' : 'issued',
        payments: t.payments || [],
        source: 'transaction',
      }));

    return [
      ...receivables.map(r => ({ ...r, source: 'receivable' })),
      ...fromTx,
    ];
  }, [receivables, transactions]);

  const filtered = useMemo(() => {
    let items = allReceivables;
    if (filter === 'overdue') items = items.filter(r => r.status !== 'paid' && getDaysUntilDue(r.dueDate) < 0);
    else if (filter !== 'all') items = items.filter(r => r.status === filter);
    return items;
  }, [allReceivables, filter]);

  const activeReceivables = allReceivables.filter(r => r.status !== 'paid');
  const totalPending = activeReceivables.reduce((s, r) => s + r.pendingAmount, 0);
  const totalOverdue = activeReceivables.filter(r => getDaysUntilDue(r.dueDate) < 0).reduce((s, r) => s + r.pendingAmount, 0);
  const totalPartial = allReceivables.filter(r => r.status === 'partial').reduce((s, r) => s + (r.amount - r.pendingAmount), 0);
  const dueThisWeek = activeReceivables.filter(r => { const d = getDaysUntilDue(r.dueDate); return d >= 0 && d <= 7; });
  const totalDueThisWeek = dueThisWeek.reduce((s, r) => s + r.pendingAmount, 0);

  const handleMarkCobrado = async (item) => {
    if (loadingId) return;
    setLoadingId(item.id);
    const result = await markAsPaid(item);
    if (result?.success) showToast?.('Factura marcada como cobrada');
    else showToast?.('Error al marcar como cobrada', 'error');
    setLoadingId(null);
  };

  const handlePaymentSubmit = async (transaction, paymentData) => {
    const result = await registerPayment(transaction, paymentData);
    if (result?.success) showToast?.('Abono registrado correctamente');
    else showToast?.('Error al registrar abono', 'error');
  };

  const canAct = userRole === 'admin' || userRole === 'manager';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#30d158] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Cuentas por Cobrar</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">Gestión de facturas y cobros pendientes</p>
        </div>
        {canAct && (
          <button onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#30d158] hover:bg-[#28c74e] text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm">
            <Plus size={16} /> Nueva CXC
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(48,209,88,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Total por Cobrar</p>
            <TrendingUp size={18} className="text-[#30d158]" />
          </div>
          <p className="text-[28px] font-bold text-[#30d158]">{formatCurrency(totalPending)}</p>
          <p className="text-[11px] text-[#636366] mt-1">{activeReceivables.length} facturas activas</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Cobrado Parcial</p>
            <DollarSign size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">{formatCurrency(totalPartial)}</p>
          <p className="text-[11px] text-[#636366] mt-1">{allReceivables.filter(r => r.status === 'partial').length} con abono</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,69,58,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Vencido</p>
            <AlertCircle size={18} className="text-[#ff453a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff453a]">{formatCurrency(totalOverdue)}</p>
          <p className="text-[11px] text-[#636366] mt-1">{activeReceivables.filter(r => getDaysUntilDue(r.dueDate) < 0).length} vencidas</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Vence Esta Semana</p>
            <Clock size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">{formatCurrency(totalDueThisWeek)}</p>
          <p className="text-[11px] text-[#636366] mt-1">{dueThisWeek.length} próximas</p>
        </div>
      </div>

      {/* Aging Report */}
      <AgingBar receivables={allReceivables} />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'Todas' },
          { id: 'issued', label: 'Emitidas' },
          { id: 'partial', label: 'Parciales' },
          { id: 'overdue', label: 'Vencidas' },
          { id: 'paid', label: 'Cobradas' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              filter === tab.id
                ? 'bg-[rgba(48,209,88,0.15)] text-[#30d158] border border-[rgba(48,209,88,0.3)]'
                : 'text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#1c1c1e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider">Factura</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider hidden lg:table-cell">Concepto</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Monto</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Pendiente</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Vencimiento</th>
                <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Estado</th>
                {canAct && <th className="px-4 py-3.5 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {filtered.map((r) => {
                const daysUntil = getDaysUntilDue(r.dueDate);
                const isOverdue = daysUntil < 0 && r.status !== 'paid';
                const isPaid = r.status === 'paid';
                const isPartial = r.status === 'partial';
                const paidPct = r.amount > 0 ? ((r.amount - r.pendingAmount) / r.amount) * 100 : 0;
                const isLoading = loadingId === r.id;

                return (
                  <tr key={r.id} className={`transition-colors ${isOverdue ? 'bg-[rgba(255,69,58,0.04)]' : 'hover:bg-[rgba(255,255,255,0.02)]'}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#636366]" />
                        <span className="text-[13px] font-medium text-[#c7c7cc]">{r.invoiceNumber || '-'}</span>
                        {r.source === 'transaction' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[rgba(255,159,10,0.12)] text-[#ff9f0a] border border-[rgba(255,159,10,0.25)]">TXN</span>
                        ) : r.source === 'receivable' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[rgba(10,132,255,0.12)] text-[#0a84ff] border border-[rgba(10,132,255,0.25)]">Factura</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[13px] font-semibold text-white">{r.client}</span>
                      {r.description && <p className="text-[11px] text-[#636366] mt-0.5">{r.description}</p>}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-[12px] text-[#8e8e93]">{r.description || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-[13px] font-bold text-[#30d158]">{formatCurrency(r.amount)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-[13px] font-bold ${isPaid ? 'text-[#636366]' : 'text-white'}`}>
                        {formatCurrency(r.pendingAmount)}
                      </span>
                      {isPartial && (
                        <div className="mt-1">
                          <div className="w-full max-w-[100px] h-1 bg-[#2c2c2e] rounded-full overflow-hidden ml-auto">
                            <div className="h-full bg-[#30d158] rounded-full" style={{ width: `${paidPct}%` }} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-[12px] text-[#c7c7cc]">{formatDate(r.dueDate)}</span>
                      {isOverdue && (
                        <p className="text-[10px] text-[#ff453a] font-medium mt-0.5">
                          {Math.abs(daysUntil)}d vencido
                        </p>
                      )}
                      {!isOverdue && !isPaid && daysUntil <= 7 && (
                        <p className="text-[10px] text-[#ff9f0a] font-medium mt-0.5">
                          {daysUntil}d restantes
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.25)]">
                          <CheckCircle2 size={12} /> Cobrada
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(255,159,10,0.12)] text-[#ff9f0a] border border-[rgba(255,159,10,0.25)]">
                          <Circle size={12} /> Parcial
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(255,69,58,0.12)] text-[#ff453a] border border-[rgba(255,69,58,0.25)]">
                          <AlertCircle size={12} /> Vencida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[rgba(10,132,255,0.12)] text-[#0a84ff] border border-[rgba(10,132,255,0.25)]">
                          <Circle size={12} /> Emitida
                        </span>
                      )}
                    </td>
                    {canAct && (
                      <td className="px-4 py-3.5 text-center">
                        {!isPaid && (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleMarkCobrado(r)} disabled={isLoading}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#30d158] hover:bg-[#28c74e] disabled:opacity-50 transition-all">
                              {isLoading ? '...' : 'Cobrar'}
                            </button>
                            <button onClick={() => { setSelectedItem(r); setIsPaymentModalOpen(true); }} disabled={isLoading}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#ff9f0a] bg-[rgba(255,159,10,0.1)] hover:bg-[rgba(255,159,10,0.2)] border border-[rgba(255,159,10,0.25)] disabled:opacity-50 transition-all">
                              Abono
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={canAct ? 8 : 7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#636366]">
                      <div className="w-16 h-16 bg-[#2c2c2e] rounded-full flex items-center justify-center">
                        <ArrowUpCircle className="w-8 h-8 text-[#636366]" />
                      </div>
                      <p className="text-sm">No hay cuentas por cobrar</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateReceivableModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (data) => {
          const result = await createReceivable(data);
          if (result?.success) showToast?.('Cuenta por cobrar creada');
          else showToast?.('Error al crear cuenta', 'error');
        }}
        projects={projects}
      />

      {selectedItem && (
        <PartialPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => { setIsPaymentModalOpen(false); setSelectedItem(null); }}
          transaction={{ ...selectedItem, paidAmount: selectedItem.amount - selectedItem.pendingAmount }}
          onSubmit={handlePaymentSubmit}
        />
      )}
    </div>
  );
};

export default CXCIndependiente;
