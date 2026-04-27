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
import { adaptReceivableDoc } from '../finance/adapters';
import {
  DEFAULT_CURRENCY,
  MAIN_ACCOUNT_ID,
  MOVEMENT_KIND,
  MOVEMENT_STATUS,
} from '../finance/constants';
import { clampMoney, toISODate } from '../finance/utils';
import { db, appId } from '../services/firebase';
import { writeAuditLogEntry } from '../utils/auditLog';

const buildReceivableSnapshot = (receivable, override = {}) => ({
  grossAmount: override.grossAmount ?? override.amount ?? clampMoney(receivable?.grossAmount ?? receivable?.amount ?? 0),
  openAmount: override.openAmount ?? clampMoney(receivable?.openAmount ?? 0),
  pendingAmount: override.pendingAmount ?? clampMoney(receivable?.pendingAmount ?? receivable?.openAmount ?? 0),
  paidAmount: override.paidAmount ?? clampMoney(receivable?.paidAmount ?? 0),
  status: override.status ?? receivable?.status ?? 'issued',
  issueDate: override.issueDate ?? receivable?.issueDate ?? null,
  dueDate: override.dueDate ?? receivable?.dueDate ?? null,
  description: override.description ?? receivable?.description ?? '',
  counterpartyName: override.counterpartyName ?? receivable?.counterpartyName ?? receivable?.client ?? '',
  documentNumber: override.documentNumber ?? receivable?.documentNumber ?? receivable?.invoiceNumber ?? '',
  projectId: override.projectId ?? receivable?.projectId ?? '',
  projectName: override.projectName ?? receivable?.projectName ?? '',
  costCenterId: override.costCenterId ?? receivable?.costCenterId ?? '',
  updatedBy: override.updatedBy ?? receivable?.updatedBy ?? receivable?.createdBy ?? '',
  updatedAt: override.updatedAt ?? receivable?.updatedAt ?? receivable?.createdAt ?? null,
});

const createCollectionMovement = async (user, movementData) => {
  const bankMovementsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bankMovements');
  const payload = {
    accountId: movementData.accountId || MAIN_ACCOUNT_ID,
    currency: movementData.currency || DEFAULT_CURRENCY,
    kind: MOVEMENT_KIND.COLLECTION,
    status: MOVEMENT_STATUS.POSTED,
    direction: 'in',
    amount: clampMoney(movementData.amount),
    postedDate: toISODate(movementData.date) || toISODate(new Date()),
    valueDate: toISODate(movementData.date) || toISODate(new Date()),
    description: movementData.description || '',
    counterpartyName: movementData.counterpartyName || '',
    documentNumber: movementData.documentNumber || '',
    projectId: movementData.projectId || '',
    projectName: movementData.projectName || '',
    costCenterId: movementData.costCenterId || '',
    receivableId: movementData.receivableId || null,
    linkedTransactionId: movementData.linkedTransactionId || null,
    legacyTransactionId: movementData.legacyTransactionId || null,
    createdBy: user.email,
    createdAt: serverTimestamp(),
    updatedBy: user.email,
    updatedAt: serverTimestamp(),
    auditTrail: arrayUnion({
      action: 'create',
      user: user.email,
      timestamp: new Date().toISOString(),
      detail: 'Movimiento bancario de cobro generado automaticamente',
    }),
  };
  const docRef = await addDoc(bankMovementsRef, payload);
  await writeAuditLogEntry({
    action: 'create',
    entityType: 'bankMovement',
    entityId: docRef.id,
    description: `Movimiento bancario de cobro creado: ${payload.description || payload.documentNumber || docRef.id}`,
    userEmail: user.email,
    after: {
      direction: payload.direction,
      amount: payload.amount,
      status: payload.status,
      postedDate: payload.postedDate,
      valueDate: payload.valueDate,
      description: payload.description,
      counterpartyName: payload.counterpartyName,
      documentNumber: payload.documentNumber,
      projectId: payload.projectId,
      projectName: payload.projectName,
      costCenterId: payload.costCenterId,
      updatedBy: user.email,
      updatedAt: new Date().toISOString(),
    },
    metadata: {
      source: 'receivable-payment',
      receivableId: movementData.receivableId || null,
    },
  });
};

