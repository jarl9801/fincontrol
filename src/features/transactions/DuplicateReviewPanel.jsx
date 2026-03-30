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
    <section className="space-y-4 rounded-[28px] border border-[rgba(208,76,54,0.18)] bg-[rgba(255,248,246,0.94)] p-5 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
      <div className="flex items-center gap-2">
        <RotateCcw size={18} className="text-[#d04c36]" />
        <h3 className="text-[15px] font-semibold text-[#101938]">
          {duplicateGroups.length} grupo{duplicateGroups.length !== 1 ? 's' : ''} de posibles duplicados
        </h3>
      </div>
      <p className="text-[12px] text-[#6b7a96]">
        Revisa cada grupo. Elige cuál registro conservar y elimina el duplicado.
      </p>
      {duplicateGroups.map((group, gIdx) => (
        <div key={gIdx} className="rounded-2xl border border-[rgba(201,214,238,0.74)] bg-white/90 p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d04c36]">
            Grupo {gIdx + 1} — €{group.original.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} · {group.original.type === 'income' ? 'Ingreso' : 'Gasto'}
          </p>
          <div className="space-y-2">
            {[group.original, ...group.duplicates].map((record) => (
              <div key={record.id} className="flex items-center gap-3 rounded-xl border border-[rgba(201,214,238,0.6)] bg-[rgba(247,250,255,0.9)] px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#101938]">{safeString(record.description)}</p>
                  <p className="mt-0.5 text-[11px] text-[#6b7a96]">
                    {record.date} · {record.project || 'Sin proyecto'} · {record.recordFamilyLabel || record.recordFamily}
                    {record.lastEditor ? ` · ${record.lastEditor}` : ''}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-[13px] font-bold ${record.type === 'income' ? 'text-[#0f8f4b]' : 'text-[#d04c36]'}`}>
                  €{record.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </span>
                <span className="flex-shrink-0 rounded-full border border-[rgba(201,214,238,0.6)] bg-white px-2 py-0.5 text-[10px] text-[#6b7a96]">
                  {record.statusLabel || record.status}
                </span>
                <button
                  onClick={() => onDelete(record)}
                  className="flex-shrink-0 rounded-xl bg-[#d04c36] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#b8412f]"
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
