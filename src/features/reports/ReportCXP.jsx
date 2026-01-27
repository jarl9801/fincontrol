import React from 'react';
import { TrendingDown, Clock, AlertCircle, Download } from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue } from '../../utils/formatters';
import { exportCXPToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ReportCXP = ({ transactions }) => {
  // Filtrar solo gastos pendientes
  const payables = transactions.filter(t => t.type === 'expense' && t.status === 'pending');

  // Calcular métricas
  const totalPayable = payables.reduce((sum, t) => sum + t.amount, 0);

  // Análisis de antigüedad
  const agingAnalysis = {
    current: { label: '0-30 dias', count: 0, amount: 0 },
    days30_60: { label: '31-60 dias', count: 0, amount: 0 },
    days60_90: { label: '61-90 dias', count: 0, amount: 0 },
    over90: { label: '90+ dias', count: 0, amount: 0 }
  };

  payables.forEach(t => {
    const daysOverdue = getDaysOverdue(t.date);
    if (daysOverdue <= 30) {
      agingAnalysis.current.count++;
      agingAnalysis.current.amount += t.amount;
    } else if (daysOverdue <= 60) {
      agingAnalysis.days30_60.count++;
      agingAnalysis.days30_60.amount += t.amount;
    } else if (daysOverdue <= 90) {
      agingAnalysis.days60_90.count++;
      agingAnalysis.days60_90.amount += t.amount;
    } else {
      agingAnalysis.over90.count++;
      agingAnalysis.over90.amount += t.amount;
    }
  });

  const chartData = Object.values(agingAnalysis).map(item => ({
    name: item.label,
    monto: item.amount
  }));

  // Métricas resumen
  const overdueAmount = agingAnalysis.over90.amount;
  const criticalAmount = agingAnalysis.days60_90.amount + agingAnalysis.over90.amount;
  const currentAmount = agingAnalysis.current.amount;

  return (
    <div className="space-y-6">
      {/* Header con exportar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Reporte de Cuentas por Pagar</h2>
        <button
          onClick={() => exportCXPToPDF(transactions)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
        >
          <Download size={18} /> Exportar PDF
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Total por Pagar</h3>
            <TrendingDown className="text-rose-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-rose-600">{formatCurrency(totalPayable)}</p>
          <p className="text-xs text-slate-400 mt-1">{payables.length} facturas</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Monto Vencido</h3>
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">{agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Critico (90+ dias)</h3>
            <Clock className="text-amber-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(criticalAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">{agingAnalysis.days60_90.count + agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Al Corriente</h3>
            <TrendingDown className="text-emerald-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(currentAmount)}</p>
          <p className="text-xs text-slate-400 mt-1">{agingAnalysis.current.count} facturas</p>
        </div>
      </div>

      {/* Gráfico y tabla de antigüedad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Analisis de Antiguedad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="monto" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla resumen */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Resumen por Antiguedad</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-sm font-semibold text-slate-500">Periodo</th>
                <th className="text-center py-2 text-sm font-semibold text-slate-500">Facturas</th>
                <th className="text-right py-2 text-sm font-semibold text-slate-500">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(agingAnalysis).map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-3 text-sm text-slate-700">{item.label}</td>
                  <td className="py-3 text-sm text-slate-700 text-center">{item.count}</td>
                  <td className="py-3 text-sm font-medium text-right text-rose-600">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50">
                <td className="py-3 text-sm font-bold text-slate-800">Total</td>
                <td className="py-3 text-sm font-bold text-slate-800 text-center">{payables.length}</td>
                <td className="py-3 text-sm font-bold text-right text-rose-600">{formatCurrency(totalPayable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de facturas */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Detalle de Cuentas por Pagar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Descripcion</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Dias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payables.map(t => {
                const days = getDaysOverdue(t.date);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{t.description}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.project || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{t.category || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-rose-600 text-right">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        days > 90 ? 'bg-red-100 text-red-700' :
                        days > 60 ? 'bg-amber-100 text-amber-700' :
                        days > 30 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {days} dias
                      </span>
                    </td>
                  </tr>
                );
              })}
              {payables.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No hay cuentas por pagar pendientes
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

export default ReportCXP;
