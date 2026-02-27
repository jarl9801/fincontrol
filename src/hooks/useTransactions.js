import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useTransactions = (user) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const raw = doc.data();
          // Sanitize: convert Timestamps, remove non-serializable objects (viewedBy, etc.)
          const sanitized = { id: doc.id };
          for (const [k, v] of Object.entries(raw)) {
            if (v && typeof v === 'object' && typeof v.toDate === 'function') {
              sanitized[k] = v.toDate().toISOString();
            } else if (Array.isArray(v)) {
              sanitized[k] = v;
            } else if (v && typeof v === 'object' && !(v instanceof Date)) {
              // Skip plain objects like viewedBy — they crash React if rendered
              continue;
            } else {
              sanitized[k] = v;
            }
          }
          sanitized.notes = raw.notes || [];
          sanitized.payments = raw.payments || [];
          return sanitized;
        });
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(data);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { transactions, loading, error };
};
