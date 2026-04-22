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
 <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] ">
 <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
 <div className="rounded-md p-2" style={{ backgroundColor: 'var(--surface)', color: accentColor }}>
 <IconComponent size={18} />
 </div>
 <h3 className="text-sm font-semibold text-white">{title}</h3>
 </div>
 <div className="space-y-3 p-5">
 {items.map((item) => (
 <div key={item.label} className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <ChevronRight size={12} className="text-[var(--text-disabled)]" />
 <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
 </div>
 <span className={`text-sm font-semibold ${item.tone || 'text-white'}`}>{formatCurrency(item.value)}</span>
 </div>
 ))}
 </div>
 <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--black)] px-5 py-4">
 <span className="nd-label text-[var(--text-disabled)]">{totalLabel}</span>
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
 <p className="nd-mono text-xs text-[var(--text-secondary)] tracking-[0.08em] uppercase">[LOADING...]</p>
 </div>
 );
 }

 return (
 <div className="space-y-6 pb-12">
 <section className="rounded-md border border-[var(--border)] bg-[var(--black)] px-6 py-7 ">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <p className="mb-3 nd-label text-[var(--text-secondary)]">Balance general</p>
 <h2 className="nd-display text-[32px] font-semibold tracking-tight text-[var(--text-display)]">Posición financiera operativa a partir de caja, CXC, CXP y saldos de apertura.</h2>
 <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--text-secondary)]">
 Esta vista es gerencial: parte de tesorería real y documentos abiertos. No intenta reemplazar un ERP contable completo.
 </p>
 </div>
 <div className="rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
 <p className="nd-label text-[var(--text-secondary)]">Fecha de corte</p>
 <p className="mt-1 text-sm font-semibold text-white">
 {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
 </p>
 </div>
 </div>
 </section>

 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex flex-wrap items-center justify-center gap-4 text-center">
 <div>
 <p className="nd-label text-[var(--text-disabled)]">Activos</p>
 <p className="mt-2 text-2xl font-semibold text-[var(--text-secondary)]">{formatCurrency(balance.assets)}</p>
 </div>
 <span className="text-xl font-bold text-[var(--text-disabled)]">=</span>
 <div>
 <p className="nd-label text-[var(--text-disabled)]">Pasivos</p>
 <p className="mt-2 text-2xl font-semibold text-[var(--accent)]">{formatCurrency(balance.liabilities)}</p>
 </div>
 <span className="text-xl font-bold text-[var(--text-disabled)]">+</span>
 <div>
 <p className="nd-label text-[var(--text-disabled)]">Patrimonio</p>
 <p className="mt-2 text-2xl font-semibold text-[var(--success)]">{formatCurrency(balance.equity)}</p>
 </div>
 </div>
 </div>

 <div className="grid gap-4 lg:grid-cols-3">
 <SectionCard
 title="Activos"
 icon={Wallet}
 accentColor="var(--text-disabled)"
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
 accentColor="var(--accent)"
 items={[
 { label: 'Cuentas por pagar abiertas', value: balance.payables },
 ]}
 total={balance.liabilities}
 totalLabel="Total pasivos"
 />
 <SectionCard
 title="Patrimonio"
 icon={Building2}
 accentColor="var(--success)"
 items={[
 { label: 'Capital social', value: balance.capital },
 { label: 'Resultado operativo acumulado', value: balance.retainedResult, tone: balance.retainedResult >= 0 ? 'text-[var(--success)]' : 'text-[var(--accent)]' },
 ]}
 total={balance.equity}
 totalLabel="Total patrimonio"
 />
 </div>

 <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] ">
 <div className="border-b border-[var(--border)] px-5 py-4">
 <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
 <Scale size={18} className="text-[var(--text-secondary)]" />
 Detalle del balance
 </h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full min-w-[720px] text-sm">
 <thead>
 <tr className="border-b border-[var(--border)] nd-label text-[var(--text-disabled)]">
 <th className="px-6 py-3 text-left">Cuenta</th>
 <th className="px-6 py-3 text-right">Monto</th>
 <th className="px-6 py-3 text-right">% activos</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)]">
 {[
 { label: 'Caja / bancos', value: balance.cash, tone: 'text-[var(--text-secondary)]' },
 { label: 'Reserva IVA 2025', value: balance.taxReserve, tone: 'text-[var(--text-secondary)]' },
 { label: 'CXC abiertas', value: balance.receivables, tone: 'text-[var(--text-secondary)]' },
 { label: 'CXP abiertas', value: balance.payables, tone: 'text-[var(--accent)]' },
 { label: 'Capital social', value: balance.capital, tone: 'text-[var(--success)]' },
 { label: 'Resultado operativo acumulado', value: balance.retainedResult, tone: balance.retainedResult >= 0 ? 'text-[var(--success)]' : 'text-[var(--accent)]' },
 ].map((row) => (
 <tr key={row.label} className="hover:bg-[var(--surface)]">
 <td className="px-6 py-3 text-[var(--text-primary)]">{row.label}</td>
 <td className={`px-6 py-3 text-right font-semibold ${row.tone}`}>{formatCurrency(row.value)}</td>
 <td className="px-6 py-3 text-right text-[var(--text-secondary)]">
 {balance.assets > 0 ? `${((Math.abs(row.value) / balance.assets) * 100).toFixed(1)}%` : '0.0%'}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
 <p className="nd-label text-[var(--text-disabled)]">Capital de trabajo</p>
 <p className={`mt-3 nd-display text-[30px] font-semibold ${balance.netWorkingCapital >= 0 ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 {formatCurrency(balance.netWorkingCapital)}
 </p>
 <p className="mt-2 text-sm text-[var(--text-secondary)]">Caja más CXC menos CXP abiertas.</p>
 </div>
 <div className="rounded-md border border-[var(--border-visible)] bg-[var(--surface)] p-5">
 <div className="flex items-start gap-3">
 <ShieldCheck size={18} className="mt-0.5 text-[var(--text-secondary)]" />
 <div>
 <p className="text-sm font-semibold text-[var(--text-secondary)]">Notas del modelo</p>
 <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
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
