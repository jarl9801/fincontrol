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
import { adaptPayableDoc } from '../finance/adapters';
import {
  DEFAULT_CURRENCY,
  MAIN_ACCOUNT_ID,
  MOVEMENT_KIND,
  MOVEMENT_STATUS,
} from '../finance/constants';
import { clampMoney, toISODate } from '../finance/utils';
import { db, appId } from '../services/firebase';
import { writeAuditLogEntry } from '../utils/auditLog';

const buildPayableSnapshot = (payable, override = {}) => ({
  grossAmount: override.grossAmount ?? override.amount ?? clampMoney(payable?.grossAmount ?? payable?.amount ?? 0),
  openAmount: override.openAmount ?? clampMoney(payable?.openAmount ?? 0),
  pendingAmount: override.pendingAmount ?? clampMoney(payable?.pendingAmount ?? payable?.openAmount ?? 0),
  paidAmount: override.paidAmount ?? clampMoney(payable?.paidAmount ?? 0),
  status: override.status ?? payable?.status ?? 'issued',
  issueDate: override.issueDate ?? payable?.issueDate ?? null,
  dueDate: override.dueDate ?? payable?.dueDate ?? null,
  description: override.description ?? payable?.description ?? '',
  counterpartyName: override.counterpartyName ?? payable?.counterpartyName ?? payable?.vendor ?? '',
  documentNumber: override.documentNumber ?? payable?.documentNumber ?? payable?.invoiceNumber ?? '',
  projectId: override.projectId ?? payable?.projectId ?? '',
  projectName: override.projectName ?? payable?.projectName ?? '',
  costCenterId: override.costCenterId ?? payable?.costCenterId ?? '',
  updatedBy: override.updatedBy ?? payable?.updatedBy ?? payable?.createdBy ?? '',
  updatedAt: override.updatedAt ?? payable?.updatedAt ?? payable?.createdAt ?? null,
});

const createPaymentMovement = async (user, movementData) => {
  const bankMovementsRef = collection(db, 'artifacts', appId, 'public', 'data', 'bankMovements');
  const payload = {
    accountId: movementData.accountId || MAIN_ACCOUNT_ID,
    currency: movementData.currency || DEFAULT_CURRENCY,
    kind: MOVEMENT_KIND.PAYMENT,
    status: MOVEMENT_STATUS.POSTED,
    direction: 'out',
    amount: clampMoney(movementData.amount),
    postedDate: toISODate(movementData.date) || toISODate(new Date()),
    valueDate: toISODate(movementData.date) || toISODate(new Date()),
    description: movementData.description || '',
    counterpartyName: movementData.counterpartyName || '',
    documentNumber: movementData.documentNumber || '',
    projectId: movementData.projectId || '',
    projectName: movementData.projectName || '',
    costCenterId: movementData.costCenterId || '',
    payableId: movementData.payableId || null,
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
      detail: 'Movimiento bancario de pago generado automaticamente',
    }),
  };
  const docRef = await addDoc(bankMovementsRef, payload);
  await writeAuditLogEntry({
    action: 'create',
    entityType: 'bankMovement',
    entityId: docRef.id,
    description: `Movimiento bancario de pago creado: ${payload.description || payload.documentNumber || docRef.id}`,
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
      source: 'payable-payment',
      payableId: movementData.payableId || null,
    },
  });
};

