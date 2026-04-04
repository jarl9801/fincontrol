import React from 'react';
import { RotateCcw } from 'lucide-react';
import TransactionRow from '../../components/ui/TransactionRow';
import { formatCurrency } from '../../utils/formatters';

const TransactionTable = ({
 filteredRecords,
 loadingLedger,
 userRole,
 searchTerm,
 resetFilters,
 onDelete,
 onEdit,
 onViewNotes,
 onViewAuditTrail,
 onRegisterPayment,
 onVoid,
 onChangeStatus,
 onViewDetail,
}) => {
 return (
 <section className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
 <div className="border-b border-[var(--border)] px-4 py-2.5 flex items-center justify-between gap-4">
 <span className="font-[Space_Mono] text-[11px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">
 {loadingLedger
 ? 'Sincronizando registros...'
 : `${filteredRecords.length} registros`}
 </span>
 {!loadingLedger && filteredRecords.length > 0 && (
 <div className="flex items-center gap-4">
 <span className="font-[Space_Mono] text-[11px] tabular-nums text-[var(--success)]">
 +{formatCurrency(filteredRecords.filter(r => r.type === 'income').reduce((s, r) => s + Number(r.amount || 0), 0))}
 </span>
 <span className="font-[Space_Mono] text-[11px] tabular-nums text-[var(--negative)]">
 -{formatCurrency(filteredRecords.filter(r => r.type !== 'income').reduce((s, r) => s + Number(r.amount || 0), 0))}
 </span>
 </div>
 )}
 </div>

 {/* Desktop table */}
 <div className="hidden lg:block">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-[var(--border-visible)]">
 <th className="px-4 py-3 font-[Space_Mono] text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-secondary)]">Fecha</th>
 <th className="px-4 py-3 font-[Space_Mono] text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-secondary)]">Registro</th>
 <th className="px-4 py-3 font-[Space_Mono] text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-secondary)]">Categoria</th>
 <th className="px-4 py-3 text-right font-[Space_Mono] text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-secondary)]">Monto</th>
 <th className="px-4 py-3 text-center font-[Space_Mono] text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-secondary)]">Estado</th>
 <th className="px-4 py-3 text-center font-[Space_Mono] text-[11px] font-normal uppercase tracking-[0.08em] text-[var(--text-secondary)]">Acciones</th>
 </tr>
 </thead>
 <tbody>
 {filteredRecords.map((record) => (
 <TransactionRow
 key={record.id}
 t={record}
 onDelete={onDelete}
 onEdit={onEdit}
 onViewNotes={onViewNotes}
 onViewAuditTrail={onViewAuditTrail}
 onRegisterPayment={onRegisterPayment}
 onVoid={onVoid}
 onChangeStatus={onChangeStatus}
 onViewDetail={onViewDetail}
 userRole={userRole}
 searchTerm={searchTerm}
 />
 ))}

 {filteredRecords.length === 0 && (
 <tr>
 <td colSpan="6" className="px-4 py-16 text-center">
 <p className="font-[Space_Mono] text-[13px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">
 No hay transacciones que mostrar.
 </p>
 <p className="mt-2 text-[13px] text-[var(--text-disabled)]">
 Prueba ajustar los filtros o importa nuevos registros.
 </p>
 <button
 type="button"
 onClick={resetFilters}
 className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-visible)] px-4 py-2 font-[Space_Mono] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]"
 >
 <RotateCcw size={12} />
 Limpiar filtros
 </button>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 {/* Mobile card list */}
 <div className="lg:hidden">
 {filteredRecords.map((record, i) => {
 const isIncome = record.type === 'income';
 const normalizedStatus = (record.status || '').toLowerCase();
 const statusColor =
 normalizedStatus === 'paid' ? 'var(--success)'
 : normalizedStatus === 'partial' ? 'var(--warning)'
 : ['overdue'].includes(normalizedStatus) ? 'var(--accent)'
 : 'var(--text-secondary)';
 return (
 <div
 key={record.id}
 className={`px-4 py-3.5 transition-colors hover:bg-[var(--surface-raised)] ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
 onClick={() => onViewDetail?.(record)}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <p className="text-[13px] text-[var(--text-primary)] leading-snug">{record.description}</p>
 <p className="mt-1 font-[Space_Mono] text-[11px] text-[var(--text-disabled)]">
 {record.date ? new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''} · {record.categoryLabel || record.category}
 </p>
 </div>
 <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
 <span className="font-[Space_Mono] text-[14px] font-bold tabular-nums text-[var(--text-primary)]">
 {isIncome ? '+' : '-'}{formatCurrency(record.amount)}
 </span>
 <span
 className="font-[Space_Mono] text-[10px] uppercase tracking-[0.06em]"
 style={{ color: statusColor }}
 >
 {record.statusLabel || record.status}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 {filteredRecords.length === 0 && (
 <div className="px-4 py-16 text-center">
 <p className="font-[Space_Mono] text-[13px] uppercase tracking-[0.08em] text-[var(--text-disabled)]">No hay transacciones que mostrar.</p>
 <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-visible)] px-4 py-2 font-[Space_Mono] text-[11px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
 <RotateCcw size={12} /> Limpiar filtros
 </button>
 </div>
 )}
 </div>
 </section>
 );
};

export default TransactionTable;