export const useReceivables = (user) => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);

  const receivablesRef = useMemo(
    () => collection(db, 'artifacts', appId, 'public', 'data', 'receivables'),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;

    const q = query(receivablesRef, orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((entry) => adaptReceivableDoc({ id: entry.id, ...entry.data() }));
        setReceivables(data);
        setLoading(false);
      },
      (error) => {
        logError('Error loading receivables:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [receivablesRef, user]);

  const createReceivable = async (data) => {
    if (!user) return { success: false };

    try {
      const amount = clampMoney(data.amount);
      const payload = {
        accountId: data.accountId || MAIN_ACCOUNT_ID,
        currency: data.currency || DEFAULT_CURRENCY,
        invoiceNumber: data.invoiceNumber || '',
        documentNumber: data.documentNumber || data.invoiceNumber || '',
        client: data.client,
        counterpartyName: data.client,
        projectId: data.projectId || '',
        projectName: data.projectName || data.project || '',
        costCenterId: data.costCenterId || '',
        description: data.description || '',
        grossAmount: amount,
        amount,
        openAmount: amount,
        pendingAmount: amount,
        paidAmount: 0,
        issueDate: toISODate(data.issueDate) || toISODate(new Date()),
        dueDate: toISODate(data.dueDate) || toISODate(data.issueDate) || toISODate(new Date()),
        paymentTerms: data.paymentTerms || 'net30',
        status: 'issued',
        payments: [],
        notes: data.notes || '',
        linkedTransactionId: data.linkedTransactionId || null,
        legacyTransactionId: data.legacyTransactionId || null,
        createdBy: user.email,
        createdAt: serverTimestamp(),
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
        auditTrail: arrayUnion({
          action: 'create',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: 'Factura CXC creada',
        }),
      };
      const docRef = await addDoc(receivablesRef, payload);
      await writeAuditLogEntry({
        action: 'create',
        entityType: 'receivable',
        entityId: docRef.id,
        description: `Factura CXC creada: ${payload.documentNumber || payload.counterpartyName || docRef.id}`,
        userEmail: user.email,
        after: buildReceivableSnapshot(payload, {
          updatedAt: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (error) {
      logError('Error creating receivable:', error);
      return { success: false, error };
    }
  };

  const registerPayment = async (receivable, paymentData) => {
    if (!user) return { success: false };

    // POLICY GUARD: every status change must reference a real bankMovement
    // (typically imported from DATEV). The Bandeja flow uses linkToReceivable
    // (in useClassifier) which is the canonical path. registerPayment is a
    // legacy entry point — only honor it when the caller provides
    // paymentData.bankMovementId.
    if (!paymentData?.bankMovementId) {
      return {
        success: false,
        error: new Error(
          'Política UMTELKOMD: todo cobro debe vincularse a un movimiento bancario (DATEV). ' +
          'Usá la página de CXC para conciliar con el extracto importado.',
        ),
      };
    }

    try {
      const receivableRef = doc(db, 'artifacts', appId, 'public', 'data', 'receivables', receivable.id);
      const nextOpenAmount = clampMoney(receivable.openAmount - paymentData.amount);
      const nextPaidAmount = clampMoney(receivable.paidAmount + paymentData.amount);
      const nextStatus = nextOpenAmount <= 0 ? 'settled' : 'partial';
      const payment = {
        date: toISODate(paymentData.date) || toISODate(new Date()),
        amount: clampMoney(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference || '',
        note: paymentData.note || '',
        bankMovementId: paymentData.bankMovementId,
        registeredBy: user.email,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(receivableRef, {
        openAmount: Math.max(0, nextOpenAmount),
        pendingAmount: Math.max(0, nextOpenAmount),
        paidAmount: nextPaidAmount,
        status: nextStatus,
        payments: arrayUnion(payment),
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
        auditTrail: arrayUnion({
          action: 'payment',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: `Cobro registrado por ${clampMoney(payment.amount).toFixed(2)} ${receivable.currency || DEFAULT_CURRENCY}`,
        }),
      });

      await createCollectionMovement(user, {
        amount: payment.amount,
        date: payment.date,
        description: receivable.description || `Cobro ${receivable.documentNumber || receivable.counterpartyName}`,
        counterpartyName: receivable.counterpartyName,
        documentNumber: receivable.documentNumber,
        projectId: receivable.projectId,
        projectName: receivable.projectName,
        costCenterId: receivable.costCenterId,
        receivableId: receivable.id,
        linkedTransactionId: receivable.linkedTransactionId,
        legacyTransactionId: receivable.legacyTransactionId,
      });

      await writeAuditLogEntry({
        action: 'payment',
        entityType: 'receivable',
        entityId: receivable.id,
        description: `Cobro registrado en CXC: ${receivable.documentNumber || receivable.counterpartyName || receivable.id}`,
        userEmail: user.email,
        before: buildReceivableSnapshot(receivable),
        after: buildReceivableSnapshot(receivable, {
          openAmount: Math.max(0, nextOpenAmount),
          pendingAmount: Math.max(0, nextOpenAmount),
          paidAmount: nextPaidAmount,
          status: nextStatus,
          updatedBy: user.email,
          updatedAt: new Date().toISOString(),
        }),
        metadata: {
          amount: payment.amount,
          method: payment.method,
          date: payment.date,
          reference: payment.reference || '',
        },
      });

      return { success: true };
    } catch (error) {
      logError('Error registering receivable payment:', error);
      return { success: false, error };
    }
  };

  const updateReceivable = async (receivable, data) => {
    if (!user) return { success: false };

    try {
      const grossAmount = clampMoney(data.amount);
      if (grossAmount < receivable.paidAmount) {
        return { success: false, error: new Error('El importe no puede quedar por debajo de lo ya cobrado') };
      }

      const nextOpenAmount = clampMoney(grossAmount - receivable.paidAmount);
      const nextStatus = nextOpenAmount <= 0 ? 'settled' : receivable.paidAmount > 0 ? 'partial' : 'issued';
      const receivableRef = doc(db, 'artifacts', appId, 'public', 'data', 'receivables', receivable.id);

      const payload = {
        grossAmount,
        amount: grossAmount,
        openAmount: nextOpenAmount,
        pendingAmount: nextOpenAmount,
        issueDate: toISODate(data.issueDate) || receivable.issueDate,
        dueDate: toISODate(data.dueDate) || receivable.dueDate,
        description: data.description || '',
        counterpartyName: data.counterpartyName || '',
        client: data.counterpartyName || '',
        documentNumber: data.documentNumber || '',
        invoiceNumber: data.documentNumber || '',
        projectId: data.projectId || '',
        projectName: data.projectName || '',
        costCenterId: data.costCenterId || '',
        categoryName: data.categoryName || '',
        status: nextStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
        auditTrail: arrayUnion({
          action: 'update',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: 'Factura CXC actualizada desde la mesa maestra',
        }),
      };
      await updateDoc(receivableRef, payload);
      await writeAuditLogEntry({
        action: 'update',
        entityType: 'receivable',
        entityId: receivable.id,
        description: `Factura CXC actualizada: ${data.documentNumber || receivable.documentNumber || receivable.id}`,
        userEmail: user.email,
        before: buildReceivableSnapshot(receivable),
        after: buildReceivableSnapshot(receivable, {
          ...payload,
          updatedBy: user.email,
          updatedAt: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (error) {
      logError('Error updating receivable:', error);
      return { success: false, error };
    }
  };

  const cancelReceivable = async (receivable) => {
    if (!user) return { success: false };
    if ((receivable.paidAmount || 0) > 0) {
      return { success: false, error: new Error('No se puede cancelar una CXC con cobros registrados') };
    }

    try {
      const receivableRef = doc(db, 'artifacts', appId, 'public', 'data', 'receivables', receivable.id);
      const payload = {
        status: 'cancelled',
        openAmount: 0,
        pendingAmount: 0,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
        auditTrail: arrayUnion({
          action: 'cancel',
          user: user.email,
          timestamp: new Date().toISOString(),
          detail: 'Factura CXC cancelada desde la mesa maestra',
        }),
      };
      await updateDoc(receivableRef, payload);
      await writeAuditLogEntry({
        action: 'cancel',
        entityType: 'receivable',
        entityId: receivable.id,
        description: `Factura CXC cancelada: ${receivable.documentNumber || receivable.counterpartyName || receivable.id}`,
        userEmail: user.email,
        before: buildReceivableSnapshot(receivable),
        after: buildReceivableSnapshot(receivable, {
          ...payload,
          updatedAt: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (error) {
      logError('Error cancelling receivable:', error);
      return { success: false, error };
    }
  };

  // Deprecated: status-only shortcut — violates the "always link to bankMovement"
  // policy. Returns an explicit error so legacy callers fail loudly.
  const markAsPaid = async () => ({
    success: false,
    error: new Error(
      'Política UMTELKOMD: no se puede marcar una CXC como cobrada sin vincular un ' +
      'movimiento bancario. Usá /cxc → Conciliar.',
    ),
  });

  return { receivables, loading, createReceivable, registerPayment, updateReceivable, cancelReceivable, markAsPaid };
};

export default useReceivables;
