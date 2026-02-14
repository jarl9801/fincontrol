import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Target, Activity, Clock, CreditCard, Wallet,
  BarChart3, PieChart as PieChartIcon, Lightbulb, Calendar, ChevronDown,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ExecutiveSummary = ({ transactions }) => {
  const now = new Date();
  const realCurrentMonth = now.getMonth();
  const realCurrentYear = now.getFullYear();

  // Period state
  const [selectedPeriod, setSelectedPeriod] = useState(`month:${realCurrentYear}-${String(realCurrentMonth + 1).padStart(2, '0')}`);
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
    monthSet.add(`${realCurrentYear}-${String(realCurrentMonth + 1).padStart(2, '0')}`);
    return Array.from(monthSet).sort().reverse();
  }, [transactions, realCurrentMonth, realCurrentYear]);

  // Group available months by year
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

  // Derive "current month/year" from selection
  const selectedMonth = useMemo(() => {
    if (periodType === 'month' && selectedMonthKey) {
      const [y, m] = selectedMonthKey.split('-').map(Number);
      return { month: m - 1, year: y };
    }
    return { month: realCurrentMonth, year: realCurrentYear };
  }, [periodType, selectedMonthKey, realCurrentMonth, realCurrentYear]);

  // Previous month relative to selected
  const prevMonthInfo = useMemo(() => {
    const m = selectedMonth.month === 0 ? 11 : selectedMonth.month - 1;
    const y = selectedMonth.month === 0 ? selectedMonth.year - 1 : selectedMonth.year;
    return { month: m, year: y };
  }, [selectedMonth]);

  // Navigate months
  const navigateMonth = (direction) => {
    if (periodType !== 'month' || !selectedMonthKey) return;
    const idx = availableMonths.indexOf(selectedMonthKey);
    const newIdx = idx - direction;
    if (newIdx >= 0 && newIdx < availableMonths.length) {
      setSelectedPeriod(`month:${availableMonths[newIdx]}`);
    }
  };

  const canNavigatePrev = periodType === 'month' && availableMonths.indexOf(selectedMonthKey) < availableMonths.length - 1;
  const canNavigateNext = periodType === 'month' && availableMonths.indexOf(selectedMonthKey) > 0;

  const formatMonthKey = (key) => {
    const [y, m] = key.split('-').map(Number);
    return `${MONTH_NAMES_FULL[m - 1]} ${y}`;
  };

  // Helper functions
  const getMonthTransactions = (month, year) => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year && t.status === 'paid';
    });
  };

  const getPeriodTransactions = (startDate, endDate) => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d >= startDate && d <= endDate && t.status === 'paid';
    });
  };

  // Filter by period (for quarter/year/all)
  const filterByPeriod = (trans, period, offset = 0) => {
    const transDate = new Date(trans.date);
    if (period === 'all') return true;
    if (period === 'quarter') {
      const currentQuarter = Math.floor(selectedMonth.month / 3);
      const targetQuarter = currentQuarter - offset;
      const targetYear = targetQuarter < 0 ? selectedMonth.year - 1 : selectedMonth.year;
      const adjustedQuarter = targetQuarter < 0 ? 4 + targetQuarter : targetQuarter;
      const transQuarter = Math.floor(transDate.getMonth() / 3);
      return transQuarter === adjustedQuarter && transDate.getFullYear() === targetYear;
    }
    if (period === 'year') {
      return transDate.getFullYear() === (selectedMonth.year - offset);
    }
    return true;
  };

  // Current period transactions based on selection
  const currentMonthTx = useMemo(() => {
    if (periodType === 'month') {
      return getMonthTransactions(selectedMonth.month, selectedMonth.year);
    }
    return transactions.filter(t => filterByPeriod(t, periodType, 0) && t.status === 'paid');
  }, [transactions, periodType, selectedMonth]);

  // Previous period transactions
  const prevMonthTx = useMemo(() => {
    if (periodType === 'month') {
      return getMonthTransactions(prevMonthInfo.month, prevMonthInfo.year);
    }
    return transactions.filter(t => filterByPeriod(t, periodType, 1) && t.status === 'paid');
  }, [transactions, periodType, prevMonthInfo, selectedMonth]);

  // Current month data
  const currentIncome = currentMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const currentExpenses = currentMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const currentProfit = currentIncome - currentExpenses;

  // Previous month data
  const prevIncome = prevMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevMonthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const prevProfit = prevIncome - prevExpenses;

  // Calculate variations
  const incomeVariation = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome * 100) : 0;
  const expenseVariation = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses * 100) : 0;
  const profitVariation = prevProfit !== 0 ? ((currentProfit - prevProfit) / Math.abs(prevProfit) * 100) : 0;

  // YTD data (relative to selected year)
  const ytdStart = new Date(selectedMonth.year, 0, 1);
  const ytdEnd = new Date(selectedMonth.year, selectedMonth.month + 1, 0, 23, 59, 59);
  const ytdTx = getPeriodTransactions(ytdStart, ytdEnd);
  const ytdIncome = ytdTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const ytdExpenses = ytdTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const ytdProfit = ytdIncome - ytdExpenses;

  // Pending amounts (CXC and CXP) - these are always global/current
  const cxc = transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);
  const cxp = transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((s, t) => s + t.amount, 0);

  // Financial ratios
  const grossMargin = currentIncome > 0 ? (currentProfit / currentIncome * 100) : 0;
  const expenseRatio = currentIncome > 0 ? (currentExpenses / currentIncome * 100) : 0;
  const liquidityRatio = cxp > 0 ? (cxc / cxp) : cxc > 0 ? 999 : 1;
  const workingCapital = cxc - cxp;

  // Days calculation (simplified)
  const avgDaysReceivable = cxc > 0 && currentIncome > 0 ? Math.round((cxc / (currentIncome / 30))) : 0;
  const avgDaysPayable = cxp > 0 && currentExpenses > 0 ? Math.round((cxp / (currentExpenses / 30))) : 0;
  const cashCycle = avgDaysReceivable - avgDaysPayable;

  // Last 6 months trend (relative to selected month)
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(selectedMonth.year, selectedMonth.month - i, 1);
    const month = m.getMonth();
    const year = m.getFullYear();
    const tx = getMonthTransactions(month, year);
    const income = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    last6Months.push({
      name: MONTH_NAMES_SHORT[month],
      ingresos: income,
      gastos: expenses,
      utilidad: income - expenses
    });
  }

  // Project profitability analysis (scoped to current period)
  const projectData = {};
  currentMonthTx.forEach(t => {
    if (!projectData[t.project]) {
      projectData[t.project] = { name: t.project, ingresos: 0, gastos: 0 };
    }
    if (t.type === 'income') projectData[t.project].ingresos += t.amount;
    else projectData[t.project].gastos += t.amount;
  });

  const projectsWithLowMargin = Object.values(projectData)
    .map(p => ({ ...p, margin: p.ingresos > 0 ? ((p.ingresos - p.gastos) / p.ingresos * 100) : -100 }))
    .filter(p => p.margin < 20)
    .sort((a, b) => a.margin - b.margin);

  // Overdue transactions
  const overdueTransactions = transactions.filter(t => {
    if (t.status !== 'pending') return false;
    const daysOverdue = Math.floor((now - new Date(t.date)) / (1000 * 60 * 60 * 24));
    return daysOverdue > 30;
  });

  // Alerts and recommendations
  const alerts = [];
  const recommendations = [];

  if (liquidityRatio < 1) {
    alerts.push({ type: 'danger', text: 'Ratio de liquidez bajo: CXP supera CXC' });
    recommendations.push('Acelerar cobro de facturas pendientes o negociar plazos con proveedores');
  }
  if (grossMargin < 20) {
    alerts.push({ type: 'warning', text: `Margen bruto bajo: ${grossMargin.toFixed(1)}%` });
    recommendations.push('Revisar estructura de costos y evaluar ajuste de precios');
  }
  if (projectsWithLowMargin.length > 0) {
    alerts.push({ type: 'warning', text: `${projectsWithLowMargin.length} proyectos con margen < 20%` });
    recommendations.push('Analizar rentabilidad de proyectos y renegociar contratos');
  }
  if (overdueTransactions.length > 0) {
    const overdueAmount = overdueTransactions.reduce((s, t) => s + t.amount, 0);
    alerts.push({ type: 'danger', text: `${overdueTransactions.length} facturas vencidas (+30 días): ${formatCurrency(overdueAmount)}` });
    recommendations.push('Gestionar cobranza de facturas vencidas urgentemente');
  }
  if (expenseVariation > 15) {
    alerts.push({ type: 'warning', text: `Gastos aumentaron ${expenseVariation.toFixed(1)}% vs período anterior` });
    recommendations.push('Revisar gastos extraordinarios y evaluar medidas de control');
  }
  if (cashCycle > 45) {
    alerts.push({ type: 'info', text: `Ciclo de caja de ${cashCycle} días` });
    recommendations.push('Optimizar ciclo de conversión de efectivo');
  }

  if (alerts.length === 0) {
    alerts.push({ type: 'success', text: 'Indicadores financieros dentro de parámetros saludables' });
  }

  // Period labels
  const getPeriodLabel = () => {
    if (periodType === 'month' && selectedMonthKey) {
      return formatMonthKey(selectedMonthKey);
    }
    if (periodType === 'quarter') return `Q${Math.floor(selectedMonth.month / 3) + 1} ${selectedMonth.year}`;
    if (periodType === 'year') return `Año ${selectedMonth.year}`;
    return 'Todo el período';
  };

  const getPreviousPeriodLabel = () => {
    if (periodType === 'month') {
      return `${MONTH_NAMES_FULL[prevMonthInfo.month]} ${prevMonthInfo.year}`;
    }
    if (periodType === 'quarter') return `Q${Math.floor(selectedMonth.month / 3)} ${selectedMonth.year}`;
    if (periodType === 'year') return `Año ${selectedMonth.year - 1}`;
    return '';
  };

  const KPICard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      emerald: 'from-emerald-500 to-emerald-600',
      rose: 'from-rose-500 to-rose-600',
      amber: 'from-amber-500 to-amber-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white`}>
              <Icon size={20} />
            </div>
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}>
                {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(trendValue).toFixed(1)}%
              </div>
            )}
          </div>
          <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    );
  };

  const RatioIndicator = ({ label, value, benchmark, unit = '', inverse = false }) => {
    let status = 'good';
    if (inverse) {
      if (value > benchmark * 1.2) status = 'bad';
      else if (value > benchmark) status = 'warning';
    } else {
      if (value < benchmark * 0.8) status = 'bad';
      else if (value < benchmark) status = 'warning';
    }

    const statusColors = {
      good: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      bad: 'bg-rose-100 text-rose-700 border-rose-200'
    };

    const dotColors = {
      good: 'bg-emerald-500',
      warning: 'bg-amber-500',
      bad: 'bg-rose-500'
    };

    return (
      <div className={`flex items-center justify-between p-3 rounded-xl border ${statusColors[status]}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="font-bold">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Period Selector */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center">
              <button
                onClick={() => navigateMonth(-1)}
                disabled={!canNavigatePrev}
                className="p-2 rounded-l-xl border border-r-0 border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-slate-500" />
              </button>

              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-all ${
                  periodType === 'month'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} />
                {periodType === 'month' ? formatMonthKey(selectedMonthKey) : 'Mes'}
                <ChevronDown size={14} className={`transition-transform duration-200 ${monthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => navigateMonth(1)}
                disabled={!canNavigateNext}
                className="p-2 rounded-r-xl border border-l-0 border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-slate-500" />
              </button>
            </div>

            {monthDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 py-2 min-w-[220px] max-h-[320px] overflow-y-auto animate-[fadeIn_150ms_ease-out]">
                {monthsByYear.map(([year, months]) => (
                  <div key={year}>
                    <div className="px-4 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white">
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
                              ? 'bg-slate-100 text-slate-800 font-semibold'
                              : 'text-slate-600 hover:bg-slate-50'
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

          <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

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
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {periodType !== 'all' && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              Actual: <span className="font-medium text-slate-600">{getPeriodLabel()}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Anterior: <span className="font-medium text-slate-500">{getPreviousPeriodLabel()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Resumen Ejecutivo</h2>
            <p className="text-slate-300 mt-1">{getPeriodLabel()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">Utilidad YTD</p>
            <p className={`text-3xl font-bold ${ytdProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(ytdProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ingresos del Período"
          value={formatCurrency(currentIncome)}
          subtitle={`vs ${formatCurrency(prevIncome)} período anterior`}
          icon={TrendingUp}
          trend={incomeVariation >= 0 ? 'up' : 'down'}
          trendValue={incomeVariation}
          color="emerald"
        />
        <KPICard
          title="Gastos del Período"
          value={formatCurrency(currentExpenses)}
          subtitle={`vs ${formatCurrency(prevExpenses)} período anterior`}
          icon={TrendingDown}
          trend={expenseVariation <= 0 ? 'up' : 'down'}
          trendValue={expenseVariation}
          color="rose"
        />
        <KPICard
          title="Utilidad Neta"
          value={formatCurrency(currentProfit)}
          subtitle={`Margen: ${grossMargin.toFixed(1)}%`}
          icon={DollarSign}
          trend={profitVariation >= 0 ? 'up' : 'down'}
          trendValue={profitVariation}
          color="blue"
        />
        <KPICard
          title="Capital de Trabajo"
          value={formatCurrency(workingCapital)}
          subtitle={`CXC: ${formatCurrency(cxc)} | CXP: ${formatCurrency(cxp)}`}
          icon={Wallet}
          color={workingCapital >= 0 ? 'indigo' : 'amber'}
        />
      </div>

      {/* Financial Indicators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ratios de Liquidez */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Indicadores de Liquidez</h3>
              <p className="text-xs text-slate-500">Capacidad de pago a corto plazo</p>
            </div>
          </div>
          <div className="space-y-3">
            <RatioIndicator label="Ratio Corriente (CXC/CXP)" value={liquidityRatio} benchmark={1.5} unit="x" />
            <RatioIndicator label="Días Promedio Cobro" value={avgDaysReceivable} benchmark={30} unit=" días" inverse />
            <RatioIndicator label="Días Promedio Pago" value={avgDaysPayable} benchmark={30} unit=" días" inverse />
            <RatioIndicator label="Ciclo de Caja" value={cashCycle} benchmark={30} unit=" días" inverse />
          </div>
        </div>

        {/* Ratios de Rentabilidad */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Percent className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Indicadores de Rentabilidad</h3>
              <p className="text-xs text-slate-500">Eficiencia en generación de utilidades</p>
            </div>
          </div>
          <div className="space-y-3">
            <RatioIndicator label="Margen Bruto" value={grossMargin} benchmark={30} unit="%" />
            <RatioIndicator label="Ratio de Gastos" value={expenseRatio} benchmark={70} unit="%" inverse />
            <RatioIndicator
              label="Margen YTD"
              value={ytdIncome > 0 ? (ytdProfit / ytdIncome * 100) : 0}
              benchmark={25}
              unit="%"
            />
            <RatioIndicator
              label="Proyectos Rentables"
              value={Object.values(projectData).filter(p => (p.ingresos - p.gastos) > 0).length}
              benchmark={Object.keys(projectData).length * 0.8}
              unit={` / ${Object.keys(projectData).length}`}
            />
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="text-amber-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Alertas Financieras</h3>
              <p className="text-xs text-slate-500">Puntos de atención identificados</p>
            </div>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  alert.type === 'danger' ? 'bg-rose-50 border border-rose-200' :
                  alert.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  alert.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                {alert.type === 'success' ? (
                  <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                ) : (
                  <AlertTriangle className={`flex-shrink-0 mt-0.5 ${
                    alert.type === 'danger' ? 'text-rose-600' :
                    alert.type === 'warning' ? 'text-amber-600' :
                    'text-blue-600'
                  }`} size={16} />
                )}
                <span className={`text-sm ${
                  alert.type === 'danger' ? 'text-rose-700' :
                  alert.type === 'warning' ? 'text-amber-700' :
                  alert.type === 'success' ? 'text-emerald-700' :
                  'text-blue-700'
                }`}>
                  {alert.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Lightbulb className="text-indigo-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Recomendaciones</h3>
              <p className="text-xs text-slate-500">Acciones sugeridas para mejorar</p>
            </div>
          </div>
          <div className="space-y-2">
            {recommendations.length > 0 ? recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                <Target className="text-indigo-600 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-sm text-indigo-700">{rec}</span>
              </div>
            )) : (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0 mt-0.5" size={16} />
                <span className="text-sm text-emerald-700">
                  No hay recomendaciones urgentes. Mantener buenas prácticas financieras.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Month Trend Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Tendencia Últimos 6 Meses</h3>
            <p className="text-xs text-slate-500">Evolución de ingresos, gastos y utilidad</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={last6Months}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#colorIngresos)" />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#f43f5e" strokeWidth={2} fill="url(#colorGastos)" />
            <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projects with Low Margin */}
      {projectsWithLowMargin.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-amber-50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-amber-600" size={20} />
              <div>
                <h3 className="font-bold text-amber-800">Proyectos con Margen Bajo (&lt;20%)</h3>
                <p className="text-xs text-amber-600">Requieren atención para mejorar rentabilidad</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ingresos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Gastos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Margen</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectsWithLowMargin.slice(0, 5).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{p.name}</td>
                      <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(p.ingresos)}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(p.gastos)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${p.margin >= 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {p.margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.margin < 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {p.margin < 0 ? 'Pérdida' : 'Bajo Margen'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
