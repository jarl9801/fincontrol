import React, { useState, useMemo } from 'react';
import { TrendingUp, Clock, AlertCircle, DollarSign, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue, safe } from '../../utils/formatters';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import PartialPaymentModal from '../../components/ui/PartialPaymentModal';
import { KPIGrid, KPI, Button, Badge } from '@/components/ui/nexus';

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
 <div className={`fixed top-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-md text-sm font-medium animate-fadeIn ${
 toast.type === 'success' ? 'bg-[var(--success)] text-white' : 'bg-[var(--accent)] text-white'
 }`}>
 {toast.message}
 </div>
 )}

 <KPIGrid cols={4}>
 <KPI
 label="Total por cobrar"
 value={formatCurrency(totalReceivable)}
 meta={`${receivables.length} facturas pendientes`}
 icon={TrendingUp}
 />
 <KPI
 label="Cobrado parcialmente"
 value={formatCurrency(totalPartial)}
 meta={`${partialReceivables.length} facturas con abono`}
 tone="warn"
 icon={DollarSign}
 />
 <KPI
 label="Vencido"
 value={formatCurrency(totalOverdue)}
 meta={`${overdueReceivables.length} facturas vencidas`}
 tone="err"
 icon={AlertCircle}
 />
 <KPI
 label="Vence esta semana"
 value={formatCurrency(totalDueThisWeek)}
 meta={`${dueThisWeek.length} facturas próximas`}
 tone="warn"
 icon={Clock}
 />
 </KPIGrid>

 <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
 <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
 <h2 className="nd-display text-base font-medium text-[var(--text-display)]">Cuentas por Cobrar</h2>
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
 <div className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 bg-transparent">
 <ArrowUpCircle className="w-5 h-5 text-[var(--success)]" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-semibold text-[var(--text-display)]">{safe(t.description)}</span>
 {t.isRecurring && (
 <Badge variant="neutral" dot>Recurrente</Badge>
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
 <Badge variant="neutral">{safe(t.category)}</Badge>
 </td>
 <td className="px-4 py-4 text-right whitespace-nowrap">
 <div className="flex flex-col items-end">
 <span className="nd-mono text-sm font-bold text-[var(--success)]">+{formatCurrency(t.amount)}</span>
 {isPartial && <span className="text-xs text-[var(--warning)]">Restante: {formatCurrency(remaining)}</span>}
 </div>
 </td>
 <td className="px-4 py-4 text-center">
 {isPartial ? (
 <Badge variant="warn" dot>Pago Parcial</Badge>
 ) : isOverdue ? (
 <Badge variant="err" dot>Vencido</Badge>
 ) : (
 <Badge variant="warn" dot>Pendiente</Badge>
 )}
 </td>
 {canAct && (
 <td className="px-4 py-4 text-center">
 <div className="flex items-center justify-center gap-2">
 <Button
 variant="primary"
 size="sm"
 icon={CheckCircle2}
 onClick={() => handleMarkCobrado(t)}
 loading={isLoading}
 disabled={isLoading}
 >
 {isLoading ? 'Guardando...' : 'Cobrado'}
 </Button>
 <Button
 variant="ghost"
 size="sm"
 icon={DollarSign}
 onClick={() => { setPaymentTransaction(t); setIsPaymentModalOpen(true); }}
 disabled={isLoading}
 >
 Abono
 </Button>
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
