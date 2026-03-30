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
    <div className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/96 px-3 py-3 shadow-[0_20px_50px_rgba(118,136,173,0.18)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6980ac]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const Section = ({ title, subtitle, children }) => (
  <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
    <div className="mb-5">
      <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-[#6b7a96]">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const CashFlow = ({ user }) => {
  const metrics = useTreasuryMetrics({ user });
  const navigate = useNavigate();
  const movementsRef = useRef(null);
  const reconciliationRef = useRef(null);

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Preparando el panel de tesorería...</p>
        </div>
      </div>
    );
  }

  const recentMovements = [...metrics.filteredMovements]
    .sort((left, right) => (right.postedDate || '').localeCompare(left.postedDate || ''))
    .slice(0, 12);

  const SHORT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(185,248,238,0.26),transparent_24%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.34),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Tesorería</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-[#101938]">
              Caja, vencimientos y seguimiento diario en una sola vista.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#5f7091]">
              Consulta el saldo disponible, las próximas entradas y salidas y los movimientos pendientes de revisión sin mezclar compromisos con caja real.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[rgba(201,214,238,0.78)] bg-white/74 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6980ac]">Caja actual</p>
              <p className="mt-2 text-[30px] font-semibold text-[#101938]">{formatCurrency(metrics.currentCash)}</p>
            </div>
            <div className="rounded-[24px] border border-[rgba(201,214,238,0.78)] bg-white/74 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6980ac]">Liquidez proyectada</p>
              <p className="mt-2 text-[30px] font-semibold text-[#3156d3]">{formatCurrency(metrics.projectedLiquidity)}</p>
            </div>
            <div
              className="rounded-[24px] border border-[rgba(201,214,238,0.78)] bg-white/74 px-4 py-4 cursor-pointer hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(126,147,190,0.16)] transition-transform duration-200"
              onClick={() => movementsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); movementsRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6980ac]">Cobros próximos</p>
              <p className="mt-2 text-[30px] font-semibold text-[#0f8f4b]">
                {formatCurrency(metrics.upcomingReceivables.reduce((sum, entry) => sum + entry.openAmount, 0))}
              </p>
            </div>
            <div
              className="rounded-[24px] border border-[rgba(201,214,238,0.78)] bg-white/74 px-4 py-4 cursor-pointer hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(126,147,190,0.16)] transition-transform duration-200"
              onClick={() => reconciliationRef.current?.scrollIntoView({ behavior: 'smooth' })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reconciliationRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#6980ac]">Pagos próximos</p>
              <p className="mt-2 text-[30px] font-semibold text-[#c46a19]">
                {formatCurrency(metrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Section title="Estado de Resultados — Últimos 6 meses" subtitle="Ingresos vs gastos realizados, agrupados por mes.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(201,214,238,0.58)]">
                <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Mes</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Ingresos</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Gastos</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,214,238,0.42)]">
              {monthlyPL.map((row) => (
                <tr key={row.ym} className="hover:bg-[rgba(90,141,221,0.04)]">
                  <td className="px-3 py-3 text-[13px] font-medium text-[#101938]">{row.label}</td>
                  <td className="px-3 py-3 text-right text-[13px] font-medium text-[#0f8f4b]">{formatCurrency(row.inflows)}</td>
                  <td className="px-3 py-3 text-right text-[13px] font-medium text-[#d46a13]">{formatCurrency(row.outflows)}</td>
                  <td className={`px-3 py-3 text-right text-[13px] font-semibold ${row.net >= 0 ? 'text-[#0f8f4b]' : 'text-[#cc4b3f]'}`}>
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
              <CartesianGrid stroke="rgba(176,194,226,0.42)" vertical={false} />
              <XAxis dataKey="label" stroke="#7b8dae" tickLine={false} axisLine={false} />
              <YAxis stroke="#7b8dae" tickLine={false} axisLine={false} tickFormatter={(v) => `€${Math.round(v / 1000)}k`} />
              <Tooltip content={<TooltipCard />} />
              <Bar dataKey="inflows" name="Ingresos" fill="#3156d3" radius={[8, 8, 0, 0]} />
              <Bar dataKey="outflows" name="Gastos" fill="#d47a22" radius={[8, 8, 0, 0]} />
              <Bar dataKey="net" name="Resultado" radius={[8, 8, 0, 0]} fill="#0f8f4b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Section title="Balance de caja semanal" subtitle="Historico reciente derivado de movimientos contabilizados.">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.cashSeries}>
                <CartesianGrid stroke="rgba(176,194,226,0.42)" vertical={false} />
                <XAxis dataKey="label" stroke="#7b8dae" tickLine={false} axisLine={false} />
                <YAxis stroke="#7b8dae" tickLine={false} axisLine={false} tickFormatter={(value) => `€${Math.round(value / 1000)}k`} />
                <Tooltip content={<TooltipCard />} />
                <Line type="monotone" dataKey="balance" name="Caja" stroke="#3156d3" strokeWidth={2.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Compromisos por semana" subtitle="Entradas y salidas comprometidas en la siguiente ventana de 8 semanas.">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.weeklyProjection}>
                <CartesianGrid stroke="rgba(176,194,226,0.42)" vertical={false} />
                <XAxis dataKey="week" stroke="#7b8dae" tickLine={false} axisLine={false} />
                <YAxis stroke="#7b8dae" tickLine={false} axisLine={false} tickFormatter={(value) => `€${Math.round(value / 1000)}k`} />
                <Tooltip content={<TooltipCard />} />
                <Bar dataKey="committedIn" name="Cobros" fill="#0f8f4b" radius={[10, 10, 0, 0]} />
                <Bar dataKey="committedOut" name="Pagos" fill="#d47a22" radius={[10, 10, 0, 0]} />
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
                  className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/76 px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl"
                      style={{
                        backgroundColor: isInflow ? 'rgba(48,209,88,0.14)' : 'rgba(255,159,10,0.16)',
                        color: isInflow ? '#30d158' : '#ff9f0a',
                      }}
                    >
                      {isInflow ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#101938]">{movement.description || 'Movimiento sin descripción'}</p>
                      <p className="text-xs text-[#6b7a96]">
                        {movement.counterpartyName || 'Sin contraparte'} · {formatDate(movement.postedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${isInflow ? 'text-[#30d158]' : 'text-[#ff9f0a]'}`}>
                      {isInflow ? '+' : '-'}
                      {formatCurrency(movement.amount)}
                    </p>
                    <p className="text-xs text-[#6b7a96]">{movement.kind}</p>
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
              <div className="rounded-[22px] border border-dashed border-[rgba(201,214,238,0.78)] px-4 py-10 text-center text-sm text-[#6b7a96]">
                No hay movimientos pendientes de conciliación.
              </div>
            )}
            {metrics.unreconciledMovements.slice(0, 10).map((movement) => (
              <div
                key={movement.id}
                className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/76 px-4 py-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[#101938]">
                    <Landmark size={16} className="text-[#3156d3]" />
                    <span className="text-sm font-semibold">{movement.description || 'Movimiento sin descripción'}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#101938]">{formatCurrency(movement.amount)}</span>
                </div>
                <p className="text-xs text-[#6b7a96]">
                  {movement.counterpartyName || 'Sin contraparte'} · {formatDate(movement.postedDate)}
                </p>
              </div>
            ))}
          </div>
        </Section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Runway" subtitle="Caja actual sobre el egreso promedio de 90 dias.">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(90,141,221,0.14)] text-[#3156d3]">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[32px] font-semibold tracking-tight text-[#101938]">
                {metrics.runwayMonths == null ? 'N/A' : `${metrics.runwayMonths.toFixed(1)}m`}
              </p>
              <p className="text-sm text-[#6b7a96]">Egreso medio mensual: {formatCurrency(metrics.avgMonthlyOutflows)}</p>
            </div>
          </div>
        </Section>

        <div
          className="cursor-pointer hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(126,147,190,0.16)] transition-transform duration-200 rounded-[28px]"
          onClick={() => navigate('/cxc')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/cxc'); } }}
        >
        <Section title="Cobros vencidos" subtitle="Documentos abiertos con vencimiento pasado.">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(214,106,19,0.12)] text-[#d46a13]">
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-[32px] font-semibold tracking-tight text-[#101938]">
                {metrics.overdueReceivables.length}
              </p>
              <p className="text-sm text-[#6b7a96]">
                {formatCurrency(metrics.overdueReceivables.reduce((sum, entry) => sum + entry.openAmount, 0))}
              </p>
            </div>
          </div>
        </Section>
        </div>

        <div
          className="cursor-pointer hover:scale-[1.02] hover:shadow-[0_22px_50px_rgba(126,147,190,0.16)] transition-transform duration-200 rounded-[28px]"
          onClick={() => navigate('/cxp')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/cxp'); } }}
        >
        <Section title="Pagos por salir" subtitle="Compromisos abiertos dentro de la siguiente ventana.">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(212,122,34,0.12)] text-[#c46a19]">
              <Clock3 size={18} />
            </div>
            <div>
              <p className="text-[32px] font-semibold tracking-tight text-[#101938]">
                {metrics.upcomingPayables.length}
              </p>
              <p className="text-sm text-[#6b7a96]">
                {formatCurrency(metrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0))}
              </p>
            </div>
          </div>
        </Section>
        </div>
      </div>

      <Section title="Estado de control" subtitle="Referencia rápida para la operación diaria.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[22px] border border-[rgba(15,143,75,0.14)] bg-[rgba(240,250,244,0.88)] px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-[#0f8f4b]">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Caja registrada</span>
            </div>
            <p className="text-sm leading-6 text-[#40644b]">Los movimientos confirmados alimentan el saldo disponible y la conciliación.</p>
          </div>
          <div className="rounded-[22px] border border-[rgba(90,141,221,0.14)] bg-[rgba(236,242,254,0.92)] px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-[#3156d3]">
              <Landmark size={16} />
              <span className="text-sm font-semibold">Control por documento</span>
            </div>
            <p className="text-sm leading-6 text-[#4a5d84]">Las facturas abiertas se siguen por separado hasta que el cobro o el pago ocurre.</p>
          </div>
          <div className="rounded-[22px] border border-[rgba(212,122,34,0.14)] bg-[rgba(255,248,236,0.92)] px-4 py-4">
            <div className="mb-2 flex items-center gap-2 text-[#c46a19]">
              <Clock3 size={16} />
              <span className="text-sm font-semibold">Disciplina semanal</span>
            </div>
            <p className="text-sm leading-6 text-[#7a5d34]">Revisar y conciliar cada semana mejora la calidad del cierre y de la proyección.</p>
          </div>
        </div>
      </Section>
    </div>
  );
};

export default CashFlow;
