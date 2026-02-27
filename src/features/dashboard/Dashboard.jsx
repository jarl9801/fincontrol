import React, { useState } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Users,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowRight
} from 'lucide-react';
import ProjectDetail from './ProjectDetail';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import Card from '../../components/ui/Card';
import PeriodSelector, { usePeriodSelector } from '../../components/ui/PeriodSelector';
import { useMetrics } from '../../hooks/useMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { COLORS, ALERT_THRESHOLDS } from '../../constants/config';

const CHART_COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#64d2ff'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c1c1e] p-3 rounded-lg shadow-lg border border-[rgba(255,255,255,0.08)] text-sm">
        <p className="font-medium text-[#c7c7cc] mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-[#636366] uppercase tracking-wider">{children}</h3>
);

const Dashboard = ({ transactions, allTransactions, user }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const period = usePeriodSelector(2026);

  // Use allTransactions if available, otherwise fall back to transactions
  const sourceData = allTransactions && allTransactions.length > 0 ? allTransactions : transactions;
  const filteredByPeriod = period.filterTransactions(sourceData);
  const metrics = useMetrics(filteredByPeriod);

  if (selectedProject) {
    return (
      <ProjectDetail
        projectName={selectedProject}
        transactions={transactions}
        user={user}
        onClose={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header + Period Selector */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#e5e5ea]">Dashboard Financiero</h2>
            <p className="text-sm text-[#636366] mt-0.5">{period.periodLabel}</p>
          </div>
          <span className="text-xs font-medium text-[#8e8e93] bg-[#2c2c2e] px-3 py-1.5 rounded-full">
            {filteredByPeriod.length} transacciones
          </span>
        </div>
        <PeriodSelector {...period} />
      </div>

      {/* Alerts */}
      {Object.values(metrics.alerts).some(a => a) && (
        <div className="border-l-4 border-l-rose-400 bg-[#1c1c1e] rounded-r-lg border border-[rgba(255,255,255,0.08)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ff453a] mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#c7c7cc]">Alertas activas</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {metrics.alerts.negativeBalance && (
                  <span className="text-xs text-[#ff453a]">• Balance negativo</span>
                )}
                {metrics.alerts.highCXP && (
                  <span className="text-xs text-[#ff453a]">• CXP supera {formatCurrency(ALERT_THRESHOLDS.cxpLimit)}</span>
                )}
                {metrics.alerts.highCXC && (
                  <span className="text-xs text-[#ff453a]">• CXC supera {formatCurrency(ALERT_THRESHOLDS.cxcLimit)}</span>
                )}
                {metrics.alerts.hasOverdue && (
                  <span className="text-xs text-[#ff453a]">• {metrics.overdueTransactions.length} factura(s) vencida(s)</span>
                )}
                {metrics.alerts.hasNegativeProjects && (
                  <span className="text-xs text-[#ff453a]">• {metrics.negativeProjects.length} proyecto(s) con pérdida</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: KPI Cards */}
      <div>
        <SectionTitle>Indicadores clave</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-4 mt-3">
          <Card
            title="Ingresos Cobrados"
            amount={metrics.collectedIncome}
            icon={ArrowUpCircle}
            subtext="Ya recibidos"
            trend="up"
          />
          <Card
            title="Egresos Pagados"
            amount={metrics.paidExpenses}
            icon={ArrowDownCircle}
            subtext="Ya pagados"
            trend="down"
          />
          <Card
            title="Balance Real"
            amount={metrics.cashBalance}
            icon={Wallet}
            subtext="Efectivo disponible"
            alert={metrics.alerts.negativeBalance}
            trend={metrics.cashBalance >= 0 ? 'up' : 'down'}
          />
          <Card
            title="Cuentas por Cobrar"
            amount={metrics.pendingReceivables}
            icon={Users}
            subtext="Pendiente de cobro"
            alert={metrics.alerts.highCXC}
          />
          <Card
            title="Cuentas por Pagar"
            amount={metrics.pendingPayables}
            icon={AlertTriangle}
            subtext="Pendiente de pago"
            alert={metrics.alerts.highCXP}
          />
          <Card
            title="Liquidez Proyectada"
            amount={metrics.projectedLiquidity}
            icon={TrendingUp}
            subtext="Balance + CxC − CxP"
            alert={metrics.projectedLiquidity < 0}
            trend={metrics.projectedLiquidity >= 0 ? 'up' : 'down'}
          />
        </div>
      </div>

      {/* Section 2: Main Charts */}
      <div>
        <SectionTitle>Tendencias</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          {/* Tendencia Mensual */}
          <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Tendencia Mensual</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <LineChart data={metrics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#636366', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#636366', fontSize: 11 }}
                    tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#30d158"
                    strokeWidth={2}
                    dot={{ fill: '#30d158', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Ingresos"
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    stroke="#ff453a"
                    strokeWidth={2}
                    dot={{ fill: '#ff453a', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Gastos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Gastos */}
          <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Distribución de Gastos</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <PieChart>
                  <Pie
                    data={metrics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {metrics.categoryDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', backgroundColor: '#1c1c1e', color: '#ffffff' }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Projects Table */}
      <div>
        <SectionTitle>Métricas por Proyecto</SectionTitle>
        <div className="mt-3 bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#111111]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8e8e93]">Proyecto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">Gastos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">Margen</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">ROI</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-[#8e8e93]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {metrics.projectMargins.map((project, idx) => {
                  const margin = project.ingresos - project.gastos;
                  const roi = project.ingresos > 0 ? ((margin / project.ingresos) * 100) : 0;
                  const isPositive = margin >= 0;
                  const isHighRoi = roi >= 30;

                  return (
                    <tr key={idx} className="border-b border-[rgba(255,255,255,0.08)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer" tabIndex={0} role="button" aria-label={`Ver detalle de ${project.name}`} onClick={() => setSelectedProject(project.name)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedProject(project.name); } }}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-[#c7c7cc] hover:text-[#0a84ff] transition-colors">{project.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[#98989d]">
                        {formatCurrency(project.ingresos)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#98989d]">
                        {formatCurrency(project.gastos)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(margin)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${isPositive ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                          {roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          isHighRoi ? 'bg-[rgba(16,185,129,0.08)] text-[#30d158]' :
                          isPositive ? 'bg-[#2c2c2e] text-[#98989d]' :
                          'bg-[rgba(239,68,68,0.08)] text-[#ff453a]'
                        }`}>
                          {isHighRoi ? 'Excelente' : isPositive ? 'Bueno' : 'Crítico'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 4: Secondary Charts */}
      <div>
        <SectionTitle>Análisis detallado</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
          {/* Márgenes por Proyecto */}
          <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Márgenes por Proyecto</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={metrics.projectMargins} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#636366', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#636366', fontSize: 11 }}
                    tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="ingresos"
                    fill="#30d158"
                    name="Ingresos"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    fillOpacity={0.85}
                  />
                  <Bar
                    dataKey="gastos"
                    fill="#ff453a"
                    name="Gastos"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    fillOpacity={0.85}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CXC vs CXP */}
          <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
            <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">CXC vs CXP</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={metrics.debtComparison} layout="vertical" barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#636366', fontSize: 11 }}
                    tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#636366', fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="valor"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={40}
                  >
                    {metrics.debtComparison.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.name === 'CXC' ? '#64748b' : '#ff453a'}
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Cash Flow */}
      <div>
        <SectionTitle>Flujo de caja</SectionTitle>

        {/* Monthly Cash Flow Table */}
        <div className="mt-3 bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#111111]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#8e8e93]">Mes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#30d158]">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#ff453a]">Egresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">Flujo Neto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let accumulated = 0;
                  return metrics.monthlyTrend.map((m, idx) => {
                    const netFlow = m.ingresos - m.gastos;
                    accumulated += netFlow;
                    return (
                      <tr key={idx} className="border-b border-[rgba(255,255,255,0.08)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3 font-medium text-[#c7c7cc]">{m.month}</td>
                        <td className="px-4 py-3 text-right text-[#30d158]">{formatCurrency(m.ingresos)}</td>
                        <td className="px-4 py-3 text-right text-[#ff453a]">{formatCurrency(m.gastos)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${netFlow >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                          {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${accumulated >= 0 ? 'text-[#c7c7cc]' : 'text-[#ff453a]'}`}>
                          {formatCurrency(accumulated)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-[#111111] border-t-2 border-[rgba(255,255,255,0.14)]">
                  <td className="px-4 py-3 font-semibold text-[#c7c7cc]">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#30d158]">
                    {formatCurrency(metrics.monthlyTrend.reduce((s, m) => s + m.ingresos, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#ff453a]">
                    {formatCurrency(metrics.monthlyTrend.reduce((s, m) => s + m.gastos, 0))}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${
                    metrics.monthlyTrend.reduce((s, m) => s + m.ingresos - m.gastos, 0) >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                  }`}>
                    {formatCurrency(metrics.monthlyTrend.reduce((s, m) => s + m.ingresos - m.gastos, 0))}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Cash Flow Chart — Bars + Accumulated Line */}
        <div className="mt-4 bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Flujo mensual vs Acumulado</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <ComposedChart
                data={(() => {
                  let acc = 0;
                  return metrics.monthlyTrend.map(m => {
                    acc += (m.ingresos - m.gastos);
                    return { ...m, flujoNeto: m.ingresos - m.gastos, acumulado: acc };
                  });
                })()}
                barGap={2}
              >
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#30d158" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#30d158" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff453a" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#ff453a" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#636366', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="bars"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#636366', fontSize: 11 }}
                  tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="line"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#5e5ce6', fontSize: 11 }}
                  tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                <Bar
                  yAxisId="bars"
                  dataKey="ingresos"
                  fill="url(#colorIngresos)"
                  name="Ingresos"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  yAxisId="bars"
                  dataKey="gastos"
                  fill="url(#colorEgresos)"
                  name="Egresos"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="line"
                  type="monotone"
                  dataKey="acumulado"
                  stroke="#5e5ce6"
                  strokeWidth={2.5}
                  dot={{ fill: '#5e5ce6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  name="Acumulado"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Section 6: Recent Activity */}
      <div>
        <SectionTitle>Actividad reciente</SectionTitle>
        <div className="mt-3 bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#111111]">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-[#8e8e93]">Fecha</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-[#8e8e93]">Descripción</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-[#8e8e93]">Proyecto</th>
                  <th className="py-2.5 px-4 text-right text-xs font-medium text-[#8e8e93]">Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredByPeriod.slice(0, 10).map((t, idx) => (
                  <tr key={t.id} className="border-b border-[rgba(255,255,255,0.08)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3 px-4 text-[#8e8e93]">{formatDate(t.date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          t.type === 'income' ? 'bg-[rgba(48,209,88,0.12)]' : 'bg-[rgba(255,69,58,0.12)]'
                        }`} />
                        <span className="text-[#c7c7cc]">{t.description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#8e8e93]">{(t.project || '').split(' ')[0]}</td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      t.type === 'income' ? 'text-[#30d158]' : 'text-[#ff453a]'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
                {filteredByPeriod.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-[#636366] text-sm">
                      No hay transacciones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
