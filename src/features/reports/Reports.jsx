import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download, DollarSign, Percent, Target, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { exportReportToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

const Reports = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Filtrar por período
  const filterByPeriod = (trans) => {
    if (selectedPeriod === 'all') return trans;

    const now = new Date();
    const transDate = new Date(trans.date);

    if (selectedPeriod === 'month') {
      return transDate.getMonth() === now.getMonth() &&
             transDate.getFullYear() === now.getFullYear();
    }
    if (selectedPeriod === 'quarter') {
      const monthDiff = now.getMonth() - transDate.getMonth();
      return monthDiff >= 0 && monthDiff < 3 &&
             transDate.getFullYear() === now.getFullYear();
    }
    if (selectedPeriod === 'year') {
      return transDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredTransactions = transactions.filter(filterByPeriod);

  // Calcular P&L detallado
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpenses;
  const grossMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;
  const expenseRatio = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100) : 0;

  // Gastos por categoría
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === 'expense' && t.status === 'paid')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  // Ingresos por categoría
  const incomeByCategory = filteredTransactions
    .filter(t => t.type === 'income' && t.status === 'paid')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  // Ingresos y gastos por proyecto con margen
  const projectData = {};
  filteredTransactions
    .filter(t => t.status === 'paid')
    .forEach(t => {
      if (!projectData[t.project]) {
        projectData[t.project] = { name: t.project, ingresos: 0, gastos: 0 };
      }
      if (t.type === 'income') {
        projectData[t.project].ingresos += t.amount;
      } else {
        projectData[t.project].gastos += t.amount;
      }
    });

  // Calcular margen por proyecto y ordenar por margen
  const projectChartData = Object.values(projectData)
    .map(p => ({
      ...p,
      margen: p.ingresos - p.gastos,
      margenPercent: p.ingresos > 0 ? ((p.ingresos - p.gastos) / p.ingresos * 100) : (p.gastos > 0 ? -100 : 0)
    }))
    .sort((a, b) => b.margen - a.margen);

  // Ordenar categorías por valor descendente
  const sortedCategoryData = [...categoryData].sort((a, b) => b.value - a.value);
  const totalExpensesForPercent = sortedCategoryData.reduce((sum, item) => sum + item.value, 0);

  const categoryDataWithPercent = sortedCategoryData.map(item => ({
    ...item,
    percent: totalExpensesForPercent > 0 ? ((item.value / totalExpensesForPercent) * 100).toFixed(1) : 0
  }));

  // Top 5 categorías de gastos
  const top5Categories = sortedCategoryData.slice(0, 5);

  // Proyectos con pérdida
  const projectsWithLoss = projectChartData.filter(p => p.margen < 0);

  // KPIs calculados
  const avgTransactionSize = filteredTransactions.length > 0
    ? filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / filteredTransactions.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Selector de período */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Todo' },
            { key: 'month', label: 'Este Mes' },
            { key: 'quarter', label: 'Este Trimestre' },
            { key: 'year', label: 'Este Año' }
          ].map(period => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingUp size={16} className="text-emerald-500" />
            Ingresos Totales
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
          {pendingIncome > 0 && (
            <div className="text-xs text-slate-400 mt-1">+{formatCurrency(pendingIncome)} pendiente</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingDown size={16} className="text-rose-500" />
            Gastos Totales
          </div>
          <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpenses)}</div>
          {pendingExpenses > 0 && (
            <div className="text-xs text-slate-400 mt-1">+{formatCurrency(pendingExpenses)} pendiente</div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign size={16} className="text-blue-500" />
            Utilidad Neta
          </div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit >= 0 ? '' : '-'}{formatCurrency(Math.abs(netProfit))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Percent size={16} className="text-indigo-500" />
            Margen Bruto
          </div>
          <div className={`text-2xl font-bold ${grossMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {grossMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Ratio gastos: {expenseRatio.toFixed(1)}%</div>
        </div>
      </div>

      {/* Estado de Resultados Detallado */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} />
            Estado de Resultados (P&L)
          </h3>
          <button
            onClick={() => exportReportToPDF(filteredTransactions, 'general')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>

        <div className="p-6">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              {/* Ingresos */}
              <tr className="bg-emerald-50">
                <td colSpan="2" className="px-4 py-3 font-bold text-emerald-800 text-sm uppercase tracking-wide">
                  Ingresos Operacionales
                </td>
              </tr>
              {Object.entries(incomeByCategory).map(([category, amount]) => (
                <tr key={category} className="hover:bg-slate-50">
                  <td className="px-4 py-2 pl-8 text-slate-600">{category}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-800">{formatCurrency(amount)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-100 font-bold">
                <td className="px-4 py-3 text-emerald-800">Total Ingresos</td>
                <td className="px-4 py-3 text-right text-emerald-700 text-lg">{formatCurrency(totalIncome)}</td>
              </tr>

              {/* Gastos */}
              <tr className="bg-rose-50">
                <td colSpan="2" className="px-4 py-3 font-bold text-rose-800 text-sm uppercase tracking-wide">
                  Gastos Operacionales
                </td>
              </tr>
              {top5Categories.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50">
                  <td className="px-4 py-2 pl-8 text-slate-600">
                    {item.name}
                    <span className="ml-2 text-xs text-slate-400">
                      ({((item.value / totalExpensesForPercent) * 100).toFixed(1)}%)
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-800">({formatCurrency(item.value)})</td>
                </tr>
              ))}
              {sortedCategoryData.length > 5 && (
                <tr className="hover:bg-slate-50">
                  <td className="px-4 py-2 pl-8 text-slate-500 italic">
                    Otros ({sortedCategoryData.length - 5} categorías)
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-800">
                    ({formatCurrency(sortedCategoryData.slice(5).reduce((sum, item) => sum + item.value, 0))})
                  </td>
                </tr>
              )}
              <tr className="bg-rose-100 font-bold">
                <td className="px-4 py-3 text-rose-800">Total Gastos</td>
                <td className="px-4 py-3 text-right text-rose-700 text-lg">({formatCurrency(totalExpenses)})</td>
              </tr>

              {/* Resultado */}
              <tr className={`${netProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                <td className="px-4 py-4 font-bold text-white text-lg">UTILIDAD NETA</td>
                <td className="px-4 py-4 text-right font-bold text-white text-2xl">
                  {netProfit >= 0 ? '' : '('}{formatCurrency(Math.abs(netProfit))}{netProfit < 0 ? ')' : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas si hay proyectos con pérdida */}
      {projectsWithLoss.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-800">Proyectos con Pérdida</h4>
              <ul className="mt-2 text-sm text-amber-700 space-y-1">
                {projectsWithLoss.map(p => (
                  <li key={p.name}>
                    <span className="font-medium">{p.name}</span>: pérdida de {formatCurrency(Math.abs(p.margen))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gastos por Categoría */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Distribución de Gastos
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(300, categoryDataWithPercent.length * 32)} minWidth={0} minHeight={200}>
            <BarChart
              data={categoryDataWithPercent}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Monto']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar
                dataKey="value"
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'right',
                  formatter: (value) => `${((value / totalExpensesForPercent) * 100).toFixed(0)}%`,
                  fontSize: 10,
                  fill: '#64748b'
                }}
              >
                {categoryDataWithPercent.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#ef4444' : index < 3 ? '#f97316' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rentabilidad por Proyecto */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={20} />
            Rentabilidad por Proyecto
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(300, projectChartData.length * 50)} minWidth={0} minHeight={200}>
            <ComposedChart
              data={projectChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value),
                  name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Margen'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="gastos" fill="#f43f5e" name="Gastos" radius={[0, 4, 4, 0]} barSize={16} />
              <Line
                type="monotone"
                dataKey="margen"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Margen"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Proyectos Detallada */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Análisis Detallado por Proyecto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ingresos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Gastos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Margen</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">% Margen</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectChartData.map((project) => (
                <tr key={project.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{project.name}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                    {formatCurrency(project.ingresos)}
                  </td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">
                    {formatCurrency(project.gastos)}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${project.margen >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {project.margen >= 0 ? '' : '-'}{formatCurrency(Math.abs(project.margen))}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${project.margenPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {project.margenPercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.margenPercent >= 30 ? 'bg-emerald-100 text-emerald-800' :
                      project.margenPercent >= 0 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {project.margenPercent >= 30 ? 'Rentable' :
                       project.margenPercent >= 0 ? 'Bajo margen' :
                       'Pérdida'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold">
              <tr>
                <td className="px-4 py-3 text-slate-800">TOTALES</td>
                <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(totalIncome)}</td>
                <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(totalExpenses)}</td>
                <td className={`px-4 py-3 text-right ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {netProfit >= 0 ? '' : '-'}{formatCurrency(Math.abs(netProfit))}
                </td>
                <td className={`px-4 py-3 text-right ${grossMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {grossMargin.toFixed(1)}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
