import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Info,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinanceLedger } from '../../hooks/useFinanceLedger';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency } from '../../utils/formatters';
import { MONTH_NAMES, resolvePeriodRange } from '../../finance/reporting';

const statusColors = {
  good: { bg: 'bg-[rgba(48,209,88,0.12)]', text: 'text-[#30d158]', border: 'border-[rgba(48,209,88,0.22)]', icon: 'text-[#30d158]' },
  warning: { bg: 'bg-[rgba(255,159,10,0.12)]', text: 'text-[#ff9f0a]', border: 'border-[rgba(255,159,10,0.22)]', icon: 'text-[#ff9f0a]' },
  bad: { bg: 'bg-[rgba(255,69,58,0.12)]', text: 'text-[#ff453a]', border: 'border-[rgba(255,69,58,0.22)]', icon: 'text-[#ff453a]' },
};

const getStatus = (value, benchmark, inverse = false) => {
  if (inverse) {
    if (value <= benchmark.good) return 'good';
    if (value <= benchmark.warning) return 'warning';
    return 'bad';
  }
  if (value >= benchmark.good) return 'good';
  if (value >= benchmark.warning) return 'warning';
  return 'bad';
};

const RatioCard = ({ title, value, unit = '', benchmark, inverse = false, description, icon }) => {
  const IconComponent = icon;
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const status = getStatus(normalizedValue, benchmark, inverse);
  const colors = statusColors[status];
  const displayValue = Math.abs(normalizedValue) > 999 ? normalizedValue.toFixed(0) : normalizedValue.toFixed(1);
  const cap = inverse ? benchmark.warning * 1.8 : Math.max(benchmark.good * 1.8, 1);
  const gaugePercent = Math.min(100, Math.max(0, (Math.abs(normalizedValue) / cap) * 100));
  const gaugeData = [{ name: 'value', value: gaugePercent, fill: status === 'good' ? '#30d158' : status === 'warning' ? '#ff9f0a' : '#ff453a' }];

  return (
    <div className={`overflow-hidden rounded-[24px] border bg-white/84 shadow-[0_18px_44px_rgba(126,147,190,0.1)] ${colors.border}`}>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className={`rounded-xl p-2 ${colors.bg}`}>
              <IconComponent className={colors.icon} size={18} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#101938]">{title}</h4>
              <p className="text-xs text-[#6b7a96]">{description}</p>
            </div>
          </div>
          {status === 'good' ? <CheckCircle2 className="text-[#30d158]" size={18} /> : <AlertTriangle className={colors.icon} size={18} />}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-3xl font-bold ${colors.text}`}>{displayValue}{unit}</p>
            <p className="mt-1 text-xs text-[#7b8dae]">
              Referencia {inverse ? 'máx.' : 'mín.'}: {benchmark.good}{unit}
            </p>
          </div>
          <div className="h-20 w-20">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" data={gaugeData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#e3eaf6' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className={`px-4 py-2 text-xs font-semibold ${colors.bg} ${colors.text}`}>
        {status === 'good' ? 'Saludable' : status === 'warning' ? 'Requiere atención' : 'Crítico'}
      </div>
    </div>
  );
};

const SummaryMetric = ({ label, value, subvalue, tone }) => (
  <div className="rounded-[22px] border border-[rgba(205,219,243,0.78)] bg-white/84 p-4 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
    <p className="text-sm text-[#6b7a96]">{label}</p>
    <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    {subvalue && <p className="mt-1 text-xs text-[#7b8dae]">{subvalue}</p>}
  </div>
);

const FinancialRatios = ({ user }) => {
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(`month:${defaultMonth}`);

  const globalMetrics = useTreasuryMetrics({ user });
  const periodRange = resolvePeriodRange(selectedPeriod, now, 0);
  const periodMetrics = useTreasuryMetrics({ user, from: periodRange.from, to: periodRange.to });
  const ledger = useFinanceLedger(user);

  const ratioData = useMemo(() => {
    const receivables = globalMetrics.pendingReceivables;
    const payables = globalMetrics.pendingPayables;
    const currentCash = globalMetrics.currentCash;
    const currentRatio = payables > 0 ? (currentCash + receivables) / payables : currentCash + receivables > 0 ? 999 : 1;
    const quickRatio = payables > 0 ? currentCash / payables : currentCash > 0 ? 999 : 1;
    const workingCapital = currentCash + receivables - payables;
    const coverage14d = globalMetrics.upcomingPayables.length > 0
      ? globalMetrics.upcomingReceivables.reduce((sum, entry) => sum + entry.openAmount, 0) /
        globalMetrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0)
      : globalMetrics.upcomingReceivables.length > 0
        ? 999
        : 1;

    const monthlyIn = Math.max(periodMetrics.cashInflows || 0, 1);
    const monthlyOut = Math.max(periodMetrics.cashOutflows || 0, 1);
    const avgDaysReceivable = (receivables / (monthlyIn / 30));
    const avgDaysPayable = (payables / (monthlyOut / 30));
    const cashCycle = avgDaysReceivable - avgDaysPayable;
    const receivablesTurnover = receivables > 0 ? (monthlyIn * 12) / receivables : 0;
    const payablesTurnover = payables > 0 ? (monthlyOut * 12) / payables : 0;

    const cashMargin = periodMetrics.cashInflows > 0 ? (periodMetrics.netMovement / periodMetrics.cashInflows) * 100 : 0;
    const projectedMargin = globalMetrics.projectedLiquidity !== 0
      ? ((globalMetrics.projectedLiquidity - currentCash) / Math.max(Math.abs(currentCash), 1)) * 100
      : 0;
    const overdueShare = receivables > 0
      ? (globalMetrics.overdueReceivables.reduce((sum, entry) => sum + entry.openAmount, 0) / receivables) * 100
      : 0;
    const payablePressure = payables > 0
      ? (globalMetrics.overduePayables.reduce((sum, entry) => sum + entry.openAmount, 0) / payables) * 100
      : 0;

    return {
      currentRatio,
      quickRatio,
      workingCapital,
      coverage14d,
      avgDaysReceivable,
      avgDaysPayable,
      cashCycle,
      receivablesTurnover,
      payablesTurnover,
      cashMargin,
      projectedMargin,
      overdueShare,
      payablePressure,
    };
  }, [globalMetrics, periodMetrics]);

  const comparisonData = [
    { name: 'Ratio corriente', value: Math.min(ratioData.currentRatio, 4), benchmark: 1.5 },
    { name: 'Prueba ácida', value: Math.min(ratioData.quickRatio, 4), benchmark: 1.0 },
    { name: 'Cobertura 14d', value: Math.min(ratioData.coverage14d, 4), benchmark: 1.1 },
    { name: 'Margen caja', value: Math.max(ratioData.cashMargin, 0), benchmark: 15 },
    { name: 'Runway', value: Math.min(globalMetrics.runwayMonths || 0, 12), benchmark: 3 },
  ];

  if (globalMetrics.loading || periodMetrics.loading || ledger.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Calculando indicadores financieros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(210,227,255,0.4),transparent_24%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(244,248,255,0.88))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Ratios financieros</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-[#101938]">Liquidez, cobertura y eficiencia operativa.</h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#5f7091]">
              Los indicadores se calculan desde caja real, facturas abiertas y ritmo de entradas y salidas para ofrecer una lectura útil de la operación.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((offset) => {
              const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
              const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPeriod(`month:${key}`)}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition-all ${
                    selectedPeriod === `month:${key}`
                      ? 'border-[rgba(90,141,221,0.28)] bg-[rgba(90,141,221,0.12)] text-[#3156d3]'
                      : 'border-[rgba(201,214,238,0.82)] bg-white/78 text-[#6b7a96] hover:text-[#101938]'
                  }`}
                >
                  {MONTH_NAMES[date.getMonth()]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <SummaryMetric label="Caja actual" value={formatCurrency(globalMetrics.currentCash)} tone={globalMetrics.currentCash >= 0 ? 'text-[#3156d3]' : 'text-[#d46a13]'} />
        <SummaryMetric label="Liquidez proyectada" value={formatCurrency(globalMetrics.projectedLiquidity)} subvalue="Caja + CXC abiertas - CXP abiertas" tone={globalMetrics.projectedLiquidity >= 0 ? 'text-[#0f8f4b]' : 'text-[#d46a13]'} />
        <SummaryMetric label="Próximos 14 días" value={formatCurrency(globalMetrics.next14Net)} subvalue={`${globalMetrics.upcomingReceivables.length} cobros y ${globalMetrics.upcomingPayables.length} pagos`} tone={globalMetrics.next14Net >= 0 ? 'text-[#0f8f4b]' : 'text-[#c46a19]'} />
        <SummaryMetric label="Runway" value={globalMetrics.runwayMonths ? `${globalMetrics.runwayMonths.toFixed(1)}m` : 'N/A'} subvalue={`Burn mensual ${formatCurrency(globalMetrics.avgMonthlyOutflows)}`} tone="text-[#3156d3]" />
        <SummaryMetric label="Período" value={formatCurrency(periodMetrics.netMovement)} subvalue={`Caja realizada ${periodRange.label}`} tone={periodMetrics.netMovement >= 0 ? 'text-[#0f8f4b]' : 'text-[#d46a13]'} />
      </div>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-[rgba(90,141,221,0.12)] p-2">
            <Wallet className="text-[#3156d3]" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#101938]">Liquidez</h3>
            <p className="text-sm text-[#6b7a96]">Capacidad de sostener obligaciones desde caja real y compromisos abiertos.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RatioCard title="Ratio corriente" value={ratioData.currentRatio} unit="x" benchmark={{ good: 1.5, warning: 1.0 }} description="(Caja + CXC) / CXP" icon={Activity} />
          <RatioCard title="Prueba ácida" value={ratioData.quickRatio} unit="x" benchmark={{ good: 1.0, warning: 0.6 }} description="Caja / CXP" icon={CreditCard} />
          <RatioCard title="Cobertura 14d" value={ratioData.coverage14d} unit="x" benchmark={{ good: 1.1, warning: 0.9 }} description="Cobros próximos / pagos próximos" icon={Target} />
          <RatioCard title="Capital operativo" value={ratioData.workingCapital} benchmark={{ good: 0, warning: -5000 }} description="Caja + CXC - CXP" icon={DollarSign} />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-[rgba(212,122,34,0.12)] p-2">
            <Clock className="text-[#c46a19]" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#101938]">Actividad</h3>
            <p className="text-sm text-[#6b7a96]">Velocidad de cobro y pago sobre el saldo abierto actual.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RatioCard title="Días de cobro" value={ratioData.avgDaysReceivable} unit=" d" benchmark={{ good: 30, warning: 45 }} inverse description="CXC / ritmo mensual de cobro" icon={TrendingUp} />
          <RatioCard title="Días de pago" value={ratioData.avgDaysPayable} unit=" d" benchmark={{ good: 35, warning: 50 }} inverse description="CXP / ritmo mensual de pago" icon={TrendingDown} />
          <RatioCard title="Ciclo de caja" value={ratioData.cashCycle} unit=" d" benchmark={{ good: 15, warning: 40 }} inverse description="Días cobro - días pago" icon={Activity} />
          <RatioCard title="Rotación CXC" value={ratioData.receivablesTurnover} unit="x" benchmark={{ good: 8, warning: 4 }} description="Veces al año" icon={BarChart3} />
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-[rgba(15,143,75,0.12)] p-2">
            <Percent className="text-[#0f8f4b]" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#101938]">Rentabilidad y presión</h3>
            <p className="text-sm text-[#6b7a96]">Indicadores gerenciales basados en caja y envejecimiento de cartera y deuda.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RatioCard title="Margen de caja" value={ratioData.cashMargin} unit="%" benchmark={{ good: 15, warning: 5 }} description="Resultado del período / ingresos realizados" icon={TrendingUp} />
          <RatioCard title="Margen proyectado" value={ratioData.projectedMargin} unit="%" benchmark={{ good: 5, warning: 0 }} description="Liquidez proyectada vs caja actual" icon={Target} />
          <RatioCard title="Mora CXC" value={ratioData.overdueShare} unit="%" benchmark={{ good: 15, warning: 30 }} inverse description="Saldo vencido / CXC abiertas" icon={AlertTriangle} />
          <RatioCard title="Presión CXP" value={ratioData.payablePressure} unit="%" benchmark={{ good: 20, warning: 35 }} inverse description="Saldo vencido / CXP abiertas" icon={TrendingDown} />
        </div>
      </div>

      <div className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-6 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-[rgba(90,141,221,0.12)] p-2">
            <BarChart3 className="text-[#3156d3]" size={18} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#101938]">Comparativa frente a referencia</h3>
            <p className="text-sm text-[#6b7a96]">Referencia rápida para liquidez y resistencia operativa.</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} layout="vertical" margin={{ left: 110 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(176,194,226,0.42)" />
            <XAxis type="number" tick={{ fill: '#7b8dae', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#16223f', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value, name) => [Number(value).toFixed(1), name === 'value' ? 'Actual' : 'Benchmark']}
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(201,214,238,0.82)', borderRadius: 18 }}
            />
            <Bar dataKey="value" name="Actual" radius={[0, 8, 8, 0]}>
              {comparisonData.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={entry.value >= entry.benchmark ? '#30d158' : entry.value >= entry.benchmark * 0.75 ? '#ff9f0a' : '#ff453a'}
                />
              ))}
            </Bar>
            <Bar dataKey="benchmark" name="Benchmark" fill="#8ea2c7" radius={[0, 8, 8, 0]} opacity={0.55} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-[24px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(247,250,255,0.92),rgba(240,246,255,0.88))] p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 text-[#3156d3]" size={18} />
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-[#3156d3]">Liquidez</p>
              <p className="mt-1 text-sm text-[#5f7091]">El ratio corriente y la prueba ácida usan caja real más compromisos abiertos, sin adelantar cobros que aún no ocurrieron.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3156d3]">Actividad</p>
              <p className="mt-1 text-sm text-[#5f7091]">Los días de cobro y pago se estiman con saldo abierto actual frente al ritmo del período seleccionado.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#3156d3]">Rentabilidad</p>
              <p className="mt-1 text-sm text-[#5f7091]">El margen mostrado corresponde a caja realizada. Una contabilidad completa requeriría un libro contable fuera del alcance de esta fase.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialRatios;
