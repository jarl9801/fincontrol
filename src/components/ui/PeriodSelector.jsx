import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PERIOD_OPTIONS = {
  month: { label: 'Mes', key: 'month' },
  quarter: { label: 'Trimestre', key: 'quarter' },
  semester: { label: 'Semestre', key: 'semester' },
  annual: { label: 'Anual', key: 'annual' },
};

const getSubOptions = (periodType) => {
  switch (periodType) {
    case 'month':
      return MONTH_NAMES.map((m, i) => ({ value: i + 1, label: m }));
    case 'quarter':
      return [
        { value: 1, label: 'Q1 (Ene–Mar)' },
        { value: 2, label: 'Q2 (Abr–Jun)' },
        { value: 3, label: 'Q3 (Jul–Sep)' },
        { value: 4, label: 'Q4 (Oct–Dic)' },
      ];
    case 'semester':
      return [
        { value: 1, label: 'H1 (Ene–Jun)' },
        { value: 2, label: 'H2 (Jul–Dic)' },
      ];
    case 'annual':
      return [];
    default:
      return [];
  }
};

/**
 * Returns a filter function that takes a transaction and returns boolean.
 */
const buildFilterFn = (year, periodType, periodValue) => {
  return (t) => {
    if (!t.date) return false;
    const d = new Date(t.date);
    const tYear = d.getFullYear();
    const tMonth = d.getMonth() + 1; // 1-12

    // Year filter
    if (year !== 'all' && tYear !== year) return false;

    // Period filter
    if (periodType === 'month' && periodValue) {
      return tMonth === periodValue;
    }
    if (periodType === 'quarter' && periodValue) {
      const qStart = (periodValue - 1) * 3 + 1;
      return tMonth >= qStart && tMonth <= qStart + 2;
    }
    if (periodType === 'semester' && periodValue) {
      if (periodValue === 1) return tMonth >= 1 && tMonth <= 6;
      return tMonth >= 7 && tMonth <= 12;
    }
    // annual or no sub-period: just year filter
    return true;
  };
};

const usePeriodSelector = (defaultYear = 2026) => {
  const now = new Date();
  const [year, setYear] = useState(defaultYear);
  const [periodType, setPeriodType] = useState('month');
  const [periodValue, setPeriodValue] = useState(now.getMonth() + 1);

  const filterTransactions = useCallback(
    (txns) => txns.filter(buildFilterFn(year, periodType, periodValue)),
    [year, periodType, periodValue]
  );

  const periodLabel = useMemo(() => {
    const yearStr = year === 'all' ? 'Todos' : year;
    if (periodType === 'annual') return `${yearStr}`;
    if (periodType === 'month') return `${MONTH_NAMES[(periodValue || 1) - 1]} ${yearStr}`;
    if (periodType === 'quarter') return `Q${periodValue} ${yearStr}`;
    if (periodType === 'semester') return `H${periodValue} ${yearStr}`;
    return `${yearStr}`;
  }, [year, periodType, periodValue]);

  return {
    year, setYear,
    periodType, setPeriodType,
    periodValue, setPeriodValue,
    filterTransactions,
    periodLabel,
  };
};

/**
 * PeriodSelector — compact horizontal period filter.
 * Props: year, setYear, periodType, setPeriodType, periodValue, setPeriodValue
 * OR pass the full usePeriodSelector return as spread props.
 */
const PeriodSelector = ({
  year, setYear,
  periodType, setPeriodType,
  periodValue, setPeriodValue,
  compact = false,
}) => {
  const [subOpen, setSubOpen] = useState(false);
  const subRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (subRef.current && !subRef.current.contains(e.target)) setSubOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const subOptions = getSubOptions(periodType);

  const handlePeriodTypeChange = (newType) => {
    setPeriodType(newType);
    // Set sensible defaults
    const now = new Date();
    if (newType === 'month') setPeriodValue(now.getMonth() + 1);
    else if (newType === 'quarter') setPeriodValue(Math.ceil((now.getMonth() + 1) / 3));
    else if (newType === 'semester') setPeriodValue(now.getMonth() < 6 ? 1 : 2);
    else setPeriodValue(null);
  };

  const btnBase = 'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150';
  const btnActive = 'bg-[rgba(48,209,88,0.15)] text-[#30d158] shadow-sm';
  const btnInactive = 'text-[#8e8e93] hover:bg-[rgba(255,255,255,0.06)]';

  return (
    <div className={`flex items-center gap-2 flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {/* Year selector */}
      <div className="flex items-center bg-[rgba(255,255,255,0.04)] rounded-lg border border-[rgba(255,255,255,0.06)] p-0.5">
        {[2025, 2026, 'all'].map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`${btnBase} ${year === y ? btnActive : btnInactive}`}
          >
            {y === 'all' ? 'Todos' : y}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-[rgba(255,255,255,0.08)] hidden sm:block" />

      {/* Period type selector */}
      <div className="flex items-center bg-[rgba(255,255,255,0.04)] rounded-lg border border-[rgba(255,255,255,0.06)] p-0.5">
        {Object.values(PERIOD_OPTIONS).map((opt) => (
          <button
            key={opt.key}
            onClick={() => handlePeriodTypeChange(opt.key)}
            className={`${btnBase} ${periodType === opt.key ? btnActive : btnInactive}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Sub-period dropdown */}
      {subOptions.length > 0 && (
        <div className="relative" ref={subRef}>
          <button
            onClick={() => setSubOpen(!subOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#c7c7cc] hover:bg-[rgba(255,255,255,0.1)] transition-all"
          >
            <Calendar size={12} />
            {subOptions.find((o) => o.value === periodValue)?.label || 'Seleccionar'}
            <ChevronDown size={12} className={`transition-transform ${subOpen ? 'rotate-180' : ''}`} />
          </button>
          {subOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#2c2c2e] rounded-xl shadow-xl border border-[rgba(255,255,255,0.1)] py-1 min-w-[140px] max-h-[240px] overflow-y-auto">
              {subOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setPeriodValue(opt.value); setSubOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                    periodValue === opt.value
                      ? 'bg-[rgba(48,209,88,0.12)] text-[#30d158] font-semibold'
                      : 'text-[#c7c7cc] hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { usePeriodSelector };
export default PeriodSelector;
