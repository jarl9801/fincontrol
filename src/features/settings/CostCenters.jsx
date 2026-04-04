import React, { useState } from 'react';
import {
 TrendingDown, TrendingUp, TrendingUpDown, Edit2, Trash2, Plus, Package,
 Loader2, Calendar, ChevronDown, ChevronUp, BarChart3
} from 'lucide-react';
import { useCostCenters } from '../../hooks/useCostCenters';
import { useTransactions } from '../../hooks/useTransactions';
import { COST_CENTERS as PREDEFINED_COST_CENTERS } from '../../constants/costCenters';
import { formatCurrency } from '../../utils/formatters';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_FULL_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CostCenters = ({ user }) => {
 const { costCenters: allCenters, loading, createCostCenter, updateCostCenter, deleteCostCenter } = useCostCenters(user);
 const { transactions } = useTransactions(user);
 const [showNewModal, setShowNewModal] = useState(false);
 const [editingCenter, setEditingCenter] = useState(null);
 const [expandedCenter, setExpandedCenter] = useState(null);
 const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
 const [newCenter, setNewCenter] = useState({
 name: '',
 type: 'Costos',
 budget: 0,
 responsible: ''
 });

 const costCenters = allCenters.filter(c => c.type === 'Costos');
 const incomeCenters = allCenters.filter(c => c.type === 'Ingresos');

 // Calculate monthly spending for each cost center
 const calculateMonthlyData = (centerName) => {
 const monthlyData = MONTH_NAMES.map((month, index) => ({
 month,
 monthIndex: index,
 executed: 0,
 budget: 0
 }));

 // Get transactions for this cost center
 const centerTransactions = transactions?.filter(t =>
 t.costCenter === centerName &&
 t.status === 'paid' &&
 new Date(t.date).getFullYear() === selectedYear
 ) || [];

 // Group by month
 centerTransactions.forEach(t => {
 const monthIndex = new Date(t.date).getMonth();
 if (t.type === 'expense') {
 monthlyData[monthIndex].executed += t.amount;
 }
 });

 return monthlyData;
 };

 // Calculate total YTD for a cost center
 const calculateYTD = (centerName) => {
 const currentMonth = new Date().getMonth();
 const monthlyData = calculateMonthlyData(centerName);
 return monthlyData.slice(0, currentMonth + 1).reduce((sum, m) => sum + m.executed, 0);
 };

 const handleAddCenter = async () => {
 if (!newCenter.name.trim()) return;

 const centerData = {
 code: generateCode(),
 name: newCenter.name.trim(),
 type: newCenter.type,
 budget: parseFloat(newCenter.budget) || 0,
 responsible: newCenter.responsible.trim() || 'Por Asignar'
 };

 const result = await createCostCenter(centerData);
 if (result.success) {
 setNewCenter({ name: '', type: 'Costos', budget: 0, responsible: '' });
 setShowNewModal(false);
 }
 };

 const handleUpdateCenter = async () => {
 if (!editingCenter || !newCenter.name.trim()) return;

 const result = await updateCostCenter(editingCenter.id, {
 name: newCenter.name.trim(),
 type: newCenter.type,
 budget: parseFloat(newCenter.budget) || 0,
 responsible: newCenter.responsible.trim() || 'Por Asignar'
 });
 if (result.success) {
 setEditingCenter(null);
 setNewCenter({ name: '', type: 'Costos', budget: 0, responsible: '' });
 setShowNewModal(false);
 }
 };

 const handleEdit = (center) => {
 setEditingCenter(center);
 setNewCenter({
 name: center.name,
 type: center.type,
 budget: center.budget,
 responsible: center.responsible
 });
 setShowNewModal(true);
 };

 const handleDelete = async (id) => {
 await deleteCostCenter(id);
 };

 const handleLoadPredefined = async () => {
 for (const center of PREDEFINED_COST_CENTERS) {
 const exists = allCenters.some(c => c.code === center.id);
 if (!exists) {
 await createCostCenter({
 code: center.id,
 name: center.name,
 type: center.type,
 budget: center.budget,
 responsible: center.responsible
 });
 }
 }
 };

 const generateCode = () => {
 const allCodes = allCenters.map(c => c.code).filter(Boolean);
 const maxNum = allCodes.reduce((max, code) => {
 const num = parseInt(code.replace('CC-', ''));
 return num > max ? num : max;
 }, 0);
 return `CC-${String(maxNum + 1).padStart(3, '0')}`;
 };

 const getUtilization = (executed, budget) => {
 if (budget === 0) return 0;
 return (executed / budget) * 100;
 };

 const getProgressColor = (percent) => {
 if (percent > 100) return 'bg-transparent';
 if (percent > 80) return 'bg-transparent';
 return 'bg-transparent';
 };

 const getProgressBgColor = (percent) => {
 if (percent > 100) return 'bg-transparent';
 if (percent > 80) return 'bg-transparent';
 return 'bg-transparent';
 };

 // Monthly Budget View Component
 const MonthlyBudgetView = ({ center }) => {
 const monthlyBudget = center.budget / 12;
 const monthlyData = calculateMonthlyData(center.name);
 const currentMonth = new Date().getMonth();
 const ytdBudget = monthlyBudget * (currentMonth + 1);
 const ytdExecuted = monthlyData.slice(0, currentMonth + 1).reduce((sum, m) => sum + m.executed, 0);
 const ytdPercent = ytdBudget > 0 ? (ytdExecuted / ytdBudget * 100) : 0;

 return (
 <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 animate-fadeIn ">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <Calendar className="text-[var(--text-secondary)]" size={18} />
 <select
 value={selectedYear}
 onChange={(e) => setSelectedYear(parseInt(e.target.value))}
 className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)] outline-none"
 >
 {[2024, 2025, 2026].map(year => (
 <option key={year} value={year}>{year}</option>
 ))}
 </select>
 </div>
 <div className="flex items-center gap-4 text-sm">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
 <span className="text-[var(--text-secondary)]">Ppto. mensual: </span>
 <span className="font-bold text-[var(--text-primary)]">{formatCurrency(monthlyBudget)}</span>
 </div>
 <div className={`rounded-xl px-3 py-2 ${getProgressBgColor(ytdPercent)}`}>
 <span className="text-[var(--text-secondary)]">YTD: </span>
 <span className={`font-bold ${ytdPercent > 100 ? 'text-[var(--accent)]' : ytdPercent > 80 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
 {formatCurrency(ytdExecuted)} / {formatCurrency(ytdBudget)}
 </span>
 <span className={`ml-2 text-xs font-medium ${ytdPercent > 100 ? 'text-[var(--accent)]' : ytdPercent > 80 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
 ({ytdPercent.toFixed(0)}%)
 </span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-12 gap-2">
 {monthlyData.map((data, index) => {
 const percent = monthlyBudget > 0 ? (data.executed / monthlyBudget * 100) : 0;
 const isCurrentMonth = index === currentMonth && selectedYear === new Date().getFullYear();
 const isFutureMonth = (index > currentMonth && selectedYear === new Date().getFullYear()) || selectedYear > new Date().getFullYear();

 return (
 <div
 key={index}
 className={`relative rounded-xl p-2 transition-all ${
 isCurrentMonth ? 'ring-2 ring-[var(--text-primary)] bg-transparent' :
 isFutureMonth ? 'bg-[var(--surface)] opacity-70' :
 'border border-[var(--border)] bg-[var(--surface)]'
 }`}
 >
 <div className="text-center mb-2">
 <p className={`text-xs font-bold ${isCurrentMonth ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
 {data.month}
 </p>
 </div>

 <div className="relative h-16 w-full overflow-hidden rounded-lg bg-[var(--surface)]">
 <div
 className={`absolute bottom-0 left-0 right-0 transition-all ${getProgressColor(percent)}`}
 style={{ height: `${Math.min(percent, 100)}%` }}
 />
 {percent > 100 && (
 <div
 className="absolute bottom-0 left-0 right-0 bg-[var(--accent)] opacity-50"
 style={{ height: `${Math.min(percent - 100, 100)}%`, bottom: '100%' }}
 />
 )}
 </div>

 <div className="mt-2 text-center">
 <p className={`text-xs font-bold ${
 percent > 100 ? 'text-[var(--accent)]' :
 percent > 80 ? 'text-[var(--warning)]' :
 percent > 0 ? 'text-[var(--success)]' :
 'text-[var(--text-secondary)]'
 }`}>
 {percent > 0 ? `${percent.toFixed(0)}%` : '-'}
 </p>
 <p className="truncate text-[10px] text-[var(--text-secondary)]">
 {data.executed > 0 ? formatCurrency(data.executed).replace('€', '') : '-'}
 </p>
 </div>
 </div>
 );
 })}
 </div>

 <div className="flex items-center justify-center gap-6 mt-4 text-xs">
 <div className="flex items-center gap-2">
 <div className="h-3 w-3 rounded bg-[var(--success)]" />
 <span className="text-[var(--text-secondary)]">&lt;80% utilizado</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="h-3 w-3 rounded bg-[var(--warning)]" />
 <span className="text-[var(--text-secondary)]">80-100% utilizado</span>
 </div>
 <div className="flex items-center gap-2">
 <div className="h-3 w-3 rounded bg-[var(--accent)]" />
 <span className="text-[var(--text-secondary)]">&gt;100% sobrepasado</span>
 </div>
 </div>
 </div>
 );
 };

 const CostCenterRow = ({ center, onDelete, onEdit }) => {
 const ytdExecuted = calculateYTD(center.name);
 const currentMonth = new Date().getMonth();
 const ytdBudget = (center.budget / 12) * (currentMonth + 1);
 const utilization = getUtilization(ytdExecuted, ytdBudget);
 const isExpanded = expandedCenter === center.id;

 return (
 <>
 <tr className={`border-b border-[var(--surface)] transition-colors hover:bg-[var(--surface)] ${isExpanded ? 'bg-[var(--surface)]' : ''}`}>
 <td className="px-4 py-4 text-sm font-medium text-[var(--text-secondary)]">{center.code}</td>
 <td className="px-4 py-4 text-sm font-medium text-[var(--text-primary)]">{center.name}</td>
 <td className="px-4 py-4">
 <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
 center.type === 'Costos' ? 'bg-transparent text-[var(--accent)]' : 'bg-transparent text-[var(--success)]'
 }`}>
 {center.type}
 </span>
 </td>
 <td className="px-4 py-4 text-sm text-[var(--text-disabled)]">{formatCurrency(center.budget)}</td>
 <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">{formatCurrency(center.budget / 12)}/mes</td>
 <td className={`px-4 py-4 text-sm font-medium ${center.type === 'Ingresos' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>{formatCurrency(ytdExecuted)}</td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-2">
 <div className="h-2.5 w-20 overflow-hidden rounded-full bg-[var(--surface)]">
 <div
 className={`h-full rounded-full transition-all ${getProgressColor(utilization)}`}
 style={{ width: `${Math.min(utilization, 100)}%` }}
 />
 </div>
 <span className={`text-xs font-bold ${
 utilization > 100 ? 'text-[var(--accent)]' :
 utilization > 80 ? 'text-[var(--warning)]' :
 'text-[var(--success)]'
 }`}>
 {utilization.toFixed(0)}%
 </span>
 </div>
 </td>
 <td className="px-4 py-4 text-sm text-[var(--text-disabled)]">{center.responsible}</td>
 <td className="px-4 py-4">
 <div className="flex items-center gap-1">
 <button
 onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
 className={`p-1.5 rounded transition-colors ${
 isExpanded ? 'bg-transparent text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-primary)]'
 }`}
 title="Ver detalle mensual"
 >
 {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
 </button>
 <button
 onClick={() => onEdit(center)}
 className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-transparent hover:text-[var(--text-primary)]"
 >
 <Edit2 size={14} />
 </button>
 <button
 onClick={() => onDelete(center.id)}
 className="rounded p-1.5 text-[var(--text-secondary)] transition-colors hover:bg-transparent hover:text-[var(--accent)]"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </td>
 </tr>
 {isExpanded && (
 <tr>
 <td colSpan="9" className="px-4 pb-4">
 <MonthlyBudgetView center={center} />
 </td>
 </tr>
 )}
 </>
 );
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center py-12">
 <Loader2 className="w-8 h-8 text-[var(--interactive)] animate-spin" />
 <span className="ml-3 text-[var(--text-secondary)]">Preparando centros de costo...</span>
 </div>
 );
 }

 // Calculate totals for summary
 const totalBudget = costCenters.reduce((sum, c) => sum + (c.budget || 0), 0);
 const totalExecuted = costCenters.reduce((sum, c) => sum + calculateYTD(c.name), 0);
 const currentMonth = new Date().getMonth();
 const ytdBudget = (totalBudget / 12) * (currentMonth + 1);
 const overallUtilization = ytdBudget > 0 ? (totalExecuted / ytdBudget * 100) : 0;

 return (
 <div className="space-y-6">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 ">
 <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-primary)]">Presupuesto operativo</p>
 <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Centros de costo</h2>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">Organiza responsables, presupuesto anual y seguimiento mensual desde una sola mesa.</p>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3 mb-3">
 <div className="rounded-lg bg-transparent p-2">
 <TrendingDown className="text-[var(--accent)]" size={20} />
 </div>
 <h3 className="font-semibold text-[var(--text-primary)]">Centros de costos</h3>
 </div>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--accent)]">{costCenters.length}</p>
 <p className="text-xs text-[var(--text-secondary)]">activos</p>
 </div>

 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3 mb-3">
 <div className="rounded-lg bg-transparent p-2">
 <BarChart3 className="text-[var(--text-primary)]" size={20} />
 </div>
 <h3 className="font-semibold text-[var(--text-primary)]">Presupuesto anual</h3>
 </div>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{formatCurrency(totalBudget)}</p>
 <p className="text-xs text-[var(--text-secondary)]">{formatCurrency(totalBudget / 12)}/mes</p>
 </div>

 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3 mb-3">
 <div className="rounded-lg bg-transparent p-2">
 <TrendingUpDown className="text-[var(--warning)]" size={20} />
 </div>
 <h3 className="font-semibold text-[var(--text-primary)]">Ejecutado YTD</h3>
 </div>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--warning)]">{formatCurrency(totalExecuted)}</p>
 <p className="text-xs text-[var(--text-secondary)]">de {formatCurrency(ytdBudget)} presupuestado</p>
 </div>

 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="mb-3 flex items-center gap-3">
 <div className={`rounded-lg p-2 ${getProgressBgColor(overallUtilization)}`}>
 <Calendar className={`${overallUtilization > 100 ? 'text-[var(--accent)]' : overallUtilization > 80 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`} size={20} />
 </div>
 <h3 className="font-semibold text-[var(--text-primary)]">
 Utilización YTD
 </h3>
 </div>
 <p className={`text-[28px] font-semibold tracking-[-0.03em] ${overallUtilization > 100 ? 'text-[var(--accent)]' : overallUtilization > 80 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
 {overallUtilization.toFixed(1)}%
 </p>
 <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
 <div
 className={`h-full rounded-full ${getProgressColor(overallUtilization)}`}
 style={{ width: `${Math.min(overallUtilization, 100)}%` }}
 />
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3">
 <button
 onClick={handleLoadPredefined}
 className="inline-flex items-center gap-2 rounded-lg bg-[var(--success)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--success)]"
 >
 <Package size={18} /> Generar Predefinidos
 </button>
 <button
 onClick={() => {
 setEditingCenter(null);
 setNewCenter({ name: '', type: 'Costos', budget: 0, responsible: '' });
 setShowNewModal(true);
 }}
 className="inline-flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--black)] transition hover:opacity-85"
 >
 <Plus size={18} /> Nuevo Centro
 </button>
 </div>

 <div className="rounded-xl border border-[var(--border-visible)] bg-transparent p-6 ">
 <div className="flex items-center gap-3 mb-4">
 <div className="rounded-lg bg-transparent p-2">
 <TrendingDown className="text-[var(--accent)]" size={20} />
 </div>
 <div>
 <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Centros de costos</h3>
 <p className="text-sm text-[var(--text-secondary)]">Abre cada fila para revisar el detalle mensual.</p>
 </div>
 </div>

 <div className="overflow-hidden rounded-xl border border-[var(--border-visible)] bg-[var(--surface)]">
 <table className="w-full text-left">
 <thead className="border-b border-[var(--border-visible)] bg-transparent">
 <tr>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Código</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Nombre</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Tipo</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Ppto. anual</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Ppto. mensual</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Ejecutado YTD</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Utilización</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Responsable</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Acciones</th>
 </tr>
 </thead>
 <tbody>
 {costCenters.map(center => (
 <CostCenterRow key={center.id} center={center} onDelete={handleDelete} onEdit={handleEdit} />
 ))}
 {costCenters.length === 0 && (
 <tr>
 <td colSpan="9" className="px-4 py-8 text-center text-[var(--text-secondary)]">
 No hay centros de costo definidos
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {incomeCenters.length > 0 && (
 <div className="rounded-xl border border-[var(--border-visible)] bg-transparent p-6 ">
 <div className="flex items-center gap-3 mb-4">
 <div className="rounded-lg bg-transparent p-2">
 <TrendingUp className="text-[var(--success)]" size={20} />
 </div>
 <div>
 <h3 className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Centros de ingresos</h3>
 <p className="text-sm text-[var(--success)]">Usa esta mesa para metas y seguimiento comercial.</p>
 </div>
 </div>

 <div className="overflow-hidden rounded-xl border border-[#d7ebe2] bg-[var(--surface)]">
 <table className="w-full text-left">
 <thead className="border-b border-[var(--border-visible)] bg-transparent">
 <tr>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Código</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Nombre</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Tipo</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Objetivo anual</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Objetivo mensual</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Logrado YTD</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Cumplimiento</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Responsable</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--success)]">Acciones</th>
 </tr>
 </thead>
 <tbody>
 {incomeCenters.map(center => (
 <CostCenterRow key={center.id} center={center} onDelete={handleDelete} onEdit={handleEdit} />
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {showNewModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
 <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-scaleIn">
 <div className="border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4">
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">Centro presupuestario</p>
 <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
 {editingCenter ? 'Editar centro' : 'Nuevo centro'}
 </h3>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Nombre</label>
 <input
 type="text"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={newCenter.name}
 onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
 placeholder="Nombre del centro"
 />
 </div>
 <div>
 <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Tipo</label>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={newCenter.type}
 onChange={(e) => setNewCenter({ ...newCenter, type: e.target.value })}
 >
 <option value="Costos">Centro de Costos (Gastos)</option>
 <option value="Ingresos">Centro de Ingresos (Ventas)</option>
 </select>
 </div>
 <div>
 <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
 Presupuesto anual
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">€</span>
 <input
 type="number"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-2.5 pl-8 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={newCenter.budget}
 onChange={(e) => setNewCenter({ ...newCenter, budget: e.target.value })}
 placeholder="0.00"
 />
 </div>
 {newCenter.budget > 0 && (
 <p className="mt-1 text-xs text-[var(--text-secondary)]">
 = {formatCurrency(newCenter.budget / 12)} por mes
 </p>
 )}
 </div>
 <div>
 <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Responsable</label>
 <input
 type="text"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={newCenter.responsible}
 onChange={(e) => setNewCenter({ ...newCenter, responsible: e.target.value })}
 placeholder="Nombre del responsable"
 />
 </div>
 </div>
 <div className="flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4">
 <button
 onClick={() => {
 setShowNewModal(false);
 setEditingCenter(null);
 }}
 className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-transparent"
 >
 Cancelar
 </button>
 <button
 onClick={editingCenter ? handleUpdateCenter : handleAddCenter}
 className="rounded-lg bg-[var(--text-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--black)] transition hover:opacity-85"
 >
 {editingCenter ? 'Guardar cambios' : 'Crear centro'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default CostCenters;
