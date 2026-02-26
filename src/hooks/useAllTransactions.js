import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from './useTransactions';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1jeY6glYeYoCH6boBnEk4HuAvq-Uj0QMwi2deCFIUZP8/gviz/tq?tqx=out:csv&sheet=transacciones';

/**
 * Parse a CSV amount string like "3,000.00" or "1500" → number
 */
const parseAmount = (str) => {
  if (!str) return 0;
  const cleaned = str.replace(/[€$\s"]/g, '').trim();
  // Remove thousand-separator commas: "3,000.00" → "3000.00"
  const normalized = cleaned.replace(/,(?=\d{3}(\.|$))/g, '');
  return parseFloat(normalized) || 0;
};

/**
 * Parse raw CSV text into transaction objects normalized to Firebase schema
 */
const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

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
    centroCosto: headers.findIndex(h => h.includes('centro')),
    proyecto: headers.indexOf('proyecto'),
    descripcion: headers.indexOf('descripción') !== -1 ? headers.indexOf('descripción') : headers.indexOf('descripcion'),
    monto: headers.indexOf('monto'),
    metodoPago: headers.findIndex(h => h.includes('método') || h.includes('metodo') || h.includes('pago')),
    referencia: headers.indexOf('referencia'),
    usuario: headers.indexOf('usuario'),
  };

  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseRow(lines[i]);
    if (!row || row.length < 3) continue;

    const strip = (val) => (val || '').replace(/^"|"$/g, '').trim();

    const tipoRaw = strip(row[idx.tipo]).toUpperCase();
    const fecha = strip(row[idx.fecha]);
    const montoRaw = strip(row[idx.monto]);
    const categoria = strip(row[idx.categoria]);
    const proyecto = idx.proyecto >= 0 ? strip(row[idx.proyecto]) : '';
    const centroCosto = idx.centroCosto >= 0 ? strip(row[idx.centroCosto]) : '';
    const descripcion = idx.descripcion >= 0 ? strip(row[idx.descripcion]) : '';

    if (!fecha || !tipoRaw) continue;

    const type = tipoRaw === 'INGRESO' ? 'income' : 'expense';
    const amount = parseAmount(montoRaw);

    if (!amount) continue;

    // Normalize date: DD/MM/YYYY → YYYY-MM-DD
    let date = fecha;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      const [d, m, y] = fecha.split('/');
      date = `${y}-${m}-${d}`;
    }

    result.push({
      id: `sheet-2025-${i}`,
      date,
      type,
      amount,
      category: categoria,
      costCenter: centroCosto,
      project: proyecto,
      description: descripcion,
      status: 'paid',
      notes: [],
      source: '2025-sheet',
      year: 2025,
    });
  }

  return result;
};

/**
 * useAllTransactions — merges 2025 Google Sheet CSV + 2026 Firebase transactions.
 * Caches 2025 data in state (fetch once per session).
 */
export const useAllTransactions = (user) => {
  const { transactions: firebaseTransactions, loading: fbLoading } = useTransactions(user);
  const [transactions2025, setTransactions2025] = useState([]);
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
          setTransactions2025(parseCSV(text));
          setCsvLoading(false);
        }
      })
      .catch((err) => {
        console.error('useAllTransactions: CSV fetch error', err);
        if (!cancelled) {
          setCsvError(err);
          setCsvLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const loading = csvLoading || fbLoading;

  const transactions2026 = useMemo(() => {
    return firebaseTransactions.map((t) => ({
      ...t,
      source: '2026-firebase',
      year: 2026,
    }));
  }, [firebaseTransactions]);

  const allTransactions = useMemo(() => {
    return [...transactions2025, ...transactions2026].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [transactions2025, transactions2026]);

  return {
    allTransactions,
    loading,
    csvError,
    transactions2025,
    transactions2026,
  };
};
