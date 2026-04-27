/**
 * DATEV / Sparkasse CSV parser (RFC 4180-ish, quoted multiline tolerant)
 *
 * Format observed:
 *   - Encoding: UTF-8
 *   - Separator: ;
 *   - Date: DD.MM.YYYY
 *   - Amount: 1.234,56 / -12,98 (German: dot=thousands, comma=decimal)
 *   - Sign: positive=inflow, negative=outflow
 *   - 12 columns: Automat, Sammlerauflösung, Buchungsdatum, Valutadatum,
 *     Empfängername/Auftraggeber, IBAN/Kontonummer, BIC/BLZ,
 *     Verwendungszweck, Betrag in EUR, Notiz, Anzahl Belege, Geprüft
 */

/** RFC 4180-style CSV parser that respects quoted multiline fields. */
export const parseCSVText = (text, separator = ';') => {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === separator) {
        row.push(field);
        field = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        if (field !== '' || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        }
      } else {
        field += c;
      }
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

/** Convert German number "1.234,56" → JS 1234.56. */
export const parseGermanAmount = (str) => {
  if (str == null) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  const normalized = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
};

/** Convert German date "DD.MM.YYYY" → ISO "YYYY-MM-DD". */
export const parseGermanDate = (str) => {
  if (!str) return '';
  const m = String(str).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return '';
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

const parseGermanBool = (str) => String(str || '').trim().toLowerCase() === 'ja';

/**
 * Parse a Sparkasse "Kontobewegungen" CSV file content.
 * Returns { rows, errors, header, period }.
 *   rows:    array of normalized movement objects
 *   errors:  rows that couldn't be parsed (with line number + raw)
 *   header:  raw header line as array of column names
 *   period:  { minDate, maxDate, count }
 */
export const parseDatevCSV = (text) => {
  if (!text) return { rows: [], errors: [], header: [], period: null };

  // Strip BOM if present
  const cleaned = text.replace(/^﻿/, '');
  const allRows = parseCSVText(cleaned, ';');
  if (allRows.length === 0) return { rows: [], errors: [], header: [], period: null };

  const header = allRows[0];
  const rows = [];
  const errors = [];

  let minDate = '9999-99-99';
  let maxDate = '0000-00-00';

  for (let i = 1; i < allRows.length; i++) {
    const cols = allRows[i];
    if (cols.length < 9) {
      errors.push({ lineNumber: i + 1, raw: cols.join(';') });
      continue;
    }
    const postedDate = parseGermanDate(cols[2]);
    const amountSigned = parseGermanAmount(cols[8]);
    if (!postedDate || amountSigned === 0) {
      errors.push({ lineNumber: i + 1, raw: cols.join(';') });
      continue;
    }
    const direction = amountSigned >= 0 ? 'in' : 'out';
    const row = {
      lineNumber: i + 1,
      automat: parseGermanBool(cols[0]),
      sammler: parseGermanBool(cols[1]),
      postedDate,
      valueDate: parseGermanDate(cols[3]) || postedDate,
      counterpartyName: (cols[4] || '').trim(),
      counterpartyIban: (cols[5] || '').trim(),
      counterpartyBic: (cols[6] || '').trim(),
      description: (cols[7] || '').trim(),
      amountSigned,
      direction,
      amount: Math.abs(amountSigned),
      notes: (cols[9] || '').trim(),
      receiptCount: parseInt(cols[10] || '0', 10) || 0,
      verified: parseGermanBool(cols[11]),
    };
    rows.push(row);
    if (postedDate < minDate) minDate = postedDate;
    if (postedDate > maxDate) maxDate = postedDate;
  }

  const period = rows.length > 0 ? { minDate, maxDate, count: rows.length } : null;
  return { rows, errors, header, period };
};

/**
 * Build a deterministic fingerprint for an existing bankMovement so we
 * can detect duplicates across import sessions.
 *
 * Used by the importer to skip rows that already exist with the same
 * postedDate + amount + direction + counterparty (case-insensitive).
 */
export const movementFingerprint = (m) => {
  const date = (m.postedDate || '').slice(0, 10);
  const amount = Math.abs(Number(m.amount) || 0).toFixed(2);
  const direction = m.direction || (Number(m.amount) >= 0 ? 'in' : 'out');
  const cp = String(m.counterpartyName || '').trim().toLowerCase();
  return `${date}|${amount}|${direction}|${cp}`;
};

/**
 * Build the same fingerprint for a parsed DATEV row.
 */
export const datevRowFingerprint = (row) => {
  const date = row.postedDate || '';
  const amount = Math.abs(Number(row.amount) || 0).toFixed(2);
  const direction = row.direction || 'in';
  const cp = String(row.counterpartyName || '').trim().toLowerCase();
  return `${date}|${amount}|${direction}|${cp}`;
};

/**
 * Diff a parsed DATEV file against existing bank movements.
 *   Returns { newRows, duplicateRows }.
 *   - newRows: not present in existing → candidates to insert
 *   - duplicateRows: found a match → skip
 */
export const diffAgainstExisting = (parsedRows, existingMovements) => {
  const existingFingerprints = new Set(
    (existingMovements || []).map(movementFingerprint),
  );
  const newRows = [];
  const duplicateRows = [];
  for (const row of parsedRows) {
    if (existingFingerprints.has(datevRowFingerprint(row))) {
      duplicateRows.push(row);
    } else {
      newRows.push(row);
    }
  }
  return { newRows, duplicateRows };
};

/** Build the Firestore payload for a parsed DATEV row. */
export const datevRowToBankMovementPayload = (row, fileName = '') => ({
  kind: row.direction === 'in' ? 'collection' : 'payment',
  direction: row.direction,
  amount: row.amount,
  postedDate: row.postedDate,
  valueDate: row.valueDate || row.postedDate,
  description: row.description,
  counterpartyName: row.counterpartyName,
  documentNumber: '',
  // Source tracing — these fields make it easy to re-derive what came from
  // each import run.
  importSource: 'datev',
  importFile: fileName,
  importLineNumber: row.lineNumber,
});
