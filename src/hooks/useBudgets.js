import { logError } from '../utils/logger';
import { useState, useEffect, useMemo } from 'react';
import {
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, orderBy
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useBudgets = (user) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = useMemo(() => collection(db, 'artifacts', appId, 'public', 'data', 'budgets'), []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(colRef, orderBy('year', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toDate?.() ? raw.createdAt.toDate().toISOString() : raw.createdAt,
        };
      });
      setBudgets(data);
      setLoading(false);
    }, (err) => {
      logError('Error loading budgets:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const createBudget = async (data) => {
    if (!user) return { success: false };
    try {
      await addDoc(colRef, {
        projectId: data.projectId,
        projectName: data.projectName,
        year: parseInt(data.year),
        month: data.month ? parseInt(data.month) : null,
        incomeTarget: parseFloat(data.incomeTarget) || 0,
        expenseLimit: parseFloat(data.expenseLimit) || 0,
        lines: data.lines || [],
        createdBy: user.email,
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      logError('Error creating budget:', error);
      return { success: false, error };
    }
  };

  const updateBudget = async (budgetId, data) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'budgets', budgetId);
      await updateDoc(docRef, {
        ...data,
        updatedBy: user.email,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      logError('Error updating budget:', error);
      return { success: false, error };
    }
  };

  const deleteBudget = async (budgetId) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'budgets', budgetId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      logError('Error deleting budget:', error);
      return { success: false, error };
    }
  };

  return { budgets, loading, createBudget, updateBudget, deleteBudget };
};
