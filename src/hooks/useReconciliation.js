import { logError } from '../utils/logger';
import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

const normalizeReconciliation = (raw) => ({
  id: raw.id,
  accountId: raw.accountId || 'main',
  month: raw.month,
  bankBalance: Number(raw.bankBalance || 0),
  systemBalance: Number(raw.systemBalance || 0),
  discrepancy: Number(raw.discrepancy || 0),
  status: raw.status === 'pending' ? 'open' : raw.status || 'open',
  movementIds: raw.movementIds || raw.reconciledTransactions || [],
  unreconciledItems: raw.unreconciledItems || [],
  notes: raw.notes || '',
  createdBy: raw.createdBy || '',
  createdAt: raw.createdAt?.toDate?.() ? raw.createdAt.toDate().toISOString() : raw.createdAt,
  updatedBy: raw.updatedBy || '',
  updatedAt: raw.updatedAt?.toDate?.() ? raw.updatedAt.toDate().toISOString() : raw.updatedAt,
  reconciledBy: raw.reconciledBy || '',
  reconciledAt: raw.reconciledAt?.toDate?.() ? raw.reconciledAt.toDate().toISOString() : raw.reconciledAt,
});

export const useReconciliation = (user) => {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  const reconciliationsRef = useMemo(
    () => collection(db, 'artifacts', appId, 'public', 'data', 'bankReconciliation'),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;

    const q = query(reconciliationsRef, orderBy('month', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((entry) => normalizeReconciliation({ id: entry.id, ...entry.data() }));
        setReconciliations(data);
        setLoading(false);
      },
      (error) => {
        logError('Error loading reconciliations:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [reconciliationsRef, user]);

  const createReconciliation = async (data) => {
    if (!user) return { success: false };

    try {
      const discrepancy = Number(data.bankBalance || 0) - Number(data.systemBalance || 0);
      await addDoc(reconciliationsRef, {
        accountId: data.accountId || 'main',
        month: data.month,
        bankBalance: Number(data.bankBalance || 0),
        systemBalance: Number(data.systemBalance || 0),
        discrepancy,
        status: 'open',
        movementIds: data.movementIds || [],
        unreconciledItems: data.unreconciledItems || [],
        notes: data.notes || '',
        createdBy: user.email,
        createdAt: serverTimestamp(),
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      logError('Error creating reconciliation:', error);
      return { success: false, error };
    }
  };

  const updateReconciliation = async (id, data) => {
    if (!user) return { success: false };

    try {
      const reconciliationRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'bankReconciliation',
        id,
      );
      const discrepancy = Number(data.bankBalance || 0) - Number(data.systemBalance || 0);
      await updateDoc(reconciliationRef, {
        ...data,
        discrepancy,
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      logError('Error updating reconciliation:', error);
      return { success: false, error };
    }
  };

  const markReconciled = async (id, movementIds = []) => {
    if (!user) return { success: false };

    try {
      const reconciliationRef = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        'bankReconciliation',
        id,
      );
      await updateDoc(reconciliationRef, {
        status: 'reconciled',
        movementIds,
        reconciledBy: user.email,
        reconciledAt: serverTimestamp(),
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
      });

      const movementUpdates = movementIds.map(async (movementId) => {
        const movementRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankMovements', movementId);
        return updateDoc(movementRef, {
          reconciliationId: id,
          reconciledAt: serverTimestamp(),
          updatedBy: user.email,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(movementUpdates);
      return { success: true };
    } catch (error) {
      logError('Error marking reconciled:', error);
      return { success: false, error };
    }
  };

  return { reconciliations, loading, createReconciliation, updateReconciliation, markReconciled };
};

export default useReconciliation;
