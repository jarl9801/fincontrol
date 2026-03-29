import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeEuro,
  Clock3,
  Filter,
  Search,
} from 'lucide-react';
import PartialPaymentModal from '../../components/ui/PartialPaymentModal';
import { useToast } from '../../contexts/ToastContext';
import { useReceivables } from '../../hooks/useReceivables';
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

const bucketColor = ['#ff9f0a', '#ff6b35', '#ff453a', '#c81d25'];

const StatCard = ({ title, value, subtitle, accent, icon, onClick }) => {
  const IconComponent = icon;
  return (
    <div
      className={`rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/84 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)] ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(126,147,190,0.16)] transition-transform duration-200' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">{title}</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-[#101938]">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}20`, color: accent }}>
          <IconComponent size={18} />
        </div>
      </div>
      <p className="text-sm text-[#6b7a96]">{subtitle}</p>
    </div>
  );
};

const AgingBar = ({ buckets }) => {
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  if (total <= 0) return null;

  return (
    <div className="rounded-[26px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Antigüedad</p>
          <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-[#101938]">Cartera vencida por tramos</h3>
        </div>
        <span className="rounded-full border border-[rgba(201,214,238,0.82)] bg-white/84 px-2.5 py-1 text-xs font-semibold text-[#6b7a96]">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-[rgba(201,214,238,0.74)]">
        {buckets.map((bucket, index) =>
          bucket.total > 0 ? (
            <div key={bucket.label} style={{ width: `${(bucket.total / total) * 100}%`, backgroundColor: bucketColor[index] }} />
          ) : null,
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {buckets.map((bucket, index) => (
          <div key={bucket.label} className="rounded-[20px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-3 py-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bucketColor[index] }} />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6980ac]">{bucket.label}</span>
            </div>
            <p className="text-sm font-semibold text-[#101938]">{formatCurrency(bucket.total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CXCIndependiente = ({ user, userRole }) => {
  const { showToast } = useToast();
  const metrics = useTreasuryMetrics({ user });
  const { registerPayment: registerReceivablePayment, markAsPaid: settleReceivable } = useReceivables(user);
  const { registerPayment: registerLegacyPayment, markAsCompleted: settleLegacyReceivable } = useTransactionActions(user);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const rows = useMemo(() => {
    const source = metrics.receivables;
    return source
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
  }, [metrics.receivables, searchTerm, statusFilter]);

  const openRows = metrics.receivables.filter((entry) => ['issued', 'partial', 'overdue'].includes(entry.status));
  const totalOpen = openRows.reduce((sum, entry) => sum + entry.openAmount, 0);
  const totalOverdue = metrics.overdueReceivables.reduce((sum, entry) => sum + entry.openAmount, 0);
  const totalPartial = metrics.receivables
    .filter((entry) => entry.stage === 'partial')
    .reduce((sum, entry) => sum + entry.paidAmount, 0);
  const dueSoon = metrics.upcomingReceivables.reduce((sum, entry) => sum + entry.openAmount, 0);

  const canAct = userRole === 'admin' || userRole === 'manager';

  const handleSettle = async (row) => {
    if (loadingId) return;
    setLoadingId(row.id);
    try {
      let result = { success: false };
      if (row.source === 'receivable') result = await settleReceivable(row);
      if (row.source === 'legacy-transaction') {
        result = await settleLegacyReceivable({
          id: row.legacyTransactionId,
          amount: row.grossAmount,
          type: 'income',
        });
      }
      if (result.success) showToast('Cuenta por cobrar liquidada');
      else showToast('No se pudo liquidar la cuenta', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handlePartialPayment = async (_transaction, paymentData) => {
    if (!selectedRow) return;
    let result = { success: false };
    if (selectedRow.source === 'receivable') {
      result = await registerReceivablePayment(selectedRow, paymentData);
    }
    if (selectedRow.source === 'legacy-transaction') {
      result = await registerLegacyPayment(
        {
          id: selectedRow.legacyTransactionId,
          amount: selectedRow.grossAmount,
          paidAmount: selectedRow.paidAmount,
          type: 'income',
        },
        paymentData,
      );
    }
    if (result.success) showToast('Cobro parcial registrado');
    else showToast('No se pudo registrar el cobro', 'error');
  };

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#30d158] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Preparando cuentas por cobrar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(214,248,221,0.26),transparent_22%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.28),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4f9b68]">Cuentas por cobrar</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-[#101938]">Seguimiento de cobros, abonos y vencimientos.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5f7091]">
              Controla la cartera abierta y convierte cada factura en caja solo cuando el cobro realmente ocurre.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Cartera abierta" value={formatCurrency(totalOpen)} subtitle={`${openRows.length} documentos activos`} accent="#30d158" icon={BadgeEuro} onClick={() => setStatusFilter('all')} />
        <StatCard title="Cobrado parcial" value={formatCurrency(totalPartial)} subtitle="Importe ya ingresado sobre documentos abiertos" accent="#64d2ff" icon={ArrowUpRight} />
        <StatCard title="Vencido" value={formatCurrency(totalOverdue)} subtitle={`${metrics.overdueReceivables.length} documentos fuera de plazo`} accent="#ff453a" icon={AlertTriangle} onClick={() => setStatusFilter('overdue')} />
        <StatCard title="Ventana 14d" value={formatCurrency(dueSoon)} subtitle={`${metrics.upcomingReceivables.length} cobros proximos`} accent="#ff9f0a" icon={Clock3} onClick={() => setStatusFilter('issued')} />
      </div>

      <AgingBar buckets={metrics.receivablesAging} />

      <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
        <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8dae]" size={16} />
            <input
              className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 py-3 pl-10 pr-4 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              placeholder="Buscar cliente, documento o proyecto"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,214,238,0.82)] bg-white/82 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6980ac]">
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
                    ? 'border-[rgba(15,143,75,0.24)] bg-[rgba(15,143,75,0.1)] text-[#0f8f4b]'
                    : 'border-[rgba(201,214,238,0.82)] bg-white/82 text-[#6b7a96] hover:bg-white hover:text-[#101938]'
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
              <tr className="border-b border-[rgba(201,214,238,0.78)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">
                <th className="px-4 py-3">Cliente</th>
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
            <tbody className="divide-y divide-[rgba(201,214,238,0.58)]">
              {rows.map((row) => {
                const canSettle = row.source !== 'legacy-opening' && row.status !== 'settled' && row.status !== 'cancelled';
                return (
                  <tr key={row.id} className="hover:bg-[rgba(90,141,221,0.04)]">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-[#101938]">{row.counterpartyName}</p>
                      <p className="text-xs text-[#6b7a96]">{row.description || 'Sin descripción'}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#16223f]">{row.documentNumber || 'Sin documento'}</td>
                    <td className="px-4 py-4 text-sm text-[#6b7a96]">{row.projectName || 'Sin proyecto'}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-[#101938]">{formatCurrency(row.grossAmount)}</td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-[#3156d3]">{formatCurrency(row.openAmount)}</td>
                    <td className="px-4 py-4 text-center text-sm text-[#6b7a96]">{row.dueDate ? formatDate(row.dueDate) : 'Sin fecha'}</td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          row.status === 'settled'
                            ? 'border-[rgba(48,209,88,0.2)] bg-[rgba(48,209,88,0.12)] text-[#30d158]'
                            : row.status === 'overdue'
                              ? 'border-[rgba(255,69,58,0.2)] bg-[rgba(255,69,58,0.12)] text-[#ff453a]'
                              : row.status === 'partial'
                                ? 'border-[rgba(255,159,10,0.2)] bg-[rgba(255,159,10,0.12)] text-[#ff9f0a]'
                                : 'border-[rgba(100,210,255,0.2)] bg-[rgba(100,210,255,0.12)] text-[#64d2ff]'
                        }`}
                      >
                        {statusLabels[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-xs text-[#6b7a96]">{row.source}</td>
                    {canAct && (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={!canSettle}
                            onClick={() => setSelectedRow(row)}
                            className="rounded-full border border-[rgba(201,214,238,0.82)] bg-white/82 px-3 py-2 text-xs font-semibold text-[#6b7a96] transition-all hover:bg-white hover:text-[#101938] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Abono
                          </button>
                          <button
                            type="button"
                            disabled={!canSettle || loadingId === row.id}
                            onClick={() => handleSettle(row)}
                            className="rounded-full bg-[#3156d3] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#2748b6] disabled:cursor-not-allowed disabled:opacity-40"
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
                type: 'income',
              }
            : null
        }
        onSubmit={handlePartialPayment}
      />
    </div>
  );
};

export default CXCIndependiente;
