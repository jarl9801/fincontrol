import { useMemo } from 'react';
import {
  Building2,
  ChevronRight,
  Landmark,
  Scale,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { balances2025 } from '../../data/balances2025';
import { useFinanceLedger } from '../../hooks/useFinanceLedger';
import { formatCurrency } from '../../utils/formatters';

const CAPITAL_SOCIAL = 25000;

const SectionCard = ({ title, icon, accentColor, items, total, totalLabel }) => {
  const IconComponent = icon;

  return (
    <div className="overflow-hidden rounded-[26px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
        <div className="rounded-xl p-2" style={{ backgroundColor: `${accentColor}1f`, color: accentColor }}>
          <IconComponent size={18} />
        </div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3 p-5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ChevronRight size={12} className="text-[#6e6e73]" />
              <span className="text-sm text-[#c7c7cc]">{item.label}</span>
            </div>
            <span className={`text-sm font-semibold ${item.tone || 'text-white'}`}>{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] bg-[#101115] px-5 py-4">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">{totalLabel}</span>
        <span className="text-lg font-semibold" style={{ color: accentColor }}>{formatCurrency(total)}</span>
      </div>
    </div>
  );
};

const BalanceGeneral = ({ user }) => {
  const ledger = useFinanceLedger(user);

  const balance = useMemo(() => {
    const cash = ledger.summary.currentCash;
    const taxReserve = ledger.bankAccount.taxReserveBalance || 0;
    const receivables = ledger.receivables.reduce((sum, entry) => sum + entry.openAmount, 0);
    const payables = ledger.payables.reduce((sum, entry) => sum + entry.openAmount, 0);
    const assets = cash + taxReserve + receivables;
    const liabilities = payables;
    const equity = assets - liabilities;
    const retainedResult = equity - CAPITAL_SOCIAL;

    return {
      cash,
      taxReserve,
      receivables,
      payables,
      assets,
      liabilities,
      capital: CAPITAL_SOCIAL,
      retainedResult,
      equity,
      netWorkingCapital: cash + receivables - payables,
    };
  }, [ledger]);

  if (ledger.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#8e8e93]">Armando balance operativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(100,210,255,0.18),transparent_28%),linear-gradient(160deg,#0c1018_0%,#090b10_100%)] px-6 py-7 shadow-[0_40px_120px_rgba(0,0,0,0.42)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fdcff]">Balance general</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-white">Posición financiera operativa a partir de caja, CXC, CXP y saldos de apertura.</h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#a7a7ad]">
              Esta vista es gerencial: parte de tesorería real y documentos abiertos. No intenta reemplazar un ERP contable completo.
            </p>
          </div>
          <div className="rounded-[22px] border border-[rgba(100,210,255,0.18)] bg-[rgba(100,210,255,0.1)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fdcff]">Fecha de corte</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      <div className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="flex flex-wrap items-center justify-center gap-4 text-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Activos</p>
            <p className="mt-2 text-2xl font-semibold text-[#64d2ff]">{formatCurrency(balance.assets)}</p>
          </div>
          <span className="text-xl font-bold text-[#6e6e73]">=</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Pasivos</p>
            <p className="mt-2 text-2xl font-semibold text-[#ff453a]">{formatCurrency(balance.liabilities)}</p>
          </div>
          <span className="text-xl font-bold text-[#6e6e73]">+</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Patrimonio</p>
            <p className="mt-2 text-2xl font-semibold text-[#30d158]">{formatCurrency(balance.equity)}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Activos"
          icon={Wallet}
          accentColor="#64d2ff"
          items={[
            { label: 'Caja / bancos', value: balance.cash },
            { label: 'Reserva IVA 2025', value: balance.taxReserve },
            { label: 'Cuentas por cobrar abiertas', value: balance.receivables },
          ]}
          total={balance.assets}
          totalLabel="Total activos"
        />
        <SectionCard
          title="Pasivos"
          icon={Landmark}
          accentColor="#ff453a"
          items={[
            { label: 'Cuentas por pagar abiertas', value: balance.payables },
          ]}
          total={balance.liabilities}
          totalLabel="Total pasivos"
        />
        <SectionCard
          title="Patrimonio"
          icon={Building2}
          accentColor="#30d158"
          items={[
            { label: 'Capital social', value: balance.capital },
            { label: 'Resultado operativo acumulado', value: balance.retainedResult, tone: balance.retainedResult >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
          ]}
          total={balance.equity}
          totalLabel="Total patrimonio"
        />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Scale size={18} className="text-[#8fdcff]" />
            Detalle del balance
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">
                <th className="px-6 py-3 text-left">Cuenta</th>
                <th className="px-6 py-3 text-right">Monto</th>
                <th className="px-6 py-3 text-right">% activos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {[
                { label: 'Caja / bancos', value: balance.cash, tone: 'text-[#64d2ff]' },
                { label: 'Reserva IVA 2025', value: balance.taxReserve, tone: 'text-[#64d2ff]' },
                { label: 'CXC abiertas', value: balance.receivables, tone: 'text-[#64d2ff]' },
                { label: 'CXP abiertas', value: balance.payables, tone: 'text-[#ff453a]' },
                { label: 'Capital social', value: balance.capital, tone: 'text-[#30d158]' },
                { label: 'Resultado operativo acumulado', value: balance.retainedResult, tone: balance.retainedResult >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]' },
              ].map((row) => (
                <tr key={row.label} className="hover:bg-[rgba(255,255,255,0.03)]">
                  <td className="px-6 py-3 text-[#d6d6db]">{row.label}</td>
                  <td className={`px-6 py-3 text-right font-semibold ${row.tone}`}>{formatCurrency(row.value)}</td>
                  <td className="px-6 py-3 text-right text-[#8e8e93]">
                    {balance.assets > 0 ? `${((Math.abs(row.value) / balance.assets) * 100).toFixed(1)}%` : '0.0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Capital de trabajo</p>
          <p className={`mt-3 text-[30px] font-semibold ${balance.netWorkingCapital >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
            {formatCurrency(balance.netWorkingCapital)}
          </p>
          <p className="mt-2 text-sm text-[#8e8e93]">Caja más CXC menos CXP abiertas.</p>
        </div>
        <div className="rounded-[24px] border border-[rgba(100,210,255,0.18)] bg-[rgba(100,210,255,0.08)] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-[#8fdcff]" />
            <div>
              <p className="text-sm font-semibold text-[#8fdcff]">Notas del modelo</p>
              <p className="mt-2 text-sm leading-6 text-[#9fc2ff]">
                Apertura banco 2025: {formatCurrency(balances2025.bancoDic2025)}. Reserva IVA 2025: {formatCurrency(balances2025.ivaDic2025)}.
                El patrimonio se deriva desde activos y pasivos del ledger operativo, no desde asientos contables completos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceGeneral;
