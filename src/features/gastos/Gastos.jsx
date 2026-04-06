import { useMemo, useState } from 'react';
import {
 AlertTriangle,
 ArrowDownCircle,
 BadgeEuro,
 Plus,
 Search,
 Wallet,
} from 'lucide-react';
import PartialPaymentModal from '../../components/ui/PartialPaymentModal';
import RecordDetailModal from '../../components/ui/RecordDetailModal';
import { useToast } from '../../contexts/ToastContext';
import { usePayables } from '../../hooks/usePayables';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';

const statusOptions = [
 { id: 'all', label: 'Todas' },
 { id: 'issued', label: 'Emitidas' },
 { id: 'partial', label: 'Parciales' },
 { id: 'overdue', label: 'Vencidas' },
 { id: 'settled', label: 'Liquidadas' },
];

const statusLabels = {
 issued: 'Emitida',
 partial: 'Parcial',
 overdue: 'Vencida',
 settled: 'Liquidada',
 cancelled: 'Cancelada',
};

const StatCard = ({ title, value, subtitle, accent, icon, onClick }) => {
 const IconComponent = icon;

 return (
 <div
 className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ${onClick ? 'cursor-pointer hover: transition-transform duration-200' : ''}`}
 onClick={onClick}
 role={onClick ? 'button' : undefined}
 tabIndex={onClick ? 0 : undefined}
 onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
 >
 <div className="mb-4 flex items-center justify-between">
 <div>
 <p className="nd-label text-[var(--text-secondary)]">{title}</p>
 <p className="mt-2 nd-display text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">{value}</p>
 </div>
 <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}1f`, color: accent }}>
 <IconComponent size={18} />
 </div>
 </div>
 <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
 </div>
 );
};

const toModalTransaction = (row) => ({
 id: row.id,
 amount: row.grossAmount,
 paidAmount: row.paidAmount,
 description: row.description || row.counterpartyName || 'Documento',
});

