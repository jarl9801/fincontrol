import { logError } from '../utils/logger';
import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { adaptBankMovementDoc } from '../finance/adapters';
import {
  DEFAULT_CURRENCY,
  MAIN_ACCOUNT_ID,
  MOVEMENT_KIND,
  MOVEMENT_STATUS,
} from '../finance/constants';
import { clampMoney, toISODate } from '../finance/utils';
import { writeAuditLogEntry } from '../utils/auditLog';

const buildMovementSnapshot = (movement, override = {}) => ({
  direction: override.direction ?? movement?.direction ?? 'in',
  amount: override.amount ?? clampMoney(movement?.amount || 0),
  status: override.status ?? movement?.status ?? MOVEMENT_STATUS.POSTED,
  postedDate: override.postedDate ?? movement?.postedDate ?? movement?.valueDate ?? null,
  valueDate: override.valueDate ?? movement?.valueDate ?? movement?.postedDate ?? null,
  description: override.description ?? movement?.description ?? '',
  counterpartyName: override.counterpartyName ?? movement?.counterpartyName ?? '',
  documentNumber: override.documentNumber ?? movement?.documentNumber ?? '',
  projectId: override.projectId ?? movement?.projectId ?? '',
  projectName: override.projectName ?? movement?.projectName ?? '',
  costCenterId: override.costCenterId ?? movement?.costCenterId ?? '',
  updatedBy: override.updatedBy ?? movement?.updatedBy ?? movement?.createdBy ?? '',
  updatedAt: override.updatedAt ?? movement?.updatedAt ?? movement?.createdAt ?? null,
});

