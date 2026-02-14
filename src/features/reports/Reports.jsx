import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Download, DollarSign, Percent,
  Target, AlertTriangle, ArrowUpRight, ArrowDownRight, FileText, Calendar,
  ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { exportReportToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Categorías agrupadas para el estado de resultados
const CATEGORY_GROUPS = {
  income: {
    'Servicios': ['Servicios', 'Honorarios', 'Consultoría', 'Diseño', 'Desarrollo'],
    'Ventas': ['Ventas', 'Productos', 'Licencias'],
    'Otros Ingresos': ['Otros', 'Intereses', 'Comisiones']
  },
  expense: {
    'Costos Directos': ['Materiales', 'Producción', 'Subcontratación', 'Mano de Obra'],
    'Gastos Administrativos': ['Administración', 'Oficina', 'Salarios', 'Nómina', 'Impuestos'],
    'Gastos Operacionales': ['Operaciones', 'Transporte', 'Logística', 'Servicios', 'Hosting'],
    'Gastos de Ventas': ['Marketing', 'Publicidad', 'Ventas', 'Promoción'],
    'Gastos Financieros': ['Bancarios', 'Intereses', 'Comisiones Bancarias'],
    'Otros Gastos': ['Otros', 'Varios', 'Misceláneos']
  }
};

const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'];

const Reports = ({ transactions }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Period state: 'month:YYYY-MM', 'quarter', 'year', 'all'
  const [selectedPeriod, setSelectedPeriod] = useState(`month:${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [compareMode, setCompareMode] = useState(true);
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derive available months from transactions
  const availableMonths = useMemo(() => {
    const monthSet = new Set();
    transactions.forEach(t => {
      if (t.date) {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthSet.add(key);
      }
    });
    // Also add current month
    monthSet.add(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
    return Array.from(monthSet).sort().reverse();
  }, [transactions, currentMonth, currentYear]);

  // Group available months by year for the dropdown
  const monthsByYear = useMemo(() => {
    const grouped = {};
    availableMonths.forEach(key => {
      const [year] = key.split('-');
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(key);
    });
    return Object.entries(grouped).sort((a, b) => b[0] - a[0]);
  }, [availableMonths]);

  // Parse period type
  const periodType = selectedPeriod.startsWith('month:') ? 'month' : selectedPeriod;
  const selectedMonthKey = periodType === 'month' ? selectedPeriod.slice(6) : null;

  // Filtrar por período
  const filterByPeriod = (trans, period, offset = 0) => {
    const transDate = new Date(trans.date);

    if (period === 'all') return true;

    if (period === 'month' && selectedMonthKey) {
      const [selYear, selMonth] = selectedMonthKey.split('-').map(Number);
      // offset 0 = selected month, offset 1 = previous month
      let targetMonth = selMonth - offset;
      let targetYear = selYear;
      while (targetMonth <= 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      return transDate.getMonth() === (targetMonth - 1) && transDate.getFullYear() === targetYear;
    }
    if (period === 'quarter') {
      const currentQuarter = Math.floor(currentMonth / 3);
      const targetQuarter = currentQuarter - offset;
      const targetYear = targetQuarter < 0 ? currentYear - 1 : currentYear;
      const adjustedQuarter = targetQuarter < 0 ? 4 + targetQuarter : targetQuarter;
      const transQuarter = Math.floor(transDate.getMonth() / 3);
      return transQuarter === adjustedQuarter && transDate.getFullYear() === targetYear;
    }
    if (period === 'year') {
      return transDate.getFullYear() === (currentYear - offset);
    }
    return true;
  };

  const currentPeriodTx = transactions.filter(t => filterByPeriod(t, periodType, 0) && t.status === 'paid');
  const previousPeriodTx = transactions.filter(t => filterByPeriod(t, periodType, 1) && t.status === 'paid');

  // Calcular totales por tipo
  const calculateTotals = (txList) => {
    const income = txList.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txList.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, profit: income - expenses };
  };

  const current = calculateTotals(currentPeriodTx);
  const previous = calculateTotals(previousPeriodTx);

  // Calcular variaciones
  const calcVariation = (curr, prev) => prev > 0 ? ((curr - prev) / prev * 100) : (curr > 0 ? 100 : 0);

  // Agrupar por categoría
  const groupByCategory = (txList, type) => {
    const result = {};
    txList.filter(t => t.type === type).forEach(t => {
      result[t.category] = (result[t.category] || 0) + t.amount;
    });
    return result;
  };

  const currentIncomeByCategory = groupByCategory(currentPeriodTx, 'income');
  const currentExpensesByCategory = groupByCategory(currentPeriodTx, 'expense');
  const prevIncomeByCategory = groupByCategory(previousPeriodTx, 'income');
  const prevExpensesByCategory = groupByCategory(previousPeriodTx, 'expense');

  // Agrupar categorías en grupos contables
  const groupCategories = (categoryData, groups) => {
    const result = {};
    Object.entries(groups).forEach(([groupName, categories]) => {
      let total = 0;
      const details = [];
      Object.entries(categoryData).forEach(([cat, amount]) => {
        if (categories.some(c => cat.toLowerCase().includes(c.toLowerCase()))) {
          total += amount;
          details.push({ name: cat, amount });
        }
      });
      if (total > 0) {
        result[groupName] = { total, details: details.sort((a, b) => b.amount - a.amount) };
      }
    });

    // Agregar categorías no clasificadas a "Otros"
    const classifiedCategories = Object.values(groups).flat().map(c => c.toLowerCase());
    let otherTotal = 0;
    const otherDetails = [];
    Object.entries(categoryData).forEach(([cat, amount]) => {
      if (!classifiedCategories.some(c => cat.toLowerCase().includes(c))) {
        otherTotal += amount;
        otherDetails.push({ name: cat, amount });
      }
    });
    if (otherTotal > 0) {
      const otherKey = Object.keys(groups).find(k => k.includes('Otros')) || 'Otros';
      if (result[otherKey]) {
        result[otherKey].total += otherTotal;
        result[otherKey].details.push(...otherDetails);
      } else {
        result[otherKey] = { total: otherTotal, details: otherDetails };
      }
    }

    return result;
  };

  const incomeGroups = groupCategories(currentIncomeByCategory, CATEGORY_GROUPS.income);
  const expenseGroups = groupCategories(currentExpensesByCategory, CATEGORY_GROUPS.expense);

  // Calcular subtotales
  const totalDirectCosts = (expenseGroups['Costos Directos']?.total || 0);
  const grossProfit = current.income - totalDirectCosts;
  const operationalExpenses =
    (expenseGroups['Gastos Administrativos']?.total || 0) +
    (expenseGroups['Gastos Operacionales']?.total || 0) +
    (expenseGroups['Gastos de Ventas']?.total || 0);
  const operationalProfit = grossProfit - operationalExpenses;
  const financialExpenses = expenseGroups['Gastos Financieros']?.total || 0;
  const otherExpenses = expenseGroups['Otros Gastos']?.total || 0;
  const profitBeforeTax = operationalProfit - financialExpenses - otherExpenses;
  const estimatedTax = profitBeforeTax > 0 ? profitBeforeTax * 0.25 : 0;
  const netProfit = profitBeforeTax - estimatedTax;

  // Márgenes
  const grossMargin = current.income > 0 ? (grossProfit / current.income * 100) : 0;
  const operationalMargin = current.income > 0 ? (operationalProfit / current.income * 100) : 0;
  const netMargin = current.income > 0 ? (netProfit / current.income * 100) : 0;

  // Datos por proyecto
  const projectData = {};
  currentPeriodTx.forEach(t => {
    if (!projectData[t.project]) {
      projectData[t.project] = { name: t.project, ingresos: 0, gastos: 0 };
    }
    if (t.type === 'income') projectData[t.project].ingresos += t.amount;
    else projectData[t.project].gastos += t.amount;
  });

  const projectChartData = Object.values(projectData)
    .map(p => ({
      ...p,
      margen: p.ingresos - p.gastos,
      margenPercent: p.ingresos > 0 ? ((p.ingresos - p.gastos) / p.ingresos * 100) : (p.gastos > 0 ? -100 : 0)
    }))
    .sort((a, b) => b.margen - a.margen);

  const projectsWithLoss = projectChartData.filter(p => p.margen < 0);

  // Período label
  const getPeriodLabel = () => {
    if (periodType === 'month' && selectedMonthKey) {
      const [y, m] = selectedMonthKey.split('-').map(Number);
      return `${MONTH_NAMES[m - 1]} ${y}`;
    }
    if (periodType === 'quarter') return `Q${Math.floor(currentMonth / 3) + 1} ${currentYear}`;
    if (periodType === 'year') return `Año ${currentYear}`;
    return 'Todo el período';
  };

  const getPreviousPeriodLabel = () => {
    if (periodType === 'month' && selectedMonthKey) {
      const [y, m] = selectedMonthKey.split('-').map(Number);
      const prevM = m - 1 <= 0 ? 12 : m - 1;
      const prevY = m - 1 <= 0 ? y - 1 : y;
      return `${MONTH_NAMES[prevM - 1]} ${prevY}`;
    }
    if (periodType === 'quarter') return `Q${Math.floor(currentMonth / 3)} ${currentYear}`;
    if (periodType === 'year') return `Año ${currentYear - 1}`;
    return '';
  };

  // Navigate months with arrows
  const navigateMonth = (direction) => {
    if (periodType !== 'month' || !selectedMonthKey) return;
    const idx = availableMonths.indexOf(selectedMonthKey);
    const newIdx = idx - direction; // reversed because sorted desc
    if (newIdx >= 0 && newIdx < availableMonths.length) {
      setSelectedPeriod(`month:${availableMonths[newIdx]}`);
    }
  };

  const canNavigatePrev = periodType === 'month' && availableMonths.indexOf(selectedMonthKey) < availableMonths.length - 1;
  const canNavigateNext = periodType === 'month' && availableMonths.indexOf(selectedMonthKey) > 0;

  const formatMonthKey = (key) => {
    const [y, m] = key.split('-').map(Number);
    return `${MONTH_NAMES[m - 1]} ${y}`;
  };

  const LineItem = ({ label, amount, prevAmount, isSubtotal = false, isTotal = false, isNegative = false, indent = 0, showVariation = true }) => {
    const variation = prevAmount !== undefined && showVariation ? calcVariation(amount, prevAmount) : null;
    const percentOfIncome = current.income > 0 ? (Math.abs(amount) / current.income * 100) : 0;

    return (
      <tr className={`
        transition-colors duration-150
        ${isTotal ? 'bg-slate-800 text-white' : ''}
        ${isSubtotal ? 'bg-[rgba(255,255,255,0.02)] font-semibold' : ''}
        ${!isTotal && !isSubtotal ? 'hover:bg-[rgba(59,130,246,0.08)]/40' : ''}
        border-b border-[#2a2a4a]
      `}>
        <td className={`px-5 py-3.5 ${indent > 0 ? 'pl-10' : ''} ${isTotal ? 'font-bold text-lg' : ''} ${indent > 0 && !isSubtotal ? 'text-[#9898b8]' : ''}`}>
          {label}
        </td>
        <td className={`px-5 py-3.5 text-right tabular-nums ${isTotal ? 'text-lg' : 'text-sm'} ${
          isNegative ? (isTotal ? 'text-white' : 'text-[#9898b8]') : ''
        }`}>
          {isNegative && !isTotal ? '(' : ''}{formatCurrency(Math.abs(amount))}{isNegative && !isTotal ? ')' : ''}
        </td>
        <td className={`px-5 py-3.5 text-right text-sm tabular-nums ${isTotal ? 'text-[#585890]' : 'text-[#6868a0]'}`}>
          {percentOfIncome.toFixed(1)}%
        </td>
        {compareMode && (
          <>
            <td className={`px-5 py-3.5 text-right text-sm tabular-nums ${isTotal ? 'text-[#585890]' : 'text-[#6868a0]'}`}>
              {prevAmount !== undefined ? formatCurrency(prevAmount) : '-'}
            </td>
            <td className="px-5 py-3.5 text-right">
              {variation !== null && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  variation >= 0
                    ? (isNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')
                    : (isNegative ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')
                }`}>
                  {variation >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  {Math.abs(variation).toFixed(1)}%
                </span>
              )}
            </td>
          </>
        )}
      </tr>
    );
  };

  const SectionHeader = ({ title, color = 'slate' }) => {
    const colors = {
      emerald: 'bg-emerald-600/90 text-white',
      rose: 'bg-rose-600/90 text-white',
      blue: 'bg-slate-700/90 text-white',
      amber: 'bg-amber-500/90 text-white',
      slate: 'bg-slate-600/90 text-white'
    };

    return (
      <tr className={colors[color]}>
        <td colSpan={compareMode ? 5 : 3} className="px-5 py-2.5 font-bold text-xs uppercase tracking-wider">
          {title}
        </td>
      </tr>
    );
  };

  const customTooltipStyle = {
    backgroundColor: '#1e293b',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 14px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
    color: '#f1f5f9',
    fontSize: '13px'
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-[#1a1a2e] rounded-2xl p-5 shadow-sm border border-[#2a2a4a]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Period selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Month selector with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center">
                {/* Prev arrow */}
                <button
                  onClick={() => navigateMonth(-1)}
                  disabled={!canNavigatePrev}
                  className="p-2 rounded-l-xl border border-r-0 border-[#2a2a4a] bg-[#1a1a2e] hover:bg-[#13132a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} className="text-[#8888b0]" />
                </button>

                {/* Month button */}
                <button
                  onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                  className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-all ${
                    periodType === 'month'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-[#1a1a2e] text-[#9898b8] border-[#2a2a4a] hover:bg-[#13132a]'
                  }`}
                >
                  <Calendar size={15} />
                  {periodType === 'month' ? formatMonthKey(selectedMonthKey) : 'Mes'}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${monthDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Next arrow */}
                <button
                  onClick={() => navigateMonth(1)}
                  disabled={!canNavigateNext}
                  className="p-2 rounded-r-xl border border-l-0 border-[#2a2a4a] bg-[#1a1a2e] hover:bg-[#13132a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="text-[#8888b0]" />
                </button>
              </div>

              {/* Dropdown */}
              {monthDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-[#1a1a2e] rounded-xl shadow-xl border border-[#2a2a4a] py-2 min-w-[220px] max-h-[320px] overflow-y-auto animate-[fadeIn_150ms_ease-out]">
                  {monthsByYear.map(([year, months]) => (
                    <div key={year}>
                      <div className="px-4 py-1.5 text-xs font-bold text-[#6868a0] uppercase tracking-wider sticky top-0 bg-[#1a1a2e]">
                        {year}
                      </div>
                      {months.map(key => {
                        const isSelected = selectedMonthKey === key && periodType === 'month';
                        return (
                          <button
                            key={key}
                            onClick={() => {
                              setSelectedPeriod(`month:${key}`);
                              setMonthDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                              isSelected
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-[#9898b8] hover:bg-[#13132a]'
                            }`}
                          >
                            {formatMonthKey(key)}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-[#252540] mx-1 hidden sm:block" />

            {/* Other period buttons */}
            {[
              { key: 'quarter', label: 'Trimestre' },
              { key: 'year', label: 'Año' },
              { key: 'all', label: 'Todo' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  periodType === period.key
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-[#13132a] text-[#9898b8] hover:bg-[rgba(255,255,255,0.05)] border border-[#2a2a4a]'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-[#9898b8] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 rounded border-[#3a3a5a] text-blue-600 focus:ring-blue-500"
              />
              Comparar con {periodType === 'month' ? 'mes' : 'período'} anterior
            </label>
            <button
              onClick={() => exportReportToPDF(currentPeriodTx, 'general')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-all duration-200 text-sm shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Download size={16} />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Period info bar */}
        {compareMode && periodType !== 'all' && (
          <div className="mt-3 pt-3 border-t border-[#2a2a4a] flex items-center gap-4 text-xs text-[#6868a0]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              Actual: <span className="font-medium text-[#9898b8]">{getPeriodLabel()}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Anterior: <span className="font-medium text-[#8888b0]">{getPreviousPeriodLabel()}</span>
            </span>
          </div>
        )}
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 shadow-sm border border-emerald-100/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-100/40 rounded-full -translate-y-6 translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#8888b0] text-sm mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <TrendingUp size={14} className="text-emerald-600" />
              </div>
              Ingresos
            </div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">{formatCurrency(current.income)}</div>
            {compareMode && previous.income > 0 && (
              <div className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                calcVariation(current.income, previous.income) >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {calcVariation(current.income, previous.income) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(calcVariation(current.income, previous.income)).toFixed(1)}% vs anterior
              </div>
            )}
          </div>
        </div>

        {/* Gastos */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-white rounded-2xl p-5 shadow-sm border border-rose-100/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-100/40 rounded-full -translate-y-6 translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#8888b0] text-sm mb-2">
              <div className="p-1.5 rounded-lg bg-rose-100">
                <TrendingDown size={14} className="text-rose-600" />
              </div>
              Gastos
            </div>
            <div className="text-2xl font-bold text-rose-700 tracking-tight">{formatCurrency(current.expenses)}</div>
            {compareMode && previous.expenses > 0 && (
              <div className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                calcVariation(current.expenses, previous.expenses) <= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {calcVariation(current.expenses, previous.expenses) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(calcVariation(current.expenses, previous.expenses)).toFixed(1)}% vs anterior
              </div>
            )}
          </div>
        </div>

        {/* Utilidad Neta */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-white rounded-2xl p-5 shadow-sm border border-blue-100/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100/40 rounded-full -translate-y-6 translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#8888b0] text-sm mb-2">
              <div className="p-1.5 rounded-lg bg-blue-100">
                <DollarSign size={14} className="text-blue-600" />
              </div>
              Utilidad Neta
            </div>
            <div className={`text-2xl font-bold tracking-tight ${netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
              {formatCurrency(netProfit)}
            </div>
            <div className="text-xs text-[#6868a0] mt-2 font-medium">Margen: {netMargin.toFixed(1)}%</div>
          </div>
        </div>

        {/* Margen Operacional */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 shadow-sm border border-indigo-100/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/40 rounded-full -translate-y-6 translate-x-6" />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#8888b0] text-sm mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-100">
                <Percent size={14} className="text-indigo-600" />
              </div>
              Margen Operacional
            </div>
            <div className={`text-2xl font-bold tracking-tight ${operationalMargin >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {operationalMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-[#6868a0] mt-2 font-medium">EBIT: {formatCurrency(operationalProfit)}</div>
          </div>
        </div>
      </div>

      {/* Estado de Resultados Profesional */}
      <div className="bg-[#1a1a2e] rounded-2xl shadow-sm border border-[#2a2a4a] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a4a] bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#1a1a2e]/10">
              <FileText className="text-white" size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Estado de Resultados</h3>
              <p className="text-sm text-[#6868a0] mt-0.5">{getPeriodLabel()}</p>
            </div>
          </div>
          {compareMode && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-[#6868a0] bg-[#1a1a2e]/5 px-3 py-1.5 rounded-lg">
              <Calendar size={14} />
              vs {getPreviousPeriodLabel()}
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(255,255,255,0.02)] border-b border-[#2a2a4a]">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Concepto</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Monto</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">% Ing.</th>
                {compareMode && (
                  <>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Anterior</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Var.</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {/* INGRESOS */}
              <SectionHeader title="Ingresos Operacionales" color="emerald" />
              {Object.entries(incomeGroups).map(([group, data]) => (
                <React.Fragment key={group}>
                  {data.details.length > 1 ? (
                    <>
                      {data.details.map(item => (
                        <LineItem
                          key={item.name}
                          label={item.name}
                          amount={item.amount}
                          prevAmount={prevIncomeByCategory[item.name]}
                          indent={1}
                        />
                      ))}
                      <LineItem
                        label={`Subtotal ${group}`}
                        amount={data.total}
                        prevAmount={Object.entries(prevIncomeByCategory)
                          .filter(([cat]) => data.details.some(d => d.name === cat))
                          .reduce((s, [, a]) => s + a, 0)}
                        isSubtotal
                      />
                    </>
                  ) : (
                    <LineItem
                      label={data.details[0]?.name || group}
                      amount={data.total}
                      prevAmount={prevIncomeByCategory[data.details[0]?.name]}
                    />
                  )}
                </React.Fragment>
              ))}
              <LineItem
                label="TOTAL INGRESOS"
                amount={current.income}
                prevAmount={previous.income}
                isTotal
              />

              {/* COSTOS DIRECTOS */}
              {expenseGroups['Costos Directos'] && (
                <>
                  <SectionHeader title="Costos de Operación" color="rose" />
                  {expenseGroups['Costos Directos'].details.map(item => (
                    <LineItem
                      key={item.name}
                      label={item.name}
                      amount={item.amount}
                      prevAmount={prevExpensesByCategory[item.name]}
                      isNegative
                      indent={1}
                    />
                  ))}
                  <LineItem
                    label="Total Costos Directos"
                    amount={-totalDirectCosts}
                    prevAmount={-Object.entries(prevExpensesByCategory)
                      .filter(([cat]) => expenseGroups['Costos Directos'].details.some(d => d.name === cat))
                      .reduce((s, [, a]) => s + a, 0)}
                    isSubtotal
                    isNegative
                  />
                </>
              )}

              {/* UTILIDAD BRUTA */}
              <tr className="bg-gradient-to-r from-emerald-50 to-emerald-50/50 font-bold border-b-2 border-emerald-200">
                <td className="px-5 py-4 text-emerald-800">UTILIDAD BRUTA</td>
                <td className={`px-5 py-4 text-right text-lg tabular-nums ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(grossProfit)}
                </td>
                <td className="px-5 py-4 text-right text-emerald-600 tabular-nums">{grossMargin.toFixed(1)}%</td>
                {compareMode && (
                  <>
                    <td className="px-5 py-4 text-right text-[#8888b0] tabular-nums">
                      {formatCurrency(previous.income - (Object.entries(prevExpensesByCategory)
                        .filter(([cat]) => expenseGroups['Costos Directos']?.details.some(d => d.name === cat))
                        .reduce((s, [, a]) => s + a, 0)))}
                    </td>
                    <td className="px-5 py-4 text-right">-</td>
                  </>
                )}
              </tr>

              {/* GASTOS OPERACIONALES */}
              <SectionHeader title="Gastos Operacionales" color="amber" />
              {['Gastos Administrativos', 'Gastos Operacionales', 'Gastos de Ventas'].map(groupName => {
                const group = expenseGroups[groupName];
                if (!group) return null;
                return (
                  <React.Fragment key={groupName}>
                    {group.details.map(item => (
                      <LineItem
                        key={item.name}
                        label={item.name}
                        amount={item.amount}
                        prevAmount={prevExpensesByCategory[item.name]}
                        isNegative
                        indent={1}
                      />
                    ))}
                  </React.Fragment>
                );
              })}
              <LineItem
                label="Total Gastos Operacionales"
                amount={-operationalExpenses}
                prevAmount={-['Gastos Administrativos', 'Gastos Operacionales', 'Gastos de Ventas']
                  .flatMap(g => expenseGroups[g]?.details || [])
                  .reduce((s, d) => s + (prevExpensesByCategory[d.name] || 0), 0)}
                isSubtotal
                isNegative
              />

              {/* UTILIDAD OPERACIONAL */}
              <tr className="bg-gradient-to-r from-blue-50 to-blue-50/50 font-bold border-b-2 border-blue-200">
                <td className="px-5 py-4 text-blue-800">UTILIDAD OPERACIONAL (EBIT)</td>
                <td className={`px-5 py-4 text-right text-lg tabular-nums ${operationalProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                  {formatCurrency(operationalProfit)}
                </td>
                <td className="px-5 py-4 text-right text-blue-600 tabular-nums">{operationalMargin.toFixed(1)}%</td>
                {compareMode && (
                  <>
                    <td className="px-5 py-4 text-right text-[#8888b0]">-</td>
                    <td className="px-5 py-4 text-right">-</td>
                  </>
                )}
              </tr>

              {/* OTROS GASTOS */}
              {(financialExpenses > 0 || otherExpenses > 0) && (
                <>
                  <SectionHeader title="Otros Ingresos / Gastos" color="slate" />
                  {expenseGroups['Gastos Financieros']?.details.map(item => (
                    <LineItem
                      key={item.name}
                      label={item.name}
                      amount={item.amount}
                      prevAmount={prevExpensesByCategory[item.name]}
                      isNegative
                      indent={1}
                    />
                  ))}
                  {expenseGroups['Otros Gastos']?.details.map(item => (
                    <LineItem
                      key={item.name}
                      label={item.name}
                      amount={item.amount}
                      prevAmount={prevExpensesByCategory[item.name]}
                      isNegative
                      indent={1}
                    />
                  ))}
                </>
              )}

              {/* UTILIDAD ANTES DE IMPUESTOS */}
              <tr className="bg-gradient-to-r from-indigo-50 to-indigo-50/50 font-bold border-b border-indigo-200">
                <td className="px-5 py-4 text-indigo-800">UTILIDAD ANTES DE IMPUESTOS</td>
                <td className={`px-5 py-4 text-right text-lg tabular-nums ${profitBeforeTax >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                  {formatCurrency(profitBeforeTax)}
                </td>
                <td className="px-5 py-4 text-right text-indigo-600 tabular-nums">
                  {current.income > 0 ? (profitBeforeTax / current.income * 100).toFixed(1) : 0}%
                </td>
                {compareMode && (
                  <>
                    <td className="px-5 py-4 text-right text-[#8888b0]">-</td>
                    <td className="px-5 py-4 text-right">-</td>
                  </>
                )}
              </tr>

              {/* IMPUESTOS */}
              {estimatedTax > 0 && (
                <LineItem
                  label="Provisión Impuestos (Est. 25%)"
                  amount={estimatedTax}
                  isNegative
                  showVariation={false}
                />
              )}

              {/* UTILIDAD NETA */}
              <tr className={`${netProfit >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-700' : 'bg-gradient-to-r from-rose-600 to-rose-700'}`}>
                <td className="px-5 py-5 font-bold text-white text-lg">UTILIDAD NETA</td>
                <td className="px-5 py-5 text-right font-bold text-white text-2xl tabular-nums">
                  {formatCurrency(netProfit)}
                </td>
                <td className="px-5 py-5 text-right text-white/80 font-bold tabular-nums">{netMargin.toFixed(1)}%</td>
                {compareMode && (
                  <>
                    <td className="px-5 py-5 text-right text-white/70 tabular-nums">
                      {formatCurrency(previous.profit)}
                    </td>
                    <td className="px-5 py-5 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1a2e]/20 text-white text-xs font-medium backdrop-blur-sm">
                        {calcVariation(netProfit, previous.profit) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(calcVariation(netProfit, previous.profit)).toFixed(1)}%
                      </span>
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas */}
      {projectsWithLoss.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-2xl transition-all duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-800">Proyectos con Pérdida</h4>
              <ul className="mt-2 text-sm text-amber-700 space-y-1.5">
                {projectsWithLoss.map(p => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="font-medium">{p.name}</span>: pérdida de {formatCurrency(Math.abs(p.margen))}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gastos por Categoría */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 shadow-sm border border-[#2a2a4a] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-bold text-[#d0d0e0] mb-5 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-50">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            Distribución de Gastos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(currentExpensesByCategory)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 8)}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2a2a4a" />
              <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6868a0' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#6868a0' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), 'Monto']}
                contentStyle={customTooltipStyle}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {Object.entries(currentExpensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rentabilidad por Proyecto */}
        <div className="bg-[#1a1a2e] rounded-2xl p-6 shadow-sm border border-[#2a2a4a] transition-all duration-300 hover:shadow-md">
          <h3 className="text-lg font-bold text-[#d0d0e0] mb-5 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-50">
              <Target size={18} className="text-indigo-600" />
            </div>
            Rentabilidad por Proyecto
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={projectChartData.slice(0, 6)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2a2a4a" />
              <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#6868a0' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#6868a0' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value), name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Margen']}
                contentStyle={customTooltipStyle}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[0, 6, 6, 0]} barSize={14} />
              <Bar dataKey="gastos" fill="#f43f5e" name="Gastos" radius={[0, 6, 6, 0]} barSize={14} />
              <Line type="monotone" dataKey="margen" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#1a1a2e' }} name="Margen" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla Detallada de Proyectos */}
      <div className="bg-[#1a1a2e] rounded-2xl shadow-sm border border-[#2a2a4a] overflow-hidden">
        <div className="px-6 py-5 border-b border-[#2a2a4a] bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-lg font-bold text-[#d0d0e0] tracking-tight">Análisis Detallado por Proyecto</h3>
          <p className="text-sm text-[#6868a0] mt-0.5">{getPeriodLabel()} · {projectChartData.length} proyectos</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[rgba(255,255,255,0.02)] border-b border-[#2a2a4a]">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Proyecto</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Ingresos</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Gastos</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Margen</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-[#6868a0] uppercase tracking-wider">% Margen</th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-[#6868a0] uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {projectChartData.map((project) => (
                <tr key={project.name} className="hover:bg-[rgba(59,130,246,0.08)]/30 transition-colors duration-150">
                  <td className="px-5 py-3.5 font-medium text-[#b8b8d0]">{project.name}</td>
                  <td className="px-5 py-3.5 text-right text-emerald-600 font-medium tabular-nums">{formatCurrency(project.ingresos)}</td>
                  <td className="px-5 py-3.5 text-right text-rose-600 font-medium tabular-nums">{formatCurrency(project.gastos)}</td>
                  <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${project.margen >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {project.margen >= 0 ? '' : '-'}{formatCurrency(Math.abs(project.margen))}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-bold tabular-nums ${project.margenPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {project.margenPercent.toFixed(1)}%
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      project.margenPercent >= 30 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                      project.margenPercent >= 0 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                      'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    }`}>
                      {project.margenPercent >= 30 ? 'Rentable' :
                       project.margenPercent >= 0 ? 'Bajo margen' :
                       'Pérdida'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[rgba(255,255,255,0.02)] font-bold border-t-2 border-[#2a2a4a]">
              <tr>
                <td className="px-5 py-4 text-[#d0d0e0]">TOTALES</td>
                <td className="px-5 py-4 text-right text-emerald-700 tabular-nums">{formatCurrency(current.income)}</td>
                <td className="px-5 py-4 text-right text-rose-700 tabular-nums">{formatCurrency(current.expenses)}</td>
                <td className={`px-5 py-4 text-right tabular-nums ${current.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {current.profit >= 0 ? '' : '-'}{formatCurrency(Math.abs(current.profit))}
                </td>
                <td className={`px-5 py-4 text-right tabular-nums ${grossMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {grossMargin.toFixed(1)}%
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
