import { useState, useEffect } from 'react';
import {
  collection, query, onSnapshot, addDoc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useAuditLog = (user) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'auditLog');

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(colRef, orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          timestamp: raw.timestamp?.toDate?.() ? raw.timestamp.toDate().toISOString() : raw.timestamp,
        };
      });
      setLogs(data);
      setLoading(false);
    }, (err) => {
      console.error('Error loading audit log:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const logAction = async (data) => {
    if (!user) return;
    try {
      await addDoc(colRef, {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        description: data.description,
        before: data.before || null,
        after: data.after || null,
        user: user.email,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  return { logs, loading, logAction };
};
