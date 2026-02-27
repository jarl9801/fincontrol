import { useState, useEffect } from 'react';

const SHEET_ID = '1jeY6glYeYoCH6boBnEk4HuAvq-Uj0QMwi2deCFIUZP8';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=transacciones`;

/**
 * Parse CSV text handling quoted fields with commas
 */
function parseCSV(text) {
  const lines = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  return lines.map(line => {
    const fields = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (q && line[i + 1] === '"') { field += '"'; i++; }
        else q = !q;
      } else if (ch === ',' && !q) {
        fields.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    fields.push(field);
    return fields;
  });
}

/**
 * Convert 2025 sheet row to app transaction format
 * Columns: ID, Fecha, Tipo, Categoría, Centro de Costo, Proyecto, Descripción, Monto, Método de Pago, Referencia, Usuario, Fecha de Registro
 */
function convertRow(row) {
  const [id, fecha, tipo, categoria, centroCosto, proyecto, descripcion, monto, metodoPago, referencia] = row;
  
  if (!fecha || !tipo || !monto) return null;
  
  // Parse date (DD/MM/YYYY or YYYY-MM-DD)
  let dateStr = fecha;
  if (fecha.includes('/')) {
    const parts = fecha.split('/');
    if (parts.length === 3) {
      dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  // Parse amount - remove commas, quotes, dollar signs
  const cleanAmount = monto.replace(/[$,"\s]/g, '');
  const amount = parseFloat(cleanAmount);
  if (isNaN(amount) || amount === 0) return null;

  return {
    id: `hist-${id || dateStr}-${crypto.randomUUID().slice(0, 8)}`,
    date: dateStr,
    type: tipo.toUpperCase() === 'INGRESO' ? 'income' : 'expense',
    category: categoria || 'Otros',
    costCenter: centroCosto || '',
    project: proyecto || '',
    description: descripcion || '',
    amount: Math.abs(amount),
    paymentMethod: metodoPago || '',
    reference: referencia || '',
    status: 'paid',
    source: 'import-2025',
  };
}

export const useHistoricalData = () => {
  const [historicalTransactions, setHistoricalTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const res = await fetch(CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = parseCSV(text);
        
        // Skip header row
        const dataRows = rows.slice(1);
        const transactions = dataRows
          .map(convertRow)
          .filter(Boolean);

        if (!cancelled) {
          setHistoricalTransactions(transactions);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching 2025 data:', err);
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { historicalTransactions, loading, error };
};

export default useHistoricalData;
