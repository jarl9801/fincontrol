import React, { useState } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Download, DollarSign, Percent,
  Target, AlertTriangle, ArrowUpRight, ArrowDownRight, FileText, Calendar
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { exportReportToPDF } from '../../utils/pdfExport';
import {
  BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';

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

const Reports = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('year');
  const [compareMode, setCompareMode] = useState(true);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filtrar por período
  const filterByPeriod = (trans, period, offset = 0) => {
    const transDate = new Date(trans.date);

    if (period === 'all') return true;

    if (period === 'month') {
      const targetMonth = currentMonth - offset;
      const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
      const adjustedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth;
      return transDate.getMonth() === adjustedMonth && transDate.getFullYear() === targetYear;
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

  const currentPeriodTx = transactions.filter(t => filterByPeriod(t, selectedPeriod, 0) && t.status === 'paid');
  const previousPeriodTx = transactions.filter(t => filterByPeriod(t, selectedPeriod, 1) && t.status === 'paid');

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
  const estimatedTax = profitBeforeTax > 0 ? profitBeforeTax * 0.25 : 0; // 25% estimado
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
  const getPeriodLabel = (period) => {
    if (period === 'month') return now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    if (period === 'quarter') return `Q${Math.floor(currentMonth / 3) + 1} ${currentYear}`;
    if (period === 'year') return `Año ${currentYear}`;
    return 'Todo el período';
  };

  const LineItem = ({ label, amount, prevAmount, isSubtotal = false, isTotal = false, isNegative = false, indent = 0, showVariation = true }) => {
    const variation = prevAmount !== undefined && showVariation ? calcVariation(amount, prevAmount) : null;
    const percentOfIncome = current.income > 0 ? (Math.abs(amount) / current.income * 100) : 0;

    return (
      <tr className={`
        ${isTotal ? 'bg-slate-800 text-white' : ''}
        ${isSubtotal ? 'bg-slate-100 font-semibold' : ''}
        ${!isTotal && !isSubtotal ? 'hover:bg-slate-50' : ''}
        border-b border-slate-200
      `}>
        <td className={`px-4 py-3 ${indent > 0 ? 'pl-8' : ''} ${isTotal ? 'font-bold text-lg' : ''}`}>
          {label}
        </td>
        <td className={`px-4 py-3 text-right ${isTotal ? 'text-lg' : 'text-sm'} ${
          isNegative ? (isTotal ? 'text-white' : 'text-slate-600') : ''
        }`}>
          {isNegative && !isTotal ? '(' : ''}{formatCurrency(Math.abs(amount))}{isNegative && !isTotal ? ')' : ''}
        </td>
        <td className={`px-4 py-3 text-right text-sm ${isTotal ? 'text-slate-300' : 'text-slate-500'}`}>
          {percentOfIncome.toFixed(1)}%
        </td>
        {compareMode && (
          <>
            <td className={`px-4 py-3 text-right text-sm ${isTotal ? 'text-slate-300' : 'text-slate-500'}`}>
              {prevAmount !== undefined ? formatCurrency(prevAmount) : '-'}
            </td>
            <td className="px-4 py-3 text-right">
              {variation !== null && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                  variation >= 0
                    ? (isNegative ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')
                    : (isNegative ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')
                }`}>
                  {variation >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
      emerald: 'bg-emerald-600 text-white',
      rose: 'bg-rose-600 text-white',
      blue: 'bg-blue-600 text-white',
      amber: 'bg-amber-600 text-white',
      slate: 'bg-slate-700 text-white'
    };

    return (
      <tr className={colors[color]}>
        <td colSpan={compareMode ? 5 : 3} className="px-4 py-2 font-bold text-sm uppercase tracking-wide">
          {title}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'month', label: 'Este Mes' },
              { key: 'quarter', label: 'Este Trimestre' },
              { key: 'year', label: 'Este Año' },
              { key: 'all', label: 'Todo' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Comparar con período anterior
            </label>
            <button
              onClick={() => exportReportToPDF(currentPeriodTx, 'general')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Download size={16} />
              Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingUp size={16} className="text-emerald-500" />
            Ingresos
          </div>
          <div className="text-2xl font-bold text-emerald-600">{formatCurrency(current.income)}</div>
          {compareMode && previous.income > 0 && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              calcVariation(current.income, previous.income) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {calcVariation(current.income, previous.income) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(calcVariation(current.income, previous.income)).toFixed(1)}% vs anterior
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <TrendingDown size={16} className="text-rose-500" />
            Gastos
          </div>
          <div className="text-2xl font-bold text-rose-600">{formatCurrency(current.expenses)}</div>
          {compareMode && previous.expenses > 0 && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${
              calcVariation(current.expenses, previous.expenses) <= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {calcVariation(current.expenses, previous.expenses) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(calcVariation(current.expenses, previous.expenses)).toFixed(1)}% vs anterior
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <DollarSign size={16} className="text-blue-500" />
            Utilidad Neta
          </div>
          <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(netProfit)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Margen: {netMargin.toFixed(1)}%</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
            <Percent size={16} className="text-indigo-500" />
            Margen Operacional
          </div>
          <div className={`text-2xl font-bold ${operationalMargin >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {operationalMargin.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">EBIT: {formatCurrency(operationalProfit)}</div>
        </div>
      </div>

      {/* Estado de Resultados Profesional */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-900">
          <div className="flex items-center gap-3">
            <FileText className="text-white" size={24} />
            <div>
              <h3 className="text-lg font-bold text-white">Estado de Resultados</h3>
              <p className="text-sm text-slate-300">{getPeriodLabel(selectedPeriod)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={16} />
            Período: {getPeriodLabel(selectedPeriod)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Concepto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">% Ingresos</th>
                {compareMode && (
                  <>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Anterior</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Variación</th>
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
              <tr className="bg-emerald-50 font-bold border-b-2 border-emerald-200">
                <td className="px-4 py-3 text-emerald-800">UTILIDAD BRUTA</td>
                <td className={`px-4 py-3 text-right text-lg ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrency(grossProfit)}
                </td>
                <td className="px-4 py-3 text-right text-emerald-600">{grossMargin.toFixed(1)}%</td>
                {compareMode && (
                  <>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(previous.income - (Object.entries(prevExpensesByCategory)
                        .filter(([cat]) => expenseGroups['Costos Directos']?.details.some(d => d.name === cat))
                        .reduce((s, [, a]) => s + a, 0)))}
                    </td>
                    <td className="px-4 py-3 text-right">-</td>
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
              <tr className="bg-blue-50 font-bold border-b-2 border-blue-200">
                <td className="px-4 py-3 text-blue-800">UTILIDAD OPERACIONAL (EBIT)</td>
                <td className={`px-4 py-3 text-right text-lg ${operationalProfit >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                  {formatCurrency(operationalProfit)}
                </td>
                <td className="px-4 py-3 text-right text-blue-600">{operationalMargin.toFixed(1)}%</td>
                {compareMode && (
                  <>
                    <td className="px-4 py-3 text-right text-slate-500">-</td>
                    <td className="px-4 py-3 text-right">-</td>
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
              <tr className="bg-indigo-50 font-bold border-b border-indigo-200">
                <td className="px-4 py-3 text-indigo-800">UTILIDAD ANTES DE IMPUESTOS</td>
                <td className={`px-4 py-3 text-right text-lg ${profitBeforeTax >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                  {formatCurrency(profitBeforeTax)}
                </td>
                <td className="px-4 py-3 text-right text-indigo-600">
                  {current.income > 0 ? (profitBeforeTax / current.income * 100).toFixed(1) : 0}%
                </td>
                {compareMode && (
                  <>
                    <td className="px-4 py-3 text-right text-slate-500">-</td>
                    <td className="px-4 py-3 text-right">-</td>
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
              <tr className={`${netProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                <td className="px-4 py-4 font-bold text-white text-lg">UTILIDAD NETA</td>
                <td className="px-4 py-4 text-right font-bold text-white text-2xl">
                  {formatCurrency(netProfit)}
                </td>
                <td className="px-4 py-4 text-right text-white/80 font-bold">{netMargin.toFixed(1)}%</td>
                {compareMode && (
                  <>
                    <td className="px-4 py-4 text-right text-white/70">
                      {formatCurrency(previous.profit)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/20 text-white text-xs font-medium">
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
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-800">Proyectos con Pérdida</h4>
              <ul className="mt-2 text-sm text-amber-700 space-y-1">
                {projectsWithLoss.map(p => (
                  <li key={p.name}>
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
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
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
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [formatCurrency(value), 'Monto']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {Object.entries(currentExpensesByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index < 3 ? '#f97316' : '#3b82f6'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rentabilidad por Proyecto */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target size={20} />
            Rentabilidad por Proyecto
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={projectChartData.slice(0, 6)}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value, name) => [formatCurrency(value), name === 'ingresos' ? 'Ingresos' : name === 'gastos' ? 'Gastos' : 'Margen']} />
              <Legend />
              <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="gastos" fill="#f43f5e" name="Gastos" radius={[0, 4, 4, 0]} barSize={16} />
              <Line type="monotone" dataKey="margen" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} name="Margen" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla Detallada de Proyectos */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Análisis Detallado por Proyecto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Ingresos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Gastos</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Margen</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">% Margen</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectChartData.map((project) => (
                <tr key={project.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-700">{project.name}</td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCurrency(project.ingresos)}</td>
                  <td className="px-4 py-3 text-right text-rose-600 font-medium">{formatCurrency(project.gastos)}</td>
                  <td className={`px-4 py-3 text-right font-bold ${project.margen >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {project.margen >= 0 ? '' : '-'}{formatCurrency(Math.abs(project.margen))}
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${project.margenPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {project.margenPercent.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.margenPercent >= 30 ? 'bg-emerald-100 text-emerald-800' :
                      project.margenPercent >= 0 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {project.margenPercent >= 30 ? 'Rentable' :
                       project.margenPercent >= 0 ? 'Bajo margen' :
                       'Pérdida'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold">
              <tr>
                <td className="px-4 py-3 text-slate-800">TOTALES</td>
                <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(current.income)}</td>
                <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(current.expenses)}</td>
                <td className={`px-4 py-3 text-right ${current.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {current.profit >= 0 ? '' : '-'}{formatCurrency(Math.abs(current.profit))}
                </td>
                <td className={`px-4 py-3 text-right ${grossMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
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
