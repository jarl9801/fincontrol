import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Target,
  Wallet,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency } from '../../utils/formatters';

const StatCard = ({ title, value, subtitle, accent, icon }) => {
  const IconComponent = icon;

  return (
    <div
      className="rounded-[26px] border p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]"
      style={{ background: `linear-gradient(160deg, ${accent}14 0%, rgba(10,11,15,0.94) 55%)`, borderColor: `${accent}26` }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">{title}</p>
          <p className="mt-2 text-[28px] font-semibold tracking-tight text-white">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}1f`, color: accent }}>
          <IconComponent size={18} />
        </div>
      </div>
      <p className="text-sm text-[#8e8e93]">{subtitle}</p>
    </div>
  );
};

const ScenarioCard = ({ title, balance, delta, accent, subtitle }) => (
  <div className="rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] p-5">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">{title}</p>
    <p className="mt-2 text-[28px] font-semibold tracking-tight" style={{ color: accent }}>{formatCurrency(balance)}</p>
    <p className={`mt-2 text-sm font-semibold ${delta >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
      {delta >= 0 ? '+' : ''}{formatCurrency(delta)}
    </p>
    <p className="mt-1 text-sm text-[#8e8e93]">{subtitle}</p>
  </div>
);

const ProyeccionCashflow = ({ user }) => {
  const metrics = useTreasuryMetrics({ user });

  const projectionData = useMemo(() => {
    const state = metrics.weeklyProjection.reduce((accumulator, row) => {
      const optimisticDelta = row.committedIn * 1.1 - row.committedOut * 0.95;
      const pessimisticDelta = row.committedIn * 0.8 - row.committedOut * 1.1;

      const optimisticBalance = accumulator.optimistic + optimisticDelta;
      const pessimisticBalance = accumulator.pessimistic + pessimisticDelta;

      accumulator.rows.push({
        label: row.week,
        range: row.label,
        committedIn: row.committedIn,
        committedOut: row.committedOut,
        base: row.projectedBalance,
        optimistic: Math.round(optimisticBalance * 100) / 100,
        pessimistic: Math.round(pessimisticBalance * 100) / 100,
      });
      accumulator.optimistic = optimisticBalance;
      accumulator.pessimistic = pessimisticBalance;

      return accumulator;
    }, {
      optimistic: metrics.currentCash,
      pessimistic: metrics.currentCash,
      rows: [],
    });

    return state.rows;
  }, [metrics.currentCash, metrics.weeklyProjection]);

  const alerts = useMemo(() => {
    const items = [];
    const negativeBase = projectionData.find((entry) => entry.base < 0);
    const negativePessimistic = projectionData.find((entry) => entry.pessimistic < 0);

    if (negativeBase) {
      items.push({ type: 'critical', text: `Saldo negativo proyectado en escenario base durante ${negativeBase.range}.` });
    } else if (negativePessimistic) {
      items.push({ type: 'warning', text: `En un escenario pesimista podrías entrar en saldo negativo durante ${negativePessimistic.range}.` });
    }

    if (metrics.next14Net < 0) {
      items.push({ type: 'warning', text: `La ventana de 14 días ya muestra una presión neta de ${formatCurrency(metrics.next14Net)}.` });
    }

    if ((metrics.runwayMonths || 0) > 0 && metrics.runwayMonths < 2) {
      items.push({ type: 'critical', text: `El runway estimado es menor a 2 meses (${metrics.runwayMonths.toFixed(1)}m).` });
    }

    return items;
  }, [metrics.next14Net, metrics.runwayMonths, projectionData]);

  const finalScenario = projectionData[projectionData.length - 1];

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#8e8e93]">Proyectando tesorería...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(10,132,255,0.18),transparent_28%),linear-gradient(160deg,#0b1220_0%,#090b10_100%)] px-6 py-7 shadow-[0_40px_120px_rgba(0,0,0,0.42)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8fdcff]">Proyección de tesorería</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-white">Horizonte de 8 semanas usando CXC, CXP y caja real.</h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#a7a7ad]">
              La proyección parte del saldo bancario actual y suma o resta solo compromisos abiertos con vencimiento conocido.
            </p>
          </div>
          <div className="rounded-[22px] border border-[rgba(100,210,255,0.18)] bg-[rgba(100,210,255,0.08)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8fdcff]">Horizonte</p>
            <p className="mt-1 text-sm font-semibold text-white">Próximas 8 semanas</p>
          </div>
        </div>
      </section>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.text}
              className={`flex items-center gap-3 rounded-[20px] border px-4 py-3 ${
                alert.type === 'critical'
                  ? 'border-[rgba(255,69,58,0.22)] bg-[rgba(255,69,58,0.1)]'
                  : 'border-[rgba(255,159,10,0.22)] bg-[rgba(255,159,10,0.1)]'
              }`}
            >
              <AlertTriangle size={16} className={alert.type === 'critical' ? 'text-[#ff453a]' : 'text-[#ff9f0a]'} />
              <span className={`text-sm ${alert.type === 'critical' ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`}>{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard title="Caja actual" value={formatCurrency(metrics.currentCash)} subtitle="Saldo bancario real a hoy" accent={metrics.currentCash >= 0 ? '#64d2ff' : '#ff453a'} icon={Wallet} />
        <StatCard title="Ventana 14d" value={formatCurrency(metrics.next14Net)} subtitle={`${metrics.upcomingReceivables.length} cobros y ${metrics.upcomingPayables.length} pagos`} accent={metrics.next14Net >= 0 ? '#30d158' : '#ff9f0a'} icon={Calendar} />
        <StatCard title="Liquidez proyectada" value={formatCurrency(metrics.projectedLiquidity)} subtitle="Caja actual + CXC abiertas - CXP abiertas" accent={metrics.projectedLiquidity >= 0 ? '#30d158' : '#ff453a'} icon={Target} />
        <StatCard title="Runway" value={metrics.runwayMonths ? `${metrics.runwayMonths.toFixed(1)}m` : 'N/A'} subtitle={`Burn mensual promedio ${formatCurrency(metrics.avgMonthlyOutflows)}`} accent="#bf5af2" icon={Zap} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScenarioCard
          title="Escenario optimista"
          balance={finalScenario?.optimistic ?? metrics.currentCash}
          delta={(finalScenario?.optimistic ?? metrics.currentCash) - metrics.currentCash}
          accent="#30d158"
          subtitle="+10% cobros comprometidos y -5% pagos comprometidos"
        />
        <ScenarioCard
          title="Escenario base"
          balance={finalScenario?.base ?? metrics.currentCash}
          delta={(finalScenario?.base ?? metrics.currentCash) - metrics.currentCash}
          accent="#64d2ff"
          subtitle="Solo compromisos actualmente abiertos"
        />
        <ScenarioCard
          title="Escenario pesimista"
          balance={finalScenario?.pessimistic ?? metrics.currentCash}
          delta={(finalScenario?.pessimistic ?? metrics.currentCash) - metrics.currentCash}
          accent="#ff453a"
          subtitle="-20% cobros comprometidos y +10% pagos comprometidos"
        />
      </div>

      <section className="rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">Curva de liquidez</p>
          <h3 className="mt-1 text-[18px] font-semibold tracking-tight text-white">Saldo proyectado por semana</h3>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart
            data={[
              { label: 'Hoy', range: 'Hoy', base: metrics.currentCash, optimistic: metrics.currentCash, pessimistic: metrics.currentCash },
              ...projectionData,
            ]}
          >
            <defs>
              <linearGradient id="projection-base" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64d2ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#64d2ff" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="projection-optimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#30d158" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#30d158" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="projection-pessimistic" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff453a" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#ff453a" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6e6e73', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.range || ''}
              contentStyle={{ backgroundColor: '#101115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }}
            />
            <Legend />
            <Area type="monotone" dataKey="optimistic" name="Optimista" stroke="#30d158" fill="url(#projection-optimistic)" strokeWidth={2} />
            <Area type="monotone" dataKey="base" name="Base" stroke="#64d2ff" fill="url(#projection-base)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="pessimistic" name="Pesimista" stroke="#ff453a" fill="url(#projection-pessimistic)" strokeWidth={2} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,15,0.92)] shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
        <div className="border-b border-[rgba(255,255,255,0.06)] px-5 py-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
            <Activity size={18} className="text-[#8fdcff]" />
            Desglose semanal comprometido
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">
                <th className="px-4 py-3 text-left">Semana</th>
                <th className="px-4 py-3 text-left">Rango</th>
                <th className="px-4 py-3 text-right">Cobros comprometidos</th>
                <th className="px-4 py-3 text-right">Pagos comprometidos</th>
                <th className="px-4 py-3 text-right">Saldo base</th>
                <th className="px-4 py-3 text-right">Saldo optimista</th>
                <th className="px-4 py-3 text-right">Saldo pesimista</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {projectionData.map((row) => (
                <tr key={row.label} className="hover:bg-[rgba(255,255,255,0.03)]">
                  <td className="px-4 py-3 font-semibold text-white">{row.label}</td>
                  <td className="px-4 py-3 text-[#8e8e93]">{row.range}</td>
                  <td className="px-4 py-3 text-right text-[#30d158]">{formatCurrency(row.committedIn)}</td>
                  <td className="px-4 py-3 text-right text-[#ff453a]">{formatCurrency(row.committedOut)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.base >= 0 ? 'text-[#64d2ff]' : 'text-[#ff453a]'}`}>{formatCurrency(row.base)}</td>
                  <td className={`px-4 py-3 text-right ${row.optimistic >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>{formatCurrency(row.optimistic)}</td>
                  <td className="px-4 py-3 text-right text-[#ff453a]">{formatCurrency(row.pessimistic)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="rounded-[24px] border border-[rgba(10,132,255,0.22)] bg-[rgba(10,132,255,0.08)] p-5">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 text-[#64d2ff]" size={18} />
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[#64d2ff]">Base</p>
              <p className="mt-1 text-sm text-[#9fc2ff]">Usa únicamente CXC y CXP abiertas por vencimiento, sin asumir ventas o compras futuras todavía no registradas.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#64d2ff]">Optimista</p>
              <p className="mt-1 text-sm text-[#9fc2ff]">Asume mejor conversión de cobro y algo menos de salida sobre los pagos comprometidos.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#64d2ff]">Pesimista</p>
              <p className="mt-1 text-sm text-[#9fc2ff]">Asume retrasos de cobro y mayor presión de pagos. Útil para anticipar necesidades de liquidez.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProyeccionCashflow;