export const usePayables = (user) => {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);

  const payablesRef = useMemo(
    () => collection(db, 'artifacts', appId, 'public', 'data', 'payables'),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;

    const q = query(payablesRef, orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((entry) => adaptPayableDoc({ id: entry.id, ...entry.data() }));
        setPayables(data);
        setLoading(false);
      },
      (error) => {
        logError('Error loading payables:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [payablesRef, user]);

  const createPayable = async (data) => {
    if (!user) return { success: false };

    try {
      const amount = clampMoney(data.amount);
      const payload = {
        accountId: data.accountId || MAIN_ACCOUNT_ID,
        currency: data.currency || DEFAULT_CURRENCY,
        invoiceNumber: data.invoiceNumber || '',
        documentNumber: data.documentNumber || data.invoiceNumber || '',
        vendor: data.vendor,
        counterpartyName: data.vendor,
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
          detail: 'Factura CXP creada',
        }),
      };
      const docRef = await addDoc(payablesRef, payload);
      await writeAuditLogEntry({
        action: 'create',
        entityType: 'payable',
        entityId: docRef.id,
        description: `Factura CXP creada: ${payload.documentNumber || payload.counterpartyName || docRef.id}`,
        userEmail: user.email,
        after: buildPayableSnapshot(payload, {
          updatedAt: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (error) {
      logError('Error creating payable:', error);
      return { success: false, error };
    }
  };

  const registerPayment = async (payable, paymentData) => {
    if (!user) return { success: false };

    try {
      const payableRef = doc(db, 'artifacts', appId, 'public', 'data', 'payables', payable.id);
      const nextOpenAmount = clampMoney(payable.openAmount - paymentData.amount);
      const nextPaidAmount = clampMoney(payable.paidAmount + paymentData.amount);
      const nextStatus = nextOpenAmount <= 0 ? 'settled' : 'partial';
      const payment = {
        date: toISODate(paymentData.date) || toISODate(new Date()),
        amount: clampMoney(paymentData.amount),
        method: paymentData.method,
        reference: paymentData.reference || '',
        note: paymentData.note || '',
        registeredBy: user.email,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(payableRef, {
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
          detail: `Pago registrado por ${clampMoney(payment.amount).toFixed(2)} ${payable.currency || DEFAULT_CURRENCY}`,
        }),
      });

      await createPaymentMovement(user, {
        amount: payment.amount,
        date: payment.date,
        description: payable.description || `Pago ${payable.documentNumber || payable.counterpartyName}`,
        counterpartyName: payable.counterpartyName,
        documentNumber: payable.documentNumber,
        projectId: payable.projectId,
        projectName: payable.projectName,
        costCenterId: payable.costCenterId,
        payableId: payable.id,
        linkedTransactionId: payable.linkedTransactionId,
        legacyTransactionId: payable.legacyTransactionId,
      });

      await writeAuditLogEntry({
        action: 'payment',
        entityType: 'payable',
        entityId: payable.id,
        description: `Pago registrado en CXP: ${payable.documentNumber || payable.counterpartyName || payable.id}`,
        userEmail: user.email,
        before: buildPayableSnapshot(payable),
        after: buildPayableSnapshot(payable, {
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
      logError('Error registering payable payment:', error);
      return { success: false, error };
    }
  };

  const updatePayable = async (payable, data) => {
    if (!user) return { success: false };

    try {
      const grossAmount = clampMoney(data.amount);
      if (grossAmount < payable.paidAmount) {
        return { success: false, error: new Error('El importe no puede quedar por debajo de lo ya pagado') };
      }

      const nextOpenAmount = clampMoney(grossAmount - payable.paidAmount);
      const nextStatus = nextOpenAmount <= 0 ? 'settled' : payable.paidAmount > 0 ? 'partial' : 'issued';
      const payableRef = doc(db, 'artifacts', appId, 'public', 'data', 'payables', payable.id);

      const payload = {
        grossAmount,
        amount: grossAmount,
        openAmount: nextOpenAmount,
        pendingAmount: nextOpenAmount,
        issueDate: toISODate(data.issueDate) || payable.issueDate,
        dueDate: toISODate(data.dueDate) || payable.dueDate,
        description: data.description || '',
        counterpartyName: data.counterpartyName || '',
        vendor: data.counterpartyName || '',
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
          detail: 'Factura CXP actualizada desde la mesa maestra',
        }),
      };
      await updateDoc(payableRef, payload);
      await writeAuditLogEntry({
        action: 'update',
        entityType: 'payable',
        entityId: payable.id,
        description: `Factura CXP actualizada: ${data.documentNumber || payable.documentNumber || payable.id}`,
        userEmail: user.email,
        before: buildPayableSnapshot(payable),
        after: buildPayableSnapshot(payable, {
          ...payload,
          updatedBy: user.email,
          updatedAt: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (error) {
      logError('Error updating payable:', error);
      return { success: false, error };
    }
  };

  const cancelPayable = async (payable) => {
    if (!user) return { success: false };
    if ((payable.paidAmount || 0) > 0) {
      return { success: false, error: new Error('No se puede cancelar una CXP con pagos registrados') };
    }

    try {
      const payableRef = doc(db, 'artifacts', appId, 'public', 'data', 'payables', payable.id);
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
          detail: 'Factura CXP cancelada desde la mesa maestra',
        }),
      };
      await updateDoc(payableRef, payload);
      await writeAuditLogEntry({
        action: 'cancel',
        entityType: 'payable',
        entityId: payable.id,
        description: `Factura CXP cancelada: ${payable.documentNumber || payable.counterpartyName || payable.id}`,
        userEmail: user.email,
        before: buildPayableSnapshot(payable),
        after: buildPayableSnapshot(payable, {
          ...payload,
          updatedAt: new Date().toISOString(),
        }),
      });
      return { success: true };
    } catch (error) {
      logError('Error cancelling payable:', error);
      return { success: false, error };
    }
  };

  const markAsPaid = async (payable) => {
    if (!user) return { success: false };

    try {
      const remaining = clampMoney(payable.openAmount);
      if (remaining <= 0) return { success: true };

      return await registerPayment(payable, {
        amount: remaining,
        date: toISODate(new Date()),
        method: 'Transferencia',
        note: 'Marcado como pagado',
      });
    } catch (error) {
      logError('Error marking payable as paid:', error);
      return { success: false, error };
    }
  };

  return { payables, loading, createPayable, registerPayment, updatePayable, cancelPayable, markAsPaid };
};

export default usePayables;
