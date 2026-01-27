import React from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Users,
  AlertTriangle,
  TrendingUp
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

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {Object.values(metrics.alerts).some(a => a) && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-rose-500 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold text-rose-800">Alertas del Sistema</h3>
              <ul className="mt-2 text-sm text-rose-700 space-y-1">
                {metrics.alerts.negativeBalance && <li>Balance general negativo</li>}
                {metrics.alerts.highCXP && <li>Cuentas por Pagar superan {formatCurrency(ALERT_THRESHOLDS.cxpLimit)}</li>}
                {metrics.alerts.highCXC && <li>Cuentas por Cobrar superan {formatCurrency(ALERT_THRESHOLDS.cxcLimit)}</li>}
                {metrics.alerts.hasOverdue && <li>{metrics.overdueTransactions.length} factura(s) vencida(s) más de {ALERT_THRESHOLDS.overdueDays} días</li>}
                {metrics.alerts.hasNegativeProjects && <li>{metrics.negativeProjects.length} proyecto(s) con gastos mayores a ingresos</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Balance Neto"
          amount={metrics.netBalance}
          icon={Wallet}
          colorClass="bg-blue-500"
          alert={metrics.alerts.negativeBalance}
        />
        <Card
          title="Total Ingresos"
          amount={metrics.totalIncome}
          icon={ArrowUpCircle}
          colorClass="bg-emerald-500"
        />
        <Card
          title="Cuentas por Cobrar (CXC)"
          amount={metrics.pendingReceivables}
          icon={Users}
          colorClass="bg-indigo-500"
          subtext="Facturas Pendientes"
          alert={metrics.alerts.highCXC}
        />
        <Card
          title="Cuentas por Pagar (CXP)"
          amount={metrics.pendingPayables}
          icon={ArrowDownCircle}
          colorClass="bg-rose-500"
          subtext="Cuentas Pendientes"
          alert={metrics.alerts.highCXP}
        />
      </div>

      {/* Project Metrics Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Matriz de Métricas por Proyecto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ingresos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Gastos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Margen</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">ROI %</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Transacciones</th>
              </tr>
            </thead>
            <tbody>
              {metrics.projectMargins.map((project, idx) => {
                const margin = project.ingresos - project.gastos;
                const roi = project.ingresos > 0 ? ((margin / project.ingresos) * 100) : 0;
                const transactionCount = transactions.filter(t => t.project.startsWith(project.name)).length;
                
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-700">{project.name}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${project.ingresos > 0 ? 'bg-blue-100 text-blue-700' : 'text-slate-400'}`}>
                      {formatCurrency(project.ingresos)}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${project.gastos > 0 ? 'bg-blue-50 text-blue-600' : 'text-slate-400'}`}>
                      {formatCurrency(project.gastos)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${margin > 0 ? 'bg-emerald-100 text-emerald-700' : margin < 0 ? 'bg-rose-100 text-rose-700' : 'text-slate-400'}`}>
                      {formatCurrency(margin)}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${roi > 40 ? 'bg-green-500 text-white' : roi > 0 ? 'bg-amber-400 text-amber-900' : 'bg-orange-400 text-white'}`}>
                      {roi.toFixed(1)}%
                    </td>
                    <td className={`px-4 py-3 text-center ${transactionCount > 0 ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-slate-400'}`}>
                      {transactionCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-100 rounded"></span> Mayor valor
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-emerald-100 rounded"></span> Positivo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-rose-100 rounded"></span> Negativo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded"></span> Bajo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-400 rounded"></span> Alto
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Tendencia Mensual
          </h3>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <LineChart data={metrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución de Gastos por Categoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 min-h-[256px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                <PieChart>
                  <Pie
                    data={metrics.categoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={false}
                  >
                    {metrics.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase">Categoría</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">Monto</th>
                    <th className="text-right py-2 text-xs font-semibold text-slate-500 uppercase">%</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.categoryDistribution
                    .sort((a, b) => b.value - a.value)
                    .map((item, idx) => {
                      const total = metrics.categoryDistribution.reduce((sum, i) => sum + i.value, 0);
                      const percent = total > 0 ? (item.value / total * 100) : 0;
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2 flex items-center gap-2">
                            <span 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            ></span>
                            <span className="text-slate-700">{item.name}</span>
                          </td>
                          <td className="py-2 text-right font-medium text-slate-800">
                            {formatCurrency(item.value)}
                          </td>
                          <td className="py-2 text-right font-bold text-slate-600">
                            {percent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Márgenes por Proyecto</h3>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart data={metrics.projectMargins}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" fill="#f43f5e" name="Gastos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">CXC vs CXP Pendientes</h3>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
              <BarChart data={metrics.debtComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {metrics.debtComparison.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'CXC' ? '#6366f1' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cash Flow Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Evolución del Flujo de Caja</h3>
        <div className="h-64 min-h-[256px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <AreaChart data={metrics.cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Area type="monotone" dataKey="flujo" stroke="#3b82f6" fill="#93c5fd" name="Flujo Acumulado" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Actividad Reciente</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="py-2 px-2">Fecha</th>
                <th className="py-2 px-2">Descripción</th>
                <th className="py-2 px-2">Proyecto</th>
                <th className="py-2 px-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 10).map(t => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 px-2 text-sm text-slate-500">{formatDate(t.date)}</td>
                  <td className="py-3 px-2 text-sm text-slate-700">{t.description}</td>
                  <td className="py-3 px-2 text-sm text-slate-500">{t.project.split(' ')[0]}</td>
                  <td className={`py-3 px-2 text-sm text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(t.amount)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-slate-400 text-sm">No hay transacciones.</td>
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
