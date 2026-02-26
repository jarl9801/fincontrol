import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Landmark,
  Flame, Activity, AlertTriangle, RefreshCw, Shield, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useCashFlow } from '../../hooks/useCashFlow';
import PeriodSelector, { usePeriodSelector } from '../../components/ui/PeriodSelector';
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell, BarChart
} from 'recharts';

// ─── Helpers ────────────────────────────────────────────────────────────────

const BANK_REAL_KEY = 'fincontrol_banco_real';

const formatAxis = (value) => {
  if (Math.abs(value) >= 1000) return `€${(value / 1000).toFixed(0)}k`;
  return `€${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1c1c1e] p-3 rounded-xl shadow-lg border border-[rgba(255,255,255,0.08)] min-w-[180px]">
      <p className="text-xs font-semibold text-[#c7c7cc] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs mb-0.5" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── KPI Card ───────────────────────────────────────────────────────────────

const KpiCard = ({ title, value, color, icon: Icon, subtitle, large = false }) => (
  <div className="bg-[rgba(28,28,30,0.8)] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]" style={{ backdropFilter: 'blur(40px)' }}>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">{title}</h3>
      {Icon && <Icon size={16} className={color} />}
    </div>
    <p className={`${large ? 'text-2xl' : 'text-xl'} font-bold ${color}`}>{value}</p>
    {subtitle && <p className="text-xs text-[#636366] mt-1">{subtitle}</p>}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const CashFlow = ({ user }) => {
  const { loading, csvError, monthlyData, kpis, fcfData, allMonths } = useCashFlow(user);
  const period = usePeriodSelector('all');

  // Bank Reconciliation state
  const [bancoReal, setBancoReal] = useState(() => {
    const stored = localStorage.getItem(BANK_REAL_KEY);
    return stored !== null ? stored : '';
  });
  const [bancoRealInput, setBancoRealInput] = useState(bancoReal);

  const handleSaveBanco = () => {
    localStorage.setItem(BANK_REAL_KEY, bancoRealInput);
    setBancoReal(bancoRealInput);
  };

  const bancoRealNum = parseFloat((bancoReal || '').replace(',', '.')) || null;
  const discrepancia = bancoRealNum !== null ? kpis.balance - bancoRealNum : null;
  const discPercent = bancoRealNum && bancoRealNum !== 0 ? Math.abs((discrepancia / bancoRealNum) * 100) : 0;

  // Filter monthly data by period
  const filteredMonthly = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];
    return monthlyData.filter((row) => {
      const [y, m] = row.month.split('-').map(Number);
      const yearMatch = period.year === 'all' || y === period.year;
      if (!yearMatch) return false;
      if (period.periodType === 'annual') return true;
      if (period.periodType === 'month') return m === period.periodValue;
      if (period.periodType === 'quarter') {
        const qStart = (period.periodValue - 1) * 3 + 1;
        return m >= qStart && m <= qStart + 2;
      }
      if (period.periodType === 'semester') {
        return period.periodValue === 1 ? m >= 1 && m <= 6 : m >= 7 && m <= 12;
      }
      return true;
    });
  }, [monthlyData, period.year, period.periodType, period.periodValue]);

  // Filtered KPIs
  const filteredKpis = useMemo(() => {
    const data = filteredMonthly;
    const totalIngresos = data.reduce((s, r) => s + r.ingresos, 0);
    const totalEgresos = data.reduce((s, r) => s + r.egresos, 0);
    const flujoNeto = totalIngresos - totalEgresos;
    const totalFCF = data.reduce((s, r) => s + (r.fcf || 0), 0);
    const monthCount = data.length || 1;
    const burnRate = totalEgresos / monthCount;
    const latestAccum = data.length > 0 ? data[data.length - 1].acumulado : kpis.balance;
    const runway = burnRate > 0 ? latestAccum / burnRate : Infinity;
    const fcfMargin = totalIngresos > 0 ? (totalFCF / totalIngresos) * 100 : 0;

    return {
      totalIngresos,
      totalEgresos,
      flujoNeto,
      fcf: totalFCF,
      burnRate,
      runway: Math.max(0, runway),
      fcfMargin,
      balance: latestAccum,
    };
  }, [filteredMonthly, kpis.balance]);

  // Filtered chart data (actual + projection)
  const filteredAllMonths = useMemo(() => {
    if (period.year === 'all' && period.periodType === 'annual') return allMonths;
    // When filtering, show only filtered actual data (no projection)
    return filteredMonthly;
  }, [allMonths, filteredMonthly, period.year, period.periodType]);

  // FCF data filtered
  const filteredFCF = useMemo(() => {
    return filteredMonthly.map((b) => ({
      ...b,
      fcfMargin: b.ingresos > 0 ? (b.fcf / b.ingresos) * 100 : 0,
    }));
  }, [filteredMonthly]);

  // Year-over-Year comparison
  const yoyData = useMemo(() => {
    if (period.year !== 'all') return null;
    const byYear = {};
    (monthlyData || []).forEach((row) => {
      const y = parseInt(row.month.split('-')[0]);
      if (!byYear[y]) byYear[y] = { ingresos: 0, egresos: 0, count: 0, fcf: 0 };
      byYear[y].ingresos += row.ingresos;
      byYear[y].egresos += row.egresos;
      byYear[y].fcf += row.fcf || 0;
      byYear[y].count++;
    });
    const years = Object.keys(byYear).map(Number).sort();
    if (years.length < 2) return null;
    return years.map((y) => ({
      year: y,
      avgIngresos: byYear[y].ingresos / byYear[y].count,
      avgEgresos: byYear[y].egresos / byYear[y].count,
      totalIngresos: byYear[y].ingresos,
      totalEgresos: byYear[y].egresos,
      totalFCF: byYear[y].fcf,
      months: byYear[y].count,
    }));
  }, [monthlyData, period.year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 text-[#30d158] animate-spin" />
          <p className="text-[#8e8e93] text-sm">Cargando datos históricos…</p>
        </div>
      </div>
    );
  }

  const showProjection = period.year === 'all' && period.periodType === 'annual';
  const actualData = filteredAllMonths.filter((d) => !d.isProjection);
  const lastActualMonth = actualData.length > 0 ? actualData[actualData.length - 1].month : null;

  return (
    <div className="space-y-6">

      {/* CSV error banner */}
      {csvError && (
        <div className="bg-[rgba(255,69,58,0.1)] border border-[rgba(255,69,58,0.3)] rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-[#ff453a]" size={18} />
          <p className="text-sm text-[#ff453a]">
            No se pudo cargar el historial 2025. Mostrando solo datos 2026.
          </p>
        </div>
      )}

      {/* Header: Period Selector */}
      <div className="bg-[rgba(28,28,30,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]" style={{ backdropFilter: 'blur(40px)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Flujo de Caja</h3>
            <p className="text-xs text-[#636366] mt-0.5">{period.periodLabel}</p>
          </div>
          <PeriodSelector {...period} />
        </div>
      </div>

      {/* ── KPI Cards (6) ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="Total Ingresos"
          value={formatCurrency(filteredKpis.totalIngresos)}
          color="text-[#30d158]"
          icon={TrendingUp}
          subtitle={period.periodLabel}
        />
        <KpiCard
          title="Total Egresos"
          value={formatCurrency(filteredKpis.totalEgresos)}
          color="text-[#ff453a]"
          icon={TrendingDown}
          subtitle={period.periodLabel}
        />
        <KpiCard
          title="Flujo Neto"
          value={`${filteredKpis.flujoNeto >= 0 ? '+' : ''}${formatCurrency(filteredKpis.flujoNeto)}`}
          color={filteredKpis.flujoNeto >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}
          icon={DollarSign}
          subtitle="Ingresos − Egresos"
        />
        <KpiCard
          title="FCF"
          value={`${filteredKpis.fcf >= 0 ? '+' : ''}${formatCurrency(filteredKpis.fcf)}`}
          color={filteredKpis.fcf >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}
          icon={Activity}
          subtitle={`Margen: ${filteredKpis.fcfMargin.toFixed(1)}%`}
        />
        <KpiCard
          title="Burn Rate"
          value={formatCurrency(filteredKpis.burnRate)}
          color="text-[#ff9f0a]"
          icon={Flame}
          subtitle="Prom. egresos/mes"
        />
        <KpiCard
          title="Runway"
          value={filteredKpis.runway === Infinity ? '∞' : `${filteredKpis.runway.toFixed(1)} meses`}
          color={filteredKpis.runway > 6 ? 'text-[#30d158]' : filteredKpis.runway > 3 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'}
          icon={Shield}
          subtitle="Meses de caja"
        />
      </div>

      {/* ── Cash Flow Chart ────────────────────────────────────────── */}
      <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#c7c7cc]">Flujo de Caja Histórico</h3>
          <span className="text-xs text-[#636366]">{period.periodLabel}{showProjection ? ' + proyección 3 meses' : ''}</span>
        </div>
        <p className="text-xs text-[#636366] mb-4">Barras: ingresos/egresos mensuales · Línea azul: saldo acumulado</p>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={filteredAllMonths} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#30d158" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#30d158" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="gradEgresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff453a" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#ff453a" stopOpacity={0.6} />
              </linearGradient>
              <linearGradient id="gradProjection" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#30d158" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#30d158" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#636366' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
            <ReferenceLine yAxisId="left" y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            {showProjection && lastActualMonth && (
              <ReferenceLine yAxisId="left" x={filteredAllMonths.find((d) => d.isProjection)?.label} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: 'Proyección →', fill: '#636366', fontSize: 10 }} />
            )}
            <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" maxBarSize={28} radius={[3, 3, 0, 0]}>
              {filteredAllMonths.map((entry, index) => (
                <Cell key={index} fill={entry.isProjection ? 'url(#gradProjection)' : 'url(#gradIngresos)'} />
              ))}
            </Bar>
            <Bar yAxisId="left" dataKey="egresos" name="Egresos" maxBarSize={28} radius={[3, 3, 0, 0]}>
              {filteredAllMonths.map((entry, index) => (
                <Cell key={index} fill={entry.isProjection ? 'rgba(255,69,58,0.3)' : 'url(#gradEgresos)'} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="acumulado" name="Saldo Acumulado" stroke="#0a84ff" strokeWidth={2.5} dot={{ r: 3, fill: '#0a84ff', stroke: '#1c1c1e', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#0a84ff', stroke: '#1c1c1e', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── FCF Chart ─────────────────────────────────────────────── */}
      <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Flujo de Caja Libre (FCF)</h3>
            <p className="text-xs text-[#636366]">FCF = Flujo operativo (sin financiamientos ni arriendos) − CapEx (equipos)</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#636366]">Margen FCF promedio</p>
            <p className={`text-sm font-bold ${filteredKpis.fcfMargin >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
              {filteredKpis.fcfMargin.toFixed(1)}%
            </p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={filteredFCF} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#636366' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
            <YAxis yAxisId="left" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="left" y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <Bar yAxisId="left" dataKey="fcf" name="FCF" maxBarSize={28} radius={[3, 3, 0, 0]}>
              {filteredFCF.map((entry, index) => (
                <Cell key={index} fill={entry.fcf >= 0 ? '#0a84ff' : '#ff453a'} fillOpacity={0.85} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="fcfMargin" name="Margen FCF %" stroke="#5e5ce6" strokeWidth={2} dot={{ r: 3, fill: '#5e5ce6' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly Detail Table ──────────────────────────────────── */}
      {filteredMonthly.length > 0 && (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Detalle Mensual</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#636366] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Mes</th>
                  <th className="text-right px-6 py-3 font-semibold">Ingresos</th>
                  <th className="text-right px-6 py-3 font-semibold">Egresos</th>
                  <th className="text-right px-6 py-3 font-semibold">Neto</th>
                  <th className="text-right px-6 py-3 font-semibold">FCF</th>
                  <th className="text-right px-6 py-3 font-semibold">Margen FCF</th>
                  <th className="text-right px-6 py-3 font-semibold">Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {filteredMonthly.map((row, i) => {
                  const fcfMargin = row.ingresos > 0 ? ((row.fcf || 0) / row.ingresos) * 100 : 0;
                  return (
                    <tr key={i} className="hover:bg-[#111111] transition-colors">
                      <td className="px-6 py-3 font-medium text-[#c7c7cc]">{row.label}</td>
                      <td className="px-6 py-3 text-right text-[#30d158]">{formatCurrency(row.ingresos)}</td>
                      <td className="px-6 py-3 text-right text-[#ff453a]">{formatCurrency(row.egresos)}</td>
                      <td className={`px-6 py-3 text-right font-medium ${row.neto >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                        {row.neto >= 0 ? '+' : ''}{formatCurrency(row.neto)}
                      </td>
                      <td className={`px-6 py-3 text-right ${(row.fcf || 0) >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
                        {(row.fcf || 0) >= 0 ? '+' : ''}{formatCurrency(row.fcf || 0)}
                      </td>
                      <td className={`px-6 py-3 text-right ${fcfMargin >= 0 ? 'text-[#5e5ce6]' : 'text-[#ff453a]'}`}>
                        {fcfMargin.toFixed(1)}%
                      </td>
                      <td className={`px-6 py-3 text-right font-bold ${row.acumulado < 0 ? 'text-[#ff453a]' : 'text-[#c7c7cc]'}`}>
                        {formatCurrency(row.acumulado)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[rgba(255,255,255,0.12)] bg-[#111111]">
                  <td className="px-6 py-3 font-bold text-[#c7c7cc]">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-[#30d158]">
                    {formatCurrency(filteredKpis.totalIngresos)}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-[#ff453a]">
                    {formatCurrency(filteredKpis.totalEgresos)}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${filteredKpis.flujoNeto >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                    {filteredKpis.flujoNeto >= 0 ? '+' : ''}{formatCurrency(filteredKpis.flujoNeto)}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${filteredKpis.fcf >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
                    {filteredKpis.fcf >= 0 ? '+' : ''}{formatCurrency(filteredKpis.fcf)}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${filteredKpis.fcfMargin >= 0 ? 'text-[#5e5ce6]' : 'text-[#ff453a]'}`}>
                    {filteredKpis.fcfMargin.toFixed(1)}%
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-[#636366]">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Bank Reconciliation ────────────────────────────────────── */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
          <Landmark size={16} className="text-[#8e8e93]" />
          <h3 className="text-sm font-semibold text-[#c7c7cc]">Conciliación Bancaria</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-[#111111] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#636366] mb-1">Saldo Calculado (sistema)</p>
              <p className={`text-lg font-bold ${kpis.balance >= 0 ? 'text-[#c7c7cc]' : 'text-[#ff453a]'}`}>
                {formatCurrency(kpis.balance)}
              </p>
              <p className="text-xs text-[#636366] mt-1">Base: €28,450 dic 2025</p>
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#636366] mb-1">Saldo Banco Real</p>
              {bancoRealNum !== null ? (
                <p className={`text-lg font-bold ${bancoRealNum >= 0 ? 'text-[#c7c7cc]' : 'text-[#ff453a]'}`}>
                  {formatCurrency(bancoRealNum)}
                </p>
              ) : (
                <p className="text-sm text-[#8e8e93]">No ingresado</p>
              )}
            </div>
            <div className="bg-[#111111] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
              <p className="text-xs text-[#636366] mb-1">Discrepancia</p>
              {discrepancia !== null ? (
                <>
                  <p className={`text-lg font-bold ${Math.abs(discrepancia) < 100 ? 'text-[#30d158]' : discPercent > 5 ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`}>
                    {discrepancia >= 0 ? '+' : ''}{formatCurrency(discrepancia)}
                  </p>
                  {discPercent > 5 && (
                    <p className="text-xs text-[#ff453a] mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> {discPercent.toFixed(1)}% — revisar registros
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#8e8e93]">—</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-[#8e8e93] mb-1 block">Ingresar Saldo Banco Real (€)</label>
              <input
                type="number"
                step="0.01"
                value={bancoRealInput}
                onChange={(e) => setBancoRealInput(e.target.value)}
                placeholder="Ej: 32500.00"
                className="w-full bg-[#111111] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-sm text-[#c7c7cc] placeholder-[#636366] focus:outline-none focus:border-[rgba(255,255,255,0.2)]"
              />
            </div>
            <button
              onClick={handleSaveBanco}
              className="mt-5 px-5 py-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.16)] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>

      {/* ── Year-over-Year Comparison ──────────────────────────────── */}
      {yoyData && (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Comparación Interanual</h3>
            <p className="text-xs text-[#636366]">Promedios mensuales y totales por año</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#636366] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Año</th>
                  <th className="text-right px-6 py-3 font-semibold">Meses</th>
                  <th className="text-right px-6 py-3 font-semibold">Ing. Total</th>
                  <th className="text-right px-6 py-3 font-semibold">Egr. Total</th>
                  <th className="text-right px-6 py-3 font-semibold">Ing. Prom/Mes</th>
                  <th className="text-right px-6 py-3 font-semibold">Egr. Prom/Mes</th>
                  <th className="text-right px-6 py-3 font-semibold">FCF Total</th>
                  <th className="text-right px-6 py-3 font-semibold">Crecimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {yoyData.map((row, i) => {
                  const prevRow = i > 0 ? yoyData[i - 1] : null;
                  const growth = prevRow ? ((row.totalIngresos - prevRow.totalIngresos) / prevRow.totalIngresos) * 100 : null;
                  return (
                    <tr key={row.year} className="hover:bg-[#111111] transition-colors">
                      <td className="px-6 py-3 font-bold text-[#c7c7cc]">{row.year}</td>
                      <td className="px-6 py-3 text-right text-[#8e8e93]">{row.months}</td>
                      <td className="px-6 py-3 text-right text-[#30d158] font-medium">{formatCurrency(row.totalIngresos)}</td>
                      <td className="px-6 py-3 text-right text-[#ff453a] font-medium">{formatCurrency(row.totalEgresos)}</td>
                      <td className="px-6 py-3 text-right text-[#30d158]">{formatCurrency(row.avgIngresos)}</td>
                      <td className="px-6 py-3 text-right text-[#ff453a]">{formatCurrency(row.avgEgresos)}</td>
                      <td className={`px-6 py-3 text-right font-medium ${row.totalFCF >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
                        {formatCurrency(row.totalFCF)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        {growth !== null ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${growth >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                            {growth >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {Math.abs(growth).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[#636366]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Projection Note ────────────────────────────────────────── */}
      {showProjection && (
        <div className="bg-[rgba(10,132,255,0.07)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Activity size={16} className="text-[#0a84ff] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#0a84ff]">Proyección 3 meses (área rayada en gráfico)</p>
              <p className="text-xs text-[#636366] mt-1">
                Basada en el promedio de los últimos 3 meses reales.
                Los valores proyectados se muestran con opacidad reducida en el gráfico.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlow;
