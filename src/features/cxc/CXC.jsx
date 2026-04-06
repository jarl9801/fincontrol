import React, { useState, useMemo } from 'react';
import { TrendingUp, Clock, AlertCircle, DollarSign, CheckCircle2, Circle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue, safe } from '../../utils/formatters';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import PartialPaymentModal from '../../components/ui/PartialPaymentModal';

const CXC = ({
 transactions,
 userRole,
 user
}) => {
 const { registerPayment, markAsCompleted } = useTransactionActions(user);
 const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
 const [paymentTransaction, setPaymentTransaction] = useState(null);
 const [toast, setToast] = useState(null);
 const [loadingId, setLoadingId] = useState(null);

 const receivables = useMemo(
 () => transactions.filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial')),
 [transactions]
 );

 const totalReceivable = receivables.reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
 const overdueReceivables = receivables.filter(t => getDaysOverdue(t.date) > 0);
 const totalOverdue = overdueReceivables.reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
 const dueThisWeek = receivables.filter(t => {
 const d = -getDaysOverdue(t.date);
 return d >= 0 && d <= 7;
 });
 const totalDueThisWeek = dueThisWeek.reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
 const partialReceivables = receivables.filter(t => t.status === 'partial');
 const totalPartial = partialReceivables.reduce((sum, t) => sum + (t.paidAmount || 0), 0);

 const showToast = (message, type = 'success') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 3000);
 };

 const handleMarkCobrado = async (t) => {
 if (loadingId) return;
 setLoadingId(t.id);
 const result = await markAsCompleted(t);
 if (result?.success) showToast('Factura marcada como cobrada');
 else showToast('Error al marcar como cobrada', 'error');
 setLoadingId(null);
 };

 const handlePaymentSubmit = async (transaction, paymentData) => {
 const result = await registerPayment(transaction, paymentData);
 if (result?.success) showToast('Abono registrado correctamente');
 else showToast('Error al registrar abono', 'error');
 };

 const sorted = useMemo(() => {
 return [...receivables].sort((a, b) => {
 const aOv = getDaysOverdue(a.date) > 0 ? 1 : 0;
 const bOv = getDaysOverdue(b.date) > 0 ? 1 : 0;
 if (aOv !== bOv) return bOv - aOv;
 return new Date(a.date) - new Date(b.date);
 });
 }, [receivables]);

 const canAct = userRole === 'admin' || userRole === 'manager';

 return (
 <div className="space-y-6">
 {toast && (
 <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium animate-fadeIn ${
 toast.type === 'success' ? 'bg-[var(--success)] text-white' : 'bg-[var(--accent)] text-white'
 }`}>
 {toast.message}
 </div>
 )}

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)]">
 <div className="flex items-center justify-between mb-2">
 <h3 className="nd-label text-[var(--text-secondary)]">Total por Cobrar</h3>
 <TrendingUp className="text-[var(--success)]" size={20} />
 </div>
 <p className="nd-display text-3xl font-bold text-[var(--success)]">{formatCurrency(totalReceivable)}</p>
 <p className="text-xs text-[var(--text-disabled)] mt-1">{receivables.length} facturas pendientes</p>
 </div>
 <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)]">
 <div className="flex items-center justify-between mb-2">
 <h3 className="nd-label text-[var(--text-secondary)]">Cobrado Parcialmente</h3>
 <DollarSign className="text-[var(--warning)]" size={20} />
 </div>
 <p className="nd-display text-3xl font-bold text-[var(--warning)]">{formatCurrency(totalPartial)}</p>
 <p className="text-xs text-[var(--text-disabled)] mt-1">{partialReceivables.length} facturas con abono</p>
 </div>
 <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)]">
 <div className="flex items-center justify-between mb-2">
 <h3 className="nd-label text-[var(--text-secondary)]">Vencido</h3>
 <AlertCircle className="text-[var(--accent)]" size={20} />
 </div>
 <p className="nd-display text-3xl font-bold text-[var(--accent)]">{formatCurrency(totalOverdue)}</p>
 <p className="text-xs text-[var(--text-disabled)] mt-1">{overdueReceivables.length} facturas vencidas</p>
 </div>
 <div className="bg-[var(--surface)] rounded-xl p-6 border border-[var(--border)]">
 <div className="flex items-center justify-between mb-2">
 <h3 className="nd-label text-[var(--text-secondary)]">Vence Esta Semana</h3>
 <Clock className="text-[var(--warning)]" size={20} />
 </div>
 <p className="nd-display text-3xl font-bold text-[var(--warning)]">{formatCurrency(totalDueThisWeek)}</p>
 <p className="text-xs text-[var(--text-disabled)] mt-1">{dueThisWeek.length} facturas próximas</p>
 </div>
 </div>

 <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
 <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
 <h2 className="nd-display text-base font-bold text-[var(--text-display)]">Cuentas por Cobrar</h2>
 <span className="text-xs text-[var(--text-secondary)]">{sorted.length} facturas pendientes</span>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
 <tr>
 <th className="px-4 py-4 nd-label text-[var(--text-secondary)]">Fecha</th>
 <th className="px-4 py-4 nd-label text-[var(--text-secondary)]">Descripción</th>
 <th className="px-4 py-4 nd-label text-[var(--text-secondary)] hidden md:table-cell">Categoría</th>
 <th className="px-4 py-4 nd-label text-[var(--text-secondary)] text-right">Monto</th>
 <th className="px-4 py-4 nd-label text-[var(--text-secondary)] text-center">Estado</th>
 {canAct && <th className="px-4 py-4 nd-label text-[var(--text-secondary)] text-center">Acciones</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)]">
 {sorted.map((t) => {
 const isOverdue = getDaysOverdue(t.date) > 0;
 const isPartial = t.status === 'partial';
 const paidAmount = t.paidAmount || 0;
 const remaining = t.amount - paidAmount;
 const paidPct = t.amount > 0 ? (paidAmount / t.amount) * 100 : 0;
 const isLoading = loadingId === t.id;
 return (
 <tr key={t.id} className={`group transition-all duration-200 ${isOverdue ? 'bg-transparent' : 'hover:bg-[var(--surface)]'}`}>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex flex-col">
 <span className="text-sm font-medium text-[var(--text-secondary)]">{formatDate(t.date)}</span>
 {isOverdue && <span className="text-[10px] text-[var(--accent)] font-medium">Vencido {getDaysOverdue(t.date)}d</span>}
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="flex items-start gap-3">
 <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-transparent">
 <ArrowUpCircle className="w-5 h-5 text-[var(--success)]" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-semibold text-[var(--text-display)]">{safe(t.description)}</span>
 {t.isRecurring && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]">
 <RefreshCw size={10} /> Recurrente
 </span>
 )}
 </div>
 <span className="text-xs text-[var(--text-disabled)] block mt-0.5">{safe(t.project)}</span>
 {isPartial && (
 <div className="mt-1.5">
 <div className="w-full max-w-[160px] h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
 <div className="h-full bg-[var(--success)] rounded-full" style={{ width: `${paidPct}%` }} />
 </div>
 <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 block">Cobrado: {formatCurrency(paidAmount)} / {formatCurrency(t.amount)}</span>
 </div>
 )}
 </div>
 </div>
 </td>
 <td className="px-4 py-4 hidden md:table-cell">
 <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-transparent text-[var(--success)] border border-[var(--border-visible)]">
 {safe(t.category)}
 </span>
 </td>
 <td className="px-4 py-4 text-right whitespace-nowrap">
 <div className="flex flex-col items-end">
 <span className="nd-mono text-sm font-bold text-[var(--success)]">+{formatCurrency(t.amount)}</span>
 {isPartial && <span className="text-xs text-[var(--warning)]">Restante: {formatCurrency(remaining)}</span>}
 </div>
 </td>
 <td className="px-4 py-4 text-center">
 {isPartial ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-transparent text-[var(--warning)] border-[var(--border-visible)]"><Circle size={14} /> Pago Parcial</span>
 ) : isOverdue ? (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-transparent text-[var(--accent)] border-[var(--border-visible)]"><Circle size={14} /> Vencido</span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-transparent text-[var(--warning)] border-[var(--border-visible)]"><Circle size={14} /> Pendiente</span>
 )}
 </td>
 {canAct && (
 <td className="px-4 py-4 text-center">
 <div className="flex items-center justify-center gap-2">
 <button
 onClick={() => handleMarkCobrado(t)}
 disabled={isLoading}
 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[var(--success)] hover:bg-[var(--success)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 "
 >
 <CheckCircle2 size={14} />
 {isLoading ? 'Guardando...' : 'Cobrado'}
 </button>
 <button
 onClick={() => { setPaymentTransaction(t); setIsPaymentModalOpen(true); }}
 disabled={isLoading}
 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--warning)] bg-transparent hover:bg-transparent border border-[var(--border-visible)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
 >
 <DollarSign size={14} />
 Abono
 </button>
 </div>
 </td>
 )}
 </tr>
 );
 })}
 {sorted.length === 0 && (
 <tr>
 <td colSpan={canAct ? 6 : 5} className="px-4 py-16 text-center">
 <div className="flex flex-col items-center gap-3 text-[var(--text-disabled)]">
 <div className="w-16 h-16 bg-[var(--surface-raised)] rounded-full flex items-center justify-center">
 <TrendingUp className="w-8 h-8 text-[var(--text-disabled)]" />
 </div>
 <p className="text-sm">No hay cuentas por cobrar pendientes</p>
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 <PartialPaymentModal
 isOpen={isPaymentModalOpen}
 onClose={() => { setIsPaymentModalOpen(false); setPaymentTransaction(null); }}
 transaction={paymentTransaction}
 onSubmit={handlePaymentSubmit}
 />
 </div>
 );
};

export default CXC;
