import React, { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Landmark,
  Flame, Activity, AlertTriangle, RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useCashFlow } from '../../hooks/useCashFlow';
import {
  ComposedChart, BarChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Cell
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
    <div className="bg-[#1c1c1e] p-3 rounded-xl shadow-lg border border-[rgba(255,255,255,0.08)] min-w-[160px]">
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

const KpiCard = ({ title, value, color, icon: Icon, subtitle }) => (
  <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,255,255,0.08)]">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-semibold text-[#8e8e93] uppercase tracking-wider">{title}</h3>
      {Icon && <Icon size={16} className={color} />}
    </div>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
    {subtitle && <p className="text-xs text-[#636366] mt-1">{subtitle}</p>}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const CashFlow = ({ user }) => {
  const { loading, csvError, monthlyData, kpis, fcfData, allMonths } = useCashFlow(user);

  // Bank Reconciliation state (persisted in localStorage)
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

  // Separate actual vs projection for chart
  const actualData = allMonths.filter((d) => !d.isProjection);
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

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Ingresos"
          value={formatCurrency(kpis.totalIngresos)}
          color="text-[#30d158]"
          icon={TrendingUp}
          subtitle="Histórico completo"
        />
        <KpiCard
          title="Total Egresos"
          value={formatCurrency(kpis.totalEgresos)}
          color="text-[#ff453a]"
          icon={TrendingDown}
          subtitle="Histórico completo"
        />
        <KpiCard
          title="Balance"
          value={formatCurrency(kpis.balance)}
          color={kpis.balance >= 0 ? 'text-[#c7c7cc]' : 'text-[#ff453a]'}
          icon={Landmark}
          subtitle="Saldo acumulado"
        />
        <KpiCard
          title="FCF"
          value={formatCurrency(kpis.fcf)}
          color={kpis.fcf >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}
          icon={Activity}
          subtitle="Flujo de caja libre"
        />
        <KpiCard
          title="Burn Rate"
          value={formatCurrency(kpis.burnRate)}
          color="text-[#ff9f0a]"
          icon={Flame}
          subtitle="Prom. egresos últimos 3 meses"
        />
      </div>

      {/* ── Cash Flow Chart ────────────────────────────────────────────── */}
      <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#c7c7cc]">Flujo de Caja Histórico</h3>
          <span className="text-xs text-[#636366]">Oct 2025 → presente + proyección 3 meses</span>
        </div>
        <p className="text-xs text-[#636366] mb-4">Barras: ingresos/egresos mensuales · Línea azul: saldo acumulado · Zona rayada: proyección</p>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={allMonths} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#636366' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatAxis}
              tick={{ fontSize: 11, fill: '#636366' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatAxis}
              tick={{ fontSize: 11, fill: '#636366' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
            />
            <ReferenceLine yAxisId="left" y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            {/* Projection divider */}
            {lastActualMonth && (
              <ReferenceLine
                yAxisId="left"
                x={allMonths.find((d) => d.isProjection)?.label}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 4"
                label={{ value: 'Proyección →', fill: '#636366', fontSize: 10 }}
              />
            )}
            <Bar
              yAxisId="left"
              dataKey="ingresos"
              name="Ingresos"
              maxBarSize={28}
              radius={[3, 3, 0, 0]}
            >
              {allMonths.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isProjection ? 'url(#gradProjection)' : 'url(#gradIngresos)'}
                />
              ))}
            </Bar>
            <Bar
              yAxisId="left"
              dataKey="egresos"
              name="Egresos"
              maxBarSize={28}
              radius={[3, 3, 0, 0]}
            >
              {allMonths.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isProjection ? 'rgba(255,69,58,0.3)' : 'url(#gradEgresos)'}
                />
              ))}
            </Bar>
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="acumulado"
              name="Saldo Acumulado"
              stroke="#0a84ff"
              strokeWidth={2.5}
              strokeDasharray={(d) => (d && d.isProjection ? '6 3' : undefined)}
              dot={{ r: 3, fill: '#0a84ff', stroke: '#1c1c1e', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#0a84ff', stroke: '#1c1c1e', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── FCF Chart ─────────────────────────────────────────────────── */}
      <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-[#c7c7cc]">Flujo de Caja Libre (FCF)</h3>
          <p className="text-xs text-[#636366]">FCF = Flujo operativo (sin financiamientos ni arriendos) − CapEx (equipos)</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={fcfData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#636366' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxis}
              tick={{ fontSize: 11, fill: '#636366' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            <Bar dataKey="fcf" name="FCF" maxBarSize={28} radius={[3, 3, 0, 0]}>
              {fcfData.map((entry, index) => (
                <Cell key={index} fill={entry.fcf >= 0 ? '#0a84ff' : '#ff453a'} fillOpacity={0.85} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="fcf"
              name="Tendencia FCF"
              stroke="#5e5ce6"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Monthly Table ──────────────────────────────────────────────── */}
      {monthlyData.length > 0 && (
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
                  <th className="text-right px-6 py-3 font-semibold">Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {monthlyData.map((row, i) => (
                  <tr key={i} className="hover:bg-[#111111] transition-colors">
                    <td className="px-6 py-3 font-medium text-[#c7c7cc]">{row.label}</td>
                    <td className="px-6 py-3 text-right text-[#30d158]">{formatCurrency(row.ingresos)}</td>
                    <td className="px-6 py-3 text-right text-[#ff453a]">{formatCurrency(row.egresos)}</td>
                    <td className={`px-6 py-3 text-right font-medium ${row.neto >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                      {row.neto >= 0 ? '+' : ''}{formatCurrency(row.neto)}
                    </td>
                    <td className={`px-6 py-3 text-right ${row.fcf >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
                      {row.fcf >= 0 ? '+' : ''}{formatCurrency(row.fcf)}
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${row.acumulado < 0 ? 'text-[#ff453a]' : 'text-[#c7c7cc]'}`}>
                      {formatCurrency(row.acumulado)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-[rgba(255,255,255,0.12)] bg-[#111111]">
                  <td className="px-6 py-3 font-bold text-[#c7c7cc]">Total</td>
                  <td className="px-6 py-3 text-right font-bold text-[#30d158]">
                    {formatCurrency(monthlyData.reduce((s, r) => s + r.ingresos, 0))}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-[#ff453a]">
                    {formatCurrency(monthlyData.reduce((s, r) => s + r.egresos, 0))}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${
                    monthlyData.reduce((s, r) => s + r.neto, 0) >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'
                  }`}>
                    {(() => {
                      const n = monthlyData.reduce((s, r) => s + r.neto, 0);
                      return `${n >= 0 ? '+' : ''}${formatCurrency(n)}`;
                    })()}
                  </td>
                  <td className={`px-6 py-3 text-right font-bold ${
                    monthlyData.reduce((s, r) => s + r.fcf, 0) >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'
                  }`}>
                    {(() => {
                      const f = monthlyData.reduce((s, r) => s + r.fcf, 0);
                      return `${f >= 0 ? '+' : ''}${formatCurrency(f)}`;
                    })()}
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-[#636366]">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Bank Reconciliation ────────────────────────────────────────── */}
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
                <p className={`text-lg font-bold ${Math.abs(discrepancia) < 100 ? 'text-[#30d158]' : 'text-[#ff9f0a]'}`}>
                  {discrepancia >= 0 ? '+' : ''}{formatCurrency(discrepancia)}
                </p>
              ) : (
                <p className="text-sm text-[#8e8e93]">—</p>
              )}
            </div>
          </div>
          {/* Input */}
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

      {/* ── 3-Month Projection Note ────────────────────────────────────── */}
      <div className="bg-[rgba(10,132,255,0.07)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Activity size={16} className="text-[#0a84ff] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#0a84ff]">Proyección 3 meses (área rayada en gráfico)</p>
            <p className="text-xs text-[#636366] mt-1">
              Basada en el promedio de los últimos 3 meses reales:
              {' '}ingresos prom. {formatCurrency(kpis.burnRate > 0 ? kpis.burnRate : 0)}/mes ·
              {' '}egresos prom. {formatCurrency(kpis.burnRate)}/mes.
              Los valores proyectados se muestran con opacidad reducida en el gráfico.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CashFlow;
