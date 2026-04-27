import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Repeat, Receipt } from 'lucide-react';
import {
 ResponsiveContainer,
 AreaChart,
 Area,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ReferenceLine,
} from 'recharts';
import { useForwardProjection } from '../../hooks/useForwardProjection';
import { formatCurrency } from '../../utils/formatters';
import { Badge, KPIGrid, KPI } from '@/components/ui/nexus';

const HORIZONS = [
 { days: 30, label: '30 días' },
 { days: 60, label: '60 días' },
 { days: 90, label: '90 días' },
];

const ChartTooltip = ({ active, payload }) => {
 if (!active || !payload?.length) return null;
 const d = payload[0].payload;
 return (
 <div className="border border-[var(--border-visible)] bg-[var(--surface)] px-3 py-2.5 rounded-md">
 <p className="nd-mono text-[11px] text-[var(--text-secondary)] mb-1.5">{d.date}</p>
 <p className="nd-mono text-[13px] tabular-nums" style={{ color: 'var(--text-display)' }}>
 Saldo: {formatCurrency(d.balance)}
 </p>
 {d.inflow > 0 && (
 <p className="nd-mono text-[11px] tabular-nums text-[var(--success)]">
 +{formatCurrency(d.inflow)} entrada
 </p>
 )}
 {d.outflow > 0 && (
 <p className="nd-mono text-[11px] tabular-nums text-[var(--accent)]">
 -{formatCurrency(d.outflow)} salida
 </p>
 )}
 </div>
 );
};

/**
 * ForwardProjectionPanel — daily cashflow projection up to N days using
 * open receivables, open payables and active recurringCosts (skipping
 * already-generated instances).
 */
