import React from 'react';
import { TrendingUp, Clock, AlertCircle, Download } from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue } from '../../utils/formatters';
import { exportCXCToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ReportCXC = ({ transactions }) => {
  // Filtrar solo ingresos pendientes
  const receivables = transactions.filter(t => t.type === 'income' && t.status === 'pending');

  // Calcular métricas
  const totalReceivable = receivables.reduce((sum, t) => sum + t.amount, 0);

  // Análisis de antigüedad
  const agingAnalysis = {
    current: { label: '0-30 dias', count: 0, amount: 0 },
    days30_60: { label: '31-60 dias', count: 0, amount: 0 },
    days60_90: { label: '61-90 dias', count: 0, amount: 0 },
    over90: { label: '90+ dias', count: 0, amount: 0 }
  };

  receivables.forEach(t => {
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
        <h2 className="text-xl font-bold text-[#d0d0e0]">Reporte de Cuentas por Cobrar</h2>
        <button
          onClick={() => exportCXCToPDF(transactions)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Download size={18} /> Exportar PDF
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Total por Cobrar</h3>
            <TrendingUp className="text-[#34d399]" size={20} />
          </div>
          <p className="text-2xl font-bold text-[#34d399]">{formatCurrency(totalReceivable)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{receivables.length} facturas</p>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Monto Vencido</h3>
            <AlertCircle className="text-[#f87171]" size={20} />
          </div>
          <p className="text-2xl font-bold text-[#f87171]">{formatCurrency(overdueAmount)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Critico (90+ dias)</h3>
            <Clock className="text-[#fbbf24]" size={20} />
          </div>
          <p className="text-2xl font-bold text-[#fbbf24]">{formatCurrency(criticalAmount)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{agingAnalysis.days60_90.count + agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8888b0] uppercase tracking-wide">Al Corriente</h3>
            <TrendingUp className="text-[#34d399]" size={20} />
          </div>
          <p className="text-2xl font-bold text-[#34d399]">{formatCurrency(currentAmount)}</p>
          <p className="text-xs text-[#6868a0] mt-1">{agingAnalysis.current.count} facturas</p>
        </div>
      </div>

      {/* Gráfico y tabla de antigüedad */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <h3 className="text-lg font-bold text-[#d0d0e0] mb-4">Analisis de Antiguedad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="monto" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabla resumen */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 shadow-sm border border-[#2a2a4a]">
          <h3 className="text-lg font-bold text-[#d0d0e0] mb-4">Resumen por Antiguedad</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2a2a4a]">
                <th className="text-left py-2 text-sm font-semibold text-[#8888b0]">Periodo</th>
                <th className="text-center py-2 text-sm font-semibold text-[#8888b0]">Facturas</th>
                <th className="text-right py-2 text-sm font-semibold text-[#8888b0]">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(agingAnalysis).map((item, idx) => (
                <tr key={idx} className="border-b border-[#2a2a4a]">
                  <td className="py-3 text-sm text-[#b8b8d0]">{item.label}</td>
                  <td className="py-3 text-sm text-[#b8b8d0] text-center">{item.count}</td>
                  <td className="py-3 text-sm font-medium text-right text-[#34d399]">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="bg-[#13132a]">
                <td className="py-3 text-sm font-bold text-[#d0d0e0]">Total</td>
                <td className="py-3 text-sm font-bold text-[#d0d0e0] text-center">{receivables.length}</td>
                <td className="py-3 text-sm font-bold text-right text-[#34d399]">{formatCurrency(totalReceivable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de facturas */}
      <div className="bg-[#1a1a2e] rounded-xl shadow-sm border border-[#2a2a4a] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#2a2a4a]">
          <h3 className="text-lg font-bold text-[#d0d0e0]">Detalle de Cuentas por Cobrar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#13132a] border-b border-[#2a2a4a]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#8888b0] uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8888b0] uppercase">Descripcion</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8888b0] uppercase">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8888b0] uppercase">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8888b0] uppercase text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8888b0] uppercase text-center">Dias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a]">
              {receivables.map(t => {
                const days = getDaysOverdue(t.date);
                return (
                  <tr key={t.id} className="hover:bg-[#13132a]">
                    <td className="px-4 py-3 text-sm text-[#9898b8]">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#d0d0e0]">{t.description}</td>
                    <td className="px-4 py-3 text-sm text-[#9898b8]">{t.project || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#9898b8]">{t.category || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#34d399] text-right">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        days > 90 ? 'bg-[rgba(239,68,68,0.12)] text-[#f87171]' :
                        days > 60 ? 'bg-[rgba(245,158,11,0.12)] text-[#fbbf24]' :
                        days > 30 ? 'bg-[rgba(234,179,8,0.12)] text-[#fbbf24]' :
                        'bg-[rgba(16,185,129,0.12)] text-[#34d399]'
                      }`}>
                        {days} dias
                      </span>
                    </td>
                  </tr>
                );
              })}
              {receivables.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-[#6868a0]">
                    No hay cuentas por cobrar pendientes
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

export default ReportCXC;
