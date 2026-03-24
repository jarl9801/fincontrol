import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Landmark,
  Plus,
  Scale,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useReconciliation } from '../../hooks/useReconciliation';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const Conciliacion = ({ user, userRole }) => {
  const { showToast } = useToast();
  const metrics = useTreasuryMetrics({ user });
  const { reconciliations, loading, createReconciliation, markReconciled } = useReconciliation(user);

  const [month, setMonth] = useState(currentMonth());
  const [bankBalance, setBankBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canAct = userRole === 'admin';

  const monthMovements = useMemo(
    () =>
      metrics.unreconciledMovements.filter((entry) => (entry.postedDate || '').slice(0, 7) === month),
    [metrics.unreconciledMovements, month],
  );

  const selectedMovements = monthMovements.filter((entry) => selectedIds.includes(entry.id));
  const selectedNet = selectedMovements.reduce(
    (sum, entry) => sum + (entry.direction === 'out' ? -entry.amount : entry.amount),
    0,
  );
  const declaredBankBalance = Number(bankBalance || 0);
  const discrepancy = declaredBankBalance - metrics.currentCash;

  const toggleMovement = (movementId) => {
    setSelectedIds((current) =>
      current.includes(movementId)
        ? current.filter((entry) => entry !== movementId)
        : [...current, movementId],
    );
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canAct || submitting) return;

    setSubmitting(true);
    try {
      const result = await createReconciliation({
        month,
        bankBalance: declaredBankBalance,
        systemBalance: metrics.currentCash,
        movementIds: selectedIds,
        unreconciledItems: monthMovements
          .filter((entry) => !selectedIds.includes(entry.id))
          .map((entry) => ({ id: entry.id, description: entry.description, amount: entry.amount })),
        notes,
      });

      if (!result.success) {
        showToast('No se pudo crear la conciliacion', 'error');
        return;
      }

      showToast('Conciliacion creada');
      setBankBalance('');
      setNotes('');
      setSelectedIds([]);
    } finally {
      setSubmitting(false);
    }
  };

  if (metrics.loading || loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Preparando conciliación bancaria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(185,248,238,0.22),transparent_22%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Conciliación</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-[#101938]">Saldo bancario frente al saldo operativo.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5f7091]">
              Cierra cada mes con los movimientos reales y detecta cualquier diferencia entre el banco y el control interno.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Saldo sistema</p>
            <Landmark size={18} className="text-[#3156d3]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">{formatCurrency(metrics.currentCash)}</p>
          <p className="mt-2 text-sm text-[#6b7a96]">Saldo disponible según los movimientos confirmados.</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Pendientes</p>
            <AlertTriangle size={18} className="text-[#c46a19]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">{metrics.unreconciledMovements.length}</p>
          <p className="mt-2 text-sm text-[#6b7a96]">Movimientos bancarios aún no conciliados.</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Meses conciliados</p>
            <CheckCircle2 size={18} className="text-[#0f8f4b]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">
            {reconciliations.filter((entry) => entry.status === 'reconciled').length}
          </p>
          <p className="mt-2 text-sm text-[#6b7a96]">Cierres ya validados por el equipo.</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Diferencia actual</p>
            <Scale size={18} className="text-[#d46a13]" />
          </div>
          <p className={`text-[28px] font-semibold tracking-tight ${discrepancy === 0 ? 'text-[#101938]' : 'text-[#d46a13]'}`}>
            {bankBalance ? formatCurrency(discrepancy) : 'N/A'}
          </p>
          <p className="mt-2 text-sm text-[#6b7a96]">Se calcula contra el saldo bancario declarado en el formulario.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          <div className="mb-5">
            <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Nuevo cierre mensual</h3>
            <p className="mt-1 text-sm text-[#6b7a96]">
              Selecciona los movimientos del mes, declara el saldo del banco y deja registrada la discrepancia.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Mes</span>
              <input
                type="month"
                className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Saldo bancario real</span>
              <input
                required
                type="number"
                step="0.01"
                className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={bankBalance}
                onChange={(event) => setBankBalance(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Notas</span>
              <textarea
                rows={3}
                className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Saldo sistema</p>
                <p className="mt-2 text-sm font-semibold text-[#101938]">{formatCurrency(metrics.currentCash)}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Movimientos seleccionados</p>
                <p className="mt-2 text-sm font-semibold text-[#101938]">{selectedIds.length}</p>
              </div>
              <div className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Neto seleccionado</p>
                <p className="mt-2 text-sm font-semibold text-[#101938]">{formatCurrency(selectedNet)}</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canAct || submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#3156d3] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#2748b6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={16} />
              Crear conciliación
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          <div className="mb-5">
            <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Movimientos pendientes del mes</h3>
            <p className="mt-1 text-sm text-[#6b7a96]">
              Selecciona los movimientos que quedarán cubiertos por el cierre mensual {month}.
            </p>
          </div>

          <div className="space-y-3">
            {monthMovements.length === 0 && (
              <div className="rounded-[22px] border border-dashed border-[rgba(201,214,238,0.78)] px-4 py-10 text-center text-sm text-[#6b7a96]">
                No hay movimientos pendientes para este mes.
              </div>
            )}
            {monthMovements.map((movement) => {
              const selected = selectedIds.includes(movement.id);
              return (
                <button
                  key={movement.id}
                  type="button"
                  onClick={() => toggleMovement(movement.id)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition-all ${
                    selected
                      ? 'border-[rgba(90,141,221,0.28)] bg-[rgba(90,141,221,0.1)]'
                      : 'border-[rgba(201,214,238,0.74)] bg-white/78 hover:bg-white'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${movement.direction === 'in' ? 'bg-[#30d158]' : 'bg-[#ff9f0a]'}`} />
                      <span className="text-sm font-semibold text-[#101938]">{movement.description || 'Movimiento sin descripción'}</span>
                    </div>
                    <span className={`text-sm font-semibold ${movement.direction === 'in' ? 'text-[#0f8f4b]' : 'text-[#c46a19]'}`}>
                      {movement.direction === 'in' ? '+' : '-'}
                      {formatCurrency(movement.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7a96]">
                    {movement.counterpartyName || 'Sin contraparte'} · {formatDate(movement.postedDate)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
        <div className="mb-5">
          <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Historial de conciliaciones</h3>
          <p className="mt-1 text-sm text-[#6b7a96]">Los cierres abiertos pueden marcarse como conciliados cuando el banco ya cuadra.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-[rgba(201,214,238,0.78)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3 text-right">Banco</th>
                <th className="px-4 py-3 text-right">Sistema</th>
                <th className="px-4 py-3 text-right">Discrepancia</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3">Notas</th>
                {canAct && <th className="px-4 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,214,238,0.58)]">
              {reconciliations.map((entry) => (
                <tr key={entry.id} className="hover:bg-[rgba(90,141,221,0.04)]">
                  <td className="px-4 py-4 text-sm font-semibold text-[#101938]">{entry.month}</td>
                  <td className="px-4 py-4 text-right text-sm text-[#101938]">{formatCurrency(entry.bankBalance)}</td>
                  <td className="px-4 py-4 text-right text-sm text-[#101938]">{formatCurrency(entry.systemBalance)}</td>
                  <td className={`px-4 py-4 text-right text-sm font-semibold ${Math.abs(entry.discrepancy) < 1 ? 'text-[#0f8f4b]' : 'text-[#d46a13]'}`}>
                    {formatCurrency(entry.discrepancy)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        entry.status === 'reconciled'
                          ? 'border-[rgba(48,209,88,0.2)] bg-[rgba(48,209,88,0.12)] text-[#30d158]'
                          : 'border-[rgba(255,159,10,0.2)] bg-[rgba(255,159,10,0.12)] text-[#ff9f0a]'
                      }`}
                    >
                      {entry.status === 'reconciled' ? 'Conciliado' : 'Abierto'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#6b7a96]">{entry.notes || '-'}</td>
                  {canAct && (
                    <td className="px-4 py-4 text-right">
                      {entry.status !== 'reconciled' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await markReconciled(entry.id, entry.movementIds || []);
                            if (result.success) showToast('Conciliación cerrada');
                            else showToast('No se pudo cerrar la conciliación', 'error');
                          }}
                          className="rounded-full bg-[#3156d3] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#2748b6]"
                        >
                          Marcar conciliado
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Conciliacion;
