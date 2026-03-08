import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Activity, RefreshCw,
  Calendar, Target, AlertTriangle, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useTransactions } from '../../hooks/useTransactions';
import { useReceivables } from '../../hooks/useReceivables';
import { usePayables } from '../../hooks/usePayables';

// ─── Constants ───────────────────────────────────────────────────────────────

const STARTING_BALANCE = 28450;
const PROJECTION_MONTHS = 6;
const LOOKBACK_MONTHS = 3;
const OPTIMISTIC_FACTOR = 1.15;
const PESSIMISTIC_FACTOR = 0.85;

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAxis = (value) => {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-[#1c1c1e] p-3 rounded-xl shadow-lg border border-[rgba(255,255,255,0.08)] min-w-[220px]">
      <p className="text-xs font-semibold text-[#c7c7cc] mb-2">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs mb-0.5" style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Scenario Card ───────────────────────────────────────────────────────────

const ScenarioCard = ({ title, icon: Icon, color, balance, monthlyNet, subtitle }) => (
  <div
    className="rounded-xl p-5 border transition-all duration-200 hover:translate-y-[-1px]"
    style={{
      background: `linear-gradient(135deg, ${color}12 0%, #1c1c1e 55%)`,
      borderColor: `${color}30`,
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">{title}</h3>
      <Icon size={16} style={{ color }} />
    </div>
    <p className="text-2xl font-bold" style={{ color }}>
      {formatCurrency(balance)}
    </p>
    <p className="text-[11px] text-[#636366] mt-1">
      {subtitle} &middot; Neto/mes: {monthlyNet >= 0 ? '+' : ''}{formatCurrency(monthlyNet)}
    </p>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const ProyeccionCashflow = ({ user, userRole }) => {
  const { allTransactions, loading: txLoading } = useAllTransactions(user);
  const { transactions, loading: txRtLoading } = useTransactions(user);
  const { receivables, loading: rxLoading } = useReceivables(user);
  const { payables, loading: pxLoading } = usePayables(user);

  const loading = txLoading || txRtLoading || rxLoading || pxLoading;

  // ── Current cash position ────────────────────────────────────────────────

  const currentCash = useMemo(() => {
    if (loading) return 0;
    return allTransactions.reduce((acc, t) => {
      if (t.status === 'pending') return acc;
      const amount = parseFloat(t.amount) || 0;
      return acc + (t.type === 'income' ? amount : -amount);
    }, STARTING_BALANCE);
  }, [allTransactions, loading]);

  // ── Historical averages (last 3 months) ──────────────────────────────────

  const historicalAvg = useMemo(() => {
    if (loading || allTransactions.length === 0) {
      return { avgIncome: 0, avgExpenses: 0, avgNet: 0 };
    }

    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth() - LOOKBACK_MONTHS, 1);

    const recentTx = allTransactions.filter(t => new Date(t.date) >= cutoff);

    const monthBuckets = {};
    recentTx.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthBuckets[key]) monthBuckets[key] = { income: 0, expense: 0 };
      const amount = parseFloat(t.amount) || 0;
      if (t.type === 'income') monthBuckets[key].income += amount;
      else monthBuckets[key].expense += amount;
    });

    const months = Object.values(monthBuckets);
    const count = months.length || 1;

    const avgIncome = months.reduce((s, m) => s + m.income, 0) / count;
    const avgExpenses = months.reduce((s, m) => s + m.expense, 0) / count;

    return {
      avgIncome,
      avgExpenses,
      avgNet: avgIncome - avgExpenses,
    };
  }, [allTransactions, loading]);

  // ── CXC/CXP by month (pending items with due dates) ─────────────────────

  const pendingByMonth = useMemo(() => {
    if (loading) return {};

    const byMonth = {};

    // Pending receivables (expected income)
    receivables
      .filter(r => r.status !== 'paid' && r.dueDate)
      .forEach(r => {
        const d = new Date(r.dueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { cxc: 0, cxp: 0 };
        byMonth[key].cxc += parseFloat(r.pendingAmount) || 0;
      });

    // Pending payables (expected outflows)
    payables
      .filter(p => p.status !== 'paid' && p.dueDate)
      .forEach(p => {
        const d = new Date(p.dueDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { cxc: 0, cxp: 0 };
        byMonth[key].cxp += parseFloat(p.pendingAmount) || 0;
      });

    // Transaction-based pending CXC (income pending/partial, not linked to receivables)
    const linkedRxIds = new Set(
      receivables.filter(r => r.linkedTransactionId).map(r => r.linkedTransactionId)
    );
    transactions
      .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial') && t.date && !linkedRxIds.has(t.id))
      .forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { cxc: 0, cxp: 0 };
        byMonth[key].cxc += (parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0);
      });

    // Transaction-based pending CXP (expense pending/partial, not linked to payables)
    const linkedPxIds = new Set(
      payables.filter(p => p.linkedTransactionId).map(p => p.linkedTransactionId)
    );
    transactions
      .filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'partial') && t.date && !linkedPxIds.has(t.id))
      .forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!byMonth[key]) byMonth[key] = { cxc: 0, cxp: 0 };
        byMonth[key].cxp += (parseFloat(t.amount) || 0) - (parseFloat(t.paidAmount) || 0);
      });

    return byMonth;
  }, [receivables, payables, transactions, loading]);

  // ── Projection Data (6 months, 3 scenarios) ─────────────────────────────

  const projectionData = useMemo(() => {
    if (loading) return [];

    const now = new Date();
    const data = [];

    let balBase = currentCash;
    let balOpt = currentCash;
    let balPes = currentCash;

    for (let i = 1; i <= PROJECTION_MONTHS; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;
      const label = `${MONTHS_ES[futureDate.getMonth()]} ${futureDate.getFullYear().toString().slice(2)}`;

      // Known CXC/CXP for this month
      const pending = pendingByMonth[monthKey] || { cxc: 0, cxp: 0 };

      // Base scenario: avg + known CXC/CXP
      const baseIncome = historicalAvg.avgIncome + pending.cxc;
      const baseExpense = historicalAvg.avgExpenses + pending.cxp;
      const baseNet = baseIncome - baseExpense;

      // Optimistic: +15% income, -15% expenses (relative to avg only, CXC/CXP stays)
      const optIncome = (historicalAvg.avgIncome * OPTIMISTIC_FACTOR) + pending.cxc;
      const optExpense = (historicalAvg.avgExpenses * PESSIMISTIC_FACTOR) + pending.cxp;
      const optNet = optIncome - optExpense;

      // Pessimistic: -15% income, +15% expenses
      const pesIncome = (historicalAvg.avgIncome * PESSIMISTIC_FACTOR) + pending.cxc;
      const pesExpense = (historicalAvg.avgExpenses * OPTIMISTIC_FACTOR) + pending.cxp;
      const pesNet = pesIncome - pesExpense;

      balBase += baseNet;
      balOpt += optNet;
      balPes += pesNet;

      data.push({
        month: monthKey,
        label,
        // Chart data
        base: Math.round(balBase * 100) / 100,
        optimista: Math.round(balOpt * 100) / 100,
        pesimista: Math.round(balPes * 100) / 100,
        // Table data
        baseIncome: Math.round(baseIncome * 100) / 100,
        baseExpense: Math.round(baseExpense * 100) / 100,
        baseNet: Math.round(baseNet * 100) / 100,
        cxc: pending.cxc,
        cxp: pending.cxp,
      });
    }

    return data;
  }, [currentCash, historicalAvg, pendingByMonth, loading]);

  // ── Final balances ───────────────────────────────────────────────────────

  const finalBalances = useMemo(() => {
    if (projectionData.length === 0) return { base: currentCash, opt: currentCash, pes: currentCash };
    const last = projectionData[projectionData.length - 1];
    return { base: last.base, opt: last.optimista, pes: last.pesimista };
  }, [projectionData, currentCash]);

  // ── Alert detection ──────────────────────────────────────────────────────

  const alerts = useMemo(() => {
    const items = [];
    const negativeBase = projectionData.find(d => d.base < 0);
    const negativePes = projectionData.find(d => d.pesimista < 0);
    if (negativeBase) {
      items.push({ type: 'critical', text: `Saldo negativo proyectado en escenario base: ${negativeBase.label}` });
    } else if (negativePes) {
      items.push({ type: 'warning', text: `Saldo negativo posible en escenario pesimista: ${negativePes.label}` });
    }
    if (historicalAvg.avgNet < 0) {
      items.push({ type: 'warning', text: `Flujo neto promedio negativo: ${formatCurrency(historicalAvg.avgNet)}/mes` });
    }
    return items;
  }, [projectionData, historicalAvg]);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 text-[#30d158] animate-spin" />
          <p className="text-[#8e8e93] text-sm">Analizando datos hist&oacute;ricos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Proyecci&oacute;n de Cashflow</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">
            Proyecci&oacute;n inteligente a {PROJECTION_MONTHS} meses basada en datos hist&oacute;ricos
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)] rounded-lg">
          <Calendar size={14} className="text-[#0a84ff]" />
          <span className="text-xs text-[#0a84ff] font-medium">
            Base: &uacute;ltimos {LOOKBACK_MONTHS} meses
          </span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                alert.type === 'critical'
                  ? 'bg-[rgba(255,69,58,0.08)] border-[rgba(255,69,58,0.2)]'
                  : 'bg-[rgba(255,159,10,0.08)] border-[rgba(255,159,10,0.2)]'
              }`}
            >
              <AlertTriangle size={16} className={alert.type === 'critical' ? 'text-[#ff453a]' : 'text-[#ff9f0a]'} />
              <span className={`text-sm ${alert.type === 'critical' ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`}>
                {alert.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Current Position + Historical Averages */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-xl p-5 border"
          style={{
            background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, #1c1c1e 55%)',
            borderColor: 'rgba(10,132,255,0.2)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Saldo Actual</h3>
            <Zap size={16} className="text-[#0a84ff]" />
          </div>
          <p className={`text-2xl font-bold ${currentCash >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
            {formatCurrency(currentCash)}
          </p>
          <p className="text-[11px] text-[#636366] mt-1">Punto de partida</p>
        </div>

        <div className="bg-[rgba(28,28,30,0.8)] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Ing. Prom/Mes</h3>
            <TrendingUp size={16} className="text-[#30d158]" />
          </div>
          <p className="text-xl font-bold text-[#30d158]">{formatCurrency(historicalAvg.avgIncome)}</p>
          <p className="text-[11px] text-[#636366] mt-1">&Uacute;ltimos {LOOKBACK_MONTHS} meses</p>
        </div>

        <div className="bg-[rgba(28,28,30,0.8)] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Egr. Prom/Mes</h3>
            <TrendingDown size={16} className="text-[#ff453a]" />
          </div>
          <p className="text-xl font-bold text-[#ff453a]">{formatCurrency(historicalAvg.avgExpenses)}</p>
          <p className="text-[11px] text-[#636366] mt-1">&Uacute;ltimos {LOOKBACK_MONTHS} meses</p>
        </div>

        <div className="bg-[rgba(28,28,30,0.8)] rounded-xl p-5 border border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Flujo Neto/Mes</h3>
            <Activity size={16} className={historicalAvg.avgNet >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'} />
          </div>
          <p className={`text-xl font-bold ${historicalAvg.avgNet >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
            {historicalAvg.avgNet >= 0 ? '+' : ''}{formatCurrency(historicalAvg.avgNet)}
          </p>
          <p className="text-[11px] text-[#636366] mt-1">Promedio mensual</p>
        </div>
      </div>

      {/* 3 Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScenarioCard
          title="Escenario Optimista"
          icon={TrendingUp}
          color="#30d158"
          balance={finalBalances.opt}
          monthlyNet={(finalBalances.opt - currentCash) / PROJECTION_MONTHS}
          subtitle={`+15% ingresos, -15% gastos`}
        />
        <ScenarioCard
          title="Escenario Base"
          icon={Target}
          color="#0a84ff"
          balance={finalBalances.base}
          monthlyNet={(finalBalances.base - currentCash) / PROJECTION_MONTHS}
          subtitle="Promedios hist&oacute;ricos"
        />
        <ScenarioCard
          title="Escenario Pesimista"
          icon={TrendingDown}
          color="#ff453a"
          balance={finalBalances.pes}
          monthlyNet={(finalBalances.pes - currentCash) / PROJECTION_MONTHS}
          subtitle={`-15% ingresos, +15% gastos`}
        />
      </div>

      {/* Projection Chart */}
      <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#c7c7cc]">Proyecci&oacute;n de Saldo</h3>
          <span className="text-xs text-[#636366]">Pr&oacute;ximos {PROJECTION_MONTHS} meses</span>
        </div>
        <p className="text-xs text-[#636366] mb-4">
          Banda de confianza: optimista (verde) &middot; base (azul) &middot; pesimista (rojo)
        </p>
        {projectionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <AreaChart
              data={[
                { label: 'Hoy', base: currentCash, optimista: currentCash, pesimista: currentCash },
                ...projectionData,
              ]}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradOptArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#30d158" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#30d158" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradBaseArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0a84ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0a84ff" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradPesArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff453a" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ff453a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#636366' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
              <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="optimista"
                name="Optimista"
                stroke="#30d158"
                strokeWidth={2}
                fill="url(#gradOptArea)"
                dot={{ r: 3, fill: '#30d158', stroke: '#1c1c1e', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="base"
                name="Base"
                stroke="#0a84ff"
                strokeWidth={2.5}
                fill="url(#gradBaseArea)"
                dot={{ r: 4, fill: '#0a84ff', stroke: '#1c1c1e', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="pesimista"
                name="Pesimista"
                stroke="#ff453a"
                strokeWidth={2}
                fill="url(#gradPesArea)"
                dot={{ r: 3, fill: '#ff453a', stroke: '#1c1c1e', strokeWidth: 2 }}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[360px] text-[#636366] text-sm">
            Datos insuficientes para generar proyecci&oacute;n
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      {projectionData.length > 0 && (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h3 className="text-sm font-semibold text-[#c7c7cc]">Desglose Mensual Proyectado</h3>
            <p className="text-xs text-[#636366] mt-0.5">Escenario base con CXC/CXP conocidas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#111111] text-[#636366] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-3 font-semibold">Mes</th>
                  <th className="text-right px-6 py-3 font-semibold">Ingresos Est.</th>
                  <th className="text-right px-6 py-3 font-semibold">Gastos Est.</th>
                  <th className="text-right px-6 py-3 font-semibold">CXC Vence</th>
                  <th className="text-right px-6 py-3 font-semibold">CXP Vence</th>
                  <th className="text-right px-6 py-3 font-semibold">Neto</th>
                  <th className="text-right px-6 py-3 font-semibold">Saldo Base</th>
                  <th className="text-right px-6 py-3 font-semibold">Saldo Optim.</th>
                  <th className="text-right px-6 py-3 font-semibold">Saldo Pesim.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                {projectionData.map((row, i) => (
                  <tr key={i} className="hover:bg-[#111111] transition-colors">
                    <td className="px-6 py-3 font-medium text-[#c7c7cc]">{row.label}</td>
                    <td className="px-6 py-3 text-right text-[#30d158] tabular-nums">
                      {formatCurrency(row.baseIncome)}
                    </td>
                    <td className="px-6 py-3 text-right text-[#ff453a] tabular-nums">
                      {formatCurrency(row.baseExpense)}
                    </td>
                    <td className="px-6 py-3 text-right text-[#ff9f0a] tabular-nums">
                      {row.cxc > 0 ? formatCurrency(row.cxc) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right text-[#bf5af2] tabular-nums">
                      {row.cxp > 0 ? formatCurrency(row.cxp) : '—'}
                    </td>
                    <td className={`px-6 py-3 text-right font-medium tabular-nums ${row.baseNet >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                      {row.baseNet >= 0 ? '+' : ''}{formatCurrency(row.baseNet)}
                    </td>
                    <td className={`px-6 py-3 text-right font-bold tabular-nums ${row.base >= 0 ? 'text-[#0a84ff]' : 'text-[#ff453a]'}`}>
                      {formatCurrency(row.base)}
                    </td>
                    <td className={`px-6 py-3 text-right tabular-nums ${row.optimista >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                      {formatCurrency(row.optimista)}
                    </td>
                    <td className={`px-6 py-3 text-right tabular-nums ${row.pesimista >= 0 ? 'text-[#ff453a]' : 'text-[#ff453a]'}`}>
                      {formatCurrency(row.pesimista)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      <div className="bg-[rgba(10,132,255,0.07)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Activity size={16} className="text-[#0a84ff] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-[#0a84ff]">Metodolog&iacute;a de Proyecci&oacute;n</p>
            <p className="text-xs text-[#636366] mt-1">
              Los promedios se calculan con los &uacute;ltimos {LOOKBACK_MONTHS} meses de datos reales.
              Las CXC y CXP pendientes se asignan al mes de su vencimiento.
              Escenario optimista: +15% ingresos, -15% gastos. Pesimista: -15% ingresos, +15% gastos.
              Saldo inicial: {formatCurrency(currentCash)} (posici&oacute;n actual de caja).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProyeccionCashflow;
