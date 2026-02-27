import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, ArrowUpCircle, ArrowDownCircle, TrendingUp, Percent,
  Edit2, CheckCircle2, Circle, Sparkles, MessageSquare, Trash2
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import TransactionFormModal from '../../components/ui/TransactionFormModal';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { useCategories } from '../../hooks/useCategories';
import { useCostCenters } from '../../hooks/useCostCenters';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { COLORS } from '../../constants/config';

const CHART_COLORS = ['#64748b', '#94a3b8', '#475569', '#cbd5e1', '#334155', '#e2e8f0', '#30d158', '#ff453a'];

const ProjectDetail = ({ projectName, transactions, user, onClose }) => {
  const [activeTab, setActiveTab] = useState('income');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const { updateTransaction } = useTransactionActions(user);
  const { expenseCategories, incomeCategories } = useCategories(user);
  const { costCenters } = useCostCenters(user);

  // Filter transactions for this project
  const projectTransactions = useMemo(() => {
    return transactions.filter(t => t.project.split(' ')[0] === projectName);
  }, [transactions, projectName]);

  const incomeTransactions = projectTransactions.filter(t => t.type === 'income');
  const expenseTransactions = projectTransactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((s, t) => s + t.amount, 0);
  const margin = totalIncome - totalExpenses;
  const roi = totalIncome > 0 ? ((margin / totalIncome) * 100) : 0;

  // Monthly trend for this project
  const monthlyTrend = useMemo(() => {
    const data = {};
    projectTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!data[month]) data[month] = { month, ingresos: 0, gastos: 0 };
      if (t.type === 'income') data[month].ingresos += t.amount;
      else data[month].gastos += t.amount;
    });
    return Object.values(data).sort((a, b) => a.month.localeCompare(b.month));
  }, [projectTransactions]);

  // Expense category distribution
  const categoryDistribution = useMemo(() => {
    const data = {};
    expenseTransactions.forEach(t => {
      if (!data[t.category]) data[t.category] = 0;
      data[t.category] += t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenseTransactions]);

  // Monthly margin evolution
  const marginEvolution = useMemo(() => {
    const data = {};
    projectTransactions.forEach(t => {
      const month = t.date.substring(0, 7);
      if (!data[month]) data[month] = { month, ingresos: 0, gastos: 0 };
      if (t.type === 'income') data[month].ingresos += t.amount;
      else data[month].gastos += t.amount;
    });
    return Object.values(data)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({ ...d, margen: d.ingresos - d.gastos }));
  }, [projectTransactions]);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, formData, editingTransaction.notes);
    }
    setIsFormModalOpen(false);
    setEditingTransaction(null);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1c1c1e] p-3 rounded-lg shadow-lg border border-[rgba(255,255,255,0.08)] text-sm">
          <p className="font-medium text-[#c7c7cc] mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)} €
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const currentTransactions = activeTab === 'income' ? incomeTransactions : expenseTransactions;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] p-5">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={onClose}
            className="p-2 text-[#636366] hover:text-[#c7c7cc] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[#e5e5ea]">{projectName}</h2>
            <p className="text-sm text-[#636366]">{projectTransactions.length} transacciones</p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[rgba(16,185,129,0.08)] rounded-lg p-3 border border-[rgba(16,185,129,0.2)]">
            <p className="text-xs text-[#30d158] font-medium">Ingresos</p>
            <p className="text-lg font-bold text-[#30d158]">{formatCurrency(totalIncome)} €</p>
          </div>
          <div className="bg-[rgba(239,68,68,0.08)] rounded-lg p-3 border border-[rgba(239,68,68,0.2)]">
            <p className="text-xs text-[#ff453a] font-medium">Gastos</p>
            <p className="text-lg font-bold text-[#ff453a]">{formatCurrency(totalExpenses)} €</p>
          </div>
          <div className={`rounded-lg p-3 border ${margin >= 0 ? 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.2)]' : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)]'}`}>
            <p className={`text-xs font-medium ${margin >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>Margen</p>
            <p className={`text-lg font-bold ${margin >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
              {margin >= 0 ? '+' : ''}{formatCurrency(margin)} €
            </p>
          </div>
          <div className={`rounded-lg p-3 border ${roi >= 0 ? 'bg-[#111111] border-[rgba(255,255,255,0.08)]' : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)]'}`}>
            <p className={`text-xs font-medium ${roi >= 0 ? 'text-[#98989d]' : 'text-[#ff453a]'}`}>ROI</p>
            <p className={`text-lg font-bold ${roi >= 0 ? 'text-[#c7c7cc]' : 'text-[#ff453a]'}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend */}
        <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Tendencia mensual</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="ingresos" stroke="#30d158" strokeWidth={2} dot={{ fill: '#30d158', r: 3 }} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke="#ff453a" strokeWidth={2} dot={{ fill: '#ff453a', r: 3 }} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Distribution */}
        <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)]">
          <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Distribución de gastos</h4>
          <div className="h-56">
            {categoryDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryDistribution.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `${formatCurrency(v)} €`} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#636366] text-sm">Sin gastos registrados</div>
            )}
          </div>
        </div>

        {/* Margin Evolution */}
        <div className="bg-[#1c1c1e] p-5 rounded-xl border border-[rgba(255,255,255,0.08)] lg:col-span-2">
          <h4 className="text-sm font-semibold text-[#c7c7cc] mb-4">Evolución del margen mensual</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginEvolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="margen" name="Margen" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {marginEvolution.map((entry, i) => (
                    <Cell key={i} fill={entry.margen >= 0 ? '#30d158' : '#ff453a'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction Tabs */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
        <div className="flex border-b border-[rgba(255,255,255,0.08)]">
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'income'
                ? 'text-[#30d158] border-b-2 border-emerald-500 bg-[rgba(16,185,129,0.08)]/50'
                : 'text-[#8e8e93] hover:text-[#c7c7cc] hover:bg-[#111111]'
            }`}
          >
            <ArrowUpCircle size={16} />
            Ingresos ({incomeTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'expense'
                ? 'text-[#ff453a] border-b-2 border-rose-500 bg-[rgba(239,68,68,0.08)]/50'
                : 'text-[#8e8e93] hover:text-[#c7c7cc] hover:bg-[#111111]'
            }`}
          >
            <ArrowDownCircle size={16} />
            Gastos ({expenseTransactions.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#111111]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8e8e93]">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8e8e93]">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#8e8e93] hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#8e8e93]">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#8e8e93]">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#8e8e93]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(t => (
                <tr key={t.id} className="border-b border-[rgba(255,255,255,0.08)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                  <td className="px-4 py-3 text-[#98989d]">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#c7c7cc]">{String(t.description || '')}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      t.type === 'income'
                        ? 'bg-[rgba(16,185,129,0.08)] text-[#30d158] border border-[rgba(16,185,129,0.2)]'
                        : 'bg-[rgba(239,68,68,0.08)] text-[#ff453a] border border-[rgba(239,68,68,0.2)]'
                    }`}>
                      {String(t.category || '')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    t.type === 'income' ? 'text-[#30d158]' : 'text-[#ff453a]'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)} €
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      t.status === 'paid'
                        ? 'bg-[rgba(16,185,129,0.12)] text-[#30d158] border-[rgba(16,185,129,0.25)]'
                        : 'bg-[rgba(245,158,11,0.12)] text-[#ff9f0a] border-[rgba(245,158,11,0.25)]'
                    }`}>
                      {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {t.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(t)}
                      className="p-1.5 text-[#636366] hover:text-[#0a84ff] hover:bg-[rgba(59,130,246,0.08)] rounded-lg transition-all opacity-60 group-hover:opacity-100"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-[#636366] text-sm">
                    No hay {activeTab === 'income' ? 'ingresos' : 'gastos'} en este proyecto
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <TransactionFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingTransaction(null); }}
        onSubmit={handleFormSubmit}
        editingTransaction={editingTransaction}
        user={user}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        costCenters={costCenters}
      />
    </div>
  );
};

export default ProjectDetail;
