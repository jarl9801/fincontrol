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
import { useMetrics } from '../../hooks/useMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { COLORS, ALERT_THRESHOLDS } from '../../constants/config';

const CHART_COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

const Dashboard = ({ transactions, user }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const metrics = useMetrics(transactions);

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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a2e] p-3 rounded-lg shadow-lg border border-slate-200 text-sm">
          <p className="font-medium text-slate-700 mb-1">{label}</p>
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
    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Dashboard Financiero</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
          {transactions.length} transacciones
        </span>
      </div>

      {/* Alerts */}
      {Object.values(metrics.alerts).some(a => a) && (
        <div className="border-l-4 border-l-rose-400 bg-[#1a1a2e] rounded-r-lg border border-slate-200 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">Alertas activas</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {metrics.alerts.negativeBalance && (
                  <span className="text-xs text-rose-600">• Balance negativo</span>
                )}
                {metrics.alerts.highCXP && (
                  <span className="text-xs text-rose-600">• CXP supera {formatCurrency(ALERT_THRESHOLDS.cxpLimit)}</span>
                )}
                {metrics.alerts.highCXC && (
                  <span className="text-xs text-rose-600">• CXC supera {formatCurrency(ALERT_THRESHOLDS.cxcLimit)}</span>
                )}
                {metrics.alerts.hasOverdue && (
                  <span className="text-xs text-rose-600">• {metrics.overdueTransactions.length} factura(s) vencida(s)</span>
                )}
                {metrics.alerts.hasNegativeProjects && (
                  <span className="text-xs text-rose-600">• {metrics.negativeProjects.length} proyecto(s) con pérdida</span>
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
          <div className="bg-[#1a1a2e] p-5 rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Tendencia Mensual</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <LineChart data={metrics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a4a" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6868a0', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6868a0', fontSize: 11 }}
                    tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Ingresos"
                  />
                  <Line
                    type="monotone"
                    dataKey="gastos"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ fill: '#f43f5e', r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Gastos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribución de Gastos */}
          <div className="bg-[#1a1a2e] p-5 rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Distribución de Gastos</h4>
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
                    contentStyle={{ borderRadius: '8px', border: '1px solid #2a2a4a', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', backgroundColor: '#1a1a2e', color: '#e8e8f0' }}
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
        <div className="mt-3 bg-[#1a1a2e] rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#13132a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Proyecto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Gastos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Margen</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">ROI</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {metrics.projectMargins.map((project, idx) => {
                  const margin = project.ingresos - project.gastos;
                  const roi = project.ingresos > 0 ? ((margin / project.ingresos) * 100) : 0;
                  const isPositive = margin >= 0;
                  const isHighRoi = roi >= 30;

                  return (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors cursor-pointer" onClick={() => setSelectedProject(project.name)}>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700 hover:text-blue-600 transition-colors">{project.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(project.ingresos)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(project.gastos)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(margin)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          isHighRoi ? 'bg-emerald-50 text-emerald-700' :
                          isPositive ? 'bg-slate-100 text-slate-600' :
                          'bg-rose-50 text-rose-700'
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
          <div className="bg-[#1a1a2e] p-5 rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Márgenes por Proyecto</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={metrics.projectMargins} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a4a" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6868a0', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6868a0', fontSize: 11 }}
                    tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="ingresos"
                    fill="#10b981"
                    name="Ingresos"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    fillOpacity={0.85}
                  />
                  <Bar
                    dataKey="gastos"
                    fill="#f43f5e"
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
          <div className="bg-[#1a1a2e] p-5 rounded-xl border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">CXC vs CXP</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <BarChart data={metrics.debtComparison} layout="vertical" barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2a2a4a" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6868a0', fontSize: 11 }}
                    tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6868a0', fontSize: 12, fontWeight: 500 }}
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
                        fill={entry.name === 'CXC' ? '#64748b' : '#f43f5e'}
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
        <div className="mt-3 bg-[#1a1a2e] rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#13132a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Mes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-emerald-600">Ingresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-rose-600">Egresos</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Flujo Neto</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let accumulated = 0;
                  return metrics.monthlyTrend.map((m, idx) => {
                    const netFlow = m.ingresos - m.gastos;
                    accumulated += netFlow;
                    return (
                      <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-700">{m.month}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(m.ingresos)}</td>
                        <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(m.gastos)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${accumulated >= 0 ? 'text-slate-700' : 'text-rose-600'}`}>
                          {formatCurrency(accumulated)}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
              <tfoot>
                <tr className="bg-[#13132a] border-t-2 border-slate-300">
                  <td className="px-4 py-3 font-semibold text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {formatCurrency(metrics.monthlyTrend.reduce((s, m) => s + m.ingresos, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-rose-600">
                    {formatCurrency(metrics.monthlyTrend.reduce((s, m) => s + m.gastos, 0))}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${
                    metrics.monthlyTrend.reduce((s, m) => s + m.ingresos - m.gastos, 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
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
        <div className="mt-4 bg-[#1a1a2e] p-5 rounded-xl border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">Flujo mensual vs Acumulado</h4>
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
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2a2a4a" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6868a0', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="bars"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6868a0', fontSize: 11 }}
                  tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                />
                <YAxis
                  yAxisId="line"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6366f1', fontSize: 11 }}
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
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
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
        <div className="mt-3 bg-[#1a1a2e] rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-[#13132a]">
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500">Fecha</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500">Descripción</th>
                  <th className="py-2.5 px-4 text-left text-xs font-medium text-slate-500">Proyecto</th>
                  <th className="py-2.5 px-4 text-right text-xs font-medium text-slate-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((t, idx) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="py-3 px-4 text-slate-500">{formatDate(t.date)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          t.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <span className="text-slate-700">{t.description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{t.project.split(' ')[0]}</td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-slate-400 text-sm">
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
