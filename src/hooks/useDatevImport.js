import { useCallback } from 'react';
import {
 addDoc,
 arrayUnion,
 collection,
 serverTimestamp,
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { writeAuditLogEntry } from '../utils/auditLog';
import { logError } from '../utils/logger';
import { datevRowToBankMovementPayload } from '../finance/datevParser';

/**
 * useDatevImport — bulk-create bank movements from parsed DATEV rows.
 *
 * Stateless hook: caller is responsible for parsing CSV and computing
 * the diff vs. existing movements. This hook just writes new rows.
 */
export const useDatevImport = (user) => {
 const movementsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bankMovements');

 /**
 * Insert each row from `rows` (already filtered to unique new rows)
 * as a bankMovement document. Reports counts and per-row errors.
 *
 * onProgress(processed, total) — optional callback to update UI.
 */
 const importRows = useCallback(
 async (rows, fileName = '', onProgress = null) => {
 if (!user) return { success: false, error: 'No user' };
 let imported = 0;
 const errors = [];

 for (let i = 0; i < rows.length; i++) {
 const row = rows[i];
 try {
 const base = datevRowToBankMovementPayload(row, fileName);
 const payload = {
 accountId: 'main',
 currency: 'EUR',
 kind: base.kind,
 status: 'posted',
 direction: base.direction,
 amount: base.amount,
 postedDate: base.postedDate,
 valueDate: base.valueDate,
 description: base.description,
 counterpartyName: base.counterpartyName,
 documentNumber: '',
 projectId: '',
 projectName: '',
 employeeIds: [],
 costCenterId: '',
 receivableId: null,
 payableId: null,
 linkedTransactionId: null,
 legacyTransactionId: null,
 reconciliationId: null,
 reconciledAt: null,
 // Trace fields
 importSource: base.importSource,
 importFile: base.importFile,
 importLineNumber: base.importLineNumber,
 createdBy: user.email,
 createdAt: serverTimestamp(),
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'create',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Importado desde DATEV — ${fileName} línea ${row.lineNumber}`,
 }),
 };
 await addDoc(movementsRef, payload);
 imported += 1;
 } catch (err) {
 logError('Error importing DATEV row:', err);
 errors.push({ row, error: err.message || String(err) });
 }
 if (onProgress) onProgress(i + 1, rows.length);
 }

 await writeAuditLogEntry({
 action: 'bulk-import',
 entityType: 'bankMovement',
 entityId: fileName || 'datev-bulk',
 description: `DATEV import — ${fileName}: ${imported} creados, ${errors.length} errores`,
 userEmail: user.email,
 metadata: { fileName, imported, errorCount: errors.length },
 });

 return { success: errors.length === 0, imported, errors };
 },
 [user, movementsRef],
 );

 return { importRows };
};

export default useDatevImport;
