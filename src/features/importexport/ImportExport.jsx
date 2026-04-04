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
 const _ibanCol = headers.find(h => h.includes('iban'));
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
 } catch {
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
 <div className="w-6 h-6 border-2 border-[var(--interactive)] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 ">
 <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-primary)]">Operación de datos</p>
 <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Importación y exportación</h2>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">Mueve registros en bloque con control previo de columnas y duplicados.</p>
 </div>

 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
 <div className="flex items-center gap-2 mb-4">
 <Download size={18} className="text-[var(--success)]" />
 <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Exportar transacciones</h3>
 <span className="ml-auto text-[11px] text-[var(--text-secondary)]">{allTransactions.length} transacciones disponibles</span>
 </div>
 <div className="flex gap-3">
 <button
 onClick={handleExportCSV}
 className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-2.5 text-[12px] font-medium text-[var(--success)] transition hover:bg-transparent"
 >
 <FileText size={14} />
 Exportar CSV
 </button>
 <button
 onClick={handleExportExcel}
 className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-2.5 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-transparent"
 >
 <FileSpreadsheet size={14} />
 Exportar Excel
 </button>
 </div>
 </div>

 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
 <div className="flex items-center gap-2 mb-4">
 <Upload size={18} className="text-[var(--warning)]" />
 <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Importar transacciones</h3>
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
 ? 'border-[var(--warning)] bg-transparent'
 : 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border)]'
 }`}
 >
 <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'}`} />
 <p className="mb-1 text-[14px] font-medium text-[var(--text-primary)]">
 {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un CSV o haz clic para seleccionar'}
 </p>
 <p className="text-[12px] text-[var(--text-secondary)]">Columnas esperadas: fecha, monto, descripción, categoría y tipo.</p>
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
 <div className="flex items-center justify-between rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-3">
 <div className="flex items-center gap-2">
 <FileText size={16} className="text-[var(--warning)]" />
 <span className="text-[13px] font-medium text-[var(--text-primary)]">{importData.fileName}</span>
 <span className="text-[11px] text-[var(--text-secondary)]">{importData.rows.length} filas</span>
 {duplicates.size > 0 && (
 <span className="rounded-full bg-transparent px-2 py-0.5 text-[11px] text-[var(--accent)]">
 {duplicates.size} posibles duplicados
 </span>
 )}
 </div>
 <button onClick={handleClearImport} className="p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
 <X size={16} />
 </button>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
 {REQUIRED_COLUMNS.map(col => (
 <div key={col}>
 <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
 {col} {!columnMapping[col] && <span className="text-[var(--accent)]">*</span>}
 </label>
 <select
 value={columnMapping[col] || ''}
 onChange={(e) => setColumnMapping(prev => ({ ...prev, [col]: e.target.value }))}
 className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] px-2 py-1.5 text-[12px] text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
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
 <Eye size={14} className="text-[var(--text-secondary)]" />
 <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
 Vista previa (primeras {Math.min(previewRows.length, 10)} filas)
 </span>
 </div>
 <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">#</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Fecha</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Descripción</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Categoría</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Tipo</th>
 <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Monto</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Estado</th>
 </tr>
 </thead>
 <tbody>
 {previewRows.map((row, idx) => {
 const isDupe = duplicates.has(idx);
 return (
 <tr key={idx} className={`border-b border-[var(--surface)] ${isDupe ? 'opacity-55' : ''}`}>
 <td className="px-3 py-2 text-[11px] text-[var(--text-secondary)]">{idx + 1}</td>
 <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">{row.fecha}</td>
 <td className="max-w-[200px] truncate px-3 py-2 text-[12px] text-[var(--text-primary)]">{row.descripcion}</td>
 <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">{row.categoria}</td>
 <td className="px-3 py-2">
 <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
 normalizeType(row.tipo) === 'income'
 ? 'bg-transparent text-[var(--success)]'
 : 'bg-transparent text-[var(--accent)]'
 }`}>
 {normalizeType(row.tipo) === 'income' ? 'Ingreso' : 'Gasto'}
 </span>
 </td>
 <td className="px-3 py-2 text-right font-mono text-[12px] text-[var(--text-primary)]">{row.monto}</td>
 <td className="px-3 py-2">
 {isDupe ? (
 <span className="rounded-full bg-transparent px-1.5 py-0.5 text-[10px] text-[var(--accent)]">Duplicado</span>
 ) : (
 <span className="rounded-full bg-transparent px-1.5 py-0.5 text-[10px] text-[var(--success)]">Nuevo</span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {importData.rows.length > 10 && (
 <p className="mt-2 text-center text-[11px] text-[var(--text-secondary)]">
 ... y {importData.rows.length - 10} filas más
 </p>
 )}
 </div>

 {importResult && (
 <div className="flex items-center gap-3 rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-3">
 <CheckCircle2 size={18} className="text-[var(--success)]" />
 <div className="text-[12px] text-[var(--text-primary)]">
 <span className="font-medium">Importación completada:</span>{' '}
 <span className="text-[var(--success)]">{importResult.imported} creadas</span>,{' '}
 <span className="text-[var(--warning)]">{importResult.skipped} omitidas</span>
 {importResult.errors > 0 && (
 <>, <span className="text-[var(--accent)]">{importResult.errors} errores</span></>
 )}
 </div>
 </div>
 )}

 <div className="flex justify-end gap-3">
 <button
 onClick={handleClearImport}
 className="rounded-lg px-4 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:bg-transparent"
 >
 Cancelar
 </button>
 <button
 onClick={handleImport}
 disabled={importing || !!importResult}
 className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-visible)] bg-transparent px-5 py-2 text-[12px] font-medium text-[var(--warning)] transition hover:bg-transparent disabled:opacity-50"
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
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 ">
 <div className="flex items-center gap-2 mb-4">
 <Landmark size={18} className="text-[var(--text-primary)]" />
 <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Importar movimientos bancarios</h3>
 <span className="ml-auto text-[11px] text-[var(--text-secondary)]">{bankMovements.length} movimientos en sistema</span>
 </div>
 <p className="mb-4 text-[12px] text-[var(--text-secondary)]">
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
 ? 'border-[var(--text-primary)] bg-[var(--surface)]'
 : 'border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border)]'
 }`}
 >
 <Landmark size={32} className={`mx-auto mb-3 ${bankIsDragging ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`} />
 <p className="mb-1 text-[14px] font-medium text-[var(--text-primary)]">
 {bankIsDragging ? 'Suelta el archivo aquí' : 'Arrastra el CSV del banco o haz clic para seleccionar'}
 </p>
 <p className="text-[12px] text-[var(--text-secondary)]">Formato esperado: Kontobewegungen export (CSV con separador ;)</p>
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
 <div className="flex items-center justify-between rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
 <div className="flex items-center gap-2 flex-wrap">
 <Landmark size={16} className="text-[var(--text-primary)]" />
 <span className="text-[13px] font-medium text-[var(--text-primary)]">{bankImportData.fileName}</span>
 <span className="text-[11px] text-[var(--text-secondary)]">{bankImportData.movements.length} movimientos</span>
 <span className="text-[11px] text-[var(--text-secondary)]">{bankImportData.dateRange}</span>
 {bankImportData.dupes.size > 0 && (
 <span className="rounded-full bg-transparent px-2 py-0.5 text-[11px] text-[var(--accent)]">
 {bankImportData.dupes.size} duplicados
 </span>
 )}
 </div>
 <button onClick={handleClearBankImport} className="p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]">
 <X size={16} />
 </button>
 </div>

 {/* Preview table */}
 <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Fecha</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Contrapartida</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Descripción</th>
 <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Monto</th>
 <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Estado</th>
 </tr>
 </thead>
 <tbody>
 {bankImportData.movements.slice(0, 15).map((m, idx) => {
 const isDupe = bankImportData.dupes.has(idx);
 return (
 <tr key={idx} className={`border-b border-[var(--surface)] ${isDupe ? 'opacity-55' : ''}`}>
 <td className="px-3 py-2 text-[12px] text-[var(--text-secondary)]">{m.postedDate}</td>
 <td className="max-w-[160px] truncate px-3 py-2 text-[12px] text-[var(--text-primary)]">{m.counterparty || '—'}</td>
 <td className="max-w-[220px] truncate px-3 py-2 text-[12px] text-[var(--text-secondary)]">{m.description}</td>
 <td className={`px-3 py-2 text-right font-mono text-[12px] ${m.direction === 'in' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 {m.direction === 'in' ? '+' : '-'}€{m.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
 </td>
 <td className="px-3 py-2">
 {isDupe ? (
 <span className="rounded-full bg-transparent px-1.5 py-0.5 text-[10px] text-[var(--accent)]">Duplicado</span>
 ) : (
 <span className="rounded-full bg-transparent px-1.5 py-0.5 text-[10px] text-[var(--success)]">Nuevo</span>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {bankImportData.movements.length > 15 && (
 <p className="text-center text-[11px] text-[var(--text-secondary)]">
 ... y {bankImportData.movements.length - 15} movimientos más
 </p>
 )}

 {/* Summary stats */}
 <div className="grid grid-cols-3 gap-3">
 <div className="rounded-xl border border-[var(--border-visible)] bg-transparent p-3 text-center">
 <p className="text-[10px] font-semibold uppercase text-[var(--success)]">Entradas</p>
 <p className="text-sm font-bold text-[var(--success)]">
 €{bankImportData.movements.filter(m => m.direction === 'in').reduce((s, m) => s + m.amount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
 </p>
 </div>
 <div className="rounded-xl border border-[var(--border-visible)] bg-transparent p-3 text-center">
 <p className="text-[10px] font-semibold uppercase text-[var(--text-secondary)]">Salidas</p>
 <p className="text-sm font-bold text-[var(--accent)]">
 €{bankImportData.movements.filter(m => m.direction === 'out').reduce((s, m) => s + m.amount, 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
 </p>
 </div>
 <div className="rounded-xl border border-[var(--border-visible)] bg-[var(--surface)] p-3 text-center">
 <p className="text-[10px] font-semibold uppercase text-[var(--text-primary)]">Nuevos</p>
 <p className="text-sm font-bold text-[var(--text-primary)]">
 {bankImportData.movements.length - bankImportData.dupes.size} de {bankImportData.movements.length}
 </p>
 </div>
 </div>

 {bankImportResult && (
 <div className="flex items-center gap-3 rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-3">
 <CheckCircle2 size={18} className="text-[var(--success)]" />
 <div className="text-[12px] text-[var(--text-primary)]">
 <span className="font-medium">Importación completada:</span>{' '}
 <span className="text-[var(--success)]">{bankImportResult.imported} creados</span>,{' '}
 <span className="text-[var(--warning)]">{bankImportResult.skipped} omitidos</span>
 {bankImportResult.errors > 0 && (
 <>, <span className="text-[var(--accent)]">{bankImportResult.errors} errores</span></>
 )}
 </div>
 </div>
 )}

 <div className="flex justify-end gap-3">
 <button
 onClick={handleClearBankImport}
 className="rounded-lg px-4 py-2 text-[12px] font-medium text-[var(--text-secondary)] transition hover:bg-transparent"
 >
 Cancelar
 </button>
 <button
 onClick={handleBankImport}
 disabled={bankImporting || !!bankImportResult}
 className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-5 py-2 text-[12px] font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface)] disabled:opacity-50"
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
