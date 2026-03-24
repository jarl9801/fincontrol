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
      <div className="mt-3 rounded-[24px] border border-[#dce6f8] bg-[rgba(246,249,255,0.92)] p-4 animate-fadeIn shadow-[0_16px_42px_rgba(134,153,186,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-[#6b7a99]" size={18} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-xl border border-[#d8e3f7] bg-white/90 px-3 py-1.5 text-sm font-medium text-[#22304f] outline-none"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="rounded-xl border border-[#dce6f8] bg-white/92 px-3 py-2">
              <span className="text-[#6b7a99]">Ppto. mensual: </span>
              <span className="font-bold text-[#1f2a44]">{formatCurrency(monthlyBudget)}</span>
            </div>
            <div className={`rounded-xl px-3 py-2 ${getProgressBgColor(ytdPercent)}`}>
              <span className="text-[#6b7a99]">YTD: </span>
              <span className={`font-bold ${ytdPercent > 100 ? 'text-[#d04c36]' : ytdPercent > 80 ? 'text-[#c98717]' : 'text-[#0f9f6e]'}`}>
                {formatCurrency(ytdExecuted)} / {formatCurrency(ytdBudget)}
              </span>
              <span className={`ml-2 text-xs font-medium ${ytdPercent > 100 ? 'text-[#d04c36]' : ytdPercent > 80 ? 'text-[#c98717]' : 'text-[#0f9f6e]'}`}>
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
                  isCurrentMonth ? 'ring-2 ring-[#7aa2ff] bg-[rgba(59,130,246,0.08)]' :
                  isFutureMonth ? 'bg-[rgba(225,232,245,0.62)] opacity-70' :
                  'border border-[#dce6f8] bg-white/92'
                }`}
              >
                <div className="text-center mb-2">
                  <p className={`text-xs font-bold ${isCurrentMonth ? 'text-[#2563eb]' : 'text-[#6b7a99]'}`}>
                    {data.month}
                  </p>
                </div>

                <div className="relative h-16 w-full overflow-hidden rounded-lg bg-[#edf3ff]">
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
                    percent > 100 ? 'text-[#d04c36]' :
                    percent > 80 ? 'text-[#c98717]' :
                    percent > 0 ? 'text-[#0f9f6e]' :
                    'text-[#93a0b6]'
                  }`}>
                    {percent > 0 ? `${percent.toFixed(0)}%` : '-'}
                  </p>
                  <p className="truncate text-[10px] text-[#70819f]">
                    {data.executed > 0 ? formatCurrency(data.executed).replace('€', '') : '-'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[#bde6d5]" />
            <span className="text-[#6b7a99]">&lt;80% utilizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[#f3cf8c]" />
            <span className="text-[#6b7a99]">80-100% utilizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[#f4a69b]" />
            <span className="text-[#6b7a99]">&gt;100% sobrepasado</span>
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
        <tr className={`border-b border-[#edf1fb] transition-colors hover:bg-[rgba(241,246,255,0.8)] ${isExpanded ? 'bg-[rgba(241,246,255,0.68)]' : ''}`}>
          <td className="px-4 py-4 text-sm font-medium text-[#6b7a99]">{center.code}</td>
          <td className="px-4 py-4 text-sm font-medium text-[#1f2a44]">{center.name}</td>
          <td className="px-4 py-4">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              center.type === 'Costos' ? 'bg-[rgba(208,76,54,0.1)] text-[#d04c36]' : 'bg-[rgba(15,159,110,0.1)] text-[#0f9f6e]'
            }`}>
              {center.type}
            </span>
          </td>
          <td className="px-4 py-4 text-sm text-[#5f6f8d]">{formatCurrency(center.budget)}</td>
          <td className="px-4 py-4 text-sm text-[#70819f]">{formatCurrency(center.budget / 12)}/mes</td>
          <td className={`px-4 py-4 text-sm font-medium ${center.type === 'Ingresos' ? 'text-[#0f9f6e]' : 'text-[#d04c36]'}`}>{formatCurrency(ytdExecuted)}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-20 overflow-hidden rounded-full bg-[#edf3ff]">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(utilization)}`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${
                utilization > 100 ? 'text-[#d04c36]' :
                utilization > 80 ? 'text-[#c98717]' :
                'text-[#0f9f6e]'
              }`}>
                {utilization.toFixed(0)}%
              </span>
            </div>
          </td>
          <td className="px-4 py-4 text-sm text-[#5f6f8d]">{center.responsible}</td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpandedCenter(isExpanded ? null : center.id)}
                className={`p-1.5 rounded transition-colors ${
                  isExpanded ? 'bg-[rgba(59,130,246,0.08)] text-[#2563eb]' : 'text-[#7a879d] hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]'
                }`}
                title="Ver detalle mensual"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={() => onEdit(center)}
                className="rounded p-1.5 text-[#7a879d] transition-colors hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onDelete(center.id)}
                className="rounded p-1.5 text-[#7a879d] transition-colors hover:bg-[rgba(208,76,54,0.08)] hover:text-[#d04c36]"
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
        <Loader2 className="w-8 h-8 text-[#0a84ff] animate-spin" />
        <span className="ml-3 text-[#6b7a99]">Preparando centros de costo...</span>
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
      <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Presupuesto operativo</p>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Centros de costo</h2>
        <p className="mt-1 text-sm text-[#6b7a99]">Organiza responsables, presupuesto anual y seguimiento mensual desde una sola mesa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-2xl bg-[rgba(208,76,54,0.1)] p-2">
              <TrendingDown className="text-[#d04c36]" size={20} />
            </div>
            <h3 className="font-semibold text-[#1f2a44]">Centros de costos</h3>
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#d04c36]">{costCenters.length}</p>
          <p className="text-xs text-[#70819f]">activos</p>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-2xl bg-[rgba(59,130,246,0.12)] p-2">
              <BarChart3 className="text-[#2563eb]" size={20} />
            </div>
            <h3 className="font-semibold text-[#1f2a44]">Presupuesto anual</h3>
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#1f5fbf]">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-[#70819f]">{formatCurrency(totalBudget / 12)}/mes</p>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-2xl bg-[rgba(245,158,11,0.12)] p-2">
              <TrendingUpDown className="text-[#c98717]" size={20} />
            </div>
            <h3 className="font-semibold text-[#1f2a44]">Ejecutado YTD</h3>
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#c98717]">{formatCurrency(totalExecuted)}</p>
          <p className="text-xs text-[#70819f]">de {formatCurrency(ytdBudget)} presupuestado</p>
        </div>

        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="mb-3 flex items-center gap-3">
            <div className={`rounded-2xl p-2 ${getProgressBgColor(overallUtilization)}`}>
              <Calendar className={`${overallUtilization > 100 ? 'text-[#d04c36]' : overallUtilization > 80 ? 'text-[#c98717]' : 'text-[#0f9f6e]'}`} size={20} />
            </div>
            <h3 className="font-semibold text-[#1f2a44]">
              Utilización YTD
            </h3>
          </div>
          <p className={`text-[28px] font-semibold tracking-[-0.03em] ${overallUtilization > 100 ? 'text-[#d04c36]' : overallUtilization > 80 ? 'text-[#c98717]' : 'text-[#0f9f6e]'}`}>
            {overallUtilization.toFixed(1)}%
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#edf3ff]">
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
          className="inline-flex items-center gap-2 rounded-2xl bg-[#0f9f6e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c875d]"
        >
          <Package size={18} /> Generar Predefinidos
        </button>
        <button
          onClick={() => {
            setEditingCenter(null);
            setNewCenter({ name: '', type: 'Costos', budget: 0, responsible: '' });
            setShowNewModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f56cf]"
        >
          <Plus size={18} /> Nuevo Centro
        </button>
      </div>

      <div className="rounded-[28px] border border-[rgba(208,76,54,0.16)] bg-[rgba(255,252,250,0.88)] p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-[rgba(208,76,54,0.1)] p-2">
            <TrendingDown className="text-[#d04c36]" size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">Centros de costos</h3>
            <p className="text-sm text-[#8a6d66]">Abre cada fila para revisar el detalle mensual.</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#eddad5] bg-white/90">
          <table className="w-full text-left">
            <thead className="border-b border-[#f0ded8] bg-[rgba(255,247,245,0.94)]">
              <tr>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Código</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Nombre</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Tipo</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Ppto. anual</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Ppto. mensual</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Ejecutado YTD</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Utilización</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Responsable</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6d66]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {costCenters.map(center => (
                <CostCenterRow key={center.id} center={center} onDelete={handleDelete} onEdit={handleEdit} />
              ))}
              {costCenters.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-[#8a6d66]">
                    No hay centros de costo definidos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {incomeCenters.length > 0 && (
        <div className="rounded-[28px] border border-[rgba(15,159,110,0.16)] bg-[rgba(247,253,250,0.9)] p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-[rgba(15,159,110,0.1)] p-2">
              <TrendingUp className="text-[#0f9f6e]" size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">Centros de ingresos</h3>
              <p className="text-sm text-[#628173]">Usa esta mesa para metas y seguimiento comercial.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#d7ebe2] bg-white/92">
            <table className="w-full text-left">
              <thead className="border-b border-[#dcefe7] bg-[rgba(244,251,247,0.95)]">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Código</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Nombre</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Tipo</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Objetivo anual</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Objetivo mensual</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Logrado YTD</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Cumplimiento</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Responsable</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#628173]">Acciones</th>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#dce6f8] bg-[rgba(255,255,255,0.96)] shadow-[0_35px_120px_rgba(15,23,42,0.24)] animate-scaleIn">
            <div className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)] px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b7bd6]">Centro presupuestario</p>
              <h3 className="text-lg font-semibold tracking-[-0.03em] text-[#1f2a44]">
                {editingCenter ? 'Editar centro' : 'Nuevo centro'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Nombre</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                  value={newCenter.name}
                  onChange={(e) => setNewCenter({ ...newCenter, name: e.target.value })}
                  placeholder="Nombre del centro"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Tipo</label>
                <select
                  className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                  value={newCenter.type}
                  onChange={(e) => setNewCenter({ ...newCenter, type: e.target.value })}
                >
                  <option value="Costos">Centro de Costos (Gastos)</option>
                  <option value="Ingresos">Centro de Ingresos (Ventas)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                  Presupuesto anual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a879d]">€</span>
                  <input
                    type="number"
                    className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] py-2.5 pl-8 pr-4 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                    value={newCenter.budget}
                    onChange={(e) => setNewCenter({ ...newCenter, budget: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                {newCenter.budget > 0 && (
                  <p className="mt-1 text-xs text-[#70819f]">
                    = {formatCurrency(newCenter.budget / 12)} por mes
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Responsable</label>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                  value={newCenter.responsible}
                  onChange={(e) => setNewCenter({ ...newCenter, responsible: e.target.value })}
                  placeholder="Nombre del responsable"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-[#e2ebfb] bg-[rgba(245,248,255,0.94)] px-6 py-4">
              <button
                onClick={() => {
                  setShowNewModal(false);
                  setEditingCenter(null);
                }}
                className="rounded-2xl px-4 py-2.5 text-sm font-medium text-[#6b7a99] transition hover:bg-[rgba(94,115,159,0.08)]"
              >
                Cancelar
              </button>
              <button
                onClick={editingCenter ? handleUpdateCenter : handleAddCenter}
                className="rounded-2xl bg-[#2563eb] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f56cf]"
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
