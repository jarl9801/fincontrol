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
          return {
            id: doc.id,
            ...raw,
            notes: raw.notes || [],
            // Convert Firestore Timestamps to ISO strings to prevent React render errors
            createdAt: raw.createdAt?.toDate ? raw.createdAt.toDate().toISOString() : (raw.createdAt || null),
            lastModifiedAt: raw.lastModifiedAt?.toDate ? raw.lastModifiedAt.toDate().toISOString() : (raw.lastModifiedAt || null),
          };
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
