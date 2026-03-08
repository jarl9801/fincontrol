import React, { useState, useMemo } from 'react';
import {
  Target, TrendingUp, TrendingDown, AlertTriangle, Plus, Trash2, Edit3, Check, X
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { useBudgets } from '../../hooks/useBudgets';
import { useProjects } from '../../hooks/useProjects';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const DeviationBadge = ({ pct }) => {
  const abs = Math.abs(pct);
  if (abs <= 10) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.2)]">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>;
  if (abs <= 25) return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,159,10,0.12)] text-[#ff9f0a] border border-[rgba(255,159,10,0.2)]">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>;
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,69,58,0.12)] text-[#ff453a] border border-[rgba(255,69,58,0.2)]">{pct > 0 ? '+' : ''}{pct.toFixed(1)}%</span>;
};

const CreateBudgetModal = ({ isOpen, onClose, onSubmit, projects }) => {
  const [form, setForm] = useState({
    projectId: '', projectName: '', year: '2026', month: '',
    incomeTarget: '', expenseLimit: '',
    lines: [{ category: '', amount: '', description: '' }],
  });

  if (!isOpen) return null;

  const addLine = () => setForm(p => ({ ...p, lines: [...p.lines, { category: '', amount: '', description: '' }] }));
  const removeLine = (i) => setForm(p => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));
  const updateLine = (i, field, val) => setForm(p => ({ ...p, lines: p.lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l) }));

  const handleProjectChange = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    setForm(p => ({ ...p, projectId, projectName: proj?.name || proj?.code || '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.projectName || !form.incomeTarget) return;
    onSubmit({
      ...form,
      lines: form.lines.filter(l => l.category && l.amount).map(l => ({ ...l, amount: parseFloat(l.amount) })),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#1c1c1e] rounded-2xl border border-[rgba(255,255,255,0.1)] p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
        <h3 className="text-lg font-bold text-white mb-5">Nuevo Presupuesto</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Proyecto *</label>
              <select value={form.projectId} onChange={e => handleProjectChange(e.target.value)}
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0a84ff] focus:outline-none">
                <option value="">Seleccionar...</option>
                <option value="__general__">General (Empresa)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name || p.code}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Año</label>
                <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                  className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0a84ff] focus:outline-none">
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Mes</label>
                <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                  className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#0a84ff] focus:outline-none">
                  <option value="">Anual</option>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Ingreso Objetivo (EUR) *</label>
              <input type="number" step="0.01" min="0" value={form.incomeTarget} onChange={e => setForm(p => ({ ...p, incomeTarget: e.target.value }))} required
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#30d158] focus:outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase mb-1.5">Límite de Gasto (EUR)</label>
              <input type="number" step="0.01" min="0" value={form.expenseLimit} onChange={e => setForm(p => ({ ...p, expenseLimit: e.target.value }))}
                className="w-full bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#ff453a] focus:outline-none" />
            </div>
          </div>

          {/* Budget Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-[#8e8e93] uppercase">Líneas de Presupuesto</label>
              <button type="button" onClick={addLine} className="text-[11px] text-[#0a84ff] hover:text-[#64d2ff] font-medium">+ Agregar línea</button>
            </div>
            <div className="space-y-2">
              {form.lines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input placeholder="Categoría" value={line.category} onChange={e => updateLine(i, 'category', e.target.value)}
                    className="flex-1 bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                  <input type="number" placeholder="Monto" value={line.amount} onChange={e => updateLine(i, 'amount', e.target.value)}
                    className="w-28 bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none" />
                  <button type="button" onClick={() => removeLine(i)} className="p-1.5 text-[#636366] hover:text-[#ff453a] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0a84ff] hover:bg-[#0070d8] transition-colors shadow-sm">
              Crear Presupuesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#2c2c2e] p-3 rounded-xl border border-[rgba(255,255,255,0.1)] text-sm" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <p className="font-medium text-[#c7c7cc] mb-1.5">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BudgetVsActual = ({ user, userRole }) => {
  const { budgets, loading, createBudget, deleteBudget } = useBudgets(user);
  const { projects } = useProjects(user);
  const { allTransactions } = useAllTransactions(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

  const canAct = userRole === 'admin';

  // Calculate actual amounts per project
  const actuals = useMemo(() => {
    const result = {};
    allTransactions.forEach(t => {
      const year = new Date(t.date).getFullYear();
      if (year !== selectedYear) return;
      const month = new Date(t.date).getMonth() + 1;
      const project = t.project || 'Sin Proyecto';
      const key = `${project}_${month}`;
      if (!result[key]) result[key] = { income: 0, expense: 0 };
      if (t.type === 'income') result[key].income += t.amount;
      else result[key].expense += t.amount;

      // Also aggregate yearly
      const yearKey = `${project}_annual`;
      if (!result[yearKey]) result[yearKey] = { income: 0, expense: 0 };
      if (t.type === 'income') result[yearKey].income += t.amount;
      else result[yearKey].expense += t.amount;
    });
    return result;
  }, [allTransactions, selectedYear]);

  const yearBudgets = budgets.filter(b => b.year === selectedYear);

  // Build comparison data
  const comparisons = useMemo(() => {
    return yearBudgets.map(b => {
      const key = b.month
        ? `${b.projectName}_${b.month}`
        : `${b.projectName}_annual`;
      const actual = actuals[key] || { income: 0, expense: 0 };
      const incomeDeviation = b.incomeTarget > 0
        ? ((actual.income - b.incomeTarget) / b.incomeTarget) * 100
        : 0;
      const expenseDeviation = b.expenseLimit > 0
        ? ((actual.expense - b.expenseLimit) / b.expenseLimit) * 100
        : 0;
      const expenseUsage = b.expenseLimit > 0 ? (actual.expense / b.expenseLimit) * 100 : 0;

      return {
        ...b,
        actualIncome: actual.income,
        actualExpense: actual.expense,
        incomeDeviation,
        expenseDeviation,
        expenseUsage,
        periodLabel: b.month ? MONTHS[b.month - 1] : 'Anual',
      };
    });
  }, [yearBudgets, actuals]);

  // Chart data for overview
  const chartData = useMemo(() => {
    return comparisons.filter(c => !c.month).map(c => ({
      name: c.projectName?.length > 12 ? c.projectName.substring(0, 12) + '...' : c.projectName,
      'Ingreso Presup.': c.incomeTarget,
      'Ingreso Real': c.actualIncome,
      'Gasto Presup.': c.expenseLimit,
      'Gasto Real': c.actualExpense,
    }));
  }, [comparisons]);

  // Summary KPIs
  const totalBudgetIncome = comparisons.reduce((s, c) => s + (c.incomeTarget || 0), 0);
  const totalActualIncome = comparisons.reduce((s, c) => s + c.actualIncome, 0);
  const totalBudgetExpense = comparisons.reduce((s, c) => s + (c.expenseLimit || 0), 0);
  const totalActualExpense = comparisons.reduce((s, c) => s + c.actualExpense, 0);
  const alertCount = comparisons.filter(c => c.expenseUsage > 80).length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Presupuesto vs Real</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">Comparativa de presupuestos por proyecto</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="bg-[#2c2c2e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
          {canAct && (
            <button onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0a84ff] hover:bg-[#0070d8] text-white rounded-xl text-[13px] font-semibold transition-all shadow-sm">
              <Plus size={16} /> Nuevo Presupuesto
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(10,132,255,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Ingreso Objetivo</p>
            <Target size={18} className="text-[#0a84ff]" />
          </div>
          <p className="text-[28px] font-bold text-[#0a84ff]">{formatCurrency(totalBudgetIncome)}</p>
          <p className="text-[11px] text-[#636366] mt-1">Real: {formatCurrency(totalActualIncome)}</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(48,209,88,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Ingreso Real</p>
            <TrendingUp size={18} className="text-[#30d158]" />
          </div>
          <p className="text-[28px] font-bold text-[#30d158]">{formatCurrency(totalActualIncome)}</p>
          {totalBudgetIncome > 0 && (
            <div className="mt-1"><DeviationBadge pct={((totalActualIncome - totalBudgetIncome) / totalBudgetIncome) * 100} /></div>
          )}
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,69,58,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Límite de Gasto</p>
            <TrendingDown size={18} className="text-[#ff453a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff453a]">{formatCurrency(totalBudgetExpense)}</p>
          <p className="text-[11px] text-[#636366] mt-1">Real: {formatCurrency(totalActualExpense)}</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Alertas</p>
            <AlertTriangle size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">{alertCount}</p>
          <p className="text-[11px] text-[#636366] mt-1">Proyectos &gt;80% del límite</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.06)]">
          <h4 className="text-[13px] font-semibold text-[#c7c7cc] mb-4">Comparativa por Proyecto</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Ingreso Presup." fill="#0a84ff" fillOpacity={0.4} radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Ingreso Real" fill="#30d158" radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Gasto Presup." fill="#ff453a" fillOpacity={0.4} radius={[3, 3, 0, 0]} maxBarSize={20} />
                <Bar dataKey="Gasto Real" fill="#ff9f0a" radius={[3, 3, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-[#1c1c1e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <h4 className="text-[13px] font-semibold text-[#c7c7cc]">Detalle de Presupuestos — {selectedYear}</h4>
          <span className="text-[11px] text-[#636366]">{comparisons.length} presupuestos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider">Proyecto</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Período</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Ingreso Presup.</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Ingreso Real</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Desv. Ingreso</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Gasto Presup.</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-right">Gasto Real</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Uso Gasto</th>
                {canAct && <th className="px-4 py-3 text-[11px] font-semibold text-[#636366] uppercase tracking-wider text-center">Acc.</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {comparisons.map((c) => (
                <tr key={c.id} className={`transition-colors hover:bg-[rgba(255,255,255,0.02)] ${c.expenseUsage > 80 ? 'bg-[rgba(255,69,58,0.04)]' : ''}`}>
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold text-white">{c.projectName}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[12px] text-[#8e8e93]">{c.periodLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-[#8e8e93]">{formatCurrency(c.incomeTarget)}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#30d158]">{formatCurrency(c.actualIncome)}</td>
                  <td className="px-4 py-3 text-center"><DeviationBadge pct={c.incomeDeviation} /></td>
                  <td className="px-4 py-3 text-right text-[13px] text-[#8e8e93]">{formatCurrency(c.expenseLimit)}</td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold text-[#ff453a]">{formatCurrency(c.actualExpense)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1.5 bg-[#2c2c2e] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(c.expenseUsage, 100)}%`,
                            backgroundColor: c.expenseUsage > 100 ? '#ff453a' : c.expenseUsage > 80 ? '#ff9f0a' : '#30d158',
                          }}
                        />
                      </div>
                      <span className={`text-[11px] font-bold ${
                        c.expenseUsage > 100 ? 'text-[#ff453a]' : c.expenseUsage > 80 ? 'text-[#ff9f0a]' : 'text-[#30d158]'
                      }`}>
                        {c.expenseUsage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  {canAct && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={async () => {
                          const result = await deleteBudget(c.id);
                          if (result?.success) showToast?.('Presupuesto eliminado');
                          else showToast?.('Error al eliminar', 'error');
                        }}
                        className="p-1.5 text-[#636366] hover:text-[#ff453a] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {comparisons.length === 0 && (
                <tr>
                  <td colSpan={canAct ? 9 : 8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#636366]">
                      <div className="w-16 h-16 bg-[#2c2c2e] rounded-full flex items-center justify-center">
                        <Target className="w-8 h-8 text-[#636366]" />
                      </div>
                      <p className="text-sm">No hay presupuestos para {selectedYear}</p>
                      {canAct && (
                        <button onClick={() => setIsCreateOpen(true)}
                          className="text-[13px] text-[#0a84ff] hover:text-[#64d2ff] font-medium">
                          Crear primer presupuesto
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Section */}
      {comparisons.filter(c => c.expenseUsage > 80).length > 0 && (
        <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,69,58,0.15)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-2">
            <AlertTriangle size={15} className="text-[#ff453a]" />
            <h3 className="text-[13px] font-semibold text-[#c7c7cc]">Alertas de Presupuesto</h3>
          </div>
          <div className="p-2 space-y-0.5">
            {comparisons.filter(c => c.expenseUsage > 80).map(c => (
              <div key={c.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[rgba(255,255,255,0.02)]">
                <AlertTriangle size={15} className={c.expenseUsage > 100 ? 'text-[#ff453a]' : 'text-[#ff9f0a]'} />
                <span className="text-[13px] text-[#c7c7cc] flex-1">
                  <strong>{c.projectName}</strong> ({c.periodLabel}): {c.expenseUsage.toFixed(0)}% del presupuesto de gasto utilizado
                  {c.expenseUsage > 100 && ' — EXCEDIDO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateBudgetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={async (data) => {
          const result = await createBudget(data);
          if (result?.success) showToast?.('Presupuesto creado');
          else showToast?.('Error al crear presupuesto', 'error');
        }}
        projects={projects}
      />
    </div>
  );
};

export default BudgetVsActual;