const Gastos = ({ userRole, user, onNewTransaction }) => {
 const { showToast } = useToast();
 const metrics = useTreasuryMetrics({ user });
 const { registerPayment: registerPayablePayment, markAsPaid: settlePayable } = usePayables(user);
 const { registerPayment: registerLegacyPayment, markAsCompleted: settleLegacyPayable } = useTransactionActions(user);

 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState('all');
 const [selectedRow, setSelectedRow] = useState(null);
 const [loadingId, setLoadingId] = useState(null);
 const [detailRecord, setDetailRecord] = useState(null);

 const canAct = userRole === 'admin' || userRole === 'manager';

 const paymentMovements = useMemo(
 () => metrics.postedMovements.filter((entry) => String(entry.kind || '').includes('payment')),
 [metrics.postedMovements],
 );

 const rows = useMemo(() => {
 return metrics.payables
 .filter((entry) => {
 if (statusFilter !== 'all' && entry.status !== statusFilter) return false;
 if (!searchTerm.trim()) return true;
 const query = searchTerm.toLowerCase();
 return (
 (entry.counterpartyName || '').toLowerCase().includes(query) ||
 (entry.description || '').toLowerCase().includes(query) ||
 (entry.documentNumber || '').toLowerCase().includes(query) ||
 (entry.projectName || '').toLowerCase().includes(query)
 );
 })
 .sort((left, right) => (right.dueDate || '').localeCompare(left.dueDate || ''));
 }, [metrics.payables, searchTerm, statusFilter]);

 const openRows = metrics.payables.filter((entry) => ['issued', 'partial', 'overdue'].includes(entry.status));
 const totalOpen = openRows.reduce((sum, entry) => sum + entry.openAmount, 0);
 const totalOverdue = metrics.overduePayables.reduce((sum, entry) => sum + entry.openAmount, 0);
 const totalPartial = metrics.payables
 .filter((entry) => entry.status === 'partial')
 .reduce((sum, entry) => sum + entry.paidAmount, 0);
 const paidReal = paymentMovements.reduce((sum, entry) => sum + entry.amount, 0);

 const handleSettle = async (row) => {
 if (loadingId) return;
 setLoadingId(row.id);
 try {
 let result = { success: false };
 if (row.source === 'payable') result = await settlePayable(row);
 if (row.source === 'legacy-transaction') {
 result = await settleLegacyPayable({
 id: row.legacyTransactionId,
 amount: row.grossAmount,
 type: 'expense',
 });
 }
 if (result.success) showToast('Gasto liquidado');
 else showToast('No se pudo liquidar el gasto', 'error');
 } finally {
 setLoadingId(null);
 }
 };

 const handlePartialPayment = async (_transaction, paymentData) => {
 if (!selectedRow) return;
 let result = { success: false };
 if (selectedRow.source === 'payable') result = await registerPayablePayment(selectedRow, paymentData);
 if (selectedRow.source === 'legacy-transaction') {
 result = await registerLegacyPayment(
 {
 id: selectedRow.legacyTransactionId,
 amount: selectedRow.grossAmount,
 paidAmount: selectedRow.paidAmount,
 type: 'expense',
 },
 paymentData,
 );
 }
 if (result.success) showToast('Pago parcial registrado');
 else showToast('No se pudo registrar el pago', 'error');
 };

 if (metrics.loading) {
 return (
 <div className="flex items-center justify-center py-28">
 <p className="nd-mono text-xs text-[var(--text-secondary)] tracking-[0.08em] uppercase">[LOADING...]</p>
 </div>
 );
 }

 return (
 <div className="space-y-6 pb-12">
 <section className="rounded-xl border border-[var(--border)] bg-[var(--black)] px-6 py-7 ">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <p className="mb-3 nd-label text-[var(--warning)]">Gastos</p>
 <h2 className="nd-display text-[32px] font-semibold tracking-tight text-[var(--text-display)]">Pagos reales y deuda operativa sin mezclar con caja futura.</h2>
 <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
 Las CXP abiertas permanecen fuera de caja hasta registrar una salida real en banco. Aquí ves deuda, abonos y pagos realizados sobre el mismo ledger.
 </p>
 </div>
 {canAct && onNewTransaction && (
 <button
 type="button"
 onClick={() => onNewTransaction('expense')}
 className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent)]"
 >
 <Plus size={16} />
 Nueva factura CXP
 </button>
 )}
 </div>
 </section>

 <div className="grid gap-4 lg:grid-cols-4">
 <StatCard title="Pagado real" value={formatCurrency(paidReal)} subtitle={`${paymentMovements.length} pagos bancarios registrados`} accent="var(--accent)" icon={Wallet} onClick={() => setStatusFilter('settled')} />
 <StatCard title="Deuda abierta" value={formatCurrency(totalOpen)} subtitle={`${openRows.length} documentos activos`} accent="var(--warning)" icon={BadgeEuro} onClick={() => setStatusFilter('all')} />
 <StatCard title="Pago parcial" value={formatCurrency(totalPartial)} subtitle="Importe ya pagado sobre facturas aún abiertas" accent="var(--text-secondary)" icon={ArrowDownCircle} />
 <StatCard title="Vencido" value={formatCurrency(totalOverdue)} subtitle={`${metrics.overduePayables.length} documentos fuera de plazo`} accent="var(--accent)" icon={AlertTriangle} onClick={() => setStatusFilter('overdue')} />
 </div>

 <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
 <div className="relative w-full xl:max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
 <input
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--black)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)]"
 placeholder="Buscar proveedor, documento o proyecto"
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {statusOptions.map((option) => (
 <button
 key={option.id}
 type="button"
 onClick={() => setStatusFilter(option.id)}
 className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${
 statusFilter === option.id
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--warning)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
 }`}
 >
 {option.label}
 </button>
 ))}
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[980px] text-left">
 <thead>
 <tr className="border-b border-[var(--border)] nd-label text-[var(--text-secondary)]">
 <th className="px-4 py-3">Proveedor</th>
 <th className="px-4 py-3">Documento</th>
 <th className="px-4 py-3">Proyecto</th>
 <th className="px-4 py-3 text-right">Bruto</th>
 <th className="px-4 py-3 text-right">Abierto</th>
 <th className="px-4 py-3 text-center">Vence</th>
 <th className="px-4 py-3 text-center">Estado</th>
 <th className="px-4 py-3 text-center">Origen</th>
 {canAct && <th className="px-4 py-3 text-right">Acciones</th>}
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)]">
 {rows.map((row) => {
 const canSettle = row.source !== 'legacy-opening' && row.status !== 'settled' && row.status !== 'cancelled';
 return (
 <tr key={row.id} className="cursor-pointer hover:bg-[var(--surface)]" onClick={() => setDetailRecord(row)}>
 <td className="px-4 py-4">
 <p className="text-sm font-semibold text-[var(--text-primary)]">{row.counterpartyName}</p>
 <p className="text-xs text-[var(--text-secondary)]">{row.description || 'Sin descripción'}</p>
 </td>
 <td className="px-4 py-4 text-sm text-[var(--text-primary)]">{row.documentNumber || 'Sin documento'}</td>
 <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{row.projectName || 'Sin proyecto'}</td>
 <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(row.grossAmount)}</td>
 <td className="px-4 py-4 text-right text-sm font-semibold text-[var(--warning)]">{formatCurrency(row.openAmount)}</td>
 <td className="px-4 py-4 text-center text-sm text-[var(--text-secondary)]">{row.dueDate ? formatDate(row.dueDate) : 'Sin fecha'}</td>
 <td className="px-4 py-4 text-center">
 <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
 row.status === 'settled'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--success)]'
 : row.status === 'overdue'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--accent)]'
 : row.status === 'partial'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--warning)]'
 : 'border-[var(--border-visible)] bg-[var(--surface)] text-[var(--text-secondary)]'
 }`}>
 {statusLabels[row.status]}
 </span>
 </td>
 <td className="px-4 py-4 text-center text-xs text-[var(--text-secondary)]">{row.source}</td>
 {canAct && (
 <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
 <div className="flex justify-end gap-2">
 {canSettle && (
 <>
 <button
 type="button"
 onClick={() => setSelectedRow(row)}
 className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)]"
 >
 Abono
 </button>
 <button
 type="button"
 onClick={() => handleSettle(row)}
 disabled={loadingId === row.id}
 className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
 >
 {loadingId === row.id ? 'Procesando...' : 'Liquidar'}
 </button>
 </>
 )}
 </div>
 </td>
 )}
 </tr>
 );
 })}
 {rows.length === 0 && (
 <tr>
 <td colSpan={canAct ? 9 : 8} className="px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
 No hay gastos que coincidan con los filtros.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </section>

 <PartialPaymentModal
 isOpen={Boolean(selectedRow)}
 onClose={() => setSelectedRow(null)}
 transaction={selectedRow ? toModalTransaction(selectedRow) : null}
 onSubmit={handlePartialPayment}
 />

 <RecordDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} userRole={userRole} />
 </div>
 );
};

export default Gastos;
