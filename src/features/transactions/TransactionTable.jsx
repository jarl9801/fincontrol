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
    <section className="overflow-hidden rounded-[28px] border border-[rgba(205,219,243,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,255,0.8))] shadow-[0_24px_64px_rgba(126,147,190,0.12)] backdrop-blur-2xl">
      <div className="border-b border-[rgba(201,214,238,0.72)] px-4 py-3 text-[12px] text-[#6b7a96]">
        {loadingLedger
          ? 'Sincronizando registros...'
          : userRole === 'admin'
            ? 'Vista unificada: los registros actuales se mantienen desde aquí y el histórico integrado queda protegido.'
            : 'Mesa unificada de registros financieros.'}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block">
        <table className="w-full text-left">
          <thead className="border-b border-[rgba(201,214,238,0.72)] bg-[rgba(244,248,255,0.88)]">
            <tr>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Fecha</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Registro</th>
              <th className="px-4 py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Categoría</th>
              <th className="px-4 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Monto</th>
              <th className="px-4 py-3.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Estado</th>
              <th className="px-4 py-3.5 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(201,214,238,0.58)]">
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
                  <div className="mx-auto max-w-md">
                    <p className="text-[14px] font-semibold text-[#101938]">No se encontraron registros</p>
                    <p className="mt-2 text-[13px] leading-6 text-[#6b7a96]">
                      Ajusta la búsqueda o limpia los filtros para volver a la vista completa de registros.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-4 inline-flex items-center gap-2 rounded-[16px] border border-[rgba(201,214,238,0.82)] bg-white/80 px-4 py-2.5 text-[13px] font-medium text-[#3156d3] transition-colors hover:bg-white hover:text-[#101938]"
                    >
                      <RotateCcw size={14} />
                      Limpiar filtros
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden divide-y divide-[rgba(201,214,238,0.58)]">
        {filteredRecords.map((record) => {
          const isIncome = record.type === 'income';
          const normalizedStatus = (record.status || '').toLowerCase();
          const statusColors = normalizedStatus === 'paid'
            ? 'bg-[rgba(208,244,220,0.72)] text-[#0f8f4b]'
            : normalizedStatus === 'partial'
              ? 'bg-[rgba(255,239,209,0.82)] text-[#d46a13]'
              : ['overdue'].includes(normalizedStatus)
                ? 'bg-[rgba(255,234,231,0.9)] text-[#cc4b3f]'
                : 'bg-[rgba(255,244,223,0.88)] text-[#c47a09]';
          return (
            <div key={record.id} className="px-4 py-4 hover:bg-[rgba(90,141,221,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#101938] leading-snug">{record.description}</p>
                  <p className="mt-1 text-[11px] text-[#6b7a96]">
                    {record.date ? new Date(record.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''} · {record.categoryLabel || record.category}
                  </p>
                  {record.project && record.project !== 'Sin proyecto' && (
                    <p className="mt-0.5 text-[10px] text-[#7b8cab]">{record.project}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`text-[14px] font-bold ${isIncome ? 'text-[#0f8f4b]' : 'text-[#cc4b3f]'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(record.amount)}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors}`}>
                    {record.statusLabel || record.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredRecords.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-[14px] font-semibold text-[#101938]">No se encontraron registros</p>
            <p className="mt-2 text-[13px] leading-6 text-[#6b7a96]">Ajusta la búsqueda o limpia los filtros.</p>
            <button type="button" onClick={resetFilters} className="mt-4 inline-flex items-center gap-2 rounded-[16px] border border-[rgba(201,214,238,0.82)] bg-white/80 px-4 py-2.5 text-[13px] font-medium text-[#3156d3]">
              <RotateCcw size={14} /> Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default TransactionTable;
