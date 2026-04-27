import { useCallback, useMemo } from 'react';
import {
 arrayUnion,
 doc,
 serverTimestamp,
 updateDoc,
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { writeAuditLogEntry } from '../utils/auditLog';
import { logError } from '../utils/logger';
import { useBankMovements } from './useBankMovements';
import { useReceivables } from './useReceivables';
import { usePayables } from './usePayables';

/**
 * useClassifier — operations to handle the weekly DATEV inbox flow.
 *
 * After a Friday DATEV import, every imported bankMovement is "raw":
 *   - direction in/out + amount + postedDate + counterparty + description
 *   - no categoryName / projectId / costCenterId / receivableId / payableId
 *
 * This hook exposes:
 *   linkToReceivable(movement, receivable)
 *     Marks the receivable settled (or partial) and copies its
 *     classification (projectId/projectName/costCenterId) onto the
 *     bankMovement plus a `receivableId` link.
 *
 *   linkToPayable(movement, payable)
 *     Analogous for payables.
 *
 *   categorize(movement, { categoryName, projectId, projectName, costCenterId, employeeIds })
 *     For "spontaneous" movements that are NOT tied to a CXC/CXP. Just
 *     writes classification fields onto the bankMovement.
 *
 *   suggestMatches(movement)
 *     Pure helper: returns CXC (if direction=in) or CXP (if direction=out)
 *     candidates with exact amount match (±0.01) within ±21 days.
 *     Excludes receivables/payables already settled.
 *
 *   inboxMovements
 *     Memoized list of bankMovements that need action:
 *       - direction=in and !receivableId
 *       - direction=out and !payableId and !categoryName
 */
export const useClassifier = (user) => {
 const { bankMovements } = useBankMovements(user);
 const { receivables } = useReceivables(user);
 const { payables } = usePayables(user);

 const movementsRef = (id) => doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', id);
 const receivablesRef = (id) => doc(db, 'artifacts', appId, 'public', 'data', 'receivables', id);
 const payablesRef = (id) => doc(db, 'artifacts', appId, 'public', 'data', 'payables', id);

 const linkToReceivable = useCallback(
 async (movement, receivable) => {
 if (!user) return { success: false, error: 'No user' };
 try {
 const amount = Math.abs(Number(movement.amount) || 0);
 const open = Math.max(0, Number(receivable.openAmount || receivable.grossAmount || receivable.amount) || 0);
 const nextOpen = Math.max(0, +(open - amount).toFixed(2));
 const nextPaid = +((Number(receivable.paidAmount) || 0) + amount).toFixed(2);
 const nextStatus = nextOpen <= 0.01 ? 'settled' : 'partial';

 // 1. Update bankMovement: link + propagate classification
 await updateDoc(movementsRef(movement.id), {
 receivableId: receivable.id,
 reconciledAt: serverTimestamp(),
 categoryName: receivable.categoryName || movement.categoryName || '',
 projectId: receivable.projectId || movement.projectId || '',
 projectName: receivable.projectName || movement.projectName || '',
 costCenterId: receivable.costCenterId || movement.costCenterId || '',
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'link-receivable',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Conciliado con CXC ${receivable.documentNumber || receivable.id}`,
 }),
 });

 // 2. Update receivable: register payment + status
 await updateDoc(receivablesRef(receivable.id), {
 openAmount: nextOpen,
 pendingAmount: nextOpen,
 paidAmount: nextPaid,
 status: nextStatus,
 payments: arrayUnion({
 date: movement.postedDate,
 amount,
 method: 'Transferencia',
 reference: movement.description || '',
 note: 'Conciliado desde DATEV',
 bankMovementId: movement.id,
 registeredBy: user.email,
 timestamp: new Date().toISOString(),
 }),
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'link-bank-movement',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Conciliado con bankMovement ${movement.id}`,
 }),
 });

 await writeAuditLogEntry({
 action: 'reconcile',
 entityType: 'receivable',
 entityId: receivable.id,
 description: `CXC conciliada: ${receivable.documentNumber || receivable.counterpartyName || receivable.id} ↔ bank ${movement.postedDate}`,
 userEmail: user.email,
 metadata: {
 bankMovementId: movement.id,
 amount,
 nextStatus,
 },
 });
 return { success: true, status: nextStatus };
 } catch (err) {
 logError('linkToReceivable error:', err);
 return { success: false, error: err };
 }
 },
 [user],
 );

 const linkToPayable = useCallback(
 async (movement, payable) => {
 if (!user) return { success: false, error: 'No user' };
 try {
 const amount = Math.abs(Number(movement.amount) || 0);
 const open = Math.max(0, Number(payable.openAmount || payable.grossAmount || payable.amount) || 0);
 const nextOpen = Math.max(0, +(open - amount).toFixed(2));
 const nextPaid = +((Number(payable.paidAmount) || 0) + amount).toFixed(2);
 const nextStatus = nextOpen <= 0.01 ? 'settled' : 'partial';

 await updateDoc(movementsRef(movement.id), {
 payableId: payable.id,
 reconciledAt: serverTimestamp(),
 categoryName: payable.categoryName || movement.categoryName || '',
 projectId: payable.projectId || movement.projectId || '',
 projectName: payable.projectName || movement.projectName || '',
 costCenterId: payable.costCenterId || movement.costCenterId || '',
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'link-payable',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Conciliado con CXP ${payable.documentNumber || payable.id}`,
 }),
 });

 await updateDoc(payablesRef(payable.id), {
 openAmount: nextOpen,
 pendingAmount: nextOpen,
 paidAmount: nextPaid,
 status: nextStatus,
 payments: arrayUnion({
 date: movement.postedDate,
 amount,
 method: 'Transferencia',
 reference: movement.description || '',
 note: 'Conciliado desde DATEV',
 bankMovementId: movement.id,
 registeredBy: user.email,
 timestamp: new Date().toISOString(),
 }),
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'link-bank-movement',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Conciliado con bankMovement ${movement.id}`,
 }),
 });

 await writeAuditLogEntry({
 action: 'reconcile',
 entityType: 'payable',
 entityId: payable.id,
 description: `CXP conciliada: ${payable.documentNumber || payable.counterpartyName || payable.id} ↔ bank ${movement.postedDate}`,
 userEmail: user.email,
 metadata: {
 bankMovementId: movement.id,
 amount,
 nextStatus,
 },
 });
 return { success: true, status: nextStatus };
 } catch (err) {
 logError('linkToPayable error:', err);
 return { success: false, error: err };
 }
 },
 [user],
 );

 const categorize = useCallback(
 async (movement, classification) => {
 if (!user) return { success: false, error: 'No user' };
 try {
 const categoryName = (classification.categoryName || '').trim();
 const payload = {
 categoryName,
 projectId: classification.projectId || '',
 projectName: classification.projectName || '',
 costCenterId: classification.costCenterId || '',
 employeeIds: Array.isArray(classification.employeeIds) ? classification.employeeIds : [],
 updatedBy: user.email,
 updatedAt: serverTimestamp(),
 auditTrail: arrayUnion({
 action: 'classify',
 user: user.email,
 timestamp: new Date().toISOString(),
 detail: `Categorizado como ${categoryName || 'sin categoría'}`,
 }),
 };
 await updateDoc(movementsRef(movement.id), payload);
 return { success: true };
 } catch (err) {
 logError('categorize error:', err);
 return { success: false, error: err };
 }
 },
 [user],
 );

 // Pure suggestion logic — does not touch Firestore
 const suggestMatches = useCallback(
 (movement) => {
 if (!movement) return [];
 const amount = Math.abs(Number(movement.amount) || 0);
 const targetDate = new Date(movement.postedDate || '');
 if (Number.isNaN(targetDate.getTime())) return [];
 const TOLERANCE_DAYS = 21;
 const TOLERANCE_MS = TOLERANCE_DAYS * 24 * 60 * 60 * 1000;

 const pool = movement.direction === 'in' ? receivables : payables;
 const fieldDate = movement.direction === 'in' ? 'dueDate' : 'dueDate';

 return (pool || [])
 .filter((p) => p.status !== 'settled' && p.status !== 'cancelled' && p.status !== 'void')
 .map((p) => {
 const open = Math.abs(Number(p.openAmount || p.grossAmount || p.amount) || 0);
 const itemDate = new Date(p[fieldDate] || p.issueDate || '');
 const daysDiff = Number.isNaN(itemDate.getTime())
 ? Infinity
 : Math.abs((itemDate - targetDate) / (1000 * 60 * 60 * 24));
 const amountDiff = Math.abs(open - amount);
 // Score: amount match worth 100, date proximity worth up to 30
 let score = 0;
 if (amountDiff < 0.01) score += 100;
 else if (amountDiff < 1) score += 80;
 else if (amountDiff < 10) score += 40;
 else return null;
 if (daysDiff <= TOLERANCE_DAYS) score += Math.max(0, 30 - daysDiff);
 return { item: p, amountDiff, daysDiff, score };
 })
 .filter((m) => m && m.score > 0)
 .sort((a, b) => b.score - a.score)
 .slice(0, 5);
 },
 [receivables, payables],
 );

 // Inbox: movements that need action
 const inboxMovements = useMemo(() => {
 return (bankMovements || []).filter((m) => {
 if (m.status === 'void') return false;
 if (m.direction === 'in') {
 // Income needs link to a CXC
 return !m.receivableId;
 }
 // Outflow: needs CXP link OR explicit categorization
 const hasLink = !!m.payableId;
 const hasCategory = !!(m.categoryName || m.costCenterId);
 return !hasLink && !hasCategory;
 });
 }, [bankMovements]);

 return {
 inboxMovements,
 bankMovements,
 receivables,
 payables,
 linkToReceivable,
 linkToPayable,
 categorize,
 suggestMatches,
 };
};

export default useClassifier;
