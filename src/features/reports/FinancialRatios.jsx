import React from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Activity, Clock,
  CreditCard, Wallet, Target, BarChart3, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';

const FinancialRatios = ({ transactions }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper functions
  const getMonthTransactions = (month, year) => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.status === 'paid';
    });
  };

  // Current and previous periods
  const currentMonthTx = getMonthTransactions(currentMonth, currentYear);
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthTx = getMonthTransactions(prevMonth, prevYear);

  // YTD
  const ytdTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && t.status === 'paid';
  });

  // Calculate basic metrics
  const currentIncome = currentMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentProfit = currentIncome - currentExpenses;

  const ytdIncome = ytdTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const ytdExpenses = ytdTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const ytdProfit = ytdIncome - ytdExpenses;

  // Pending amounts
  const cxc = transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const cxp = transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  // Overdue transactions
  const overdueCXC = transactions.filter(t => {
    if (t.type !== 'income' || t.status !== 'pending') return false;
    const daysOverdue = Math.floor((now - new Date(t.date)) / (1000 * 60 * 60 * 24));
    return daysOverdue > 0;
  }).reduce((s, t) => s + t.amount, 0);

  const overdueCXP = transactions.filter(t => {
    if (t.type !== 'expense' || t.status !== 'pending') return false;
    const daysOverdue = Math.floor((now - new Date(t.date)) / (1000 * 60 * 60 * 24));
    return daysOverdue > 0;
  }).reduce((s, t) => s + t.amount, 0);

  // === RATIOS DE LIQUIDEZ ===
  const currentRatio = cxp > 0 ? (cxc / cxp) : (cxc > 0 ? 999 : 1);
  const quickRatio = cxp > 0 ? ((cxc - overdueCXC) / cxp) : 1; // Activo líquido / Pasivo corriente
  const workingCapital = cxc - cxp;
  const cashRatio = cxp > 0 ? (workingCapital / cxp) : 1;

  // === RATIOS DE ACTIVIDAD ===
  const avgDaysReceivable = cxc > 0 && currentIncome > 0 ? Math.round((cxc / (currentIncome / 30))) : 0;
  const avgDaysPayable = cxp > 0 && currentExpenses > 0 ? Math.round((cxp / (currentExpenses / 30))) : 0;
  const cashConversionCycle = avgDaysReceivable - avgDaysPayable;
  const receivablesTurnover = currentIncome > 0 && cxc > 0 ? (currentIncome * 12 / cxc) : 0;
  const payablesTurnover = currentExpenses > 0 && cxp > 0 ? (currentExpenses * 12 / cxp) : 0;

  // === RATIOS DE RENTABILIDAD ===
  const grossMargin = currentIncome > 0 ? (currentProfit / currentIncome * 100) : 0;
  const operatingMargin = currentIncome > 0 ? ((currentProfit * 0.85) / currentIncome * 100) : 0; // Estimado
  const netMargin = currentIncome > 0 ? ((currentProfit * 0.75) / currentIncome * 100) : 0; // Después de impuestos estimado
  const ytdMargin = ytdIncome > 0 ? (ytdProfit / ytdIncome * 100) : 0;

  // ROA y ROE simplificados (sin activos totales reales)
  const totalAssets = cxc + (currentProfit > 0 ? currentProfit : 0); // Simplificado
  const equity = totalAssets - cxp;
  const roa = totalAssets > 0 ? ((ytdProfit) / totalAssets * 100) : 0;
  const roe = equity > 0 ? ((ytdProfit) / equity * 100) : 0;

  // === RATIOS DE EFICIENCIA ===
  const expenseToIncomeRatio = currentIncome > 0 ? (currentExpenses / currentIncome * 100) : 0;
  const operatingEfficiency = 100 - expenseToIncomeRatio;

  // Benchmark values
  const BENCHMARKS = {
    currentRatio: { good: 1.5, warning: 1.0 },
    quickRatio: { good: 1.0, warning: 0.5 },
    avgDaysReceivable: { good: 30, warning: 45 },
    avgDaysPayable: { good: 30, warning: 45 },
    cashCycle: { good: 30, warning: 60 },
    grossMargin: { good: 30, warning: 15 },
    operatingMargin: { good: 20, warning: 10 },
    roa: { good: 15, warning: 5 },
    roe: { good: 20, warning: 10 },
    operatingEfficiency: { good: 30, warning: 15 }
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

  const statusColors = {
    good: { bg: 'bg-[rgba(16,185,129,0.12)]', text: 'text-[#30d158]', border: 'border-[rgba(16,185,129,0.25)]', icon: 'text-[#30d158]' },
    warning: { bg: 'bg-[rgba(245,158,11,0.12)]', text: 'text-[#ff9f0a]', border: 'border-[rgba(245,158,11,0.25)]', icon: 'text-[#ff9f0a]' },
    bad: { bg: 'bg-[rgba(239,68,68,0.12)]', text: 'text-[#ff453a]', border: 'border-[rgba(239,68,68,0.25)]', icon: 'text-[#ff453a]' }
  };

  const RatioCard = ({ title, value, unit = '', benchmark, inverse = false, description, icon: Icon }) => {
    const status = getStatus(value, benchmark, inverse);
    const colors = statusColors[status];
    const displayValue = typeof value === 'number' ? (value > 100 ? '>100' : value.toFixed(1)) : value;

    // Calculate gauge percentage
    const maxValue = inverse ? benchmark.warning * 2 : benchmark.good * 2;
    const gaugePercent = Math.min(100, Math.max(0, (value / maxValue) * 100));

    const gaugeData = [{ name: 'value', value: gaugePercent, fill: status === 'good' ? '#30d158' : status === 'warning' ? '#ff9f0a' : '#ff453a' }];

    return (
      <div className={`bg-[#1c1c1e] rounded-xl shadow-sm border ${colors.border} overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={colors.icon} size={18} />
              </div>
              <div>
                <h4 className="font-semibold text-[#e5e5ea] text-sm">{title}</h4>
                <p className="text-xs text-[#8e8e93]">{description}</p>
              </div>
            </div>
            {status === 'good' ? (
              <CheckCircle2 className="text-[#30d158]" size={20} />
            ) : status === 'warning' ? (
              <AlertTriangle className="text-[#ff9f0a]" size={20} />
            ) : (
              <AlertTriangle className="text-[#ff453a]" size={20} />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {displayValue}{unit}
              </p>
              <p className="text-xs text-[#636366] mt-1">
                Referencia: {inverse ? '<' : '>'}{benchmark.good}{unit}
              </p>
            </div>
            <div className="w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="100%"
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar
                    background={{ fill: '#000000' }}
                    dataKey="value"
                    cornerRadius={10}
                    fill={gaugeData[0].fill}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={`px-4 py-2 ${colors.bg} flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-[#30d158]' : status === 'warning' ? 'bg-[#ff9f0a]' : 'bg-[#ff453a]'}`} />
          <span className={`text-xs font-medium ${colors.text}`}>
            {status === 'good' ? 'Saludable' : status === 'warning' ? 'Requiere atención' : 'Crítico'}
          </span>
        </div>
      </div>
    );
  };

  const SummaryMetric = ({ label, value, subvalue, trend, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-[#0a84ff] to-[#0070e0]',
      emerald: 'from-[#30d158] to-[#28c74e]',
      rose: 'from-[#ff453a] to-[#e63b31]',
      amber: 'from-[#ff9f0a] to-[#e68f09]',
      indigo: 'from-[#5e5ce6] to-[#4f4dd4]'
    };

    return (
      <div className="bg-[#1c1c1e] rounded-xl shadow-sm border border-[rgba(255,255,255,0.08)] p-4">
        <p className="text-sm text-[#8e8e93] mb-1">{label}</p>
        <p className={`text-2xl font-bold bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
          {value}
        </p>
        {subvalue && <p className="text-xs text-[#636366] mt-1">{subvalue}</p>}
      </div>
    );
  };

  // Data for comparison chart
  const ratioComparisonData = [
    { name: 'Ratio Corriente', value: Math.min(currentRatio, 3), benchmark: 1.5 },
    { name: 'Margen Bruto', value: Math.max(grossMargin, 0), benchmark: 30 },
    { name: 'Margen Operativo', value: Math.max(operatingMargin, 0), benchmark: 20 },
    { name: 'Eficiencia Op.', value: Math.max(operatingEfficiency, 0), benchmark: 30 },
    { name: 'ROE', value: Math.max(roe, 0), benchmark: 20 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#2c2c2e] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Ratios Financieros</h2>
            <p className="text-[#5e5ce6] mt-1">Análisis de indicadores clave de rendimiento</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#5e5ce6]">Período</p>
            <p className="text-lg font-semibold">
              {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <SummaryMetric
          label="Ingresos del Mes"
          value={formatCurrency(currentIncome)}
          color="emerald"
        />
        <SummaryMetric
          label="Gastos del Mes"
          value={formatCurrency(currentExpenses)}
          color="rose"
        />
        <SummaryMetric
          label="Utilidad Neta"
          value={formatCurrency(currentProfit)}
          color={currentProfit >= 0 ? 'blue' : 'rose'}
        />
        <SummaryMetric
          label="CXC Pendiente"
          value={formatCurrency(cxc)}
          subvalue={`${avgDaysReceivable} días promedio`}
          color="amber"
        />
        <SummaryMetric
          label="CXP Pendiente"
          value={formatCurrency(cxp)}
          subvalue={`${avgDaysPayable} días promedio`}
          color="indigo"
        />
      </div>

      {/* Liquidity Ratios */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(59,130,246,0.12)] rounded-lg">
            <Wallet className="text-[#0a84ff]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e5e5ea]">Ratios de Liquidez</h3>
            <p className="text-sm text-[#8e8e93]">Capacidad para cumplir obligaciones a corto plazo</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RatioCard
            title="Ratio Corriente"
            value={currentRatio}
            unit="x"
            benchmark={BENCHMARKS.currentRatio}
            description="CXC / CXP"
            icon={Activity}
          />
          <RatioCard
            title="Prueba Ácida"
            value={quickRatio}
            unit="x"
            benchmark={BENCHMARKS.quickRatio}
            description="Activo líquido / Pasivo"
            icon={Target}
          />
          <RatioCard
            title="Capital de Trabajo"
            value={workingCapital}
            unit=""
            benchmark={{ good: 0, warning: -5000 }}
            description="CXC - CXP"
            icon={DollarSign}
          />
          <RatioCard
            title="Ratio de Efectivo"
            value={cashRatio}
            unit="x"
            benchmark={{ good: 0.5, warning: 0.2 }}
            description="Efectivo neto / Pasivo"
            icon={CreditCard}
          />
        </div>
      </div>

      {/* Activity Ratios */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(245,158,11,0.12)] rounded-lg">
            <Clock className="text-[#ff9f0a]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e5e5ea]">Ratios de Actividad</h3>
            <p className="text-sm text-[#8e8e93]">Eficiencia en la gestión de cobros y pagos</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RatioCard
            title="Días de Cobro"
            value={avgDaysReceivable}
            unit=" días"
            benchmark={BENCHMARKS.avgDaysReceivable}
            inverse
            description="Tiempo promedio de cobro"
            icon={TrendingUp}
          />
          <RatioCard
            title="Días de Pago"
            value={avgDaysPayable}
            unit=" días"
            benchmark={BENCHMARKS.avgDaysPayable}
            inverse
            description="Tiempo promedio de pago"
            icon={TrendingDown}
          />
          <RatioCard
            title="Ciclo de Caja"
            value={cashConversionCycle}
            unit=" días"
            benchmark={BENCHMARKS.cashCycle}
            inverse
            description="Cobro - Pago"
            icon={Activity}
          />
          <RatioCard
            title="Rotación CXC"
            value={receivablesTurnover}
            unit="x"
            benchmark={{ good: 8, warning: 4 }}
            description="Veces al año"
            icon={BarChart3}
          />
        </div>
      </div>

      {/* Profitability Ratios */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(16,185,129,0.12)] rounded-lg">
            <Percent className="text-[#30d158]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e5e5ea]">Ratios de Rentabilidad</h3>
            <p className="text-sm text-[#8e8e93]">Capacidad para generar utilidades</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RatioCard
            title="Margen Bruto"
            value={grossMargin}
            unit="%"
            benchmark={BENCHMARKS.grossMargin}
            description="Utilidad / Ingresos"
            icon={TrendingUp}
          />
          <RatioCard
            title="Margen Operativo"
            value={operatingMargin}
            unit="%"
            benchmark={BENCHMARKS.operatingMargin}
            description="EBIT / Ingresos"
            icon={Target}
          />
          <RatioCard
            title="ROA"
            value={roa}
            unit="%"
            benchmark={BENCHMARKS.roa}
            description="Retorno sobre activos"
            icon={BarChart3}
          />
          <RatioCard
            title="ROE"
            value={roe}
            unit="%"
            benchmark={BENCHMARKS.roe}
            description="Retorno sobre patrimonio"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Efficiency Ratios */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(99,102,241,0.12)] rounded-lg">
            <Target className="text-[#5e5ce6]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e5e5ea]">Ratios de Eficiencia</h3>
            <p className="text-sm text-[#8e8e93]">Optimización de recursos operativos</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RatioCard
            title="Eficiencia Operativa"
            value={operatingEfficiency}
            unit="%"
            benchmark={BENCHMARKS.operatingEfficiency}
            description="100% - Ratio gastos"
            icon={Activity}
          />
          <RatioCard
            title="Ratio Gastos/Ingresos"
            value={expenseToIncomeRatio}
            unit="%"
            benchmark={{ good: 70, warning: 85 }}
            inverse
            description="Gastos / Ingresos"
            icon={TrendingDown}
          />
          <RatioCard
            title="Margen YTD"
            value={ytdMargin}
            unit="%"
            benchmark={{ good: 25, warning: 10 }}
            description="Utilidad acumulada del año"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-[#1c1c1e] rounded-xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[rgba(168,85,247,0.12)] rounded-lg">
            <BarChart3 className="text-[#bf5af2]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#e5e5ea]">Comparativa vs Benchmark</h3>
            <p className="text-sm text-[#8e8e93]">Indicadores principales vs valores de referencia</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ratioComparisonData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" domain={[0, 'auto']} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                name === 'value' ? `${value.toFixed(1)}` : `${value}`,
                name === 'value' ? 'Actual' : 'Benchmark'
              ]}
            />
            <Bar dataKey="value" name="Actual" radius={[0, 4, 4, 0]} barSize={20}>
              {ratioComparisonData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= entry.benchmark ? '#30d158' : entry.value >= entry.benchmark * 0.7 ? '#ff9f0a' : '#ff453a'}
                />
              ))}
            </Bar>
            <Bar dataKey="benchmark" name="Benchmark" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={20} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Info Card */}
      <div className="bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.25)] rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info className="text-[#0a84ff] mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-[#0a84ff] mb-2">Interpretación de Indicadores</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#0a84ff]">
              <div>
                <p className="font-semibold mb-1">Liquidez</p>
                <p>Un ratio corriente &gt;1.5 indica buena capacidad de pago. Valores muy altos pueden indicar recursos ociosos.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Actividad</p>
                <p>Días de cobro menores a 30 son ideales. Un ciclo de caja negativo significa que cobras antes de pagar.</p>
              </div>
              <div>
                <p className="font-semibold mb-1">Rentabilidad</p>
                <p>Márgenes &gt;20% indican buena rentabilidad. ROE debe superar el costo de oportunidad del capital.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialRatios;
