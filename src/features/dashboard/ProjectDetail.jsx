import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, ArrowUpCircle, ArrowDownCircle,
  Edit2, CheckCircle2, Circle
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

const ProjectChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-[#dce6f8] bg-white/96 p-3 text-sm shadow-[0_16px_40px_rgba(134,153,186,0.16)]">
        <p className="mb-1 font-medium text-[#1f2a44]">{label}</p>
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

const ProjectDetail = ({ projectName, transactions, user, onClose }) => {
  const [activeTab, setActiveTab] = useState('income');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  const { updateTransaction } = useTransactionActions(user);
  const { expenseCategories, incomeCategories } = useCategories(user);
  const { costCenters } = useCostCenters(user);

  // Filter transactions for this project
  const projectTransactions = useMemo(() => {
    return transactions.filter(t => (t.project || '').split(' ')[0] === projectName);
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
    projectTransactions.forEach(t => {
      if (t.type !== 'expense') return;
      if (!data[t.category]) data[t.category] = 0;
      data[t.category] += t.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [projectTransactions]);

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

  const currentTransactions = activeTab === 'income' ? incomeTransactions : expenseTransactions;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-[28px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-[#7a879d] transition hover:bg-[rgba(94,115,159,0.08)] hover:text-[#5f6f8d]"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1f2a44]">{projectName}</h2>
            <p className="text-sm text-[#6b7a99]">{projectTransactions.length} transacciones</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[rgba(15,159,110,0.16)] bg-[rgba(244,252,248,0.94)] p-3">
            <p className="text-xs font-medium text-[#0f9f6e]">Ingresos</p>
            <p className="text-lg font-semibold text-[#0f9f6e]">{formatCurrency(totalIncome)} €</p>
          </div>
          <div className="rounded-2xl border border-[rgba(208,76,54,0.16)] bg-[rgba(255,244,241,0.92)] p-3">
            <p className="text-xs font-medium text-[#d04c36]">Gastos</p>
            <p className="text-lg font-semibold text-[#d04c36]">{formatCurrency(totalExpenses)} €</p>
          </div>
          <div className={`rounded-2xl border p-3 ${margin >= 0 ? 'border-[rgba(15,159,110,0.16)] bg-[rgba(244,252,248,0.94)]' : 'border-[rgba(208,76,54,0.16)] bg-[rgba(255,244,241,0.92)]'}`}>
            <p className={`text-xs font-medium ${margin >= 0 ? 'text-[#0f9f6e]' : 'text-[#d04c36]'}`}>Margen</p>
            <p className={`text-lg font-semibold ${margin >= 0 ? 'text-[#0f9f6e]' : 'text-[#d04c36]'}`}>
              {margin >= 0 ? '+' : ''}{formatCurrency(margin)} €
            </p>
          </div>
          <div className={`rounded-2xl border p-3 ${roi >= 0 ? 'border-[#dce6f8] bg-[rgba(246,249,255,0.92)]' : 'border-[rgba(208,76,54,0.16)] bg-[rgba(255,244,241,0.92)]'}`}>
            <p className={`text-xs font-medium ${roi >= 0 ? 'text-[#6b7a99]' : 'text-[#d04c36]'}`}>ROI</p>
            <p className={`text-lg font-semibold ${roi >= 0 ? 'text-[#1f2a44]' : 'text-[#d04c36]'}`}>
              {roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <h4 className="mb-4 text-sm font-semibold text-[#1f2a44]">Tendencia mensual</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#70819f', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#70819f', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ProjectChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="ingresos" stroke="#0f9f6e" strokeWidth={2} dot={{ fill: '#0f9f6e', r: 3 }} name="Ingresos" />
                <Line type="monotone" dataKey="gastos" stroke="#d04c36" strokeWidth={2} dot={{ fill: '#d04c36', r: 3 }} name="Gastos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <h4 className="mb-4 text-sm font-semibold text-[#1f2a44]">Distribución de gastos</h4>
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
                  <Tooltip formatter={v => `${formatCurrency(v)} €`} contentStyle={{ borderRadius: '16px', border: '1px solid #dce6f8', backgroundColor: 'rgba(255,255,255,0.96)' }} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#6b7a99]">Sin gastos registrados</div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)] lg:col-span-2">
          <h4 className="mb-4 text-sm font-semibold text-[#1f2a44]">Evolución del margen mensual</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marginEvolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#70819f', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#70819f', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ProjectChartTooltip />} />
                <Bar dataKey="margen" name="Margen" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {marginEvolution.map((entry, i) => (
                    <Cell key={i} fill={entry.margen >= 0 ? '#0f9f6e' : '#d04c36'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#dce6f8] bg-white/88 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex border-b border-[#e2ebfb]">
          <button
            onClick={() => setActiveTab('income')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'income'
                ? 'border-b-2 border-[#0f9f6e] bg-[rgba(15,159,110,0.08)] text-[#0f9f6e]'
                : 'text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)] hover:text-[#5f6f8d]'
            }`}
          >
            <ArrowUpCircle size={16} />
            Ingresos ({incomeTransactions.length})
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
              activeTab === 'expense'
                ? 'border-b-2 border-[#d04c36] bg-[rgba(208,76,54,0.08)] text-[#d04c36]'
                : 'text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)] hover:text-[#5f6f8d]'
            }`}
          >
            <ArrowDownCircle size={16} />
            Gastos ({expenseTransactions.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#70819f]">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#70819f]">Descripción</th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium text-[#70819f] md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#70819f]">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#70819f]">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#70819f]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentTransactions
                .sort((a, b) => b.date.localeCompare(a.date))
                .map(t => (
                <tr key={t.id} className="group border-b border-[#eef2fb] last:border-0 transition-colors hover:bg-[rgba(241,246,255,0.8)]">
                  <td className="px-4 py-3 text-[#6b7a99]">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#1f2a44]">{String(t.description || '')}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      t.type === 'income'
                        ? 'border border-[rgba(15,159,110,0.2)] bg-[rgba(15,159,110,0.08)] text-[#0f9f6e]'
                        : 'border border-[rgba(208,76,54,0.2)] bg-[rgba(208,76,54,0.08)] text-[#d04c36]'
                    }`}>
                      {String(t.category || '')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${
                    t.type === 'income' ? 'text-[#0f9f6e]' : 'text-[#d04c36]'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)} €
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                      t.status === 'paid'
                        ? 'border-[rgba(15,159,110,0.25)] bg-[rgba(15,159,110,0.12)] text-[#0f9f6e]'
                        : 'border-[rgba(214,149,44,0.25)] bg-[rgba(214,149,44,0.12)] text-[#c98717]'
                    }`}>
                      {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {t.status === 'paid' ? 'Pagado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleEdit(t)}
                      className="rounded-lg p-1.5 text-[#7a879d] opacity-60 transition-all hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb] group-hover:opacity-100"
                      title="Editar"
                    >
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-sm text-[#6b7a99]">
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