export const useBankMovements = (user) => {
  const [bankMovements, setBankMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const movementsRef = useMemo(
    () => collection(db, 'artifacts', appId, 'public', 'data', 'bankMovements'),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;

    const q = query(movementsRef, orderBy('postedDate', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((entry) => adaptBankMovementDoc({ id: entry.id, ...entry.data() }));
        setBankMovements(data);
        setLoading(false);
      },
      (snapshotError) => {
        logError('Error loading bank movements:', snapshotError);
        setError(snapshotError);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [movementsRef, user]);

  const createBankMovement = async (data) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const payload = {
        accountId: data.accountId || MAIN_ACCOUNT_ID,
        currency: data.currency || DEFAULT_CURRENCY,
        kind: data.kind || MOVEMENT_KIND.ADJUSTMENT,
        status: data.status || MOVEMENT_STATUS.POSTED,
        direction: data.direction === 'out' ? 'out' : 'in',
        amount: clampMoney(data.amount),
        postedDate: toISODate(data.postedDate || data.date) || toISODate(new Date()),
        valueDate:
          toISODate(data.valueDate || data.postedDate || data.date) || toISODate(new Date()),
        description: data.description || '',
        counterpartyName: data.counterpartyName || '',
        documentNumber: data.documentNumber || '',
        projectId: data.projectId || '',
        projectName: data.projectName || '',
        costCenterId: data.costCenterId || '',
        receivableId: data.receivableId || null,
        payableId: data.payableId || null,
        linkedTransactionId: data.linkedTransactionId || null,
        legacyTransactionId: data.legacyTransactionId || null,
        reconciliationId: data.reconciliationId || null,
        reconciledAt: data.reconciledAt || null,
        createdBy: user.email,
        createdAt: serverTimestamp(),
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        auditTrail: arrayUnion({
          action: 'create',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: 'Movimiento bancario creado',
        }),
      };
      const docRef = await addDoc(movementsRef, payload);
      await writeAuditLogEntry({
        action: 'create',
        entityType: 'bankMovement',
        entityId: docRef.id,
        description: `Movimiento bancario creado: ${payload.description || payload.documentNumber || docRef.id}`,
        userEmail: user.email,
        after: buildMovementSnapshot(payload, {
          updatedAt: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (createError) {
      logError('Error creating bank movement:', createError);
      return { success: false, error: createError };
    }
  };

  const updateBankMovement = async (movementId, data) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const movementRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', movementId);
      const payload = {
        direction: data.direction === 'out' ? 'out' : 'in',
        amount: clampMoney(data.amount),
        postedDate: toISODate(data.postedDate || data.date) || toISODate(new Date()),
        valueDate: toISODate(data.valueDate || data.postedDate || data.date) || toISODate(new Date()),
        description: data.description || '',
        counterpartyName: data.counterpartyName || '',
        documentNumber: data.documentNumber || '',
        projectId: data.projectId || '',
        projectName: data.projectName || '',
        costCenterId: data.costCenterId || '',
        categoryName: data.categoryName || '',
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        auditTrail: arrayUnion({
          action: 'update',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: 'Movimiento bancario actualizado desde la mesa maestra',
        }),
      };
      await updateDoc(movementRef, payload);
      await writeAuditLogEntry({
        action: 'update',
        entityType: 'bankMovement',
        entityId: movementId,
        description: `Movimiento bancario actualizado: ${data.description || data.documentNumber || movementId}`,
        userEmail: user.email,
        before: buildMovementSnapshot(bankMovements.find((entry) => entry.id === movementId)),
        after: buildMovementSnapshot(bankMovements.find((entry) => entry.id === movementId), {
          ...payload,
          updatedBy: user.email,
          updatedAt: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (updateError) {
      logError('Error updating bank movement:', updateError);
      return { success: false, error: updateError };
    }
  };

  const voidBankMovement = async (movementId, reason = '') => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const movementRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', movementId);
      const payload = {
        status: MOVEMENT_STATUS.VOID,
        voidReason: reason,
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        auditTrail: arrayUnion({
          action: 'void',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: reason || 'Movimiento bancario anulado desde la mesa maestra',
        }),
      };
      await updateDoc(movementRef, payload);
      const currentMovement = bankMovements.find((entry) => entry.id === movementId);
      await writeAuditLogEntry({
        action: 'void',
        entityType: 'bankMovement',
        entityId: movementId,
        description: `Movimiento bancario anulado: ${currentMovement?.description || currentMovement?.documentNumber || movementId}`,
        userEmail: user.email,
        before: buildMovementSnapshot(currentMovement),
        after: buildMovementSnapshot(currentMovement, {
          ...payload,
          updatedAt: new Date().toISOString(),
        }),
        metadata: {
          reason: reason || 'Sin motivo informado',
        },
      });
      return { success: true };
    } catch (updateError) {
      logError('Error voiding bank movement:', updateError);
      return { success: false, error: updateError };
    }
  };

  const reconcileMovement = async (movementId, transactionId) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const movementRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', movementId);
      await updateDoc(movementRef, {
        linkedTransactionId: transactionId,
        reconciledAt: serverTimestamp(),
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        auditTrail: arrayUnion({
          action: 'reconcile',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: `Conciliado con transacción ${transactionId}`,
        }),
      });
      const currentMovement = bankMovements.find((entry) => entry.id === movementId);
      await writeAuditLogEntry({
        action: 'reconcile',
        entityType: 'bankMovement',
        entityId: movementId,
        description: `Movimiento bancario conciliado: ${currentMovement?.description || currentMovement?.documentNumber || movementId}`,
        userEmail: user.email,
        metadata: {
          linkedTransactionId: transactionId,
        },
      });
      return { success: true };
    } catch (reconcileError) {
      logError('Error reconciling movement:', reconcileError);
      return { success: false, error: reconcileError };
    }
  };

  const unreconcileMovement = async (movementId) => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const movementRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', movementId);
      await updateDoc(movementRef, {
        linkedTransactionId: null,
        reconciledAt: null,
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        auditTrail: arrayUnion({
          action: 'unreconcile',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: 'Conciliación deshecha',
        }),
      });
      const currentMovement = bankMovements.find((entry) => entry.id === movementId);
      await writeAuditLogEntry({
        action: 'unreconcile',
        entityType: 'bankMovement',
        entityId: movementId,
        description: `Conciliación deshecha: ${currentMovement?.description || currentMovement?.documentNumber || movementId}`,
        userEmail: user.email,
      });
      return { success: true };
    } catch (unreconcileError) {
      logError('Error unreconciling movement:', unreconcileError);
      return { success: false, error: unreconcileError };
    }
  };

  const bulkUpdateCategory = async (movementIds, categoryName, costCenterId = '') => {
    if (!user || !movementIds?.length) return { success: false, error: 'No ids' };

    try {
      const promises = movementIds.map((id) => {
        const ref = doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', id);
        return updateDoc(ref, {
          categoryName,
          ...(costCenterId !== undefined ? { costCenterId } : {}),
          updatedBy: user.email,
          updatedAt: serverTimestamp(),
          auditTrail: arrayUnion({
            action: 'bulk-categorize',
            user: user.email,
            timestamp: new Date().toISOString(),
            detail: `Categoría asignada en lote: ${categoryName}`,
          }),
        });
      });
      await Promise.all(promises);
      await writeAuditLogEntry({
        action: 'bulk-categorize',
        entityType: 'bankMovement',
        entityId: movementIds.join(','),
        description: `${movementIds.length} movimientos categorizados como "${categoryName}"`,
        userEmail: user.email,
      });
      return { success: true, count: movementIds.length };
    } catch (bulkError) {
      logError('Error bulk categorizing:', bulkError);
      return { success: false, error: bulkError };
    }
  };

  return {
    bankMovements,
    loading,
    error,
    createBankMovement,
    updateBankMovement,
    bulkUpdateCategory,
    voidBankMovement,
    reconcileMovement,
    unreconcileMovement,
  };
};

export default useBankMovements;
