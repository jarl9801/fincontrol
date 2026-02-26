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
    if (percent > 100) return 'bg-[rgba(255,69,58,0.12)]';
    if (percent > 80) return 'bg-[rgba(255,159,10,0.12)]';
    return 'bg-[rgba(48,209,88,0.12)]';
  };

  const getProgressBgColor = (percent) => {
    if (percent > 100) return 'bg-[rgba(239,68,68,0.12)]';
    if (percent > 80) return 'bg-[rgba(245,158,11,0.12)]';
    return 'bg-[rgba(16,185,129,0.12)]';
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
      <div className="bg-[#111111] p-4 rounded-xl mt-3 animate-fadeIn">
        {/* Year selector and YTD summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-[#8e8e93]" size={18} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="text-sm font-medium bg-[#1c1c1e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-1.5"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-[#1c1c1e] rounded-lg px-3 py-2 border border-[rgba(255,255,255,0.08)]">
              <span className="text-[#8e8e93]">Ppto. Mensual: </span>
              <span className="font-bold text-[#c7c7cc]">{formatCurrency(monthlyBudget)}</span>
            </div>
            <div className={`rounded-lg px-3 py-2 ${getProgressBgColor(ytdPercent)}`}>
              <span className="text-[#8e8e93]">YTD: </span>
              <span className={`font-bold ${ytdPercent > 100 ? 'text-[#f87171]' : ytdPercent > 80 ? 'text-[#fbbf24]' : 'text-[#34d399]'}`}>
                {formatCurrency(ytdExecuted)} / {formatCurrency(ytdBudget)}
              </span>
              <span className={`ml-2 text-xs font-medium ${ytdPercent > 100 ? 'text-[#f87171]' : ytdPercent > 80 ? 'text-[#fbbf24]' : 'text-[#34d399]'}`}>
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
                  isCurrentMonth ? 'ring-2 ring-blue-500 bg-[rgba(59,130,246,0.08)]' :
                  isFutureMonth ? 'bg-[#2c2c2e] opacity-50' :
                  'bg-[#1c1c1e] border border-[rgba(255,255,255,0.08)]'
                }`}
              >
                <div className="text-center mb-2">
                  <p className={`text-xs font-bold ${isCurrentMonth ? 'text-[#60a5fa]' : 'text-[#98989d]'}`}>
                    {data.month}
                  </p>
                </div>

                {/* Progress bar vertical */}
                <div className="h-16 w-full bg-[#2c2c2e] rounded-lg overflow-hidden relative">
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
                    percent > 100 ? 'text-[#f87171]' :
                    percent > 80 ? 'text-[#fbbf24]' :
                    percent > 0 ? 'text-[#34d399]' :
                    'text-[#636366]'
                  }`}>
                    {percent > 0 ? `${percent.toFixed(0)}%` : '-'}
                  </p>
                  <p className="text-[10px] text-[#8e8e93] truncate">
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
            <div className="w-3 h-3 rounded bg-[rgba(48,209,88,0.12)]" />
            <span className="text-[#98989d]">&lt;80% utilizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[rgba(255,159,10,0.12)]" />
            <span className="text-[#98989d]">80-100% utilizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[rgba(255,69,58,0.12)]" />
            <span className="text-[#98989d]">&gt;100% sobrepasado</span>
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
        <tr className={`border-b border-[rgba(255,255,255,0.08)] hover:bg-[#111111] transition-colors ${isExpanded ? 'bg-[#111111]' : ''}`}>
          <td className="px-4 py-4 text-sm font-medium text-[#98989d]">{center.code}</td>
          <td className="px-4 py-4 text-sm font-medium text-[#e5e5ea]">{center.name}</td>
          <td className="px-4 py-4">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              center.type === 'Costos' ? 'bg-[rgba(239,68,68,0.12)] text-[#f87171]' : 'bg-[rgba(16,185,129,0.12)] text-[#34d399]'
            }`}>
              {center.type}
            </span>
          </td>
          <td className="px-4 py-4 text-sm text-[#98989d]">{formatCurrency(center.budget)}</td>
          <td className="px-4 py-4 text-sm text-[#8e8e93]">{formatCurrency(center.budget / 12)}/mes</td>
          <td className="px-4 py-4 text-sm font-medium text-[#f87171]">{formatCurrency(ytdExecuted)}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="w-20 h-2.5 bg-[#2c2c2e] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(utilization)}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${
                utilization > 100 ? 'text-[#f87171]' :
                utilization > 80 ? 'text-[#fbbf24]' :
                'text-[#34d399]'
              }`}>
                {utilization.toFixed(0)}%
              </span>
            </div>
          </td>
          <td className="px-4 py-4 text-sm text-[#98989d]">{center.responsible}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
                className={`p-1.5 rounded transition-colors ${
                  isExpanded ? 'text-[#60a5fa] bg-[rgba(59,130,246,0.08)]' : 'text-[#636366] hover:text-[#60a5fa] hover:bg-[rgba(59,130,246,0.08)]'
                }`}
                title="Ver detalle mensual"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={() => onEdit(center)}
                className="p-1.5 text-[#636366] hover:text-[#60a5fa] hover:bg-[rgba(59,130,246,0.08)] rounded transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(center.id)}
                className="p-1.5 text-[#636366] hover:text-[#f87171] hover:bg-[rgba(239,68,68,0.08)] rounded transition-colors"
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
        <Loader2 className="w-8 h-8 text-[#60a5fa] animate-spin" />
        <span className="ml-3 text-[#8e8e93]">Cargando centros de costo...</span>
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
        <div className="bg-[#1c1c1e] rounded-xl p-5 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(239,68,68,0.12)] rounded-lg">
              <TrendingDown className="text-[#f87171]" size={20} />
            </div>
            <h3 className="font-bold text-rose-800">Centros de Costos</h3>
          </div>
          <p className="text-2xl font-bold text-[#f87171]">{costCenters.length}</p>
          <p className="text-xs text-[#8e8e93]">activos</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-5 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(59,130,246,0.12)] rounded-lg">
              <BarChart3 className="text-[#60a5fa]" size={20} />
            </div>
            <h3 className="font-bold text-blue-800">Presupuesto Anual</h3>
          </div>
          <p className="text-2xl font-bold text-[#60a5fa]">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-[#8e8e93]">{formatCurrency(totalBudget / 12)}/mes</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-5 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[rgba(245,158,11,0.12)] rounded-lg">
              <TrendingUpDown className="text-[#fbbf24]" size={20} />
            </div>
            <h3 className="font-bold text-amber-800">Ejecutado YTD</h3>
          </div>
          <p className="text-2xl font-bold text-[#fbbf24]">{formatCurrency(totalExecuted)}</p>
          <p className="text-xs text-[#8e8e93]">de {formatCurrency(ytdBudget)} presupuestado</p>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl p-5 shadow-sm border border-[rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${getProgressBgColor(overallUtilization)}`}>
              <Calendar className={`${overallUtilization > 100 ? 'text-[#f87171]' : overallUtilization > 80 ? 'text-[#fbbf24]' : 'text-[#34d399]'}`} size={20} />
            </div>
            <h3 className={`font-bold ${overallUtilization > 100 ? 'text-rose-800' : overallUtilization > 80 ? 'text-amber-800' : 'text-emerald-800'}`}>
              Utilización YTD
            </h3>
          </div>
          <p className={`text-2xl font-bold ${overallUtilization > 100 ? 'text-[#f87171]' : overallUtilization > 80 ? 'text-[#fbbf24]' : 'text-[#34d399]'}`}>
            {overallUtilization.toFixed(1)}%
          </p>
          <div className="w-full h-2 bg-[#2c2c2e] rounded-full overflow-hidden mt-2">
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
      <div className="bg-[rgba(239,68,68,0.08)] rounded-2xl p-6 border border-[rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(239,68,68,0.12)] rounded-lg">
            <TrendingDown className="text-[#f87171]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Centros de Costos</h3>
            <p className="text-sm text-[#f87171]">Click en la flecha para ver detalle mensual</p>
          </div>
        </div>

        <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#111111] border-b border-[rgba(255,255,255,0.08)]">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Código</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Ppto. Anual</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Ppto. Mensual</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Ejecutado YTD</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Utilización</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Responsable</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {costCenters.map(center => (
                <CostCenterRow key={center.id} center={center} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
              {costCenters.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-[#636366]">
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
        <div className="bg-[rgba(16,185,129,0.08)] rounded-2xl p-6 border border-[rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[rgba(16,185,129,0.12)] rounded-lg">
              <TrendingUp className="text-[#34d399]" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-800">Centros de Ingresos</h3>
              <p className="text-sm text-[#34d399]">Solo registra VENTAS</p>
            </div>
          </div>

          <div className="bg-[#1c1c1e] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#111111] border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Código</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Nombre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Tipo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Objetivo Anual</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Objetivo Mensual</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Logrado YTD</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Cumplimiento</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Responsable</th>
                  <th className="px-4 py-3 text-xs font-semibold text-[#8e8e93] uppercase">Acciones</th>
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
          <div className="bg-[#1c1c1e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-r from-slate-50 to-white">
              <h3 className="font-bold text-lg text-[#e5e5ea]">
                {editingCenter ? 'Editar Centro de Costo' : 'Nuevo Centro de Costo'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Nombre</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[rgba(255,255,255,0.14)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  placeholder="Nombre del centro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Tipo</label>
                <select
                  className="w-full px-4 py-2.5 border border-[rgba(255,255,255,0.14)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newCenter.type}
                  onChange={(e) => setNewCenter({ ...newCenter, type: e.target.value })}
                >
                  <option value="Costos">Centro de Costos (Gastos)</option>
                  <option value="Ingresos">Centro de Ingresos (Ventas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c7c7cc] mb-1">
                  Presupuesto Anual (se divide en 12 meses)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#636366]">€</span>
                  <input
                    type="number"
                    className="w-full pl-8 pr-4 py-2.5 border border-[rgba(255,255,255,0.14)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={newCenter.budget}
                    onChange={(e) => setNewCenter({ ...newCenter, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                {newCenter.budget > 0 && (
                  <p className="text-xs text-[#8e8e93] mt-1">
                    = {formatCurrency(newCenter.budget / 12)} por mes
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#c7c7cc] mb-1">Responsable</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-[rgba(255,255,255,0.14)] rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={newCenter.responsible}
                  onChange={(e) => setNewCenter({ ...newCenter, responsible: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.08)] flex gap-3 justify-end bg-[#111111]">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setEditingCenter(null);
                }}
                className="px-4 py-2.5 text-[#98989d] hover:bg-[#2c2c2e] rounded-xl font-medium transition-colors"
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
