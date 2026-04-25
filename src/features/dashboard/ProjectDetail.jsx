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

const CHART_COLORS = ['var(--text-disabled)', 'var(--text-secondary)', 'var(--border-visible)', 'var(--text-primary)', 'var(--text-tertiary)', 'var(--border)', 'var(--success)', 'var(--accent)'];

const ProjectChartTooltip = ({ active, payload, label }) => {
 if (active && payload && payload.length) {
 return (
 <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm ">
 <p className="mb-1 font-medium text-[var(--text-primary)]">{label}</p>
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
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-4 mb-5">
 <button
 onClick={onClose}
 className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
 >
 <ArrowLeft size={20} />
 </button>
 <div className="flex-1">
 <h2 className="text-xl font-medium tracking-[-0.03em] text-[var(--text-primary)]">{projectName}</h2>
 <p className="text-sm text-[var(--text-secondary)]">{projectTransactions.length} transacciones</p>
 </div>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <div className="rounded-lg border border-[var(--border-visible)] bg-transparent p-3">
 <p className="text-xs font-medium text-[var(--success)]">Ingresos</p>
 <p className="text-lg font-medium text-[var(--success)]">{formatCurrency(totalIncome)} €</p>
 </div>
 <div className="rounded-lg border border-[var(--border-visible)] bg-transparent p-3">
 <p className="text-xs font-medium text-[var(--accent)]">Gastos</p>
 <p className="text-lg font-medium text-[var(--accent)]">{formatCurrency(totalExpenses)} €</p>
 </div>
 <div className={`rounded-lg border p-3 ${margin >= 0 ? 'border-[var(--border-visible)] bg-transparent' : 'border-[var(--border-visible)] bg-transparent'}`}>
 <p className={`text-xs font-medium ${margin >= 0 ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>Margen</p>
 <p className={`text-lg font-medium ${margin >= 0 ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 {margin >= 0 ? '+' : ''}{formatCurrency(margin)} €
 </p>
 </div>
 <div className={`rounded-lg border p-3 ${roi >= 0 ? 'border-[var(--border)] bg-[var(--surface)]' : 'border-[var(--border-visible)] bg-transparent'}`}>
 <p className={`text-xs font-medium ${roi >= 0 ? 'text-[var(--text-secondary)]' : 'text-[var(--accent)]'}`}>ROI</p>
 <p className={`text-lg font-medium ${roi >= 0 ? 'text-[var(--text-primary)]' : 'text-[var(--accent)]'}`}>
 {roi.toFixed(1)}%
 </p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <h4 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Tendencia mensual</h4>
 <div className="h-56">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={monthlyTrend}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.22)" />
 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
 <Tooltip content={<ProjectChartTooltip />} />
 <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
 <Line type="monotone" dataKey="ingresos" stroke="var(--success)" strokeWidth={2} dot={{ fill: 'var(--success)', r: 3 }} name="Ingresos" />
 <Line type="monotone" dataKey="gastos" stroke="var(--accent)" strokeWidth={2} dot={{ fill: 'var(--accent)', r: 3 }} name="Gastos" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <h4 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Distribución de gastos</h4>
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
 <Tooltip formatter={v => `${formatCurrency(v)} €`} contentStyle={{ borderRadius: '16px', border: '1px solid var(--border)', backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)' }} />
 <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} />
 </PieChart>
 </ResponsiveContainer>
 ) : (
 <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">Sin gastos registrados</div>
 )}
 </div>
 </div>

 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 lg:col-span-2">
 <h4 className="mb-4 text-sm font-medium text-[var(--text-primary)]">Evolución del margen mensual</h4>
 <div className="h-56">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={marginEvolution}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.22)" />
 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
 <Tooltip content={<ProjectChartTooltip />} />
 <Bar dataKey="margen" name="Margen" radius={0} maxBarSize={40}>
 {marginEvolution.map((entry, i) => (
 <Cell key={i} fill={entry.margen >= 0 ? 'var(--success)' : 'var(--accent)'} fillOpacity={0.85} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] ">
 <div className="flex border-b border-[var(--border)]">
 <button
 onClick={() => setActiveTab('income')}
 className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
 activeTab === 'income'
 ? 'border-b-2 border-[var(--success)] bg-transparent text-[var(--success)]'
 : 'text-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-disabled)]'
 }`}
 >
 <ArrowUpCircle size={16} />
 Ingresos ({incomeTransactions.length})
 </button>
 <button
 onClick={() => setActiveTab('expense')}
 className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
 activeTab === 'expense'
 ? 'border-b-2 border-[var(--accent)] bg-transparent text-[var(--accent)]'
 : 'text-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-disabled)]'
 }`}
 >
 <ArrowDownCircle size={16} />
 Gastos ({expenseTransactions.length})
 </button>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
 <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">Fecha</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)]">Descripción</th>
 <th className="hidden px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] md:table-cell">Categoría</th>
 <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-secondary)]">Monto</th>
 <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-secondary)]">Estado</th>
 <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-secondary)]">Acciones</th>
 </tr>
 </thead>
 <tbody>
 {currentTransactions
 .sort((a, b) => b.date.localeCompare(a.date))
 .map(t => (
 <tr key={t.id} className="group border-b border-[var(--surface)] last:border-0 transition-colors hover:bg-[var(--surface)]">
 <td className="px-4 py-3 text-[var(--text-secondary)]">{formatDate(t.date)}</td>
 <td className="px-4 py-3">
 <span className="font-medium text-[var(--text-primary)]">{String(t.description || '')}</span>
 </td>
 <td className="px-4 py-3 hidden md:table-cell">
 <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
 t.type === 'income'
 ? 'border border-[var(--border-visible)] bg-transparent text-[var(--success)]'
 : 'border border-[var(--border-visible)] bg-transparent text-[var(--accent)]'
 }`}>
 {String(t.category || '')}
 </span>
 </td>
 <td className={`px-4 py-3 text-right font-medium ${
 t.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--accent)]'
 }`}>
 {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)} €
 </td>
 <td className="px-4 py-3 text-center">
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
 t.status === 'paid'
 ? 'border-[var(--border-visible)] bg-transparent text-[var(--success)]'
 : 'border-[var(--border-visible)] bg-transparent text-[var(--warning)]'
 }`}>
 {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Circle size={12} />}
 {t.status === 'paid' ? 'Pagado' : 'Pendiente'}
 </span>
 </td>
 <td className="px-4 py-3 text-center">
 <button
 onClick={() => handleEdit(t)}
 className="rounded-lg p-1.5 text-[var(--text-secondary)] opacity-60 transition-all hover:bg-transparent hover:text-[var(--text-primary)] group-hover:opacity-100"
 title="Editar"
 >
 <Edit2 size={15} />
 </button>
 </td>
 </tr>
 ))}
 {currentTransactions.length === 0 && (
 <tr>
 <td colSpan="6" className="py-10 text-center text-sm text-[var(--text-secondary)]">
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
