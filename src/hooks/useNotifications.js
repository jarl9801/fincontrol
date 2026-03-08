import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, orderBy, where, writeBatch
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'notifications');

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(colRef, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toDate?.() ? raw.createdAt.toDate().toISOString() : raw.createdAt,
        };
      });
      setNotifications(data);
      setLoading(false);
    }, (err) => {
      console.error('Error loading notifications:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const createNotification = async (data) => {
    if (!user) return { success: false };
    try {
      await addDoc(colRef, {
        type: data.type,
        severity: data.severity || 'info',
        title: data.title,
        message: data.message,
        relatedEntity: data.relatedEntity || null,
        read: false,
        userId: data.userId || user.email,
        createdAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error };
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user) return { success: false };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', notificationId);
      await updateDoc(docRef, { read: true });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  };

  const markAllAsRead = useCallback(async () => {
    if (!user) return { success: false };
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'notifications', n.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, error };
    }
  }, [user, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, createNotification, markAsRead, markAllAsRead };
};
