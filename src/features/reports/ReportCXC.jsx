import React from 'react';
import { TrendingUp, Clock, AlertCircle, Download } from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue } from '../../utils/formatters';
import { exportCXCToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const ReportCXC = ({ transactions }) => {
  // Filtrar solo ingresos pendientes
  const receivables = transactions.filter(t => t.type === 'income' && ['pending', 'partial', 'overdue', 'issued'].includes(t.status));

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
    const daysOverdue = getDaysOverdue(t.dueDate || t.date);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1f2a44]">Reporte de cuentas por cobrar</h2>
          <p className="mt-1 text-sm text-[#6b7a99]">Antigüedad, vencimientos y detalle operativo de cobros pendientes.</p>
        </div>
        <button
          onClick={() => exportCXCToPDF(transactions)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0f9f6e] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0c875d]"
        >
          <Download size={18} /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#70819f]">Total por cobrar</h3>
            <TrendingUp className="text-[#0f9f6e]" size={20} />
          </div>
          <p className="text-2xl font-semibold text-[#0f9f6e]">{formatCurrency(totalReceivable)}</p>
          <p className="mt-1 text-xs text-[#70819f]">{receivables.length} facturas</p>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#70819f]">Monto vencido</h3>
            <AlertCircle className="text-[#d04c36]" size={20} />
          </div>
          <p className="text-2xl font-semibold text-[#d04c36]">{formatCurrency(overdueAmount)}</p>
          <p className="mt-1 text-xs text-[#70819f]">{agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#70819f]">Crítico (90+ días)</h3>
            <Clock className="text-[#c98717]" size={20} />
          </div>
          <p className="text-2xl font-semibold text-[#c98717]">{formatCurrency(criticalAmount)}</p>
          <p className="mt-1 text-xs text-[#70819f]">{agingAnalysis.days60_90.count + agingAnalysis.over90.count} facturas</p>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#70819f]">Al corriente</h3>
            <TrendingUp className="text-[#0f9f6e]" size={20} />
          </div>
          <p className="text-2xl font-semibold text-[#0f9f6e]">{formatCurrency(currentAmount)}</p>
          <p className="mt-1 text-xs text-[#70819f]">{agingAnalysis.current.count} facturas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <h3 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-[#1f2a44]">Análisis de antigüedad</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
              <XAxis dataKey="name" tick={{ fill: '#70819f', fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fill: '#70819f', fontSize: 11 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '16px', border: '1px solid #dce6f8', backgroundColor: 'rgba(255,255,255,0.96)' }} />
              <Bar dataKey="monto" fill="#0f9f6e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <h3 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-[#1f2a44]">Resumen por antigüedad</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e2ebfb]">
                <th className="py-2 text-left text-sm font-semibold text-[#70819f]">Periodo</th>
                <th className="py-2 text-center text-sm font-semibold text-[#70819f]">Facturas</th>
                <th className="py-2 text-right text-sm font-semibold text-[#70819f]">Monto</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(agingAnalysis).map((item, idx) => (
                <tr key={idx} className="border-b border-[#eef2fb]">
                  <td className="py-3 text-sm text-[#1f2a44]">{item.label}</td>
                  <td className="py-3 text-center text-sm text-[#5f6f8d]">{item.count}</td>
                  <td className="py-3 text-right text-sm font-medium text-[#0f9f6e]">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr className="bg-[rgba(245,248,255,0.94)]">
                <td className="py-3 text-sm font-semibold text-[#1f2a44]">Total</td>
                <td className="py-3 text-center text-sm font-semibold text-[#1f2a44]">{receivables.length}</td>
                <td className="py-3 text-right text-sm font-semibold text-[#0f9f6e]">{formatCurrency(totalReceivable)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#dce6f8] bg-white/88 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="border-b border-[#e2ebfb] px-6 py-4">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#1f2a44]">Detalle de cuentas por cobrar</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#70819f]">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#70819f]">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#70819f]">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-[#70819f]">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[#70819f]">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[#70819f]">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2fb]">
              {receivables.map(t => {
                const days = getDaysOverdue(t.dueDate || t.date);
                return (
                  <tr key={t.id} className="transition-colors hover:bg-[rgba(241,246,255,0.8)]">
                    <td className="px-4 py-3 text-sm text-[#6b7a99]">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1f2a44]">{t.description}</td>
                    <td className="px-4 py-3 text-sm text-[#5f6f8d]">{t.project || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[#5f6f8d]">{t.category || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-[#0f9f6e]">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        days > 90 ? 'bg-[rgba(208,76,54,0.12)] text-[#d04c36]' :
                        days > 60 ? 'bg-[rgba(214,149,44,0.12)] text-[#c98717]' :
                        days > 30 ? 'bg-[rgba(214,149,44,0.12)] text-[#c98717]' :
                        'bg-[rgba(15,159,110,0.12)] text-[#0f9f6e]'
                      }`}>
                        {days} días
                      </span>
                    </td>
                  </tr>
                );
              })}
              {receivables.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-[#6b7a99]">
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
