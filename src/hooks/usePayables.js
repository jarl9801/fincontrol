import { useState, useEffect } from 'react';
import {
  collection, query, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, arrayUnion, orderBy
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const usePayables = (user) => {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'payables');

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(colRef, orderBy('dueDate', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          issueDate: raw.issueDate?.toDate?.() ? raw.issueDate.toDate().toISOString().split('T')[0] : raw.issueDate,
          dueDate: raw.dueDate?.toDate?.() ? raw.dueDate.toDate().toISOString().split('T')[0] : raw.dueDate,
          createdAt: raw.createdAt?.toDate?.() ? raw.createdAt.toDate().toISOString() : raw.createdAt,
          updatedAt: raw.updatedAt?.toDate?.() ? raw.updatedAt.toDate().toISOString() : raw.updatedAt,
          payments: (raw.payments || []).map(p => ({
            ...p,
            timestamp: p.timestamp?.toDate?.() ? p.timestamp.toDate().toISOString() : p.timestamp,
          })),
        };
      });
      setPayables(data);
      setLoading(false);
    }, (err) => {
      console.error('Error loading payables:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const createPayable = async (data) => {
    if (!user) return { success: false };
    try {
      await addDoc(colRef, {
        invoiceNumber: data.invoiceNumber || '',
        vendor: data.vendor,
        projectId: data.projectId || '',
        description: data.description || '',
        amount: parseFloat(data.amount),
        pendingAmount: parseFloat(data.amount),
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        paymentTerms: data.paymentTerms || 'net30',
        status: 'issued',
        payments: [],
        notes: data.notes || '',
        linkedTransactionId: data.linkedTransactionId || null,
        createdBy: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating payable:', error);
      return { success: false, error };
    }
  };

  const registerPayment = async (payable, paymentData) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'payables', payable.id);
      const newPending = payable.pendingAmount - paymentData.amount;
      const newStatus = newPending <= 0 ? 'paid' : 'partial';

      const payment = {
        date: paymentData.date,
        amount: paymentData.amount,
        method: paymentData.method,
        reference: paymentData.reference || '',
        registeredBy: user.email,
        timestamp: new Date().toISOString(),
      };

      await updateDoc(docRef, {
        pendingAmount: Math.max(0, newPending),
        status: newStatus,
        payments: arrayUnion(payment),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error registering payable payment:', error);
      return { success: false, error };
    }
  };

  const markAsPaid = async (payable) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'payables', payable.id);
      await updateDoc(docRef, {
        pendingAmount: 0,
        status: 'paid',
        payments: arrayUnion({
          date: new Date().toISOString().split('T')[0],
          amount: payable.pendingAmount,
          method: 'Transferencia',
          reference: 'Marcado como pagado',
          registeredBy: user.email,
          timestamp: new Date().toISOString(),
        }),
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking payable as paid:', error);
      return { success: false, error };
    }
  };

  return { payables, loading, createPayable, registerPayment, markAsPaid };
};
