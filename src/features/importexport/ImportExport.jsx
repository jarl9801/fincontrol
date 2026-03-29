import React, { useState, useMemo, useRef } from 'react';
import {
  Download, Upload, FileSpreadsheet, FileText,
  CheckCircle2, X, Eye, Loader2
} from 'lucide-react';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { useBankMovements } from '../../hooks/useBankMovements';
import { exportToExcel } from '../../utils/excelExport';
import { useToast } from '../../contexts/ToastContext';
import { Landmark } from 'lucide-react';

const REQUIRED_COLUMNS = ['fecha', 'monto', 'descripcion', 'categoria', 'tipo'];

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [], error: 'El archivo debe tener al menos una fila de encabezados y una de datos' };

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n').trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseRow(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows, error: null };
};

const normalizeType = (val) => {
  const lower = (val || '').toLowerCase().trim();
  if (['ingreso', 'income', 'entrada', 'in'].includes(lower)) return 'income';
  if (['gasto', 'expense', 'salida', 'out', 'egreso'].includes(lower)) return 'expense';
  return 'expense';
};

const normalizeAmount = (val) => {
  if (!val) return 0;
  // Handle European number format (1.234,56) and standard (1,234.56)
  const str = String(val).replace(/[€$\s]/g, '');
  if (str.includes(',') && str.includes('.')) {
    // Determine format by position of last separator
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // European: 1.234,56
      return Math.abs(parseFloat(str.replace(/\./g, '').replace(',', '.')));
    }
    // Standard: 1,234.56
    return Math.abs(parseFloat(str.replace(/,/g, '')));
  }
  if (str.includes(',')) {
    // Could be European decimal or thousand sep
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      return Math.abs(parseFloat(str.replace(',', '.')));
    }
    return Math.abs(parseFloat(str.replace(/,/g, '')));
  }
  return Math.abs(parseFloat(str)) || 0;
};

// Parse German bank date DD.MM.YYYY to ISO YYYY-MM-DD
const parseGermanDate = (val) => {
  if (!val) return '';
  const parts = val.trim().split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return val;
};

// Parse German amount: "1.234,56" or "-1.234,56" or "33.459,76"
const parseGermanAmount = (val) => {
  if (!val) return 0;
  const str = String(val).replace(/\s/g, '');
  // Remove thousand separators (.) and replace decimal comma with dot
  const normalized = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
};