const ForwardProjectionPanel = ({ user }) => {
 const [horizon, setHorizon] = useState(90);
 const proj = useForwardProjection(user, horizon);

 const balanceTone = proj.projectedEndBalance >= 0 ? 'default' : 'err';
 const negativeWarning = proj.firstNegativeDay
 ? `Saldo cae bajo cero el ${proj.firstNegativeDay.date}`
 : 'Saldo siempre positivo';

 return (
 <section className="space-y-4">
 <div className="flex items-end justify-between gap-4 flex-wrap">
 <div>
 <p className="nd-label text-[var(--text-secondary)]">Proyección de caja</p>
 <h3 className="mt-1 nd-display text-[20px] font-light text-[var(--text-display)]">
 Próximos {horizon} días
 </h3>
 </div>
 <div className="nx-tabs">
 {HORIZONS.map((h) => (
 <button
 key={h.days}
 type="button"
 onClick={() => setHorizon(h.days)}
 className={`nx-tab ${horizon === h.days ? 'active' : ''}`}
 >
 {h.label}
 </button>
 ))}
 </div>
 </div>

 <KPIGrid cols={4}>
 <KPI
 label="Saldo inicial"
 value={formatCurrency(proj.startingBalance)}
 meta="Hoy"
 />
 <KPI
 label="Entradas previstas"
 value={formatCurrency(proj.totalInflows)}
 meta={`${proj.inflows.length} CXC abiertas`}
 tone="ok"
 icon={TrendingUp}
 />
 <KPI
 label="Salidas previstas"
 value={formatCurrency(proj.totalOutflows)}
 meta={`${proj.outflowsPayables.length} CXP + ${proj.outflowsRecurring.length} recurrentes`}
 tone="warn"
 icon={TrendingDown}
 />
 <KPI
 label={`Saldo proyectado`}
 value={formatCurrency(proj.projectedEndBalance)}
 meta={negativeWarning}
 tone={balanceTone}
 icon={proj.firstNegativeDay ? AlertTriangle : undefined}
 />
 </KPIGrid>

 {proj.firstNegativeDay && (
 <div className="rounded-md border border-[var(--error)]/40 bg-[rgba(255,77,46,0.05)] px-4 py-3 flex items-start gap-3">
 <AlertTriangle size={16} className="text-[var(--error)] flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm text-[var(--text-primary)]">
 Alerta: la caja cae a <span className="nd-mono tabular-nums text-[var(--error)]">{formatCurrency(proj.firstNegativeDay.balance)}</span> el día <span className="nd-mono">{proj.firstNegativeDay.date}</span>
 </p>
 <p className="mt-1 text-[12px] text-[var(--text-disabled)]">
 Considerá adelantar cobros, retrasar pagos o ajustar los costos recurrentes.
 </p>
 </div>
 </div>
 )}

 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <div style={{ width: '100%', height: 280, minHeight: 280, minWidth: 0 }}>
 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
 <AreaChart data={proj.series} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="var(--text-display)" stopOpacity={0.25} />
 <stop offset="100%" stopColor="var(--text-display)" stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid stroke="var(--border)" vertical={false} />
 <XAxis
 dataKey="date"
 stroke="var(--text-disabled)"
 tickLine={false}
 axisLine={false}
 minTickGap={28}
 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
 />
 <YAxis
 stroke="var(--text-disabled)"
 tickLine={false}
 axisLine={false}
 tickFormatter={(v) => `${Math.round(v / 1000)}k`}
 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
 />
 <Tooltip content={<ChartTooltip />} />
 <ReferenceLine y={0} stroke="var(--error)" strokeDasharray="3 3" />
 <Area
 type="monotone"
 dataKey="balance"
 stroke="var(--text-display)"
 strokeWidth={2}
 fill="url(#balanceGradient)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="grid gap-4 lg:grid-cols-2">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <div className="flex items-center justify-between mb-3">
 <p className="nd-label text-[var(--text-secondary)]">Hitos del horizonte</p>
 </div>
 <div className="space-y-2">
 <Row label="Saldo a 30 días" value={proj.next30Balance} />
 <Row label="Saldo a 60 días" value={proj.next60Balance} />
 <Row label="Saldo a 90 días" value={proj.next90Balance} />
 </div>
 </div>

 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <div className="flex items-center justify-between mb-3">
 <p className="nd-label text-[var(--text-secondary)]">Top contrapartes (salidas)</p>
 <span className="nd-label text-[var(--text-disabled)]">{proj.horizonDays}d</span>
 </div>
 {proj.topOutflowCounterparties.length === 0 ? (
 <p className="text-[12px] text-[var(--text-disabled)]">Sin salidas proyectadas.</p>
 ) : (
 <div className="space-y-1.5">
 {proj.topOutflowCounterparties.map((cp) => (
 <div key={cp.name} className="flex items-center justify-between gap-3 text-[13px]">
 <span className="text-[var(--text-primary)] truncate">{cp.name}</span>
 <span className="nd-mono tabular-nums text-[var(--warning)] flex-shrink-0">
 {formatCurrency(cp.amount)}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 <Mini icon={Receipt} label="CXP abiertas en horizonte" value={proj.outflowsPayables.length} amount={proj.outflowsPayables.reduce((s, e) => s + e.amount, 0)} />
 <Mini icon={Repeat} label="Costos recurrentes (a generar)" value={proj.outflowsRecurring.length} amount={proj.outflowsRecurring.reduce((s, e) => s + e.amount, 0)} />
 <Mini icon={TrendingUp} label="CXC abiertas en horizonte" value={proj.inflows.length} amount={proj.totalInflows} tone="ok" />
 </div>
 </section>
 );
};

const Row = ({ label, value }) => (
 <div className="flex items-center justify-between text-[13px]">
 <span className="text-[var(--text-secondary)]">{label}</span>
 <span className={`nd-mono tabular-nums ${value < 0 ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'}`}>
 {formatCurrency(value)}
 </span>
 </div>
);

const Mini = ({ icon: Icon, label, value, amount, tone = 'warn' }) => (
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
 <div className="flex items-center justify-between gap-2">
 <p className="nd-label text-[var(--text-secondary)] truncate">{label}</p>
 {Icon && <Icon size={14} className="text-[var(--text-disabled)]" />}
 </div>
 <p className={`nd-display text-[22px] font-light tabular-nums mt-2 ${tone === 'ok' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
 {value}
 </p>
 <p className="nd-mono text-[11px] tabular-nums text-[var(--text-disabled)] mt-1">
 {formatCurrency(amount)}
 </p>
 </div>
);

export default ForwardProjectionPanel;
