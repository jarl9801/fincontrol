import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1jeY6glYeYoCH6boBnEk4HuAvq-Uj0QMwi2deCFIUZP8/gviz/tq?tqx=out:csv&sheet=transacciones';

// Categories treated as financing outflows (excluded from Operating CF)
const FINANCING_CATEGORIES = ['EGR-FIN', 'Intereses Bancos', 'Intereses prestamos', 'Financiero'];
// Categories treated as arrears/rent (excluded from Operating CF)
const ARREARS_CATEGORIES = ['EGR-ARR', 'Alquiler vehiculo', 'Cuotas vehiculos', 'Vivienda'];
// CapEx categories
const CAPEX_CATEGORIES = ['EGR-EQP', 'Equipos', 'Equipos Alquileres'];

// Dec 2025 bank ending balance anchor
const DEC_2025_ENDING = 28450;

/**
 * Parse a CSV amount string like "3,000.00" or "1500" → number
 */
const parseAmount = (str) => {
  if (!str) return 0;
  // Remove currency symbols and spaces
  const cleaned = str.replace(/[€$\s]/g, '').trim();
  // Remove thousand-separator commas (e.g. "3,000.00" → "3000.00")
  // But keep decimal point
  const normalized = cleaned.replace(/,(?=\d{3}(\.|$))/g, '').replace(/,/g, '');
  return parseFloat(normalized) || 0;
};

/**
 * Parse raw CSV text into transaction objects
 */
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Strip BOM if present
  const rawHeader = lines[0].replace(/^\uFEFF/, '');

  const parseRow = (line) => {
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  };

  const headers = parseRow(rawHeader).map((h) => h.replace(/^"|"$/g, '').toLowerCase().trim());

  const idx = {
    id: headers.indexOf('id'),
    fecha: headers.indexOf('fecha'),
    tipo: headers.indexOf('tipo'),
    categoria: headers.indexOf('categoría') !== -1 ? headers.indexOf('categoría') : headers.indexOf('categoria'),
    monto: headers.indexOf('monto'),
    descripcion: headers.indexOf('descripción') !== -1 ? headers.indexOf('descripción') : headers.indexOf('descripcion'),
  };

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (!row || row.length < 3) continue;

    const tipoRaw = (row[idx.tipo] || '').replace(/^"|"$/g, '').trim().toUpperCase();
    const fecha = (row[idx.fecha] || '').replace(/^"|"$/g, '').trim();
    const montoRaw = (row[idx.monto] || '').replace(/^"|"$/g, '').trim();
    const categoria = (row[idx.categoria] || '').replace(/^"|"$/g, '').trim();

    if (!fecha || !tipoRaw) continue;

    const type = tipoRaw === 'INGRESO' ? 'income' : 'expense';
    const amount = parseAmount(montoRaw);

    if (!amount) continue;

    // Normalize date: could be DD/MM/YYYY or YYYY-MM-DD
    let date = fecha;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      const [d, m, y] = fecha.split('/');
      date = `${y}-${m}-${d}`;
    }

    result.push({
      id: `csv-${i}`,
      date,
      type,
      amount,
      category: categoria,
      source: '2025',
    });
  }

  return result;
};

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const toLabel = (ym) => {
  const [year, month] = ym.split('-');
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
};

/**
 * useCashFlow — merges 2025 CSV + 2026 Firebase transactions
 * Returns monthly aggregates, KPIs, FCF data, and projection.
 */
