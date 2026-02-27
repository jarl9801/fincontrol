import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

// Deep-sanitize a value: convert Timestamps to ISO strings, drop plain objects
const sanitizeValue = (v) => {
  if (v == null) return v;
  if (v && typeof v === 'object' && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  if (v instanceof Date) {
    return v.toISOString();
  }
  if (Array.isArray(v)) {
    return v.map(item => sanitizeValue(item));
  }
  if (typeof v === 'object') {
    // Deep-sanitize object properties (for notes/payments array items)
    const out = {};
    for (const [key, val] of Object.entries(v)) {
      const s = sanitizeValue(val);
      // Only keep primitives, strings, numbers, arrays — skip nested plain objects
      // BUT allow sanitized objects (like note/payment items in arrays)
      if (s != null) out[key] = s;
    }
    return out;
  }
  return v;
};

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
          // Sanitize: convert Timestamps, deep-clean arrays, skip top-level plain objects (viewedBy)
          const sanitized = { id: doc.id };
          for (const [k, v] of Object.entries(raw)) {
            if (v && typeof v === 'object' && typeof v.toDate === 'function') {
              sanitized[k] = v.toDate().toISOString();
            } else if (Array.isArray(v)) {
              sanitized[k] = v.map(item => sanitizeValue(item));
            } else if (v && typeof v === 'object' && !(v instanceof Date)) {
              // Skip top-level plain objects like viewedBy — they crash React if rendered
              continue;
            } else {
              sanitized[k] = v;
            }
          }
          // Ensure notes and payments are always arrays (deep-sanitized)
          if (!Array.isArray(sanitized.notes)) {
            sanitized.notes = Array.isArray(raw.notes) ? raw.notes.map(item => sanitizeValue(item)) : [];
          }
          if (!Array.isArray(sanitized.payments)) {
            sanitized.payments = Array.isArray(raw.payments) ? raw.payments.map(item => sanitizeValue(item)) : [];
          }
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
