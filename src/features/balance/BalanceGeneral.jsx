import React, { useMemo } from 'react';
import {
  Scale, Landmark, Wallet, Building2, TrendingUp,
  CheckCircle2, XCircle, RefreshCw, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useTransactions } from '../../hooks/useTransactions';
import { useReceivables } from '../../hooks/useReceivables';
import { usePayables } from '../../hooks/usePayables';

// ─── Constants ───────────────────────────────────────────────────────────────

const STARTING_BALANCE = 28450;
const CAPITAL_SOCIAL = 25000;

// ─── Section Card ────────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, iconColor, items, total, totalLabel, accentColor }) => (
  <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: `${accentColor}15` }}>
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <h3 className="text-sm font-semibold text-[#c7c7cc]">{title}</h3>
    </div>

    {/* Line Items */}
    <div className="flex-1 p-5 space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronRight size={12} className="text-[#636366]" />
            <span className="text-[13px] text-[#c7c7cc]">{item.label}</span>
          </div>
          <span className="text-[13px] font-medium text-[#e5e5ea] tabular-nums">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>

    {/* Total */}
    <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.06)] bg-[#111111]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">
          {totalLabel}
        </span>
        <span className="text-lg font-bold tabular-nums" style={{ color: accentColor }}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const BalanceGeneral = ({ user, userRole }) => {
  const { allTransactions, loading: txLoading } = useAllTransactions(user);
  const { transactions, loading: txRtLoading } = useTransactions(user);
  const { receivables, loading: rxLoading } = useReceivables(user);
  const { payables, loading: pxLoading } = usePayables(user);

  const loading = txLoading || txRtLoading || rxLoading || pxLoading;

  // ── Calculations ─────────────────────────────────────────────────────────

  const balanceData = useMemo(() => {
    if (loading) return null;

    // Caja/Bancos: starting balance + net of non-pending transactions
    const netCashFlow = allTransactions.reduce((acc, t) => {
      if (t.status === 'pending') return acc;
      const amount = parseFloat(t.amount) || 0;
      return acc + (t.type === 'income' ? amount : -amount);
    }, 0);
    const cajaBancos = STARTING_BALANCE + netCashFlow;

    // CXC: pending receivables collection
    const cxcFromRx = receivables
      .filter(r => r.status !== 'paid')
      .reduce((acc, r) => acc + (parseFloat(r.pendingAmount) || 0), 0);

    // CXC: pending income transactions (not already linked to receivables)
    const linkedRxIds = new Set(
      receivables.filter(r => r.linkedTransactionId).map(r => r.linkedTransactionId)
    );
    const cxcFromTx = transactions
      .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial') && !linkedRxIds.has(t.id))
      .reduce((acc, t) => acc + ((parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0)), 0);

    const cxc = cxcFromRx + cxcFromTx;

    // Total Activos
    const totalActivos = cajaBancos + cxc;

    // CXP: pending payables collection
    const cxpFromPx = payables
      .filter(p => p.status !== 'paid')
      .reduce((acc, p) => acc + (parseFloat(p.pendingAmount) || 0), 0);

    // CXP: pending expense transactions (not already linked to payables)
    const linkedPxIds = new Set(
      payables.filter(p => p.linkedTransactionId).map(p => p.linkedTransactionId)
    );
    const cxpFromTx = transactions
      .filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'partial') && !linkedPxIds.has(t.id))
      .reduce((acc, t) => acc + ((parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0)), 0);

    const cxp = cxpFromPx + cxpFromTx;

    // Total Pasivos
    const totalPasivos = cxp;

    // Utilidades Acumuladas: total income - total expenses
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const totalExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const utilidadesAcumuladas = totalIncome - totalExpenses;

    // Total Patrimonio
    const totalPatrimonio = CAPITAL_SOCIAL + utilidadesAcumuladas;

    // Verification: Activos = Pasivos + Patrimonio
    const diff = Math.abs(totalActivos - (totalPasivos + totalPatrimonio));
    const isBalanced = diff < 0.01;

    return {
      cajaBancos,
      cxc,
      totalActivos,
      cxp,
      totalPasivos,
      capitalSocial: CAPITAL_SOCIAL,
      utilidadesAcumuladas,
      totalPatrimonio,
      isBalanced,
      diff,
    };
  }, [allTransactions, transactions, receivables, payables, loading]);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 text-[#30d158] animate-spin" />
          <p className="text-[#8e8e93] text-sm">Cargando balance general...</p>
        </div>
      </div>
    );
  }

  if (!balanceData) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-[#636366] text-sm">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Balance General</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">
            Estado de situaci&oacute;n financiera &mdash; {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {/* Verification Badge */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
          balanceData.isBalanced
            ? 'bg-[rgba(48,209,88,0.08)] border-[rgba(48,209,88,0.2)]'
            : 'bg-[rgba(255,69,58,0.08)] border-[rgba(255,69,58,0.2)]'
        }`}>
          {balanceData.isBalanced ? (
            <>
              <CheckCircle2 size={16} className="text-[#30d158]" />
              <span className="text-xs font-semibold text-[#30d158]">Ecuaci&oacute;n Contable Verificada</span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-[#ff453a]" />
              <span className="text-xs font-semibold text-[#ff453a]">
                Descuadre: {formatCurrency(balanceData.diff)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Accounting Equation Summary */}
      <div className="bg-[rgba(28,28,30,0.8)] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]" style={{ backdropFilter: 'blur(40px)' }}>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">Activos</p>
            <p className="text-xl font-bold text-[#0a84ff]">{formatCurrency(balanceData.totalActivos)}</p>
          </div>
          <span className="text-lg font-bold text-[#636366]">=</span>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">Pasivos</p>
            <p className="text-xl font-bold text-[#ff453a]">{formatCurrency(balanceData.totalPasivos)}</p>
          </div>
          <span className="text-lg font-bold text-[#636366]">+</span>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">Patrimonio</p>
            <p className="text-xl font-bold text-[#30d158]">{formatCurrency(balanceData.totalPatrimonio)}</p>
          </div>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activos */}
        <SectionCard
          title="Activos"
          icon={Wallet}
          iconColor="#0a84ff"
          accentColor="#0a84ff"
          items={[
            { label: 'Caja / Bancos', value: balanceData.cajaBancos },
            { label: 'Cuentas por Cobrar (CXC)', value: balanceData.cxc },
          ]}
          total={balanceData.totalActivos}
          totalLabel="Total Activos"
        />

        {/* Pasivos */}
        <SectionCard
          title="Pasivos"
          icon={Landmark}
          iconColor="#ff453a"
          accentColor="#ff453a"
          items={[
            { label: 'Cuentas por Pagar (CXP)', value: balanceData.cxp },
          ]}
          total={balanceData.totalPasivos}
          totalLabel="Total Pasivos"
        />

        {/* Patrimonio */}
        <SectionCard
          title="Patrimonio"
          icon={Building2}
          iconColor="#30d158"
          accentColor="#30d158"
          items={[
            { label: 'Capital Social', value: balanceData.capitalSocial },
            { label: 'Utilidades Acumuladas', value: balanceData.utilidadesAcumuladas },
          ]}
          total={balanceData.totalPatrimonio}
          totalLabel="Total Patrimonio"
        />
      </div>

      {/* Detail Breakdown Table */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
          <Scale size={16} className="text-[#8e8e93]" />
          <h3 className="text-sm font-semibold text-[#c7c7cc]">Detalle del Balance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#111111] text-[#636366] text-xs uppercase tracking-wider">
                <th className="text-left px-6 py-3 font-semibold">Cuenta</th>
                <th className="text-right px-6 py-3 font-semibold">Monto</th>
                <th className="text-right px-6 py-3 font-semibold">% del Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
              {/* Activos Section */}
              <tr className="bg-[rgba(10,132,255,0.04)]">
                <td colSpan={3} className="px-6 py-2 text-xs font-bold text-[#0a84ff] uppercase tracking-wider">
                  Activos
                </td>
              </tr>
              <tr className="hover:bg-[#111111] transition-colors">
                <td className="px-6 py-3 text-[#c7c7cc] pl-10">Caja / Bancos</td>
                <td className="px-6 py-3 text-right text-[#e5e5ea] font-medium tabular-nums">
                  {formatCurrency(balanceData.cajaBancos)}
                </td>
                <td className="px-6 py-3 text-right text-[#8e8e93] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((balanceData.cajaBancos / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
              <tr className="hover:bg-[#111111] transition-colors">
                <td className="px-6 py-3 text-[#c7c7cc] pl-10">Cuentas por Cobrar</td>
                <td className="px-6 py-3 text-right text-[#e5e5ea] font-medium tabular-nums">
                  {formatCurrency(balanceData.cxc)}
                </td>
                <td className="px-6 py-3 text-right text-[#8e8e93] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((balanceData.cxc / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
              <tr className="border-t-2 border-[rgba(10,132,255,0.2)] bg-[rgba(10,132,255,0.04)]">
                <td className="px-6 py-3 font-bold text-[#0a84ff]">Total Activos</td>
                <td className="px-6 py-3 text-right font-bold text-[#0a84ff] tabular-nums">
                  {formatCurrency(balanceData.totalActivos)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-[#0a84ff]">100.0%</td>
              </tr>

              {/* Pasivos Section */}
              <tr className="bg-[rgba(255,69,58,0.04)]">
                <td colSpan={3} className="px-6 py-2 text-xs font-bold text-[#ff453a] uppercase tracking-wider">
                  Pasivos
                </td>
              </tr>
              <tr className="hover:bg-[#111111] transition-colors">
                <td className="px-6 py-3 text-[#c7c7cc] pl-10">Cuentas por Pagar</td>
                <td className="px-6 py-3 text-right text-[#e5e5ea] font-medium tabular-nums">
                  {formatCurrency(balanceData.cxp)}
                </td>
                <td className="px-6 py-3 text-right text-[#8e8e93] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((balanceData.cxp / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
              <tr className="border-t-2 border-[rgba(255,69,58,0.2)] bg-[rgba(255,69,58,0.04)]">
                <td className="px-6 py-3 font-bold text-[#ff453a]">Total Pasivos</td>
                <td className="px-6 py-3 text-right font-bold text-[#ff453a] tabular-nums">
                  {formatCurrency(balanceData.totalPasivos)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-[#ff453a] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((balanceData.totalPasivos / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>

              {/* Patrimonio Section */}
              <tr className="bg-[rgba(48,209,88,0.04)]">
                <td colSpan={3} className="px-6 py-2 text-xs font-bold text-[#30d158] uppercase tracking-wider">
                  Patrimonio
                </td>
              </tr>
              <tr className="hover:bg-[#111111] transition-colors">
                <td className="px-6 py-3 text-[#c7c7cc] pl-10">Capital Social</td>
                <td className="px-6 py-3 text-right text-[#e5e5ea] font-medium tabular-nums">
                  {formatCurrency(balanceData.capitalSocial)}
                </td>
                <td className="px-6 py-3 text-right text-[#8e8e93] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((balanceData.capitalSocial / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
              <tr className="hover:bg-[#111111] transition-colors">
                <td className="px-6 py-3 text-[#c7c7cc] pl-10">Utilidades Acumuladas</td>
                <td className={`px-6 py-3 text-right font-medium tabular-nums ${balanceData.utilidadesAcumuladas >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                  {balanceData.utilidadesAcumuladas >= 0 ? '+' : ''}{formatCurrency(balanceData.utilidadesAcumuladas)}
                </td>
                <td className="px-6 py-3 text-right text-[#8e8e93] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((Math.abs(balanceData.utilidadesAcumuladas) / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
              <tr className="border-t-2 border-[rgba(48,209,88,0.2)] bg-[rgba(48,209,88,0.04)]">
                <td className="px-6 py-3 font-bold text-[#30d158]">Total Patrimonio</td>
                <td className="px-6 py-3 text-right font-bold text-[#30d158] tabular-nums">
                  {formatCurrency(balanceData.totalPatrimonio)}
                </td>
                <td className="px-6 py-3 text-right font-bold text-[#30d158] tabular-nums">
                  {balanceData.totalActivos > 0 ? ((balanceData.totalPatrimonio / balanceData.totalActivos) * 100).toFixed(1) : '0.0'}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-[rgba(10,132,255,0.07)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Scale size={16} className="text-[#0a84ff] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#0a84ff]">Notas al Balance</p>
            <p className="text-xs text-[#636366] mt-1">
              Capital Social: {formatCurrency(CAPITAL_SOCIAL)} (configurable). Saldo inicial Caja/Bancos: {formatCurrency(STARTING_BALANCE)} (dic 2025).
              Las utilidades acumuladas reflejan el resultado neto de todas las operaciones registradas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceGeneral;
