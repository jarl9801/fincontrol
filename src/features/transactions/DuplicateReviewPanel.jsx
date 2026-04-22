import React from 'react';
import { RotateCcw } from 'lucide-react';

const safeString = (value) => {
 if (value == null) return '';
 if (typeof value === 'object') return JSON.stringify(value);
 return String(value);
};

const DuplicateReviewPanel = ({ duplicateGroups, onDelete }) => {
 if (duplicateGroups.length === 0) return null;

 return (
 <section className="space-y-4 rounded-md border border-[var(--border-visible)] bg-transparent p-5 ">
 <div className="flex items-center gap-2">
 <RotateCcw size={18} className="text-[var(--accent)]" />
 <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">
 {duplicateGroups.length} grupo{duplicateGroups.length !== 1 ? 's' : ''} de posibles duplicados
 </h3>
 </div>
 <p className="text-[12px] text-[var(--text-secondary)]">
 Revisa cada grupo. Elige cuál registro conservar y elimina el duplicado.
 </p>
 {duplicateGroups.map((group, gIdx) => (
 <div key={gIdx} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
 <p className="mb-3 nd-label text-[var(--accent)]">
 Grupo {gIdx + 1} — €{group.original.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} · {group.original.type === 'income' ? 'Ingreso' : 'Gasto'}
 </p>
 <div className="space-y-2">
 {[group.original, ...group.duplicates].map((record) => (
 <div key={record.id} className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
 <div className="flex-1 min-w-0">
 <p className="truncate text-[13px] font-medium text-[var(--text-primary)]">{safeString(record.description)}</p>
 <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
 {record.date} · {record.project || 'Sin proyecto'} · {record.recordFamilyLabel || record.recordFamily}
 {record.lastEditor ? ` · ${record.lastEditor}` : ''}
 </p>
 </div>
 <span className={`flex-shrink-0 text-[13px] font-bold ${record.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 €{record.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
 </span>
 <span className="flex-shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
 {record.statusLabel || record.status}
 </span>
 <button
 onClick={() => onDelete(record)}
 className="flex-shrink-0 rounded-md bg-[var(--accent)] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[var(--accent)]"
 >
 Eliminar
 </button>
 </div>
 ))}
 </div>
 </div>
 ))}
 </section>
 );
};

export default DuplicateReviewPanel;
