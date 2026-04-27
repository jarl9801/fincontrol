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
import {
 computeInstancesForPeriod,
 instanceToPayablePayload,
 periodLabel,
} from '../finance/recurringGenerator';

/**
 * useRecurringGenerator — generate payable instances from recurringCosts.
 *
 * Stateless hook: caller passes in the rules + existing payables + target
 * period; generator computes the diff and writes new payables to Firestore.
 *
 * Idempotent by (recurringCostId, recurringPeriod): re-running for the same
 * period skips already-created instances.
 */
export const useRecurringGenerator = (user) => {
 const payablesRef = collection(db, 'artifacts', appId, 'public', 'data', 'payables');

 /**
 * Pure preview — no writes. Useful for the modal.
 */
 const preview = useCallback(
 ({ rules, existingPayables, year, month }) =>
 computeInstancesForPeriod({ rules, existingPayables, year, month }),
 [],
 );

 /**
 * Execute generation. Skips instances that are flagged `existing`.
 * Returns { success, created, skipped, errors }.
 */
 const generate = useCallback(
 async ({ rules, existingPayables, year, month }) => {
 if (!user) return { success: false, error: 'No user' };

 const instances = computeInstancesForPeriod({ rules, existingPayables, year, month });
 const toCreate = instances.filter((i) => !i.existing);

 let created = 0;
 const skipped = instances.length - toCreate.length;
 const errors = [];

 for (const instance of toCreate) {
 try {
 const base = instanceToPayablePayload(instance);
 const amount = Math.max(0, Math.round(Number(base.amount) * 100) / 100);
 const payload = {
 accountId: 'main',
 currency: 'EUR',
 invoiceNumber: '',
 documentNumber: '',
 vendor: base.vendor,
 counterpartyName: base.vendor,
 projectId: base.projectId || '',
 projectName: '',
 employeeIds: [],
 costCenterId: base.costCenterId || '',
 description: base.description,
 grossAmount: amount,
 amount,
 openAmount: amount,
 pendingAmount: amount,
 paidAmount: 0,
 issueDate: base.issueDate,
 dueDate: base.dueDate,
 paymentTerms: 'net30',
 status: 'issued',
 payments: [],
 notes: base.notes || '',
 linkedTransactionId: null,
 legacyTransactionId: null,
 // Traceability fields specific to recurring instances
 recurringCostId: base.recurringCostId,
 recurringPeriod: base.recurringPeriod,
 source: 'recurring',
 createdBy: user.email,
 createdAt: serverTimestamp(),
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'create',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Generada desde costo recurrente — ${base.recurringPeriod}`,
 }),
 };
 const docRef = await addDoc(payablesRef, payload);
 await writeAuditLogEntry({
 action: 'create',
 entityType: 'payable',
 entityId: docRef.id,
 description: `Payable generada (recurrente): ${payload.description}`,
 userEmail: user.email,
 metadata: {
 recurringCostId: base.recurringCostId,
 recurringPeriod: base.recurringPeriod,
 },
 });
 created += 1;
 } catch (err) {
 logError('Error generating recurring payable:', err);
 errors.push({ instance, error: err.message || String(err) });
 }
 }

 // Summary audit
 await writeAuditLogEntry({
 action: 'bulk-generate',
 entityType: 'recurringInstances',
 entityId: `${year}-${String(month).padStart(2, '0')}`,
 description: `Generación recurrente — ${periodLabel(year, month)}: ${created} creadas, ${skipped} ya existían, ${errors.length} errores`,
 userEmail: user.email,
 metadata: { year, month, created, skipped, errorCount: errors.length },
 });

 return {
 success: errors.length === 0,
 created,
 skipped,
 errors,
 };
 },
 [user, payablesRef],
 );

 return { preview, generate };
};

export default useRecurringGenerator;