export const useCashFlow = (user) => {
  const { transactions: firebaseTransactions, loading: fbLoading } = useTransactions(user);
  const [csvTransactions, setCsvTransactions] = useState([]);
  const [csvLoading, setCsvLoading] = useState(true);
  const [csvError, setCsvError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setCsvLoading(true);
    fetch(CSV_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setCsvTransactions(parseCSV(text));
          setCsvLoading(false);
        }
      })
      .catch((err) => {
        console.error('useCashFlow: CSV fetch error', err);
        if (!cancelled) {
          setCsvError(err);
          setCsvLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = csvLoading || fbLoading;

  const { monthlyData, kpis, fcfData, projectionData, allMonths } = useMemo(() => {
    if (loading) {
      return { monthlyData: [], kpis: {}, fcfData: [], projectionData: [], allMonths: [] };
    }

    // Merge all transactions
    const all = [
      ...csvTransactions,
      ...firebaseTransactions.map((t) => ({ ...t, source: '2026' })),
    ];

    // Build monthly buckets
    const buckets = {};
    all.forEach((t) => {
      const ym = t.date.substring(0, 7);
      if (!buckets[ym]) {
        buckets[ym] = { month: ym, label: toLabel(ym), ingresos: 0, egresos: 0, opCF: 0, capex: 0 };
      }
      const b = buckets[ym];
      if (t.type === 'income') {
        b.ingresos += t.amount;
        b.opCF += t.amount;
      } else {
        b.egresos += t.amount;
        // Classify outflow
        const cat = t.category || '';
        const isFinancing = FINANCING_CATEGORIES.some((c) => cat.includes(c));
        const isArrears = ARREARS_CATEGORIES.some((c) => cat.includes(c));
        const isCapex = CAPEX_CATEGORIES.some((c) => cat.includes(c));
        if (isCapex) {
          b.capex += t.amount;
        } else if (!isFinancing && !isArrears) {
          b.opCF -= t.amount;
        }
      }
    });

    const sortedMonths = Object.keys(buckets).sort();

    // Compute cumulative balance using DEC_2025_ENDING as anchor
    // First, sum net through Dec 2025
    const dec2025 = '2025-12';
    let sumThruDec2025 = 0;
    sortedMonths.forEach((ym) => {
      if (ym <= dec2025) {
        sumThruDec2025 += buckets[ym].ingresos - buckets[ym].egresos;
      }
    });

    // Offset so that cumulative at end of Dec 2025 = DEC_2025_ENDING
    const offset = DEC_2025_ENDING - sumThruDec2025;

    let accumulated = offset;
    sortedMonths.forEach((ym) => {
      const b = buckets[ym];
      b.neto = b.ingresos - b.egresos;
      accumulated += b.neto;
      b.acumulado = accumulated;
      b.fcf = b.opCF - b.capex;
    });

    // Filter display: show Oct 2025 onwards
    const displayStart = '2025-10';
    const displayMonths = sortedMonths.filter((ym) => ym >= displayStart);
    const monthlyData = displayMonths.map((ym) => buckets[ym]);

    // KPIs across all data
    let totalIngresos = 0, totalEgresos = 0, totalFCF = 0;
    sortedMonths.forEach((ym) => {
      totalIngresos += buckets[ym].ingresos;
      totalEgresos += buckets[ym].egresos;
      totalFCF += buckets[ym].fcf;
    });

    const latestBalance = sortedMonths.length > 0 ? buckets[sortedMonths[sortedMonths.length - 1]].acumulado : 0;

    // Burn rate = avg monthly egresos over last 3 months with data
    const recentMonths = sortedMonths.slice(-3);
    const burnRate = recentMonths.length > 0
      ? recentMonths.reduce((s, ym) => s + buckets[ym].egresos, 0) / recentMonths.length
      : 0;

    const kpis = {
      totalIngresos,
      totalEgresos,
      balance: latestBalance,
      fcf: totalFCF,
      burnRate,
    };

    // FCF chart data (display months only)
    const fcfData = monthlyData.map((b) => ({ ...b }));

    // 3-month projection based on avg of last 3 display months
    const last3 = monthlyData.slice(-3);
    const avgIngresos = last3.length > 0 ? last3.reduce((s, b) => s + b.ingresos, 0) / last3.length : 0;
    const avgEgresos = last3.length > 0 ? last3.reduce((s, b) => s + b.egresos, 0) / last3.length : 0;

    const lastMonth = sortedMonths[sortedMonths.length - 1] || '2026-01';
    let [y, m] = lastMonth.split('-').map(Number);
    let runningBalance = latestBalance;
    const projectionData = [];
    for (let i = 1; i <= 3; i++) {
      m += 1;
      if (m > 12) { m = 1; y += 1; }
      const ym = `${y}-${String(m).padStart(2, '0')}`;
      runningBalance += avgIngresos - avgEgresos;
      projectionData.push({
        month: ym,
        label: toLabel(ym),
        ingresos: avgIngresos,
        egresos: avgEgresos,
        neto: avgIngresos - avgEgresos,
        acumulado: runningBalance,
        isProjection: true,
      });
    }

    // Combined chart data (monthlyData + projectionData)
    const allMonths = [...monthlyData, ...projectionData];

    return { monthlyData, kpis, fcfData, projectionData, allMonths };
  }, [csvTransactions, firebaseTransactions, loading]);

  return {
    loading,
    csvError,
    monthlyData,
    kpis,
    fcfData,
    projectionData,
    allMonths,
  };
};
