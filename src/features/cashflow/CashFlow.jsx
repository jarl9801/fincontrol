import { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
 ArrowDownLeft,
 ArrowUpRight,
 CheckCircle2,
 Clock3,
 Landmark,
 ShieldAlert,
 TrendingUp,
} from 'lucide-react';
import HelpButton from '../../components/ui/HelpButton';
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

const TooltipCard = ({ active, payload, label }) => {
 if (!active || !payload?.length) return null;
 return (
 <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 ">
 <p className="nd-label text-[var(--text-disabled)] mb-2">{label}</p>
 {payload.map((entry) => (
 <p key={entry.name} className="nd-mono text-sm" style={{ color: entry.color }}>
 {entry.name}: {formatCurrency(entry.value)}
 </p>
 ))}
 </div>
 );
};

const Section = ({ title, subtitle, children, help }) => (
 <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="mb-5">
 <div className="flex items-center gap-2">
 <h3 className="nd-display text-[18px] font-semibold tracking-tight text-[var(--text-display)]">{title}</h3>
 {help}
 </div>
 {subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>}
 </div>
 {children}
 </section>
);

const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const CashFlow = ({ user }) => {
 const metrics = useTreasuryMetrics({ user });
 const navigate = useNavigate();
 const movementsRef = useRef(null);
 const reconciliationRef = useRef(null);

 const monthlyPL = useMemo(() => {
 const now = new Date();
 const months = [];
 for (let i = 5; i >= 0; i--) {
 const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
 const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
 months.push({ ym, label: `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`, inflows: 0, outflows: 0, net: 0 });
 }
 (metrics.postedMovements || []).forEach((m) => {
 const ym = m.postedDate?.slice(0, 7);
 if (!ym) return;
 const bucket = months.find((b) => b.ym === ym);
 if (!bucket) return;
 if (m.direction === 'in') bucket.inflows += m.amount;
 else bucket.outflows += m.amount;
 });
 months.forEach((b) => { b.net = b.inflows - b.outflows; });
 return months;
 }, [metrics.postedMovements]);

 if (metrics.loading) {
 return (
 <div className="flex items-center justify-center py-28">
 <p className="nd-mono text-xs text-[var(--text-secondary)] tracking-[0.08em] uppercase">[LOADING...]</p>
 </div>
 );
 }

 const recentMovements = [...metrics.filteredMovements]
 .sort((left, right) => (right.postedDate || '').localeCompare(left.postedDate || ''))
 .slice(0, 12);

 return (
 <div className="space-y-6 pb-12">
 <section className="rounded-md border border-[var(--border)] bg-[var(--black)] px-6 py-7 ">
 <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
 <div>
 <p className="nd-label text-[var(--text-secondary)] mb-3">Tesorería</p>
 <h2 className="nd-display text-[32px] font-semibold tracking-tight text-[var(--text-display)]">
 Caja, vencimientos y seguimiento diario en una sola vista.
 </h2>
 <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-disabled)]">
 Consulta el saldo disponible, las próximas entradas y salidas y los movimientos pendientes de revisión sin mezclar compromisos con caja real.
 </p>
 </div>
 <div className="grid gap-3 sm:grid-cols-2">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
 <div className="flex items-center gap-1.5">
 <p className="nd-label text-[var(--text-disabled)]">Caja actual</p>
 <HelpButton title="Caja actual" size={13}>
 <p>Saldo operativo real de la cuenta bancaria principal.</p>
 <p>Calculado desde el saldo de apertura (dic 2025) mas todos los movimientos bancarios registrados.</p>
 </HelpButton>
 </div>
 <p className="mt-2 nd-display text-[30px] font-semibold text-[var(--text-display)]">{formatCurrency(metrics.currentCash)}</p>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
 <div className="flex items-center gap-1.5">
 <p className="nd-label text-[var(--text-disabled)]">Liquidez proyectada</p>
 <HelpButton title="Liquidez proyectada" size={13}>
 <p>Caja actual + CXC abiertas - CXP abiertas.</p>
 <p>Muestra cuanto tendria la empresa si se cobrara y pagara todo lo pendiente.</p>
 </HelpButton>
 </div>
 <p className="mt-2 nd-display text-[30px] font-semibold text-[var(--text-display)]">{formatCurrency(metrics.projectedLiquidity)}</p>
 </div>
 <div
 className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4 cursor-pointer hover: transition-transform duration-200"
 onClick={() => movementsRef.current?.scrollIntoView({ behavior: 'smooth' })}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); movementsRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
 >
 <div className="flex items-center gap-1.5">
 <p className="nd-label text-[var(--text-disabled)]">Cobros proximos</p>
 <HelpButton title="Cobros proximos" size={13}>
 <p>Suma de documentos CXC abiertos con vencimiento en los proximos 14 dias.</p>
 <p>Representa el dinero que se espera recibir a corto plazo.</p>
 </HelpButton>
 </div>
 <p className="mt-2 nd-display text-[30px] font-semibold text-[var(--success)]">
 {formatCurrency(metrics.upcomingReceivables.reduce((sum, entry) => sum + entry.openAmount, 0))}
 </p>
 </div>
 <div
 className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-4 cursor-pointer hover: transition-transform duration-200"
 onClick={() => reconciliationRef.current?.scrollIntoView({ behavior: 'smooth' })}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reconciliationRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
 >
 <div className="flex items-center gap-1.5">
 <p className="nd-label text-[var(--text-disabled)]">Pagos proximos</p>
 <HelpButton title="Pagos proximos" size={13}>
 <p>Suma de documentos CXP abiertos con vencimiento en la siguiente ventana.</p>
 <p>Representa las obligaciones de pago mas inmediatas.</p>
 </HelpButton>
 </div>
 <p className="mt-2 nd-display text-[30px] font-semibold text-[var(--warning)]">
 {formatCurrency(metrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0))}
 </p>
 </div>
 </div>
 </div>
 </section>

 <Section title="Estado de Resultados" subtitle="Ingresos vs gastos realizados, agrupados por mes." help={
 <HelpButton title="Estado de Resultados" size={14}>
 <p>Resumen de ingresos y gastos reales de los ultimos 6 meses.</p>
 <p>Solo incluye movimientos contabilizados (cobros y pagos ejecutados), no compromisos pendientes.</p>
 </HelpButton>
 }>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead>
 <tr className="border-b border-[var(--border)]">
 <th className="px-3 py-2.5 nd-label text-[var(--text-disabled)]">Mes</th>
 <th className="px-3 py-2.5 text-right nd-label text-[var(--text-disabled)]">Ingresos</th>
 <th className="px-3 py-2.5 text-right nd-label text-[var(--text-disabled)]">Gastos</th>
 <th className="px-3 py-2.5 text-right nd-label text-[var(--text-disabled)]">Resultado</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)]">
 {monthlyPL.map((row) => (
 <tr key={row.ym} className="hover:bg-[var(--surface)]">
 <td className="px-3 py-3 text-[13px] font-medium text-[var(--text-primary)]">{row.label}</td>
 <td className="px-3 py-3 text-right text-[13px] font-medium text-[var(--success)]">{formatCurrency(row.inflows)}</td>
 <td className="px-3 py-3 text-right text-[13px] font-medium text-[var(--warning)]">{formatCurrency(row.outflows)}</td>
 <td className={`px-3 py-3 text-right text-[13px] font-semibold ${row.net >= 0 ? 'text-[var(--success)]' : 'text-[var(--negative)]'}`}>
 {row.net >= 0 ? '\u{1F7E2}' : '\u{1F534}'} {formatCurrency(row.net)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="mt-5 h-[280px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={monthlyPL}>
 <CartesianGrid stroke="var(--border)" vertical={false} />
 <XAxis dataKey="label" stroke="var(--text-disabled)" tickLine={false} axisLine={false} />
 <YAxis stroke="var(--text-disabled)" tickLine={false} axisLine={false} tickFormatter={(v) => `€${Math.round(v / 1000)}k`} />
 <Tooltip content={<TooltipCard />} />
 <Bar dataKey="inflows" name="Ingresos" fill="var(--text-primary)" radius={0} />
 <Bar dataKey="outflows" name="Gastos" fill="var(--warning)" radius={0} />
 <Bar dataKey="net" name="Resultado" radius={0} fill="var(--success)" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </Section>

 <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
 <Section title="Balance de caja semanal" subtitle="Historico reciente derivado de movimientos contabilizados." help={
 <HelpButton title="Balance de caja semanal" size={14}>
 <p>Evolucion del saldo bancario semana a semana, basado en movimientos reales.</p>
 <p>Permite detectar tendencias de consumo o acumulacion de liquidez.</p>
 </HelpButton>
 }>
 <div className="h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={metrics.cashSeries}>
 <CartesianGrid stroke="var(--border)" vertical={false} />
 <XAxis dataKey="label" stroke="var(--text-disabled)" tickLine={false} axisLine={false} />
 <YAxis stroke="var(--text-disabled)" tickLine={false} axisLine={false} tickFormatter={(value) => `€${Math.round(value / 1000)}k`} />
 <Tooltip content={<TooltipCard />} />
 <Line type="monotone" dataKey="balance" name="Caja" stroke="var(--text-primary)" strokeWidth={2.8} dot={false} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </Section>

 <Section title="Compromisos por semana" subtitle="Entradas y salidas comprometidas en la siguiente ventana de 8 semanas." help={
 <HelpButton title="Compromisos por semana" size={14}>
 <p>Cobros y pagos pendientes agrupados por semana de vencimiento.</p>
 <p>Ayuda a anticipar semanas con alta presion de salida o entrada de caja.</p>
 </HelpButton>
 }>
 <div className="h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={metrics.weeklyProjection}>
 <CartesianGrid stroke="var(--border)" vertical={false} />
 <XAxis dataKey="week" stroke="var(--text-disabled)" tickLine={false} axisLine={false} />
 <YAxis stroke="var(--text-disabled)" tickLine={false} axisLine={false} tickFormatter={(value) => `€${Math.round(value / 1000)}k`} />
 <Tooltip content={<TooltipCard />} />
 <Bar dataKey="committedIn" name="Cobros" fill="var(--success)" radius={0} />
 <Bar dataKey="committedOut" name="Pagos" fill="var(--warning)" radius={0} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </Section>
 </div>

 <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
 <div ref={movementsRef}>
 <Section title="Movimientos recientes" subtitle="Ultimas entradas y salidas contabilizadas en la cuenta principal.">
 <div className="space-y-3">
 {recentMovements.map((movement) => {
 const isInflow = movement.direction === 'in';
 return (
 <div
 key={movement.id}
 className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[var(--border)] bg-transparent px-4 py-4"
 >
 <div className="flex items-center gap-3">
 <div
 className="flex h-11 w-11 items-center justify-center rounded-lg"
 style={{
 backgroundColor: isInflow ? 'var(--success-50)' : 'var(--warning-50)',
 color: isInflow ? 'var(--success)' : 'var(--warning)',
 }}
 >
 {isInflow ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
 </div>
 <div>
 <p className="text-sm font-semibold text-[var(--text-primary)]">{movement.description || 'Movimiento sin descripción'}</p>
 <p className="text-xs text-[var(--text-secondary)]">
 {movement.counterpartyName || 'Sin contraparte'} · {formatDate(movement.postedDate)}
 </p>
 </div>
 </div>
 <div className="text-right">
 <p className={`text-sm font-semibold ${isInflow ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
 {isInflow ? '+' : '-'}
 {formatCurrency(movement.amount)}
 </p>
 <p className="text-xs text-[var(--text-secondary)]">{movement.kind}</p>
 </div>
 </div>
 );
 })}
 </div>
 </Section>
 </div>

 <div ref={reconciliationRef}>
 <Section title="Pendiente de conciliacion" subtitle="Movimientos bancarios aun no vinculados a un cierre mensual.">
 <div className="space-y-3">
 {metrics.unreconciledMovements.length === 0 && (
 <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
 No hay movimientos pendientes de conciliación.
 </div>
 )}
 {metrics.unreconciledMovements.slice(0, 10).map((movement) => (
 <div
 key={movement.id}
 className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-4"
 >
 <div className="mb-2 flex items-center justify-between gap-3">
 <div className="flex items-center gap-2 text-[var(--text-primary)]">
 <Landmark size={16} className="text-[var(--text-primary)]" />
 <span className="text-sm font-semibold">{movement.description || 'Movimiento sin descripción'}</span>
 </div>
 <span className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(movement.amount)}</span>
 </div>
 <p className="text-xs text-[var(--text-secondary)]">
 {movement.counterpartyName || 'Sin contraparte'} · {formatDate(movement.postedDate)}
 </p>
 </div>
 ))}
 </div>
 </Section>
 </div>
 </div>

 <div className="grid gap-6 lg:grid-cols-3">
 <Section title="Runway" subtitle="Caja actual sobre el egreso promedio de 90 dias." help={
 <HelpButton title="Runway" size={14}>
 <p>Meses de operacion que la caja actual puede cubrir al ritmo de gasto promedio de los ultimos 90 dias.</p>
 <p>Un runway inferior a 3 meses se considera critico.</p>
 </HelpButton>
 }>
 <div className="flex items-center gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--text-primary)]">
 <TrendingUp size={18} />
 </div>
 <div>
 <p className="nd-display text-[32px] font-semibold tracking-tight text-[var(--text-display)]">
 {metrics.runwayMonths == null ? 'N/A' : `${metrics.runwayMonths.toFixed(1)}m`}
 </p>
 <p className="text-sm text-[var(--text-secondary)]">Egreso medio mensual: {formatCurrency(metrics.avgMonthlyOutflows)}</p>
 </div>
 </div>
 </Section>

 <div
 className="cursor-pointer hover: transition-transform duration-200 rounded-md"
 onClick={() => navigate('/cxc')}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/cxc'); } }}
 >
 <Section title="Cobros vencidos" subtitle="Documentos abiertos con vencimiento pasado.">
 <div className="flex items-center gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-transparent text-[var(--warning)]">
 <ShieldAlert size={18} />
 </div>
 <div>
 <p className="nd-display text-[32px] font-semibold tracking-tight text-[var(--text-display)]">
 {metrics.overdueReceivables.length}
 </p>
 <p className="text-sm text-[var(--text-secondary)]">
 {formatCurrency(metrics.overdueReceivables.reduce((sum, entry) => sum + entry.openAmount, 0))}
 </p>
 </div>
 </div>
 </Section>
 </div>

 <div
 className="cursor-pointer hover: transition-transform duration-200 rounded-md"
 onClick={() => navigate('/cxp')}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/cxp'); } }}
 >
 <Section title="Pagos por salir" subtitle="Compromisos abiertos dentro de la siguiente ventana.">
 <div className="flex items-center gap-4">
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-transparent text-[var(--warning)]">
 <Clock3 size={18} />
 </div>
 <div>
 <p className="nd-display text-[32px] font-semibold tracking-tight text-[var(--text-display)]">
 {metrics.upcomingPayables.length}
 </p>
 <p className="text-sm text-[var(--text-secondary)]">
 {formatCurrency(metrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0))}
 </p>
 </div>
 </div>
 </Section>
 </div>
 </div>

 <Section title="Estado de control" subtitle="Referencia rápida para la operación diaria.">
 <div className="grid gap-4 md:grid-cols-3">
 <div className="rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-4">
 <div className="mb-2 flex items-center gap-2 text-[var(--success)]">
 <CheckCircle2 size={16} />
 <span className="text-sm font-semibold">Caja registrada</span>
 </div>
 <p className="text-sm leading-6 text-[var(--text-secondary)]">Los movimientos confirmados alimentan el saldo disponible y la conciliación.</p>
 </div>
 <div className="rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-4">
 <div className="mb-2 flex items-center gap-2 text-[var(--text-primary)]">
 <Landmark size={16} />
 <span className="text-sm font-semibold">Control por documento</span>
 </div>
 <p className="text-sm leading-6 text-[var(--text-secondary)]">Las facturas abiertas se siguen por separado hasta que el cobro o el pago ocurre.</p>
 </div>
 <div className="rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-4">
 <div className="mb-2 flex items-center gap-2 text-[var(--warning)]">
 <Clock3 size={16} />
 <span className="text-sm font-semibold">Disciplina semanal</span>
 </div>
 <p className="text-sm leading-6 text-[var(--text-secondary)]">Revisar y conciliar cada semana mejora la calidad del cierre y de la proyección.</p>
 </div>
 </div>
 </Section>
 </div>
 );
};

export default CashFlow;
