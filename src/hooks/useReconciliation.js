import { useState, useEffect } from 'react';
import {
  collection, query, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, orderBy
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useReconciliation = (user) => {
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'bankReconciliation');

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(colRef, orderBy('month', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          reconciledAt: raw.reconciledAt?.toDate?.() ? raw.reconciledAt.toDate().toISOString() : raw.reconciledAt,
          createdAt: raw.createdAt?.toDate?.() ? raw.createdAt.toDate().toISOString() : raw.createdAt,
        };
      });
      setReconciliations(data);
      setLoading(false);
    }, (err) => {
      console.error('Error loading reconciliations:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const createReconciliation = async (data) => {
    if (!user) return { success: false };
    try {
      const discrepancy = (data.bankBalance || 0) - (data.systemBalance || 0);
      await addDoc(colRef, {
        accountId: data.accountId || 'main',
        month: data.month,
        bankBalance: parseFloat(data.bankBalance) || 0,
        systemBalance: parseFloat(data.systemBalance) || 0,
        discrepancy,
        reconciledTransactions: data.reconciledTransactions || [],
        unreconciledItems: data.unreconciledItems || [],
        status: 'pending',
        notes: data.notes || '',
        createdBy: user.email,
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating reconciliation:', error);
      return { success: false, error };
    }
  };

  const updateReconciliation = async (id, data) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankReconciliation', id);
      const discrepancy = (data.bankBalance || 0) - (data.systemBalance || 0);
      await updateDoc(docRef, {
        ...data,
        discrepancy,
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating reconciliation:', error);
      return { success: false, error };
    }
  };

  const markReconciled = async (id) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'bankReconciliation', id);
      await updateDoc(docRef, {
        status: 'reconciled',
        reconciledBy: user.email,
        reconciledAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking reconciled:', error);
      return { success: false, error };
    }
  };

  return { reconciliations, loading, createReconciliation, updateReconciliation, markReconciled };
};
