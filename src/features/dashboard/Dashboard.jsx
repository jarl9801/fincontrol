import {
 ArrowDownRight,
 ArrowUpRight,
 ChevronRight,
 FileDown,
 FileUp,
 Wallet,
} from 'lucide-react';
import {
 Bar,
 BarChart,
 CartesianGrid,
 Line,
 LineChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from 'recharts';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { summarizeVAT } from '../../finance/reporting';

/* ===== Nothing Tooltip ===== */
const ChartTooltip = ({ active, payload, label }) => {
 if (!active || !payload?.length) return null;
 return (
 <div className="border border-[var(--border-visible)] bg-[var(--surface)] px-3 py-2.5 rounded-md">
 <p className="nd-label text-[var(--text-secondary)] mb-1.5">{label}</p>
 {payload.map((entry) => (
 <p key={entry.name} className="nd-mono text-[13px] tabular-nums" style={{ color: entry.color }}>
 {entry.name}: {formatCurrency(entry.value)}
 </p>
 ))}
 </div>
 );
};

/* ===== Segmented Progress Bar (Nothing signature) ===== */
const SegmentedBar = ({ value, max, color = 'var(--text-display)', segments = 20, height = 8 }) => {
 const filled = Math.min(segments, Math.round((Math.abs(value) / Math.max(max, 1)) * segments));
 return (
 <div className="flex gap-[2px]">
 {Array.from({ length: segments }).map((_, i) => (
 <div
 key={i}
 className="flex-1"
 style={{
 height,
 background: i < filled ? color : 'var(--border)',
 }}
 />
 ))}
 </div>
 );
};

/* ===== Dashboard ===== */
const Dashboard = ({ user, setView, onNewTransaction }) => {
 const metrics = useTreasuryMetrics({ user });
 const vatSummary = summarizeVAT(metrics.postedMovements || []);

 const overdueExposure =
 metrics.overdueReceivables.reduce((sum, e) => sum + e.openAmount, 0) +
 metrics.overduePayables.reduce((sum, e) => sum + e.openAmount, 0);

 const health =
 metrics.runwayMonths != null && metrics.runwayMonths < 3
 ? { label: 'CRITICA', color: 'var(--error)' }
 : (metrics.runwayMonths != null && metrics.runwayMonths < 6) || overdueExposure > 10000
 ? { label: 'ALERTA', color: 'var(--warning)' }
 : { label: 'ESTABLE', color: 'var(--success)' };

 const netMarginPct =
 metrics.cashInflows > 0
 ? ((metrics.cashInflows - metrics.avgMonthlyOutflows) / metrics.cashInflows * 100).toFixed(1)
 : '0.0';

 const upcomingRows = [...metrics.upcomingReceivables, ...metrics.upcomingPayables]
 .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
 .slice(0, 8)
 .map((entry) => ({ ...entry, direction: entry.kind === 'receivable' ? 'in' : 'out' }));

 const quickActions = [
 { id: 'register-collection', title: 'Registrar cobro', desc: 'Entrada real de dinero.', icon: ArrowUpRight },
 { id: 'register-payment', title: 'Registrar pago', desc: 'Salida real ejecutada.', icon: ArrowDownRight },
 { id: 'create-receivable', title: 'Factura CXC', desc: 'Por cobrar, sin afectar caja.', icon: FileUp },
 { id: 'create-payable', title: 'Factura CXP', desc: 'Por pagar, sin afectar caja.', icon: FileDown },
 { id: 'bank-adjustment', title: 'Ajuste bancario', desc: 'Movimiento directo.', icon: Wallet },
 ];

 /* ===== Loading — Nothing bracket text ===== */
 if (metrics.loading) {
 return (
 <div className="flex items-center justify-center py-32">
 <p className="nd-mono text-xs text-[var(--text-secondary)] tracking-[0.08em] uppercase">
 [LOADING...]
 </p>
 </div>
 );
 }

 return (
 <div className="space-y-12 pb-16">

 {/* ===== HERO — Primary Layer: One number dominates ===== */}
 <section className="pt-4">
 <div className="flex flex-col gap-10 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <p className="nd-label text-[var(--text-secondary)] mb-3">
 Caja real
 </p>
 <p className={`nd-display text-[64px] md:text-[80px] leading-[1] tracking-[-0.03em] tabular-nums ${
 metrics.currentCash >= 0 ? 'text-[var(--text-display)]' : 'text-[var(--negative)]'
 }`}>
 {formatCurrency(metrics.currentCash)}
 </p>
 <p className="nd-label text-[var(--text-disabled)] mt-2">
 EUR
 </p>

 <div className="flex items-center gap-6 mt-6">
 <span
 className="nd-label"
 style={{ color: health.color }}
 >
 [{health.label}]
 </span>
 {metrics.runwayMonths != null && (
 <span className="nd-label text-[var(--text-disabled)]">
 Runway {metrics.runwayMonths.toFixed(1)}m
 </span>
 )}
 </div>
 </div>

 {/* Secondary metrics — right side */}
 <div className="grid gap-px sm:grid-cols-3 xl:min-w-[420px] border border-[var(--border)] rounded-md overflow-hidden">
 <button
 type="button"
 onClick={() => setView?.('cashflow')}
 className="bg-[var(--surface)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-raised)]"
 >
 <p className="nd-label text-[var(--text-secondary)]">Liquidez proy.</p>
 <p className="nd-mono text-[22px] tabular-nums text-[var(--text-primary)] mt-1">
 {formatCurrency(metrics.projectedLiquidity)}
 </p>
 </button>
 <button
 type="button"
 onClick={() => setView?.('cxc')}
 className="bg-[var(--surface)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-raised)] border-l border-[var(--border)]"
 >
 <p className="nd-label text-[var(--text-secondary)]">CXC abierta</p>
 <p className="nd-mono text-[22px] tabular-nums text-[var(--text-primary)] mt-1">
 {formatCurrency(metrics.pendingReceivables)}
 </p>
 </button>
 <button
 type="button"
 onClick={() => setView?.('cxp')}
 className="bg-[var(--surface)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface-raised)] border-l border-[var(--border)]"
 >
 <p className="nd-label text-[var(--text-secondary)]">CXP abierta</p>
 <p className="nd-mono text-[22px] tabular-nums text-[var(--warning)] mt-1">
 {formatCurrency(metrics.pendingPayables)}
 </p>
 </button>
 </div>
 </div>
 </section>

 {/* ===== KPI ROW — Secondary Layer ===== */}
 <section>
 <div className="grid grid-cols-2 gap-px lg:grid-cols-5 border border-[var(--border)] rounded-md overflow-hidden">
 {[
 {
 label: 'Ventana 14d',
 value: `${metrics.next14Net >= 0 ? '+' : ''}${formatCurrency(metrics.next14Net)}`,
 color: metrics.next14Net >= 0 ? 'var(--text-primary)' : 'var(--negative)',
 },
 {
 label: 'Exposicion vencida',
 value: formatCurrency(overdueExposure),
 color: overdueExposure > 0 ? 'var(--negative)' : 'var(--text-primary)',
 onClick: () => setView?.('alertas'),
 },
 {
 label: 'Margen neto mes',
 value: `${netMarginPct}%`,
 color: parseFloat(netMarginPct) >= 0 ? 'var(--success)' : 'var(--negative)',
 },
 {
 label: 'Burn mensual',
 value: formatCurrency(metrics.avgMonthlyOutflows),
 color: 'var(--text-primary)',
 },
 {
 label: 'Ingresos mes',
 value: formatCurrency(metrics.cashInflows),
 color: 'var(--text-primary)',
 },
 ].map((kpi, i) => (
 <div
 key={kpi.label}
 className={`bg-[var(--surface)] px-5 py-4 ${kpi.onClick ? 'cursor-pointer hover:bg-[var(--surface-raised)] transition-colors' : ''} ${i > 0 ? 'border-l border-[var(--border)]' : ''}`}
 onClick={kpi.onClick}
 role={kpi.onClick ? 'button' : undefined}
 tabIndex={kpi.onClick ? 0 : undefined}
 onKeyDown={kpi.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); kpi.onClick(); } } : undefined}
 >
 <p className="nd-label text-[var(--text-secondary)]">
 {kpi.label}
 </p>
 <p className="nd-mono text-[20px] tabular-nums mt-1" style={{ color: kpi.color }}>
 {kpi.value}
 </p>
 </div>
 ))}
 </div>
 </section>

 {/* ===== VAT — German Umsatzsteuer ===== */}
 <section>
 <p className="nd-label text-[var(--text-secondary)] mb-4">
 IVA Aleman — Umsatzsteuer
 </p>
 <div className="grid grid-cols-3 gap-px border border-[var(--border)] rounded-md overflow-hidden">
 <div className="bg-[var(--surface)] px-5 py-4">
 <p className="nd-label text-[var(--text-secondary)]">USt (ingresos)</p>
 <p className="nd-mono text-[20px] tabular-nums text-[var(--warning)] mt-1">{formatCurrency(vatSummary.outputVAT)}</p>
 <p className="nd-mono text-[11px] text-[var(--text-disabled)] mt-1">Debe a Finanzamt</p>
 </div>
 <div className="bg-[var(--surface)] px-5 py-4 border-l border-[var(--border)]">
 <p className="nd-label text-[var(--text-secondary)]">Vorsteuer (gastos)</p>
 <p className="nd-mono text-[20px] tabular-nums text-[var(--text-primary)] mt-1">{formatCurrency(vatSummary.inputVAT)}</p>
 <p className="nd-mono text-[11px] text-[var(--text-disabled)] mt-1">Reclamable</p>
 </div>
 <div className="bg-[var(--surface)] px-5 py-4 border-l border-[var(--border)]">
 <p className="nd-label text-[var(--text-secondary)]">Neto VAT</p>
 <p className={`nd-mono text-[20px] tabular-nums mt-1 ${vatSummary.netVAT >= 0 ? 'text-[var(--negative)]' : 'text-[var(--success)]'}`}>
 {vatSummary.netVAT >= 0 ? '+' : ''}{formatCurrency(vatSummary.netVAT)}
 </p>
 <p className="nd-mono text-[11px] text-[var(--text-disabled)] mt-1">
 {vatSummary.netVAT >= 0 ? 'Pagar' : 'A favor'}
 </p>
 </div>
 </div>
 </section>

 {/* ===== CHARTS — Two columns ===== */}
 <div className="grid gap-8 xl:grid-cols-[1.4fr,1fr]">
 {/* Cash trend */}
 <section>
 <div className="flex items-center justify-between mb-4">
 <p className="nd-label text-[var(--text-secondary)]">
 Caja — 12 semanas
 </p>
 <button
 type="button"
 onClick={() => setView?.('cashflow')}
 className="nd-label text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
 >
 Abrir tesoreria <ChevronRight size={12} className="inline" />
 </button>
 </div>
 <div className="border border-[var(--border)] rounded-md p-4 bg-[var(--surface)]">
 <div className="h-[280px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={metrics.cashSeries}>
 <CartesianGrid stroke="var(--border)" vertical={false} />
 <XAxis
 dataKey="label"
 stroke="var(--text-disabled)"
 tickLine={false}
 axisLine={false}
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
 <Line
 type="monotone"
 dataKey="balance"
 name="Caja"
 stroke="var(--text-display)"
 strokeWidth={2}
 dot={false}
 activeDot={{ r: 3, fill: 'var(--text-display)' }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 </section>

 {/* Weekly projection */}
 <section>
 <div className="flex items-center justify-between mb-4">
 <p className="nd-label text-[var(--text-secondary)]">
 Compromisos — 8 semanas
 </p>
 </div>
 <div className="border border-[var(--border)] rounded-md p-4 bg-[var(--surface)]">
 <div className="h-[280px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={metrics.weeklyProjection} barCategoryGap={12}>
 <CartesianGrid stroke="var(--border)" vertical={false} />
 <XAxis
 dataKey="week"
 stroke="var(--text-disabled)"
 tickLine={false}
 axisLine={false}
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
 <Bar dataKey="committedIn" name="Cobros" fill="var(--text-display)" radius={0} />
 <Bar dataKey="committedOut" name="Pagos" fill="var(--text-disabled)" radius={0} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </section>
 </div>

 {/* ===== QUICK ACTIONS ===== */}
 <section>
 <p className="nd-label text-[var(--text-secondary)] mb-4">
 Acciones rapidas
 </p>
 <div className="grid gap-px grid-cols-2 lg:grid-cols-5 border border-[var(--border)] rounded-md overflow-hidden">
 {quickActions.map((action) => {
 const Icon = action.icon;
 return (
 <button
 key={action.id}
 type="button"
 onClick={() => onNewTransaction?.(action.id)}
className="group bg-[var(--surface)] px-4 py-5 text-left transition-colors hover:bg-[var(--surface-raised)]"
 >
 <Icon size={16} className="text-[var(--text-disabled)] mb-3 group-hover:text-[var(--text-primary)] transition-colors" />
<p className="nd-label text-[var(--text-primary)]">[{action.title}]</p>
<p className="mt-1 text-[12px] leading-5 text-[var(--text-secondary)]">{action.desc}</p>
 </button>
 );
 })}
 </div>
 </section>

 {/* ===== UPCOMING + PROJECTS — Two columns ===== */}
 <div className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
 {/* Upcoming */}
 <section>
 <p className="nd-label text-[var(--text-secondary)] mb-4">
 Proximos vencimientos
 </p>
 <div className="border border-[var(--border)] rounded-md overflow-hidden">
 {upcomingRows.length === 0 ? (
 <div className="px-5 py-12 text-center">
 <p className="text-[14px] text-[var(--text-disabled)]">No hay vencimientos proximos.</p>
 <p className="text-[12px] text-[var(--text-disabled)] mt-1">Los documentos apareceran a medida que se acerque su fecha de cobro o pago.</p>
 </div>
 ) : (
 upcomingRows.map((entry, i) => {
 const isIn = entry.direction === 'in';
 return (
 <div
 key={entry.id}
 className={`flex items-center justify-between gap-4 bg-[var(--surface)] px-5 py-3.5 transition-colors hover:bg-[var(--surface-raised)] ${
 i > 0 ? 'border-t border-[var(--border)]' : ''
 }`}
 >
 <div className="flex items-center gap-3 min-w-0">
 {isIn ? (
 <ArrowUpRight size={14} className="flex-shrink-0 text-[var(--text-secondary)]" />
 ) : (
 <ArrowDownRight size={14} className="flex-shrink-0 text-[var(--text-secondary)]" />
 )}
 <div className="min-w-0">
 <p className="text-[14px] text-[var(--text-primary)] truncate">{entry.counterpartyName}</p>
 <p className="nd-mono text-[11px] text-[var(--text-disabled)]">
 {entry.documentNumber || '—'} · {formatDate(entry.dueDate)}
 </p>
 </div>
 </div>
 <p className={`nd-mono text-[14px] tabular-nums flex-shrink-0 ${
 isIn ? 'text-[var(--text-primary)]' : 'text-[var(--warning)]'
 }`}>
 {isIn ? '+' : '-'}{formatCurrency(entry.openAmount)}
 </p>
 </div>
 );
 })
 )}
 </div>
 </section>

 {/* Project margins */}
 <section>
 <div className="flex items-center justify-between mb-4">
 <p className="nd-label text-[var(--text-secondary)]">
 Margen por proyecto
 </p>
 <button
 type="button"
 onClick={() => setView?.('proyectos')}
 className="nd-label text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
 >
 Detalle <ChevronRight size={12} className="inline" />
 </button>
 </div>
 <div className="border border-[var(--border)] rounded-md overflow-hidden">
 {metrics.projectMargins.length === 0 ? (
 <div className="px-5 py-12 text-center">
 <p className="nd-label text-[var(--text-disabled)]">
 Sin movimientos con proyecto asignado.
 </p>
 </div>
 ) : (
 metrics.projectMargins.map((project, i) => (
 <div
 key={project.name}
 className={`bg-[var(--surface)] px-5 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
 >
 <div className="flex items-center justify-between mb-2">
 <p className="text-[14px] text-[var(--text-primary)]">{project.name}</p>
 <p className={`nd-mono text-[14px] tabular-nums ${
 project.net >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--negative)]'
 }`}>
 {project.margin.toFixed(1)}%
 </p>
 </div>
 <SegmentedBar
 value={Math.abs(project.margin)}
 max={100}
 color={project.net >= 0 ? 'var(--text-display)' : 'var(--negative)'}
 segments={24}
 height={6}
 />
 <div className="flex items-center justify-between mt-2">
 <p className="nd-mono text-[11px] text-[var(--text-disabled)]">
 In {formatCurrency(project.inflows)} · Out {formatCurrency(project.outflows)}
 </p>
 <p className={`nd-mono text-[11px] ${project.net >= 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--negative)]'}`}>
 {project.net >= 0 ? '+' : ''}{formatCurrency(project.net)}
 </p>
 </div>
 </div>
 ))
 )}
 </div>
 </section>
 </div>

 {/* ===== ALERTS + RUNWAY — Tertiary Layer ===== */}
 <div className="grid gap-8 lg:grid-cols-3">
 {/* Radar */}
 <section>
 <p className="nd-label text-[var(--text-secondary)] mb-4">
 Radar operativo
 </p>
 <div className="space-y-px border border-[var(--border)] rounded-md overflow-hidden">
 <div className="bg-[var(--surface)] px-5 py-4">
 <p className="nd-label text-[var(--error)] mb-1">
 [CARTERA VENCIDA]
 </p>
 <p className="text-[14px] text-[var(--text-primary)]">
 {metrics.overdueReceivables.length} docs por cobrar
 </p>
 <p className="nd-mono text-[14px] tabular-nums text-[var(--negative)] mt-0.5">
 {formatCurrency(metrics.overdueReceivables.reduce((s, e) => s + e.openAmount, 0))}
 </p>
 </div>
 <div className="bg-[var(--surface)] px-5 py-4 border-t border-[var(--border)]">
 <p className="nd-label text-[var(--warning)] mb-1">
 [PAGOS VENCIDOS]
 </p>
 <p className="text-[14px] text-[var(--text-primary)]">
 {metrics.overduePayables.length} docs por pagar
 </p>
 <p className="nd-mono text-[14px] tabular-nums text-[var(--warning)] mt-0.5">
 {formatCurrency(metrics.overduePayables.reduce((s, e) => s + e.openAmount, 0))}
 </p>
 </div>
 </div>
 </section>

 {/* Runway */}
 <section>
 <p className="nd-label text-[var(--text-secondary)] mb-4">
 Runway estimado
 </p>
 <div className="border border-[var(--border)] rounded-md bg-[var(--surface)] px-5 py-5">
 <p className="nd-display text-[48px] leading-[1] tracking-[-0.02em] text-[var(--text-display)]">
 {metrics.runwayMonths == null ? '—' : metrics.runwayMonths.toFixed(1)}
 </p>
 <p className="nd-label text-[var(--text-disabled)] mt-1">
 Meses
 </p>
 <div className="mt-4">
 <SegmentedBar
 value={metrics.runwayMonths || 0}
 max={12}
 color={
 metrics.runwayMonths != null && metrics.runwayMonths < 3
 ? 'var(--accent)'
 : metrics.runwayMonths != null && metrics.runwayMonths < 6
 ? 'var(--warning)'
 : 'var(--text-display)'
 }
 segments={12}
 height={10}
 />
 <div className="flex justify-between mt-1">
 <span className="nd-mono text-[9px] text-[var(--text-disabled)]">0</span>
 <span className="nd-mono text-[9px] text-[var(--text-disabled)]">12m</span>
 </div>
 </div>
 <p className="text-[13px] text-[var(--text-disabled)] mt-4 leading-relaxed">
 Burn mensual: {formatCurrency(metrics.avgMonthlyOutflows)}
 </p>
 </div>
 </section>

 {/* Suggested action */}
 <section>
 <p className="nd-label text-[var(--text-secondary)] mb-4">
 Accion sugerida
 </p>
 <div className="border border-[var(--border)] rounded-md bg-[var(--surface)] px-5 py-5">
 <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
 Prioriza el cobro de la cartera vencida y valida conciliacion semanalmente para mantener la caja proyectada alineada con banco.
 </p>
 <button
 type="button"
 onClick={() => setView?.('conciliacion')}
 className="mt-4 nd-label text-[var(--text-disabled)] hover:text-[var(--text-primary)] transition-colors"
 >
 Ir a conciliacion <ChevronRight size={12} className="inline" />
 </button>
 </div>
 </section>
 </div>
 </div>
 );
};

export default Dashboard;
