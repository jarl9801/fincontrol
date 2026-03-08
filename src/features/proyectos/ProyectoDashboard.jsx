import React, { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Target,
  RefreshCw, ChevronDown, ArrowUpCircle, ArrowDownCircle,
  BarChart3, PieChart as PieChartIcon, List
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useProjects } from '../../hooks/useProjects';
import { useBudgets } from '../../hooks/useBudgets';

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = ['#0a84ff', '#30d158', '#ff9f0a', '#ff453a', '#bf5af2', '#64d2ff', '#5e5ce6', '#ac8e68'];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatAxis = (value) => {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
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

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({ title, value, color, icon: Icon, subtitle, accentBg }) => (
  <div
    className="rounded-xl p-5 border transition-all duration-200 hover:translate-y-[-1px]"
    style={{
      background: `linear-gradient(135deg, ${accentBg || 'rgba(28,28,30,0.8)'} 0%, #1c1c1e 55%)`,
      borderColor: 'rgba(255,255,255,0.06)',
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">{title}</h3>
      {Icon && <Icon size={16} className={color} />}
    </div>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {subtitle && <p className="text-[11px] text-[#636366] mt-1">{subtitle}</p>}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const ProyectoDashboard = ({ user, userRole }) => {
  const { allTransactions, loading: txLoading } = useAllTransactions(user);
  const { projects, loading: projLoading } = useProjects(user);
  const { budgets, loading: budgLoading } = useBudgets(user);

  const [selectedProjectId, setSelectedProjectId] = useState('');

  const loading = txLoading || projLoading || budgLoading;

  // ── Selected project data ────────────────────────────────────────────────

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  const projectName = selectedProject?.name || '';

  // ── Filtered transactions for selected project ───────────────────────────

  const projectTransactions = useMemo(() => {
    if (!projectName) return [];
    return allTransactions.filter(t =>
      (t.project || '').toLowerCase() === projectName.toLowerCase()
    );
  }, [allTransactions, projectName]);

  // ── KPIs ─────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const income = projectTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const expenses = projectTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const margin = income - expenses;
    const roi = income > 0 ? (margin / income) * 100 : 0;

    return { income, expenses, margin, roi };
  }, [projectTransactions]);

  // ── Monthly P&L data ─────────────────────────────────────────────────────

  const monthlyData = useMemo(() => {
    if (projectTransactions.length === 0) return [];

    const byMonth = {};
    projectTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, ingresos: 0, gastos: 0 };
      const amount = parseFloat(t.amount) || 0;
      if (t.type === 'income') byMonth[key].ingresos += amount;
      else byMonth[key].gastos += amount;
    });

    return Object.values(byMonth)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        ...m,
        label: `${MONTHS_ES[parseInt(m.month.split('-')[1]) - 1]} ${m.month.split('-')[0].slice(2)}`,
        margen: m.ingresos - m.gastos,
      }));
  }, [projectTransactions]);

  // ── Category breakdown (expenses) ────────────────────────────────────────

  const categoryData = useMemo(() => {
    const byCategory = {};
    projectTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = t.category || 'Sin categoría';
        byCategory[cat] = (byCategory[cat] || 0) + (parseFloat(t.amount) || 0);
      });

    return Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [projectTransactions]);

  // ── Budget comparison ────────────────────────────────────────────────────

  const projectBudget = useMemo(() => {
    if (!selectedProjectId) return null;
    return budgets.find(b =>
      b.projectId === selectedProjectId || b.projectName === projectName
    ) || null;
  }, [budgets, selectedProjectId, projectName]);

  // ── Loading State ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-7 h-7 text-[#30d158] animate-spin" />
          <p className="text-[#8e8e93] text-sm">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header + Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Dashboard por Proyecto</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">
            P&L y m&eacute;tricas por proyecto individual
          </p>
        </div>
        <div className="relative">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="appearance-none bg-[#1c1c1e] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2.5 pr-10 text-sm text-[#c7c7cc] focus:outline-none focus:border-[rgba(255,255,255,0.2)] min-w-[240px] cursor-pointer"
          >
            <option value="">Seleccionar proyecto...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#636366] pointer-events-none" />
        </div>
      </div>

      {/* No project selected */}
      {!selectedProjectId && (
        <div className="flex flex-col items-center justify-center py-20">
          <BarChart3 size={48} className="text-[#636366] mb-4" />
          <p className="text-[#8e8e93] text-sm">Selecciona un proyecto para ver su dashboard</p>
          <p className="text-[#636366] text-xs mt-1">{projects.length} proyectos disponibles</p>
        </div>
      )}

      {/* Project selected — show dashboard */}
      {selectedProjectId && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Ingresos"
              value={formatCurrency(kpis.income)}
              color="text-[#30d158]"
              icon={TrendingUp}
              accentBg="rgba(48,209,88,0.08)"
              subtitle={`${projectTransactions.filter(t => t.type === 'income').length} transacciones`}
            />
            <KpiCard
              title="Gastos"
              value={formatCurrency(kpis.expenses)}
              color="text-[#ff453a]"
              icon={TrendingDown}
              accentBg="rgba(255,69,58,0.08)"
              subtitle={`${projectTransactions.filter(t => t.type === 'expense').length} transacciones`}
            />
            <KpiCard
              title="Margen"
              value={`${kpis.margin >= 0 ? '+' : ''}${formatCurrency(kpis.margin)}`}
              color={kpis.margin >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}
              icon={DollarSign}
              accentBg={kpis.margin >= 0 ? 'rgba(48,209,88,0.06)' : 'rgba(255,69,58,0.06)'}
              subtitle="Ingresos - Gastos"
            />
            <KpiCard
              title="ROI"
              value={`${kpis.roi.toFixed(1)}%`}
              color={kpis.roi >= 30 ? 'text-[#30d158]' : kpis.roi >= 0 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'}
              icon={Percent}
              accentBg={kpis.roi >= 30 ? 'rgba(48,209,88,0.06)' : 'rgba(255,159,10,0.06)'}
              subtitle="Margen / Ingresos"
            />
          </div>

          {/* Budget Comparison (if exists) */}
          {projectBudget && (
            <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
                <Target size={16} className="text-[#bf5af2]" />
                <h3 className="text-sm font-semibold text-[#c7c7cc]">Presupuesto vs Real</h3>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Income vs Target */}
                <div className="bg-[#111111] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
                  <p className="text-xs text-[#636366] mb-2">Ingresos vs Meta</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-lg font-bold text-[#30d158]">{formatCurrency(kpis.income)}</span>
                    <span className="text-xs text-[#8e8e93]">/ {formatCurrency(projectBudget.incomeTarget)}</span>
                  </div>
                  <div className="w-full h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, projectBudget.incomeTarget > 0 ? (kpis.income / projectBudget.incomeTarget) * 100 : 0)}%`,
                        background: 'linear-gradient(90deg, #30d158, #30d158)',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-[#636366] mt-1">
                    {projectBudget.incomeTarget > 0 ? ((kpis.income / projectBudget.incomeTarget) * 100).toFixed(1) : 0}% alcanzado
                  </p>
                </div>

                {/* Expenses vs Limit */}
                <div className="bg-[#111111] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
                  <p className="text-xs text-[#636366] mb-2">Gastos vs L&iacute;mite</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className={`text-lg font-bold ${kpis.expenses > projectBudget.expenseLimit ? 'text-[#ff453a]' : 'text-[#ff9f0a]'}`}>
                      {formatCurrency(kpis.expenses)}
                    </span>
                    <span className="text-xs text-[#8e8e93]">/ {formatCurrency(projectBudget.expenseLimit)}</span>
                  </div>
                  <div className="w-full h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, projectBudget.expenseLimit > 0 ? (kpis.expenses / projectBudget.expenseLimit) * 100 : 0)}%`,
                        background: kpis.expenses > projectBudget.expenseLimit
                          ? 'linear-gradient(90deg, #ff453a, #ff453a)'
                          : 'linear-gradient(90deg, #ff9f0a, #ff9f0a)',
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-[#636366] mt-1">
                    {projectBudget.expenseLimit > 0 ? ((kpis.expenses / projectBudget.expenseLimit) * 100).toFixed(1) : 0}% utilizado
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly P&L Chart (2/3 width) */}
            <div className="lg:col-span-2 bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#c7c7cc]">P&L Mensual</h3>
                <span className="text-xs text-[#636366]">{monthlyData.length} meses</span>
              </div>
              <p className="text-xs text-[#636366] mb-4">
                Barras: ingresos/gastos &middot; L&iacute;nea: margen neto
              </p>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradIngProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#30d158" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#30d158" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="gradEgrProj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff453a" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#ff453a" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#636366' }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                    <YAxis yAxisId="left" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#636366' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" fill="url(#gradIngProj)" maxBarSize={28} radius={[3, 3, 0, 0]} />
                    <Bar yAxisId="left" dataKey="gastos" name="Gastos" fill="url(#gradEgrProj)" maxBarSize={28} radius={[3, 3, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="margen" name="Margen" stroke="#0a84ff" strokeWidth={2.5} dot={{ r: 3, fill: '#0a84ff', stroke: '#1c1c1e', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-[#636366] text-sm">
                  Sin datos mensuales
                </div>
              )}
            </div>

            {/* Category Pie Chart (1/3 width) */}
            <div className="bg-[#1c1c1e] rounded-xl p-6 border border-[rgba(255,255,255,0.08)]">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon size={14} className="text-[#8e8e93]" />
                <h3 className="text-sm font-semibold text-[#c7c7cc]">Gastos por Categor&iacute;a</h3>
              </div>
              {categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={v => formatCurrency(v)}
                        contentStyle={{
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          backgroundColor: '#2c2c2e',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="space-y-1.5 mt-2">
                    {categoryData.slice(0, 6).map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-[11px] text-[#c7c7cc] truncate max-w-[120px]">{cat.name}</span>
                        </div>
                        <span className="text-[11px] text-[#8e8e93] tabular-nums">{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-[#636366] text-sm">
                  Sin gastos registrados
                </div>
              )}
            </div>
          </div>

          {/* Transaction List */}
          <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List size={16} className="text-[#8e8e93]" />
                <h3 className="text-sm font-semibold text-[#c7c7cc]">Transacciones del Proyecto</h3>
              </div>
              <span className="text-[11px] text-[#636366] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 rounded-full">
                {projectTransactions.length} registros
              </span>
            </div>
            {projectTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#111111] text-[#636366] text-xs uppercase tracking-wider">
                      <th className="text-left px-6 py-3 font-semibold">Fecha</th>
                      <th className="text-left px-6 py-3 font-semibold">Descripci&oacute;n</th>
                      <th className="text-left px-6 py-3 font-semibold">Categor&iacute;a</th>
                      <th className="text-right px-6 py-3 font-semibold">Monto</th>
                      <th className="text-center px-6 py-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                    {projectTransactions.slice(0, 50).map((t, i) => (
                      <tr key={t.id || i} className="hover:bg-[#111111] transition-colors">
                        <td className="px-6 py-3 text-[#8e8e93] whitespace-nowrap">{formatDate(t.date)}</td>
                        <td className="px-6 py-3 text-[#c7c7cc] max-w-[300px] truncate">{String(t.description || '')}</td>
                        <td className="px-6 py-3 text-[#8e8e93]">{t.category || '—'}</td>
                        <td className={`px-6 py-3 text-right font-medium tabular-nums ${t.type === 'income' ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.status === 'paid' || t.status === 'completed'
                              ? 'bg-[rgba(48,209,88,0.1)] text-[#30d158]'
                              : t.status === 'pending'
                              ? 'bg-[rgba(255,159,10,0.1)] text-[#ff9f0a]'
                              : 'bg-[rgba(255,255,255,0.06)] text-[#8e8e93]'
                          }`}>
                            {t.status === 'paid' || t.status === 'completed' ? 'Pagado' : t.status === 'pending' ? 'Pendiente' : t.status || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot>
                    <tr className="border-t-2 border-[rgba(255,255,255,0.12)] bg-[#111111]">
                      <td colSpan={3} className="px-6 py-3 font-bold text-[#c7c7cc]">Total</td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-[#30d158] font-bold tabular-nums">+{formatCurrency(kpis.income)}</span>
                        <span className="text-[#636366] mx-1">/</span>
                        <span className="text-[#ff453a] font-bold tabular-nums">-{formatCurrency(kpis.expenses)}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`text-sm font-bold ${kpis.margin >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
                          {kpis.margin >= 0 ? '+' : ''}{formatCurrency(kpis.margin)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-[#636366] text-sm">
                No hay transacciones para este proyecto
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProyectoDashboard;
