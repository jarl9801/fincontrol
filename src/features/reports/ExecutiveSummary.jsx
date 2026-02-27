import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Percent, AlertTriangle, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Target, Activity, Clock, CreditCard, Wallet,
  BarChart3, PieChart as PieChartIcon, Lightbulb, Calendar, ChevronDown,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { FINANCIAL_CONSTANTS } from '../../constants/config';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MONTH_NAMES_FULL = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const MONTH_NAMES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const KPI_COLOR_CLASSES = {
  blue: 'from-[#0a84ff] to-[#0070e0]',
  emerald: 'from-[#30d158] to-[#28c74e]',
  rose: 'from-[#ff453a] to-[#e63b31]',
  amber: 'from-[#ff9f0a] to-[#e68f09]',
  indigo: 'from-[#5e5ce6] to-[#4f4dd4]'
};

const KPICard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'blue' }) => (
  <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] overflow-hidden">
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${KPI_COLOR_CLASSES[color]} text-white`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
            trend === 'up' ? 'bg-[rgba(16,185,129,0.12)] text-[#30d158]' : 'bg-[rgba(239,68,68,0.12)] text-[#ff453a]'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trendValue).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-[#8e8e93] mb-1">{title}</h3>
      <p className="text-2xl font-bold text-[#e5e5ea]">{value}</p>
      {subtitle && <p className="text-xs text-[#636366] mt-1">{subtitle}</p>}
    </div>
  </div>
);

const RATIO_STATUS_COLORS = {
  good: 'bg-[rgba(16,185,129,0.12)] text-[#30d158] border-[rgba(16,185,129,0.25)]',
  warning: 'bg-[rgba(245,158,11,0.12)] text-[#ff9f0a] border-[rgba(245,158,11,0.25)]',
  bad: 'bg-[rgba(239,68,68,0.12)] text-[#ff453a] border-[rgba(239,68,68,0.25)]'
};

const RATIO_DOT_COLORS = {
  good: 'bg-[#30d158]',
  warning: 'bg-[#ff9f0a]',
  bad: 'bg-[#ff453a]'
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

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${RATIO_STATUS_COLORS[status]}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${RATIO_DOT_COLORS[status]}`} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="font-bold">{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1c1c1e] p-3 rounded-xl shadow-lg border border-[rgba(255,255,255,0.08)]">
        <p className="text-sm font-semibold text-[#c7c7cc] mb-2">{label}</p>
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
  const avgDaysReceivable = cxc > 0 && currentIncome > 0 ? Math.round((cxc / (currentIncome / FINANCIAL_CONSTANTS.DAYS_PER_MONTH))) : 0;
  const avgDaysPayable = cxp > 0 && currentExpenses > 0 ? Math.round((cxp / (currentExpenses / FINANCIAL_CONSTANTS.DAYS_PER_MONTH))) : 0;
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
    .filter(p => p.margin < FINANCIAL_CONSTANTS.MARGIN_WARNING_PERCENT)
    .sort((a, b) => a.margin - b.margin);

  // Overdue transactions
  const overdueTransactions = transactions.filter(t => {
    if (t.status !== 'pending') return false;
    const daysOverdue = Math.floor((now - new Date(t.date)) / (1000 * 60 * 60 * 24));
    return daysOverdue > FINANCIAL_CONSTANTS.DAYS_PER_MONTH;
  });

  // Alerts and recommendations
  const alerts = [];
  const recommendations = [];

  if (liquidityRatio < 1) {
    alerts.push({ type: 'danger', text: 'Ratio de liquidez bajo: CXP supera CXC' });
    recommendations.push('Acelerar cobro de facturas pendientes o negociar plazos con proveedores');
  }
  if (grossMargin < FINANCIAL_CONSTANTS.MARGIN_WARNING_PERCENT) {
    alerts.push({ type: 'warning', text: `Margen bruto bajo: ${grossMargin.toFixed(1)}%` });
    recommendations.push('Revisar estructura de costos y evaluar ajuste de precios');
  }
  if (projectsWithLowMargin.length > 0) {
    alerts.push({ type: 'warning', text: `${projectsWithLowMargin.length} proyectos con margen < ${FINANCIAL_CONSTANTS.MARGIN_WARNING_PERCENT}%` });
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
  if (cashCycle > FINANCIAL_CONSTANTS.CASH_CYCLE_WARNING_DAYS) {
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Period Selector */}
      <div className="bg-[#1c1c1e] rounded-2xl p-5 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center">
              <button
                onClick={() => navigateMonth(-1)}
                disabled={!canNavigatePrev}
                className="p-2 rounded-l-xl border border-r-0 border-[rgba(255,255,255,0.08)] bg-[#1c1c1e] hover:bg-[#111111] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="text-[#8e8e93]" />
              </button>

              <button
                onClick={() => setMonthDropdownOpen(!monthDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 border text-sm font-medium transition-all ${
                  periodType === 'month'
                    ? 'bg-[#2c2c2e] text-white border-[rgba(255,255,255,0.08)] shadow-sm'
                    : 'bg-[#1c1c1e] text-[#98989d] border-[rgba(255,255,255,0.08)] hover:bg-[#111111]'
                }`}
              >
                <Calendar size={15} />
                {periodType === 'month' ? formatMonthKey(selectedMonthKey) : 'Mes'}
                <ChevronDown size={14} className={`transition-transform duration-200 ${monthDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => navigateMonth(1)}
                disabled={!canNavigateNext}
                className="p-2 rounded-r-xl border border-l-0 border-[rgba(255,255,255,0.08)] bg-[#1c1c1e] hover:bg-[#111111] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} className="text-[#8e8e93]" />
              </button>
            </div>

            {monthDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 z-50 bg-[#1c1c1e] rounded-xl shadow-xl border border-[rgba(255,255,255,0.08)] py-2 min-w-[220px] max-h-[320px] overflow-y-auto animate-[fadeIn_150ms_ease-out]">
                {monthsByYear.map(([year, months]) => (
                  <div key={year}>
                    <div className="px-4 py-1.5 text-xs font-bold text-[#636366] uppercase tracking-wider sticky top-0 bg-[#1c1c1e]">
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
                              ? 'bg-[#2c2c2e] text-[#e5e5ea] font-semibold'
                              : 'text-[#98989d] hover:bg-[#111111]'
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

          <div className="w-px h-8 bg-[#2c2c2e] mx-1 hidden sm:block" />

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
                  ? 'bg-[#2c2c2e] text-white shadow-sm'
                  : 'bg-[#111111] text-[#98989d] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {periodType !== 'all' && (
          <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)] flex items-center gap-4 text-xs text-[#636366]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[rgba(255,255,255,0.14)]" />
              Actual: <span className="font-medium text-[#98989d]">{getPeriodLabel()}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#636366]" />
              Anterior: <span className="font-medium text-[#8e8e93]">{getPreviousPeriodLabel()}</span>
            </span>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c2c2e] to-[#1c1c1e] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Resumen Ejecutivo</h2>
            <p className="text-[#636366] mt-1">{getPeriodLabel()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#636366]">Utilidad YTD</p>
            <p className={`text-3xl font-bold ${ytdProfit >= 0 ? 'text-[#30d158]' : 'text-[#ff453a]'}`}>
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
        <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[rgba(59,130,246,0.12)] rounded-lg">
              <Activity className="text-[#0a84ff]" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#e5e5ea]">Indicadores de Liquidez</h3>
              <p className="text-xs text-[#8e8e93]">Capacidad de pago a corto plazo</p>
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
        <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[rgba(16,185,129,0.12)] rounded-lg">
              <Percent className="text-[#30d158]" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#e5e5ea]">Indicadores de Rentabilidad</h3>
              <p className="text-xs text-[#8e8e93]">Eficiencia en generación de utilidades</p>
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
        <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[rgba(245,158,11,0.12)] rounded-lg">
              <AlertTriangle className="text-[#ff9f0a]" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#e5e5ea]">Alertas Financieras</h3>
              <p className="text-xs text-[#8e8e93]">Puntos de atención identificados</p>
            </div>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-xl ${
                  alert.type === 'danger' ? 'bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.25)]' :
                  alert.type === 'warning' ? 'bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)]' :
                  alert.type === 'success' ? 'bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)]' :
                  'bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.25)]'
                }`}
              >
                {alert.type === 'success' ? (
                  <CheckCircle2 className="text-[#30d158] flex-shrink-0 mt-0.5" size={16} />
                ) : (
                  <AlertTriangle className={`flex-shrink-0 mt-0.5 ${
                    alert.type === 'danger' ? 'text-[#ff453a]' :
                    alert.type === 'warning' ? 'text-[#ff9f0a]' :
                    'text-[#0a84ff]'
                  }`} size={16} />
                )}
                <span className={`text-sm ${
                  alert.type === 'danger' ? 'text-[#ff453a]' :
                  alert.type === 'warning' ? 'text-[#ff9f0a]' :
                  alert.type === 'success' ? 'text-[#30d158]' :
                  'text-[#0a84ff]'
                }`}>
                  {alert.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[rgba(99,102,241,0.12)] rounded-lg">
              <Lightbulb className="text-[#5e5ce6]" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#e5e5ea]">Recomendaciones</h3>
              <p className="text-xs text-[#8e8e93]">Acciones sugeridas para mejorar</p>
            </div>
          </div>
          <div className="space-y-2">
            {recommendations.length > 0 ? recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(99,102,241,0.08)] border border-[rgba(99,102,241,0.25)]">
                <Target className="text-[#5e5ce6] flex-shrink-0 mt-0.5" size={16} />
                <span className="text-sm text-[#5e5ce6]">{rec}</span>
              </div>
            )) : (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)]">
                <CheckCircle2 className="text-[#30d158] flex-shrink-0 mt-0.5" size={16} />
                <span className="text-sm text-[#30d158]">
                  No hay recomendaciones urgentes. Mantener buenas prácticas financieras.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6-Month Trend Chart */}
      <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[rgba(59,130,246,0.12)] rounded-lg">
            <BarChart3 className="text-[#0a84ff]" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-[#e5e5ea]">Tendencia Últimos 6 Meses</h3>
            <p className="text-xs text-[#8e8e93]">Evolución de ingresos, gastos y utilidad</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={last6Months}>
            <defs>
              <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#30d158" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#30d158" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff453a" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ff453a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#636366', fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#30d158" strokeWidth={2} fill="url(#colorIngresos)" />
            <Area type="monotone" dataKey="gastos" name="Gastos" stroke="#ff453a" strokeWidth={2} fill="url(#colorGastos)" />
            <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke="#0a84ff" strokeWidth={3} dot={{ fill: '#0a84ff', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Projects with Low Margin */}
      {projectsWithLowMargin.length > 0 && (
        <div className="bg-[#1c1c1e] rounded-2xl shadow-sm border border-[rgba(255,255,255,0.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(245,158,11,0.08)]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-[#ff9f0a]" size={20} />
              <div>
                <h3 className="font-bold text-[#ff9f0a]">Proyectos con Margen Bajo (&lt;20%)</h3>
                <p className="text-xs text-[#ff9f0a]">Requieren atención para mejorar rentabilidad</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#111111]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#8e8e93] uppercase">Proyecto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#8e8e93] uppercase">Ingresos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#8e8e93] uppercase">Gastos</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[#8e8e93] uppercase">Margen</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#8e8e93] uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.08)]">
                  {projectsWithLowMargin.slice(0, 5).map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#111111]">
                      <td className="px-4 py-3 font-medium text-[#c7c7cc]">{p.name}</td>
                      <td className="px-4 py-3 text-right text-[#30d158]">{formatCurrency(p.ingresos)}</td>
                      <td className="px-4 py-3 text-right text-[#ff453a]">{formatCurrency(p.gastos)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${p.margin >= 0 ? 'text-[#ff9f0a]' : 'text-[#ff453a]'}`}>
                        {p.margin.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.margin < 0 ? 'bg-[rgba(239,68,68,0.12)] text-[#ff453a]' : 'bg-[rgba(245,158,11,0.12)] text-[#ff9f0a]'
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
