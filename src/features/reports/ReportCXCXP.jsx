import React from 'react';
import { TrendingUp, TrendingDown, Clock, AlertCircle, Download } from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue } from '../../utils/formatters';
import { exportCXCToPDF, exportCXPToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const CONFIG = {
  cxc: {
    filterType: 'income',
    title: 'Reporte de Cuentas por Cobrar',
    detailTitle: 'Detalle de Cuentas por Cobrar',
    totalLabel: 'Total por Cobrar',
    emptyMessage: 'No hay cuentas por cobrar pendientes',
    exportFn: exportCXCToPDF,
    exportColor: 'bg-emerald-600 hover:bg-emerald-700',
    primaryColor: '#30d158',
    TrendIcon: TrendingUp,
    barFill: '#30d158',
  },
  cxp: {
    filterType: 'expense',
    title: 'Reporte de Cuentas por Pagar',
    detailTitle: 'Detalle de Cuentas por Pagar',
    totalLabel: 'Total por Pagar',
    emptyMessage: 'No hay cuentas por pagar pendientes',
    exportFn: exportCXPToPDF,
    exportColor: 'bg-rose-600 hover:bg-rose-700',
    primaryColor: '#ff453a',
    TrendIcon: TrendingDown,
    barFill: '#ff453a',
  },
};

const ReportCXCXP = ({ transactions, type = 'cxc' }) => {
  const cfg = CONFIG[type];
  const items = transactions.filter(t => t.type === cfg.filterType && t.status === 'pending');

  const totalAmount = items.reduce((sum, t) => sum + t.amount, 0);

  const agingAnalysis = {
    current: { label: '0-30 dias', count: 0, amount: 0 },
    days30_60: { label: '31-60 dias', count: 0, amount: 0 },
    days60_90: { label: '61-90 dias', count: 0, amount: 0 },
    over90: { label: '90+ dias', count: 0, amount: 0 }
  };

  items.forEach(t => {
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

  const overdueAmount = agingAnalysis.over90.amount;
  const criticalAmount = agingAnalysis.days60_90.amount + agingAnalysis.over90.amount;
  const currentAmount = agingAnalysis.current.amount;
  const { TrendIcon } = cfg;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#e5e5ea]">{cfg.title}</h2>
        <button
          onClick={() => cfg.exportFn(transactions)}
          className={`flex items-center gap-2 px-4 py-2 ${cfg.exportColor} text-white rounded-lg transition-colors`}
        >
          <Download size={18} /> Exportar PDF
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">{cfg.totalLabel}</h3>
            <TrendIcon className={`text-[${cfg.primaryColor}]`} size={20} style={{ color: cfg.primaryColor }} />
          </div>
          <p className="text-2xl font-bold" style={{ color: cfg.primaryColor }}>{formatCurrency(totalAmount)}</p>
          <p className="text-xs text-[#636366] mt-1">{items.length} facturas</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Monto Vencido</h3>
            <AlertCircle className="text-[#ff453a]" size={20} />
          </div>
          <p className="text-2xl font-bold text-[#ff453a]">{formatCurrency(overdueAmount)}</p>
          <p className="text-xs text-[#636366] mt-1">{agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Critico (90+ dias)</h3>
            <Clock className="text-[#ff9f0a]" size={20} />
          </div>
          <p className="text-2xl font-bold text-[#ff9f0a]">{formatCurrency(criticalAmount)}</p>
          <p className="text-xs text-[#636366] mt-1">{agingAnalysis.days60_90.count + agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#8e8e93] uppercase tracking-wide">Al Corriente</h3>
            <TrendIcon className="text-[#30d158]" size={20} style={{ color: '#30d158' }} />
          </div>
          <p className="text-2xl font-bold text-[#30d158]">{formatCurrency(currentAmount)}</p>
          <p className="text-xs text-[#636366] mt-1">{agingAnalysis.current.count} facturas</p>
        </div>
      </div>

      {/* Chart and aging table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <h3 className="text-lg font-bold text-[#e5e5ea] mb-4">Analisis de Antiguedad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="monto" fill={cfg.barFill} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <h3 className="text-lg font-bold text-[#e5e5ea] mb-4">Resumen por Antiguedad</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)]">
                <th className="text-left py-2 text-sm font-semibold text-[#8e8e93]">Periodo</th>
                <th className="text-center py-2 text-sm font-semibold text-[#8e8e93]">Facturas</th>
                <th className="text-right py-2 text-sm font-semibold text-[#8e8e93]">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(agingAnalysis).map((item, idx) => (
                <tr key={idx} className="border-b border-[rgba(255,255,255,0.08)]">
                  <td className="py-3 text-sm text-[#c7c7cc]">{item.label}</td>
                  <td className="py-3 text-sm text-[#c7c7cc] text-center">{item.count}</td>
                  <td className="py-3 text-sm font-medium text-right" style={{ color: cfg.primaryColor }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="bg-[#111111]">
                <td className="py-3 text-sm font-bold text-[#e5e5ea]">Total</td>
                <td className="py-3 text-sm font-bold text-[#e5e5ea] text-center">{items.length}</td>
                <td className="py-3 text-sm font-bold text-right" style={{ color: cfg.primaryColor }}>{formatCurrency(totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail table */}
      <div className="bg-[#1c1c1e] rounded-xl shadow-sm border border-[rgba(255,255,255,0.08)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)]">
          <h3 className="text-lg font-bold text-[#e5e5ea]">{cfg.detailTitle}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#111111] border-b border-[rgba(255,255,255,0.08)]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Descripcion</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Categoria</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase text-right">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase text-center">Dias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
              {items.map(t => {
                const days = getDaysOverdue(t.date);
                return (
                  <tr key={t.id} className="hover:bg-[#111111]">
                    <td className="px-4 py-3 text-sm text-[#98989d]">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#e5e5ea]">{t.description}</td>
                    <td className="px-4 py-3 text-sm text-[#98989d]">{t.project || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#98989d]">{t.category || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-right" style={{ color: cfg.primaryColor }}>{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        days > 90 ? 'bg-[rgba(239,68,68,0.12)] text-[#ff453a]' :
                        days > 60 ? 'bg-[rgba(245,158,11,0.12)] text-[#ff9f0a]' :
                        days > 30 ? 'bg-[rgba(234,179,8,0.12)] text-[#ff9f0a]' :
                        'bg-[rgba(16,185,129,0.12)] text-[#30d158]'
                      }`}>
                        {days} dias
                      </span>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-[#636366]">
                    {cfg.emptyMessage}
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

export default ReportCXCXP;
