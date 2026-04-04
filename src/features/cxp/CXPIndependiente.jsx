import { useMemo, useState } from 'react';
import {
 AlertTriangle,
 ArrowDownLeft,
 BadgeEuro,
 Clock3,
 Filter,
 Search,
} from 'lucide-react';
import HelpButton from '../../components/ui/HelpButton';
import PartialPaymentModal from '../../components/ui/PartialPaymentModal';
import RecordDetailModal from '../../components/ui/RecordDetailModal';
import { useToast } from '../../contexts/ToastContext';
import { usePayables } from '../../hooks/usePayables';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';

const statusLabels = {
 issued: 'Emitida',
 partial: 'Parcial',
 overdue: 'Vencida',
 settled: 'Liquidada',
 cancelled: 'Cancelada',
};

const filters = [
 { id: 'all', label: 'Todas' },
 { id: 'issued', label: 'Emitidas' },
 { id: 'partial', label: 'Parciales' },
 { id: 'overdue', label: 'Vencidas' },
 { id: 'settled', label: 'Liquidadas' },
];

const bucketColor = ['var(--warning)', 'var(--accent)', 'var(--accent)', 'var(--accent)'];

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
 <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-disabled)]">{title}</p>
 <p className="mt-2 text-[28px] font-semibold tracking-tight text-[var(--text-primary)]">{value}</p>
 </div>
 <div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: `${accent}20`, color: accent }}>
 <IconComponent size={18} />
 </div>
 </div>
 <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
 </div>
 );
};

const AgingBar = ({ buckets }) => {
 const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
 if (total <= 0) return null;

 return (
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="mb-4 flex items-center justify-between">
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-disabled)]">Antigüedad</p>
 <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-[var(--text-primary)]">Deuda vencida por tramos</h3>
 </div>
 <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
 {formatCurrency(total)}
 </span>
 </div>
 <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-[var(--border)]">
 {buckets.map((bucket, index) =>
 bucket.total > 0 ? (
 <div key={bucket.label} style={{ width: `${(bucket.total / total) * 100}%`, backgroundColor: bucketColor[index] }} />
 ) : null,
 )}
 </div>
 <div className="grid gap-3 sm:grid-cols-4">
 {buckets.map((bucket, index) => (
 <div key={bucket.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
 <div className="mb-2 flex items-center gap-2">
 <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bucketColor[index] }} />
 <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">{bucket.label}</span>
 </div>
 <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(bucket.total)}</p>
 </div>
 ))}
 </div>
 </div>
 );
};

