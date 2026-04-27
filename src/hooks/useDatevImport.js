import { useCallback } from 'react';
import {
 addDoc,
 arrayUnion,
 collection,
 doc,
 increment,
 serverTimestamp,
 updateDoc,
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { writeAuditLogEntry } from '../utils/auditLog';
import { logError } from '../utils/logger';
import { datevRowToBankMovementPayload } from '../finance/datevParser';
import { findBestRule, buildClassificationPayload } from '../finance/ruleEngine';

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
 * If `rules` is provided, each newly-created movement is matched against
 * the best active rule and (when found) the classification is applied
 * + the rule's hit counter is incremented.
 *
 * onProgress(processed, total) — optional callback to update UI.
 */
 const importRows = useCallback(
 async (rows, fileName = '', onProgress = null, rules = []) => {
 if (!user) return { success: false, error: 'No user' };
 let imported = 0;
 let autoClassified = 0;
 const ruleHitsLocal = new Map(); // ruleId → count, batched at end
 const errors = [];

 for (let i = 0; i < rows.length; i++) {
 const row = rows[i];
 try {
 const base = datevRowToBankMovementPayload(row, fileName);

 // Try to find a matching rule BEFORE writing so we can include its
 // classification in the initial document (one Firestore write).
 const movementForMatch = {
 direction: base.direction,
 amount: base.amount,
 counterpartyName: base.counterpartyName,
 description: base.description,
 };
 const matchedRule = findBestRule(movementForMatch, rules);
 const ruleClassification = matchedRule
 ? buildClassificationPayload(matchedRule, movementForMatch)
 : {};

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
 // Auto-classification (overrides empty defaults above)
 ...ruleClassification,
 appliedRuleId: matchedRule ? matchedRule.id : null,
 createdBy: user.email,
 createdAt: serverTimestamp(),
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion(
 {
 action: 'create',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Importado desde DATEV — ${fileName} línea ${row.lineNumber}`,
 },
 ...(matchedRule
 ? [{
 action: 'auto-classify',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Auto-clasificado por regla "${matchedRule.name || matchedRule.pattern}"`,
 }]
 : []),
 ),
 };
 await addDoc(movementsRef, payload);
 imported += 1;
 if (matchedRule) {
 autoClassified += 1;
 ruleHitsLocal.set(matchedRule.id, (ruleHitsLocal.get(matchedRule.id) || 0) + 1);
 }
 } catch (err) {
 logError('Error importing DATEV row:', err);
 errors.push({ row, error: err.message || String(err) });
 }
 if (onProgress) onProgress(i + 1, rows.length);
 }

 // Bump rule hits in one write per rule
 const nowIso = new Date().toISOString();
 await Promise.all(
 Array.from(ruleHitsLocal.entries()).map(async ([ruleId, hits]) => {
 try {
 const ruleRef = doc(db, 'artifacts', appId, 'public', 'data', 'classificationRules', ruleId);
 await updateDoc(ruleRef, {
 hits: increment(hits),
 lastHitAt: nowIso,
 });
 } catch (err) {
 logError('Error bumping rule hits:', err);
 }
 }),
 );

 await writeAuditLogEntry({
 action: 'bulk-import',
 entityType: 'bankMovement',
 entityId: fileName || 'datev-bulk',
 description: `DATEV import — ${fileName}: ${imported} creados (${autoClassified} autoclasificados), ${errors.length} errores`,
 userEmail: user.email,
 metadata: { fileName, imported, autoClassified, errorCount: errors.length },
 });

 return { success: errors.length === 0, imported, autoClassified, errors };
 },
 [user, movementsRef],
 );

 return { importRows };
};

export default useDatevImport;
