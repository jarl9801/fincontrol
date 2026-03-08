import React, { useState, useMemo, useRef } from 'react';
import {
  Download, Upload, FileSpreadsheet, FileText, AlertTriangle,
  CheckCircle2, X, Eye, Loader2
} from 'lucide-react';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { exportToExcel } from '../../utils/excelExport';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

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

const ImportExport = ({ user, userRole }) => {
  const { allTransactions, loading } = useAllTransactions(user);
  const { createTransaction } = useTransactionActions(user);
  const fileInputRef = useRef(null);

  const [importData, setImportData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

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
        showToast?.(error, 'error');
        return;
      }

      if (rows.length === 0) {
        showToast?.('El archivo no contiene datos', 'error');
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
      showToast?.('Solo se aceptan archivos CSV', 'error');
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
      showToast?.(`Columnas sin mapear: ${missingCols.join(', ')}`, 'error');
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
      showToast?.(`Importacion completa: ${imported} creadas, ${skipped} omitidas, ${errors} errores`, imported > 0 ? 'success' : 'info');
    } catch (err) {
      console.error('Import error:', err);
      showToast?.('Error durante la importacion', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = () => {
    if (allTransactions.length === 0) {
      showToast?.('No hay transacciones para exportar', 'info');
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

    showToast?.(`${allTransactions.length} transacciones exportadas a CSV`, 'success');
  };

  const handleExportExcel = () => {
    if (allTransactions.length === 0) {
      showToast?.('No hay transacciones para exportar', 'info');
      return;
    }
    exportToExcel(allTransactions, 'fincontrol_export');
    showToast?.(`${allTransactions.length} transacciones exportadas a Excel`, 'success');
  };

  const handleClearImport = () => {
    setImportData(null);
    setColumnMapping({});
    setImportResult(null);
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
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Import / Export Masivo</h2>
        <p className="text-[13px] text-[#636366] mt-0.5">Exporta o importa transacciones en lote</p>
      </div>

      {/* Export Section */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-[#30d158]" />
          <h3 className="text-[15px] font-semibold text-white">Exportar Transacciones</h3>
          <span className="ml-auto text-[11px] text-[#636366]">{allTransactions.length} transacciones disponibles</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium bg-[rgba(48,209,88,0.12)] text-[#30d158] border border-[rgba(48,209,88,0.3)] rounded-lg hover:bg-[rgba(48,209,88,0.2)] transition-colors"
          >
            <FileText size={14} />
            Exportar CSV
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium bg-[rgba(10,132,255,0.12)] text-[#0a84ff] border border-[rgba(10,132,255,0.3)] rounded-lg hover:bg-[rgba(10,132,255,0.2)] transition-colors"
          >
            <FileSpreadsheet size={14} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={18} className="text-[#ff9f0a]" />
          <h3 className="text-[15px] font-semibold text-white">Importar Transacciones</h3>
        </div>

        {!importData ? (
          <>
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                isDragging
                  ? 'border-[#ff9f0a] bg-[rgba(255,159,10,0.08)]'
                  : 'border-[rgba(255,255,255,0.06)] bg-[#2c2c2e] hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-[#ff9f0a]' : 'text-[#636366]'}`} />
              <p className="text-[14px] font-medium text-white mb-1">
                {isDragging ? 'Suelta el archivo aqui' : 'Arrastra un CSV o haz clic para seleccionar'}
              </p>
              <p className="text-[12px] text-[#636366]">Columnas esperadas: fecha, monto, descripcion, categoria, tipo</p>
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
            {/* File Info */}
            <div className="flex items-center justify-between px-4 py-3 bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)] rounded-xl">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#ff9f0a]" />
                <span className="text-[13px] text-white font-medium">{importData.fileName}</span>
                <span className="text-[11px] text-[#636366]">{importData.rows.length} filas</span>
                {duplicates.size > 0 && (
                  <span className="text-[11px] text-[#ff453a] bg-[rgba(255,69,58,0.1)] px-2 py-0.5 rounded-full">
                    {duplicates.size} posibles duplicados
                  </span>
                )}
              </div>
              <button onClick={handleClearImport} className="p-1.5 text-[#636366] hover:text-[#ff453a] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Column Mapping */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {REQUIRED_COLUMNS.map(col => (
                <div key={col}>
                  <label className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1 block">
                    {col} {!columnMapping[col] && <span className="text-[#ff453a]">*</span>}
                  </label>
                  <select
                    value={columnMapping[col] || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-[#2c2c2e] border border-[rgba(255,255,255,0.06)] rounded-lg text-[12px] text-white focus:outline-none focus:border-[rgba(10,132,255,0.4)]"
                  >
                    <option value="">-- Seleccionar --</option>
                    {importData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview Table */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={14} className="text-[#8e8e93]" />
                <span className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                  Vista previa (primeras {Math.min(previewRows.length, 10)} filas)
                </span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.06)]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)] bg-[#2c2c2e]">
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase">#</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase">Fecha</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase">Descripcion</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase">Categoria</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase">Tipo</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase text-right">Monto</th>
                      <th className="px-3 py-2 text-[10px] font-semibold text-[#8e8e93] uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => {
                      const isDupe = duplicates.has(idx);
                      return (
                        <tr key={idx} className={`border-b border-[rgba(255,255,255,0.03)] ${isDupe ? 'opacity-50' : ''}`}>
                          <td className="px-3 py-2 text-[11px] text-[#636366]">{idx + 1}</td>
                          <td className="px-3 py-2 text-[12px] text-[#8e8e93]">{row.fecha}</td>
                          <td className="px-3 py-2 text-[12px] text-white truncate max-w-[200px]">{row.descripcion}</td>
                          <td className="px-3 py-2 text-[12px] text-[#8e8e93]">{row.categoria}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              normalizeType(row.tipo) === 'income'
                                ? 'bg-[rgba(48,209,88,0.1)] text-[#30d158]'
                                : 'bg-[rgba(255,69,58,0.1)] text-[#ff453a]'
                            }`}>
                              {normalizeType(row.tipo) === 'income' ? 'Ingreso' : 'Gasto'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[12px] text-white text-right font-mono">{row.monto}</td>
                          <td className="px-3 py-2">
                            {isDupe ? (
                              <span className="text-[10px] text-[#ff453a] bg-[rgba(255,69,58,0.1)] px-1.5 py-0.5 rounded">Duplicado</span>
                            ) : (
                              <span className="text-[10px] text-[#30d158] bg-[rgba(48,209,88,0.1)] px-1.5 py-0.5 rounded">Nuevo</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {importData.rows.length > 10 && (
                <p className="text-[11px] text-[#636366] mt-2 text-center">
                  ... y {importData.rows.length - 10} filas mas
                </p>
              )}
            </div>

            {/* Import Result */}
            {importResult && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(48,209,88,0.08)] border border-[rgba(48,209,88,0.2)] rounded-xl">
                <CheckCircle2 size={18} className="text-[#30d158]" />
                <div className="text-[12px] text-white">
                  <span className="font-medium">Importacion completada:</span>{' '}
                  <span className="text-[#30d158]">{importResult.imported} creadas</span>,{' '}
                  <span className="text-[#ff9f0a]">{importResult.skipped} omitidas</span>
                  {importResult.errors > 0 && (
                    <>, <span className="text-[#ff453a]">{importResult.errors} errores</span></>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClearImport}
                className="px-4 py-2 text-[12px] font-medium text-[#8e8e93] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={importing || !!importResult}
                className="flex items-center gap-2 px-5 py-2 text-[12px] font-medium bg-[rgba(255,159,10,0.12)] text-[#ff9f0a] border border-[rgba(255,159,10,0.3)] rounded-lg hover:bg-[rgba(255,159,10,0.2)] transition-colors disabled:opacity-50"
              >
                {importing ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#ff9f0a] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {importing ? 'Importando...' : `Importar ${importData.rows.length - duplicates.size} transacciones`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportExport;