const CXPIndependiente = ({ user, userRole }) => {
 const { showToast } = useToast();
 const metrics = useTreasuryMetrics({ user });
 const { registerPayment: registerPayablePayment, markAsPaid: settlePayable } = usePayables(user);
 const { registerPayment: registerLegacyPayment, markAsCompleted: settleLegacyPayable } = useTransactionActions(user);

 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState('all');
 const [selectedRow, setSelectedRow] = useState(null);
 const [loadingId, setLoadingId] = useState(null);
 const [detailRecord, setDetailRecord] = useState(null);

 const rows = useMemo(() => {
 const source = metrics.payables;
 return source
 .filter((entry) => {
 if (statusFilter === 'partial') {
 if (entry.stage !== 'partial' && !(entry.paidAmount > 0 && entry.openAmount > 0)) return false;
 } else if (statusFilter !== 'all' && entry.status !== statusFilter) {
 return false;
 }
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
 .filter((entry) => entry.stage === 'partial' || (entry.paidAmount > 0 && entry.openAmount > 0))
 .reduce((sum, entry) => sum + entry.paidAmount, 0);
 const dueSoon = metrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0);

 const canAct = userRole === 'admin' || userRole === 'manager';

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
 if (result.success) showToast('Cuenta por pagar liquidada');
 else showToast('No se pudo liquidar la cuenta', 'error');
 } finally {
 setLoadingId(null);
 }
 };

 const handlePartialPayment = async (_transaction, paymentData) => {
 if (!selectedRow) return;
 let result = { success: false };
 if (selectedRow.source === 'payable') {
 result = await registerPayablePayment(selectedRow, paymentData);
 }
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
 <div className="flex flex-col items-center gap-3">
 <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--warning)] border-t-transparent" />
 <p className="text-sm text-[var(--text-secondary)]">Preparando cuentas por pagar...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 pb-12">
 <section className="rounded-xl border border-[var(--border)] bg-[var(--black)] px-6 py-7 ">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--warning)]">Cuentas por pagar</p>
 <h2 className="text-[32px] font-semibold tracking-tight text-[var(--text-primary)]">
 Control de pagos, deuda y vencimientos.{' '}
 <HelpButton title="Cuentas por pagar">
 <p><strong>Deuda abierta</strong> — Total de facturas por pagar que aun no se han liquidado.</p>
 <p><strong>Pagado parcial</strong> — Abonos ya realizados en facturas que aun no estan 100% pagadas.</p>
 <p><strong>Vencido</strong> — Pagos cuya fecha limite ya paso.</p>
 <p><strong>Ventana 14d</strong> — Pagos que vencen en los proximos 14 dias.</p>
 </HelpButton>
 </h2>
 <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-disabled)]">
 Revisa los compromisos abiertos y conviértelos en salida real solo cuando el pago se registra.
 </p>
 </div>
 </div>
 </section>

 <div className="grid gap-4 lg:grid-cols-4">
 <StatCard title="Deuda abierta" value={formatCurrency(totalOpen)} subtitle={`${openRows.length} documentos activos`} accent="var(--warning)" icon={BadgeEuro} onClick={() => setStatusFilter('all')} />
 <StatCard title="Pagado parcial" value={formatCurrency(totalPartial)} subtitle={totalPartial > 0 ? 'Abonos realizados en facturas aún no liquidadas' : 'Sin abonos parciales — todas pendientes o liquidadas'} accent="#999" icon={ArrowDownLeft} onClick={() => setStatusFilter('partial')} />
 <StatCard title="Vencido" value={formatCurrency(totalOverdue)} subtitle={`${metrics.overduePayables.length} documentos fuera de plazo`} accent="var(--accent)" icon={AlertTriangle} onClick={() => setStatusFilter('overdue')} />
 <StatCard title="Ventana 14d" value={formatCurrency(dueSoon)} subtitle={`${metrics.upcomingPayables.length} pagos proximos`} accent="var(--warning)" icon={Clock3} onClick={() => setStatusFilter('issued')} />
 </div>

 <AgingBar buckets={metrics.payablesAging} />

 <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
 <div className="relative w-full xl:max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)]" size={16} />
 <input
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)] focus:"
 placeholder="Buscar proveedor, documento o proyecto"
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
 <Filter size={14} />
 Estado
 </div>
 {filters.map((filter) => (
 <button
 key={filter.id}
 type="button"
 onClick={() => setStatusFilter(filter.id)}
 className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${
 statusFilter === filter.id
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--warning)]'
 : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
 }`}
 >
 {filter.label}
 </button>
 ))}
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[980px] text-left">
 <thead>
 <tr className="border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">
 <th className="px-4 py-3">Proveedor</th>
 <th className="px-4 py-3">Documento</th>
 <th className="px-4 py-3">Proyecto</th>
 <th className="px-4 py-3 text-right">Importe</th>
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
 <span
 className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
 row.status === 'settled'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--success)]'
 : row.status === 'overdue'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--accent)]'
 : row.status === 'partial'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--warning)]'
 : 'border-[var(--border-visible)] bg-[var(--surface)] text-[var(--text-secondary)]'
 }`}
 >
 {statusLabels[row.status]}
 </span>
 </td>
 <td className="px-4 py-4 text-center text-xs text-[var(--text-secondary)]">{row.source}</td>
 {canAct && (
 <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
 <div className="flex justify-end gap-2">
 <button
 type="button"
 disabled={!canSettle}
 onClick={() => setSelectedRow(row)}
 className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40"
 >
 Abono
 </button>
 <button
 type="button"
 disabled={!canSettle || loadingId === row.id}
 onClick={() => handleSettle(row)}
 className="rounded-full bg-[var(--text-primary)] px-3 py-2 text-xs font-semibold text-[var(--black)] transition-all hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
 >
 Liquidar
 </button>
 </div>
 </td>
 )}
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </section>

 <PartialPaymentModal
 isOpen={Boolean(selectedRow)}
 onClose={() => setSelectedRow(null)}
 transaction={
 selectedRow
 ? {
 id: selectedRow.legacyTransactionId || selectedRow.id,
 description: selectedRow.description || selectedRow.counterpartyName,
 amount: selectedRow.grossAmount,
 paidAmount: selectedRow.paidAmount,
 type: 'expense',
 }
 : null
 }
 onSubmit={handlePartialPayment}
 />

 <RecordDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} userRole={userRole} />
 </div>
 );
};

export default CXPIndependiente;
