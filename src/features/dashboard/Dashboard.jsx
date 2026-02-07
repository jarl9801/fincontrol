import React from 'react';
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
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import Card from '../../components/ui/Card';
import { useMetrics } from '../../hooks/useMetrics';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { COLORS, ALERT_THRESHOLDS } from '../../constants/config';

const Dashboard = ({ transactions }) => {
  const metrics = useMetrics(transactions);

  // Custom tooltip para gráficos
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard Financiero</h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">
            {transactions.length} transacciones este período
          </span>
        </div>
      </div>

      {/* Alerts - Mejorado visualmente */}
      {Object.values(metrics.alerts).some(a => a) && (
        <div className="bg-gradient-to-r from-rose-50 to-rose-100 border border-rose-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-200 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-rose-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-rose-800 mb-2">⚠️ Alertas del Sistema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metrics.alerts.negativeBalance && (
                  <div className="flex items-center gap-2 text-sm text-rose-700 bg-white/50 px-3 py-2 rounded-lg">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    Balance general negativo
                  </div>
                )}
                {metrics.alerts.highCXP && (
                  <div className="flex items-center gap-2 text-sm text-rose-700 bg-white/50 px-3 py-2 rounded-lg">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    CXP supera {formatCurrency(ALERT_THRESHOLDS.cxpLimit)}
                  </div>
                )}
                {metrics.alerts.highCXC && (
                  <div className="flex items-center gap-2 text-sm text-rose-700 bg-white/50 px-3 py-2 rounded-lg">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    CXC supera {formatCurrency(ALERT_THRESHOLDS.cxcLimit)}
                  </div>
                )}
                {metrics.alerts.hasOverdue && (
                  <div className="flex items-center gap-2 text-sm text-rose-700 bg-white/50 px-3 py-2 rounded-lg">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    {metrics.overdueTransactions.length} factura(s) vencida(s)
                  </div>
                )}
                {metrics.alerts.hasNegativeProjects && (
                  <div className="flex items-center gap-2 text-sm text-rose-700 bg-white/50 px-3 py-2 rounded-lg">
                    <span className="w-2 h-2 bg-rose-500 rounded-full" />
                    {metrics.negativeProjects.length} proyecto(s) con pérdida
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards - Mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card
          title="Balance Neto"
          amount={metrics.netBalance}
          icon={Wallet}
          colorClass="bg-gradient-to-br from-blue-500 to-blue-600"
          alert={metrics.alerts.negativeBalance}
          trend={metrics.netBalance >= 0 ? 'up' : 'down'}
        />
        <Card
          title="Total Ingresos"
          amount={metrics.totalIncome}
          icon={ArrowUpCircle}
          colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
          subtext="Ingresos acumulados"
          trend="up"
        />
        <Card
          title="Cuentas por Cobrar"
          amount={metrics.pendingReceivables}
          icon={Users}
          colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600"
          subtext="Facturas Pendientes"
          alert={metrics.alerts.highCXC}
        />
        <Card
          title="Cuentas por Pagar"
          amount={metrics.pendingPayables}
          icon={ArrowDownCircle}
          colorClass="bg-gradient-to-br from-rose-500 to-rose-600"
          subtext="Cuentas Pendientes"
          alert={metrics.alerts.highCXP}
        />
      </div>

      {/* Project Metrics Matrix - Mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Métricas por Proyecto</h3>
              <p className="text-xs text-slate-500">Rendimiento financiero detallado</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyecto</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ingresos</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Gastos</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Margen</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">ROI %</th>
                <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody>
              {metrics.projectMargins.map((project, idx) => {
                const margin = project.ingresos - project.gastos;
                const roi = project.ingresos > 0 ? ((margin / project.ingresos) * 100) : 0;
                const isPositive = margin >= 0;
                const isHighRoi = roi >= 30;
                
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {project.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{project.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs">
                        {formatCurrency(project.ingresos)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-xs">
                        {formatCurrency(project.gastos)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(margin)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                        isHighRoi ? 'bg-emerald-500 text-white' : 
                        isPositive ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {roi.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        isHighRoi ? 'bg-emerald-100 text-emerald-700' :
                        isPositive ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isHighRoi ? 'bg-emerald-500' :
                          isPositive ? 'bg-amber-500' :
                          'bg-rose-500'
                        }`} />
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Mensual */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tendencia Mensual</h3>
                <p className="text-xs text-slate-500">Evolución de ingresos vs gastos</p>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <LineChart data={metrics.monthlyTrend}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Ingresos" 
                />
                <Line 
                  type="monotone" 
                  dataKey="gastos" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  name="Gastos" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Gastos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <PieChartIcon className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Distribución de Gastos</h3>
                <p className="text-xs text-slate-500">Por categoría</p>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <PieChart>
                <Pie
                  data={metrics.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
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
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Márgenes por Proyecto */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Márgenes por Proyecto</h3>
                <p className="text-xs text-slate-500">Ingresos vs Gastos</p>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart data={metrics.projectMargins} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Bar 
                  dataKey="ingresos" 
                  fill="#10b981" 
                  name="Ingresos" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <Bar 
                  dataKey="gastos" 
                  fill="#f43f5e" 
                  name="Gastos" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CXC vs CXP */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">CXC vs CXP</h3>
                <p className="text-xs text-slate-500">Comparación de deudas</p>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart data={metrics.debtComparison} layout="vertical" barSize={40}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="valor" 
                  radius={[0, 8, 8, 0]}
                  maxBarSize={50}
                >
                  {metrics.debtComparison.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'CXC' ? '#6366f1' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Evolución del Flujo de Caja</h3>
              <p className="text-xs text-slate-500">Flujo acumulado en el tiempo</p>
            </div>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <AreaChart data={metrics.cashFlowData}>
              <defs>
                <linearGradient id="colorFlujo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => `€${(value/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="flujo" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorFlujo)"
                name="Flujo Acumulado"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity - Mejorada */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Actividad Reciente</h3>
              <p className="text-xs text-slate-500">Últimas 10 transacciones</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100 bg-slate-50/50">
                <th className="py-3 px-6 font-medium">Fecha</th>
                <th className="py-3 px-6 font-medium">Descripción</th>
                <th className="py-3 px-6 font-medium">Proyecto</th>
                <th className="py-3 px-6 font-medium text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map((t, idx) => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-500">{formatDate(t.date)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        t.type === 'income' ? 'bg-emerald-100' : 'bg-rose-100'
                      }`}>
                        {t.type === 'income' ? (
                          <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{t.description}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">{t.project.split(' ')[0]}</td>
                  <td className={`py-4 px-6 text-sm text-right font-semibold ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-8 h-8 text-slate-300" />
                      <p>No hay transacciones registradas</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