// Extract clean description from Verwendungszweck
const cleanDescription = (raw) => {
  if (!raw) return '';
  // Remove SEPA reference codes
  let desc = raw
    .replace(/EREF\+[^\s]*/g, '')
    .replace(/KREF\+[^\s]*/g, '')
    .replace(/MREF\+[^\s]*/g, '')
    .replace(/CRED\+[^\s]*/g, '')
    .replace(/DEBT\+[^\s]*/g, '')
    .replace(/PURP\+[^\s]*/g, '')
    .replace(/RCUR/g, '')
    .replace(/ABWA\+/g, '')
    .replace(/SVWZ\+/g, '')
    .replace(/TAN:\s*\d+/g, '')
    .replace(/NONREF/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Truncate to reasonable length
  return desc.slice(0, 200) || 'Movimiento bancario';
};

const ImportExport = ({ user }) => {
  const { allTransactions, loading } = useAllTransactions(user);
  const { createTransaction } = useTransactionActions(user);
  const { bankMovements, createBankMovement } = useBankMovements(user);
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const bankFileInputRef = useRef(null);

  const [importData, setImportData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Bank movements import state
  const [bankImportData, setBankImportData] = useState(null);
  const [bankImporting, setBankImporting] = useState(false);
  const [bankImportResult, setBankImportResult] = useState(null);
  const [bankIsDragging, setBankIsDragging] = useState(false);

  // Auto-map columns
  const autoMapColumns = (headers) => {
    const mapping = {};
    const mappings = {
      fecha: ['fecha', 'date', 'dia', 'f.'],
      monto: ['monto', 'amount', 'valor', 'importe', 'total', 'sum'],
      descripcion: ['descripcion', 'description', 'concepto', 'detalle', 'nota'],
      categoria: ['categoria', 'category', 'cat', 'rubro'],
      tipo: ['tipo', 'type', 'clase'],
    };

    for (const [field, aliases] of Object.entries(mappings)) {
      const match = headers.find(h => aliases.some(a => h.includes(a)));
      if (match) mapping[field] = match;
    }
    return mapping;
  };

  const handleFileRead = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows, error } = parseCSV(text);

      if (error) {
        showToast(error, 'error');
        return;
      }

      if (rows.length === 0) {
        showToast('El archivo no contiene datos', 'error');
        return;
      }

      // Detect German bank CSV and redirect to bank import
      const isBankCSV = headers.some(h => h.includes('buchungsdatum')) && headers.some(h => h.includes('betrag'));
      if (isBankCSV) {
        showToast('Este archivo es un extracto bancario. Usa la sección "Importar movimientos bancarios" más abajo.', 'warning');
        return;
      }

      const mapping = autoMapColumns(headers);
      setColumnMapping(mapping);
      setImportData({ headers, rows, fileName: file.name });
      setImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleFileSelect = (e) => {
    handleFileRead(e.target.files?.[0]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileRead(file);
    } else {
      showToast('Solo se aceptan archivos CSV', 'error');
    }
  };

  // Preview data with mapping applied
  const previewRows = useMemo(() => {
    if (!importData) return [];
    return importData.rows.slice(0, 10).map(row => ({
      fecha: row[columnMapping.fecha] || '',
      monto: row[columnMapping.monto] || '',
      descripcion: row[columnMapping.descripcion] || '',
      categoria: row[columnMapping.categoria] || '',
      tipo: row[columnMapping.tipo] || '',
    }));
  }, [importData, columnMapping]);

  // Duplicate detection
  const duplicates = useMemo(() => {
    if (!importData) return new Set();
    const dupeIndices = new Set();
    importData.rows.forEach((row, idx) => {
      const fecha = row[columnMapping.fecha] || '';
      const monto = normalizeAmount(row[columnMapping.monto]);
      const desc = (row[columnMapping.descripcion] || '').toLowerCase().trim();

      const isDupe = allTransactions.some(t => {
        const tDate = t.date || '';
        const tAmount = t.amount || 0;
        const tDesc = (t.description || '').toLowerCase().trim();
        return tDate === fecha && Math.abs(tAmount - monto) < 0.01 && tDesc === desc;
      });
      if (isDupe) dupeIndices.add(idx);
    });
    return dupeIndices;
  }, [importData, columnMapping, allTransactions]);

  const handleImport = async () => {
    if (!importData || importing) return;

    const missingCols = REQUIRED_COLUMNS.filter(c => !columnMapping[c]);
    if (missingCols.length > 0) {
      showToast(`Columnas sin mapear: ${missingCols.join(', ')}`, 'error');
      return;
    }

    setImporting(true);
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    try {
      for (let i = 0; i < importData.rows.length; i++) {
        if (duplicates.has(i)) {
          skipped++;
          continue;
        }

        const row = importData.rows[i];
        const fecha = row[columnMapping.fecha] || new Date().toISOString().split('T')[0];
        const monto = normalizeAmount(row[columnMapping.monto]);
        const descripcion = row[columnMapping.descripcion] || 'Importado';
        const categoria = row[columnMapping.categoria] || 'Sin categorizar';
        const tipo = normalizeType(row[columnMapping.tipo]);

        if (monto === 0) {
          skipped++;
          continue;
        }

        const result = await createTransaction({
          date: fecha,
          amount: monto,
          description: descripcion,
          category: categoria,
          type: tipo,
          project: '',
          costCenter: 'Sin asignar',
          status: 'pending',
          isRecurring: false,
          comment: `Importado desde ${importData.fileName}`,
        });

        if (result?.success) {
          imported++;
        } else {
          errors++;
        }
      }

      setImportResult({ imported, skipped, errors, total: importData.rows.length });
      showToast(`Importacion completa: ${imported} creadas, ${skipped} omitidas, ${errors} errores`, imported > 0 ? 'success' : 'info');
    } catch (err) {
      console.error('Import error:', err);
      showToast('Error durante la importacion', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (allTransactions.length === 0) {
      showToast('No hay transacciones para exportar', 'info');
      return;
    }

    const headers = ['Fecha', 'Tipo', 'Categoria', 'Proyecto', 'Centro de Costo', 'Descripcion', 'Monto', 'Estado'];
    const BOM = '\uFEFF';
    const rows = allTransactions.map(t => [
      t.date || '',
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.category || '',
      t.project || '',
      t.costCenter || '',
      t.description || '',
      t.amount || 0,
      t.status === 'paid' ? 'Pagado' : 'Pendiente',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => {
        const cellStr = String(cell || '');
        if (cellStr.includes(';') || cellStr.includes('"')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';'))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `fincontrol_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`${allTransactions.length} transacciones exportadas a CSV`, 'success');
  };

  const handleExportExcel = () => {
    if (allTransactions.length === 0) {
      showToast('No hay transacciones para exportar', 'info');
      return;
    }
    exportToExcel(allTransactions, 'fincontrol_export');
    showToast(`${allTransactions.length} transacciones exportadas a Excel`, 'success');
  };

  const handleClearImport = () => {
    setImportData(null);
    setColumnMapping({});
    setImportResult(null);
  };

  // --- Bank movements import ---
  const handleBankFileRead = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows, error } = parseCSV(text);
      if (error) { showToast(error, 'error'); return; }
      if (rows.length === 0) { showToast('El archivo no contiene datos', 'error'); return; }

      // Detect German bank CSV by known headers
      const hasBookingDate = headers.some(h => h.includes('buchungsdatum'));
      const hasAmount = headers.some(h => h.includes('betrag'));
      if (!hasBookingDate || !hasAmount) {
        showToast('Formato no reconocido. Se esperan columnas: Buchungsdatum, Betrag in EUR', 'error');
        return;
      }

      // Map columns
      const dateCol = headers.find(h => h.includes('buchungsdatum'));
      const valueDateCol = headers.find(h => h.includes('valutadatum'));
      const nameCol = headers.find(h => h.includes('empfangername') || h.includes('auftraggeber'));
      const ibanCol = headers.find(h => h.includes('iban'));
      const purposeCol = headers.find(h => h.includes('verwendungszweck'));
      const amountCol = headers.find(h => h.includes('betrag'));

      // Parse and dedupe
      const movements = rows.map((row, idx) => {
        const rawAmount = parseGermanAmount(row[amountCol]);
        const postedDate = parseGermanDate(row[dateCol]);
        const valueDate = parseGermanDate(row[valueDateCol]) || postedDate;
        const counterparty = (row[nameCol] || '').trim();
        const description = cleanDescription(row[purposeCol]);
        const direction = rawAmount >= 0 ? 'in' : 'out';
        const amount = Math.abs(rawAmount);

        return { idx, postedDate, valueDate, counterparty, description, direction, amount, raw: row };
      }).filter(m => m.amount > 0);

      // Detect duplicates against existing bank movements
      const dupes = new Set();
      movements.forEach((m, i) => {
        const isDupe = bankMovements.some(existing =>
          existing.postedDate === m.postedDate &&
          Math.abs(existing.amount - m.amount) < 0.01 &&
          existing.direction === m.direction &&
          (existing.counterpartyName || '').toLowerCase() === (m.counterparty || '').toLowerCase()
        );
        if (isDupe) dupes.add(i);
      });

      setBankImportData({ movements, dupes, fileName: file.name, dateRange: `${movements[movements.length - 1]?.postedDate} → ${movements[0]?.postedDate}` });
      setBankImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleBankFileSelect = (e) => {
    handleBankFileRead(e.target.files?.[0]);
    if (bankFileInputRef.current) bankFileInputRef.current.value = '';
  };

  const handleBankDragOver = (e) => { e.preventDefault(); setBankIsDragging(true); };
  const handleBankDragLeave = () => setBankIsDragging(false);
  const handleBankDrop = (e) => {
    e.preventDefault();
    setBankIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith('.csv')) {
      handleBankFileRead(file);
    } else {
      showToast('Solo se aceptan archivos CSV', 'error');
    }
  };

  const handleBankImport = async () => {
    if (!bankImportData || bankImporting) return;
    setBankImporting(true);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    try {
      for (let i = 0; i < bankImportData.movements.length; i++) {
        if (bankImportData.dupes.has(i)) {
          skipped++;
          continue;
        }

        const m = bankImportData.movements[i];
        const result = await createBankMovement({
          kind: m.direction === 'in' ? 'collection' : 'payment',
          direction: m.direction,
          amount: m.amount,
          postedDate: m.postedDate,
          valueDate: m.valueDate,
          description: m.description,
          counterpartyName: m.counterparty,
        });

        if (result?.success) {
          imported++;
        } else {
          errors++;
        }
      }

      setBankImportResult({ imported, skipped, errors, total: bankImportData.movements.length });
      showToast(`Movimientos importados: ${imported} creados, ${skipped} duplicados, ${errors} errores`, imported > 0 ? 'success' : 'info');
    } catch (err) {
      showToast('Error durante la importación de movimientos', 'error');
    } finally {
      setBankImporting(false);
    }
  };

  const handleClearBankImport = () => {
    setBankImportData(null);
    setBankImportResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Operación de datos</p>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Importación y exportación</h2>
        <p className="mt-1 text-sm text-[#6b7a99]">Mueve registros en bloque con control previo de columnas y duplicados.</p>
      </div>

      <div className="rounded-[28px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-[#0f9f6e]" />
          <h3 className="text-[15px] font-semibold text-[#1f2a44]">Exportar transacciones</h3>
          <span className="ml-auto text-[11px] text-[#6b7a99]">{allTransactions.length} transacciones disponibles</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(15,159,110,0.24)] bg-[rgba(15,159,110,0.08)] px-4 py-2.5 text-[12px] font-medium text-[#0f9f6e] transition hover:bg-[rgba(15,159,110,0.14)]"
          >
            <FileText size={14} />
            Exportar CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(59,130,246,0.24)] bg-[rgba(59,130,246,0.08)] px-4 py-2.5 text-[12px] font-medium text-[#2563eb] transition hover:bg-[rgba(59,130,246,0.14)]"
          >
            <FileSpreadsheet size={14} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={18} className="text-[#c98717]" />
          <h3 className="text-[15px] font-semibold text-[#1f2a44]">Importar transacciones</h3>
        </div>

        {!importData ? (
          <>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? 'border-[#d9a44b] bg-[rgba(214,149,44,0.08)]'
                  : 'border-[#d8e3f7] bg-[rgba(247,250,255,0.86)] hover:border-[#b7caef]'
              }`}
            >
              <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-[#c98717]' : 'text-[#7a879d]'}`} />
              <p className="mb-1 text-[14px] font-medium text-[#1f2a44]">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un CSV o haz clic para seleccionar'}
              </p>
              <p className="text-[12px] text-[#6b7a99]">Columnas esperadas: fecha, monto, descripción, categoría y tipo.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[rgba(214,149,44,0.22)] bg-[rgba(255,248,234,0.92)] px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#c98717]" />
                <span className="text-[13px] font-medium text-[#1f2a44]">{importData.fileName}</span>
                <span className="text-[11px] text-[#8a6d66]">{importData.rows.length} filas</span>
                {duplicates.size > 0 && (
                  <span className="rounded-full bg-[rgba(208,76,54,0.1)] px-2 py-0.5 text-[11px] text-[#d04c36]">
                    {duplicates.size} posibles duplicados
                  </span>
                )}
              </div>
              <button onClick={handleClearImport} className="p-1.5 text-[#8a6d66] transition-colors hover:text-[#d04c36]">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {REQUIRED_COLUMNS.map(col => (
                <div key={col}>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">
                    {col} {!columnMapping[col] && <span className="text-[#ff453a]">*</span>}
                  </label>
                  <select
                    value={columnMapping[col] || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                    className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-2 py-1.5 text-[12px] text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                  >
                    <option value="">-- Seleccionar --</option>
                    {importData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={14} className="text-[#70819f]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">
                  Vista previa (primeras {Math.min(previewRows.length, 10)} filas)
                </span>
              </div>
              <div className="overflow-x-auto rounded-[24px] border border-[#dce6f8] bg-white/92">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">#</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Fecha</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Descripción</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Categoría</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Tipo</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Monto</th>
                      <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const isDupe = duplicates.has(idx);
                      return (
                        <tr key={idx} className={`border-b border-[#eef2fb] ${isDupe ? 'opacity-55' : ''}`}>
                          <td className="px-3 py-2 text-[11px] text-[#93a0b6]">{idx + 1}</td>
                          <td className="px-3 py-2 text-[12px] text-[#70819f]">{row.fecha}</td>
                          <td className="max-w-[200px] truncate px-3 py-2 text-[12px] text-[#1f2a44]">{row.descripcion}</td>
                          <td className="px-3 py-2 text-[12px] text-[#70819f]">{row.categoria}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              normalizeType(row.tipo) === 'income'
                                ? 'bg-[rgba(15,159,110,0.1)] text-[#0f9f6e]'
                                : 'bg-[rgba(208,76,54,0.1)] text-[#d04c36]'
                            }`}>
                              {normalizeType(row.tipo) === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-[12px] text-[#1f2a44]">{row.monto}</td>
                          <td className="px-3 py-2">
                            {isDupe ? (
                              <span className="rounded-full bg-[rgba(208,76,54,0.1)] px-1.5 py-0.5 text-[10px] text-[#d04c36]">Duplicado</span>
                            ) : (
                              <span className="rounded-full bg-[rgba(15,159,110,0.1)] px-1.5 py-0.5 text-[10px] text-[#0f9f6e]">Nuevo</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {importData.rows.length > 10 && (
                <p className="mt-2 text-center text-[11px] text-[#70819f]">
                  ... y {importData.rows.length - 10} filas más
                </p>
              )}
            </div>

            {importResult && (
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(15,159,110,0.22)] bg-[rgba(244,252,248,0.94)] px-4 py-3">
                <CheckCircle2 size={18} className="text-[#0f9f6e]" />
                <div className="text-[12px] text-[#1f2a44]">
                  <span className="font-medium">Importación completada:</span>{' '}
                  <span className="text-[#0f9f6e]">{importResult.imported} creadas</span>,{' '}
                  <span className="text-[#c98717]">{importResult.skipped} omitidas</span>
                  {importResult.errors > 0 && (
                    <>, <span className="text-[#d04c36]">{importResult.errors} errores</span></>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClearImport}
                className="rounded-2xl px-4 py-2 text-[12px] font-medium text-[#6b7a99] transition hover:bg-[rgba(94,115,159,0.08)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !!importResult}
                className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(214,149,44,0.24)] bg-[rgba(214,149,44,0.08)] px-5 py-2 text-[12px] font-medium text-[#c98717] transition hover:bg-[rgba(214,149,44,0.14)] disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {importing ? 'Importando...' : `Importar ${importData.rows.length - duplicates.size} transacciones`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bank Movements Import */}
      <div className="rounded-[28px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-2 mb-4">
          <Landmark size={18} className="text-[#3156d3]" />
          <h3 className="text-[15px] font-semibold text-[#1f2a44]">Importar movimientos bancarios</h3>
          <span className="ml-auto text-[11px] text-[#6b7a99]">{bankMovements.length} movimientos en sistema</span>
        </div>
        <p className="mb-4 text-[12px] text-[#6b7a99]">
          Importa el CSV de tu banco (formato alemán: Buchungsdatum, Empfängername, Betrag in EUR).
          Los movimientos se usan para conciliación bancaria.
        </p>

        {!bankImportData ? (
          <>
            <div
              onDragOver={handleBankDragOver}
              onDragLeave={handleBankDragLeave}
              onDrop={handleBankDrop}
              onClick={() => bankFileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                bankIsDragging
                  ? 'border-[#3156d3] bg-[rgba(49,86,211,0.06)]'
                  : 'border-[#d8e3f7] bg-[rgba(247,250,255,0.86)] hover:border-[#b7caef]'
              }`}
            >
              <Landmark size={32} className={`mx-auto mb-3 ${bankIsDragging ? 'text-[#3156d3]' : 'text-[#7a879d]'}`} />
              <p className="mb-1 text-[14px] font-medium text-[#1f2a44]">
                {bankIsDragging ? 'Suelta el archivo aquí' : 'Arrastra el CSV del banco o haz clic para seleccionar'}
              </p>
              <p className="text-[12px] text-[#6b7a99]">Formato esperado: Kontobewegungen export (CSV con separador ;)</p>
            </div>
            <input
              ref={bankFileInputRef}
              type="file"
              accept=".csv"
              onChange={handleBankFileSelect}
              className="hidden"
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-[rgba(49,86,211,0.22)] bg-[rgba(240,245,255,0.92)] px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Landmark size={16} className="text-[#3156d3]" />
                <span className="text-[13px] font-medium text-[#1f2a44]">{bankImportData.fileName}</span>
                <span className="text-[11px] text-[#6b7a99]">{bankImportData.movements.length} movimientos</span>
                <span className="text-[11px] text-[#6b7a99]">{bankImportData.dateRange}</span>
                {bankImportData.dupes.size > 0 && (
                  <span className="rounded-full bg-[rgba(208,76,54,0.1)] px-2 py-0.5 text-[11px] text-[#d04c36]">
                    {bankImportData.dupes.size} duplicados
                  </span>
                )}
              </div>
              <button onClick={handleClearBankImport} className="p-1.5 text-[#6b7a99] transition-colors hover:text-[#d04c36]">
                <X size={16} />
              </button>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto rounded-[24px] border border-[#dce6f8] bg-white/92">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Fecha</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Contrapartida</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Descripción</th>
                    <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Monto</th>
                    <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {bankImportData.movements.slice(0, 15).map((m, idx) => {
                    const isDupe = bankImportData.dupes.has(idx);
                    return (
                      <tr key={idx} className={`border-b border-[#eef2fb] ${isDupe ? 'opacity-55' : ''}`}>
                        <td className="px-3 py-2 text-[12px] text-[#70819f]">{m.postedDate}</td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-[12px] text-[#1f2a44]">{m.counterparty || '—'}</td>
                        <td className="max-w-[220px] truncate px-3 py-2 text-[12px] text-[#70819f]">{m.description}</td>
                        <td className={`px-3 py-2 text-right font-mono text-[12px] ${m.direction === 'in' ? 'text-[#0f9f6e]' : 'text-[#d04c36]'}`}>
                          {m.direction === 'in' ? '+' : '-'}€{m.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2">
                          {isDupe ? (
                            <span className="rounded-full bg-[rgba(208,76,54,0.1)] px-1.5 py-0.5 text-[10px] text-[#d04c36]">Duplicado</span>
                          ) : (
                            <span className="rounded-full bg-[rgba(15,159,110,0.1)] px-1.5 py-0.5 text-[10px] text-[#0f9f6e]">Nuevo</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {bankImportData.movements.length > 15 && (
              <p className="text-center text-[11px] text-[#70819f]">
                ... y {bankImportData.movements.length - 15} movimientos más
              </p>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-[rgba(15,159,110,0.18)] bg-[rgba(244,252,248,0.94)] p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-[#648277]">Entradas</p>
                <p className="text-sm font-bold text-[#0f9f6e]">
                  €{bankImportData.movements.filter(m => m.direction === 'in').reduce((s, m) => s + m.amount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-[rgba(208,76,54,0.18)] bg-[rgba(255,248,246,0.94)] p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-[#8a6d66]">Salidas</p>
                <p className="text-sm font-bold text-[#d04c36]">
                  €{bankImportData.movements.filter(m => m.direction === 'out').reduce((s, m) => s + m.amount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="rounded-xl border border-[rgba(49,86,211,0.18)] bg-[rgba(240,245,255,0.94)] p-3 text-center">
                <p className="text-[10px] font-semibold uppercase text-[#5b7bd6]">Nuevos</p>
                <p className="text-sm font-bold text-[#3156d3]">
                  {bankImportData.movements.length - bankImportData.dupes.size} de {bankImportData.movements.length}
                </p>
              </div>
            </div>

            {bankImportResult && (
              <div className="flex items-center gap-3 rounded-2xl border border-[rgba(15,159,110,0.22)] bg-[rgba(244,252,248,0.94)] px-4 py-3">
                <CheckCircle2 size={18} className="text-[#0f9f6e]" />
                <div className="text-[12px] text-[#1f2a44]">
                  <span className="font-medium">Importación completada:</span>{' '}
                  <span className="text-[#0f9f6e]">{bankImportResult.imported} creados</span>,{' '}
                  <span className="text-[#c98717]">{bankImportResult.skipped} omitidos</span>
                  {bankImportResult.errors > 0 && (
                    <>, <span className="text-[#d04c36]">{bankImportResult.errors} errores</span></>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClearBankImport}
                className="rounded-2xl px-4 py-2 text-[12px] font-medium text-[#6b7a99] transition hover:bg-[rgba(94,115,159,0.08)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleBankImport}
                disabled={bankImporting || !!bankImportResult}
                className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(49,86,211,0.24)] bg-[rgba(49,86,211,0.08)] px-5 py-2 text-[12px] font-medium text-[#3156d3] transition hover:bg-[rgba(49,86,211,0.14)] disabled:opacity-50"
              >
                {bankImporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Landmark size={14} />
                )}
                {bankImporting ? 'Importando...' : `Importar ${bankImportData.movements.length - bankImportData.dupes.size} movimientos`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExport;
