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
    if (percent > 100) return 'bg-rose-500';
    if (percent > 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getProgressBgColor = (percent) => {
    if (percent > 100) return 'bg-rose-100';
    if (percent > 80) return 'bg-amber-100';
    return 'bg-emerald-100';
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
      <div className="bg-slate-50 p-4 rounded-xl mt-3 animate-fadeIn">
        {/* Year selector and YTD summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-slate-500" size={18} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-sm font-medium bg-white border border-slate-200 rounded-lg px-3 py-1.5"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-white rounded-lg px-3 py-2 border border-slate-200">
              <span className="text-slate-500">Ppto. Mensual: </span>
              <span className="font-bold text-slate-700">{formatCurrency(monthlyBudget)}</span>
            </div>
            <div className={`rounded-lg px-3 py-2 ${getProgressBgColor(ytdPercent)}`}>
              <span className="text-slate-500">YTD: </span>
              <span className={`font-bold ${ytdPercent > 100 ? 'text-rose-700' : ytdPercent > 80 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {formatCurrency(ytdExecuted)} / {formatCurrency(ytdBudget)}
              </span>
              <span className={`ml-2 text-xs font-medium ${ytdPercent > 100 ? 'text-rose-600' : ytdPercent > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                ({ytdPercent.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Monthly grid */}
        <div className="grid grid-cols-12 gap-2">
          {monthlyData.map((data, index) => {
            const percent = monthlyBudget > 0 ? (data.executed / monthlyBudget * 100) : 0;
            const isCurrentMonth = index === currentMonth && selectedYear === new Date().getFullYear();
            const isFutureMonth = (index > currentMonth && selectedYear === new Date().getFullYear()) || selectedYear > new Date().getFullYear();

            return (
              <div
                key={index}
                className={`relative rounded-xl p-2 transition-all ${
                  isCurrentMonth ? 'ring-2 ring-blue-500 bg-blue-50' :
                  isFutureMonth ? 'bg-slate-100 opacity-50' :
                  'bg-white border border-slate-200'
                }`}
              >
                <div className="text-center mb-2">
                  <p className={`text-xs font-bold ${isCurrentMonth ? 'text-blue-600' : 'text-slate-600'}`}>
                    {data.month}
                  </p>
                </div>

                {/* Progress bar vertical */}
                <div className="h-16 w-full bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className={`absolute bottom-0 left-0 right-0 transition-all ${getProgressColor(percent)}`}
                    style={{ height: `${Math.min(percent, 100)}%` }}
                  />
                  {percent > 100 && (
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-rose-300 opacity-50"
                      style={{ height: `${Math.min(percent - 100, 100)}%`, bottom: '100%' }}
                    />
                  )}
                </div>

                <div className="mt-2 text-center">
                  <p className={`text-xs font-bold ${
                    percent > 100 ? 'text-rose-600' :
                    percent > 80 ? 'text-amber-600' :
                    percent > 0 ? 'text-emerald-600' :
                    'text-slate-400'
                  }`}>
                    {percent > 0 ? `${percent.toFixed(0)}%` : '-'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {data.executed > 0 ? formatCurrency(data.executed).replace('€', '') : '-'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-600">&lt;80% utilizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span className="text-slate-600">80-100% utilizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span className="text-slate-600">&gt;100% sobrepasado</span>
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
        <tr className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
          <td className="px-4 py-4 text-sm font-medium text-slate-600">{center.code}</td>
          <td className="px-4 py-4 text-sm font-medium text-slate-800">{center.name}</td>
          <td className="px-4 py-4">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              center.type === 'Costos' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {center.type}
            </span>
          </td>
          <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(center.budget)}</td>
          <td className="px-4 py-4 text-sm text-slate-500">{formatCurrency(center.budget / 12)}/mes</td>
          <td className="px-4 py-4 text-sm font-medium text-rose-600">{formatCurrency(ytdExecuted)}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="w-20 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(utilization)}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${
                utilization > 100 ? 'text-rose-600' :
                utilization > 80 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>
                {utilization.toFixed(0)}%
              </span>
            </div>
          </td>
          <td className="px-4 py-4 text-sm text-slate-600">{center.responsible}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
                className={`p-1.5 rounded transition-colors ${
                  isExpanded ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Ver detalle mensual"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={() => onEdit(center)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(center.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
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
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-slate-500">Cargando centros de costo...</span>
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <TrendingDown className="text-rose-600" size={20} />
            </div>
            <h3 className="font-bold text-rose-800">Centros de Costos</h3>
          </div>
          <p className="text-2xl font-bold text-rose-600">{costCenters.length}</p>
          <p className="text-xs text-slate-500">activos</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
            <h3 className="font-bold text-blue-800">Presupuesto Anual</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-slate-500">{formatCurrency(totalBudget / 12)}/mes</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUpDown className="text-amber-600" size={20} />
            </div>
            <h3 className="font-bold text-amber-800">Ejecutado YTD</h3>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalExecuted)}</p>
          <p className="text-xs text-slate-500">de {formatCurrency(ytdBudget)} presupuestado</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${getProgressBgColor(overallUtilization)}`}>
              <Calendar className={`${overallUtilization > 100 ? 'text-rose-600' : overallUtilization > 80 ? 'text-amber-600' : 'text-emerald-600'}`} size={20} />
            </div>
            <h3 className={`font-bold ${overallUtilization > 100 ? 'text-rose-800' : overallUtilization > 80 ? 'text-amber-800' : 'text-emerald-800'}`}>
              Utilización YTD
            </h3>
          </div>
          <p className={`text-2xl font-bold ${overallUtilization > 100 ? 'text-rose-600' : overallUtilization > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {overallUtilization.toFixed(1)}%
          </p>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${getProgressColor(overallUtilization)}`}
              style={{ width: `${Math.min(overallUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleLoadPredefined}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          <Package size={18} /> Generar Predefinidos
        </button>
        <button
          onClick={() => {
            setEditingCenter(null);
            setNewCenter({ name: '', type: 'Costos', budget: 0, responsible: '' });
            setShowNewModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={18} /> Nuevo Centro
        </button>
      </div>

      {/* Cost Centers Table */}
      <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-lg">
            <TrendingDown className="text-rose-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Centros de Costos</h3>
            <p className="text-sm text-rose-600">Click en la flecha para ver detalle mensual</p>
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Código</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ppto. Anual</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ppto. Mensual</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Ejecutado YTD</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Utilización</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Responsable</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {costCenters.map(center => (
                <CostCenterRow key={center.id} center={center} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
              {costCenters.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                    No hay centros de costo definidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Centers Table */}
      {incomeCenters.length > 0 && (
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-800">Centros de Ingresos</h3>
              <p className="text-sm text-emerald-600">Solo registra VENTAS</p>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Código</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Objetivo Anual</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Objetivo Mensual</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Logrado YTD</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cumplimiento</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Responsable</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
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

      {/* Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h3 className="font-bold text-lg text-slate-800">
                {editingCenter ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  placeholder="Nombre del centro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newCenter.type}
                  onChange={(e) => setNewCenter({ ...newCenter, type: e.target.value })}
                >
                  <option value="Costos">Centro de Costos (Gastos)</option>
                  <option value="Ingresos">Centro de Ingresos (Ventas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Presupuesto Anual (se divide en 12 meses)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">€</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newCenter.budget}
                    onChange={(e) => setNewCenter({ ...newCenter, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                {newCenter.budget > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    = {formatCurrency(newCenter.budget / 12)} por mes
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newCenter.responsible}
                  onChange={(e) => setNewCenter({ ...newCenter, responsible: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setEditingCenter(null);
                }}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingCenter ? handleUpdateCenter : handleAddCenter}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
              >
                {editingCenter ? 'Guardar Cambios' : 'Crear Centro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostCenters;
