import { logError } from '../utils/logger';
import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, appId } from '../services/firebase';
import { writeAuditLogEntry } from '../utils/auditLog';
import { validateCostOwner, monthlyEquivalent } from '../finance/assetSchemas';

const RECURRING_COLLECTION = 'recurringCosts';

/**
 * useRecurringCosts — CRUD hook for the recurringCosts collection.
 *
 * Path: artifacts/{appId}/public/data/recurringCosts
 *
 * Each rule produces payable instances on a schedule (monthly/quarterly/yearly/...).
 * Generation is handled by a separate service that scans active rules and
 * upserts into the `payables` collection.
 */
export const useRecurringCosts = (user) => {
  const [recurringCosts, setRecurringCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ref = useMemo(
    () => collection(db, 'artifacts', appId, 'public', 'data', RECURRING_COLLECTION),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;

    const q = query(ref, orderBy('ownerName', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => {
          const raw = d.data();
          const num = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
          };
          return {
            id: d.id,
            ownerType: raw.ownerType || 'general',
            ownerId: raw.ownerId ?? null,
            ownerName: raw.ownerName || '',
            concept: raw.concept || '',
            counterpartyName: raw.counterpartyName || '',
            amount: num(raw.amount),
            frequency: raw.frequency || 'monthly',
            dayOfMonth: num(raw.dayOfMonth) || 1,
            startDate: raw.startDate || '',
            endDate: raw.endDate || '',
            costCenterId: raw.costCenterId || '',
            projectId: raw.projectId || '',
            active: raw.active !== false,
            notes: raw.notes || '',
            createdAt: raw.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: raw.updatedAt?.toDate?.()?.toISOString() || null,
            createdBy: raw.createdBy || '',
          };
        });
        setRecurringCosts(data);
        setLoading(false);
      },
      (err) => {
        logError('Error loading recurringCosts:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [ref, user]);

  /**
   * Costs filtered by owner. Pass ownerType+ownerId, or just ownerType.
   */
  const getByOwner = useCallback(
    (ownerType, ownerId = null) =>
      recurringCosts.filter((c) => {
        if (c.ownerType !== ownerType) return false;
        if (ownerId == null) return true;
        return c.ownerId === ownerId;
      }),
    [recurringCosts],
  );

  /**
   * Sum of monthly-equivalent amounts of all active rules (for dashboard).
   * Pass ownerType to scope (employee/property/vehicle/general); omit for total.
   */
  const totalMonthlyEquivalent = useCallback(
    (ownerType = null) =>
      recurringCosts
        .filter((c) => c.active && (!ownerType || c.ownerType === ownerType))
        .reduce((sum, c) => sum + monthlyEquivalent(c), 0),
    [recurringCosts],
  );

  const allowedFrequencies = ['monthly', 'quarterly', 'yearly', 'biweekly', 'weekly'];

  const normalizePayload = (data) => {
    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const ownerType = ['employee', 'property', 'vehicle', 'insurance', 'general'].includes(data.ownerType)
      ? data.ownerType
      : 'general';
    const ownerId = ownerType === 'general' ? null : (data.ownerId || null);
    const dayOfMonth = Math.max(1, Math.min(31, Math.floor(num(data.dayOfMonth)) || 1));
    return {
      ownerType,
      ownerId,
      ownerName: (data.ownerName || '').trim(),
      concept: (data.concept || '').trim(),
      counterpartyName: (data.counterpartyName || '').trim(),
      amount: num(data.amount),
      frequency: allowedFrequencies.includes(data.frequency) ? data.frequency : 'monthly',
      dayOfMonth,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      costCenterId: (data.costCenterId || '').trim(),
      projectId: (data.projectId || '').trim(),
      active: data.active !== false,
      notes: (data.notes || '').trim(),
    };
  };

  const createRecurringCost = async (data) => {
    if (!user) return { success: false, error: new Error('No user') };
    const validation = validateCostOwner(data.ownerType, data.ownerId);
    if (!validation.valid) {
      return { success: false, error: new Error(validation.error) };
    }
    try {
      const payload = {
        ...normalizePayload(data),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.email || '',
      };
      const docRef = await addDoc(ref, payload);
      await writeAuditLogEntry({
        action: 'create',
        entityType: 'recurringCost',
        entityId: docRef.id,
        description: `Costo recurrente creado: ${payload.concept} — ${payload.ownerName}`,
        userEmail: user.email,
        after: { ...payload, id: docRef.id },
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      logError('Error creating recurringCost:', err);
      return { success: false, error: err };
    }
  };

  const updateRecurringCost = async (id, data) => {
    if (!user) return { success: false, error: new Error('No user') };
    const validation = validateCostOwner(data.ownerType, data.ownerId);
    if (!validation.valid) {
      return { success: false, error: new Error(validation.error) };
    }
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', RECURRING_COLLECTION, id);
      const payload = { ...normalizePayload(data), updatedAt: serverTimestamp() };
      await updateDoc(docRef, payload);
      await writeAuditLogEntry({
        action: 'update',
        entityType: 'recurringCost',
        entityId: id,
        description: `Costo recurrente actualizado: ${payload.concept}`,
        userEmail: user.email,
        after: { ...payload, id },
      });
      return { success: true };
    } catch (err) {
      logError('Error updating recurringCost:', err);
      return { success: false, error: err };
    }
  };

  const deleteRecurringCost = async (id) => {
    if (!user) return { success: false, error: new Error('No user') };
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', RECURRING_COLLECTION, id);
      const before = recurringCosts.find((c) => c.id === id);
      await deleteDoc(docRef);
      await writeAuditLogEntry({
        action: 'delete',
        entityType: 'recurringCost',
        entityId: id,
        description: `Costo recurrente eliminado: ${before?.concept || id}`,
        userEmail: user.email,
        before,
      });
      return { success: true };
    } catch (err) {
      logError('Error deleting recurringCost:', err);
      return { success: false, error: err };
    }
  };

  const toggleActive = async (cost) =>
    updateRecurringCost(cost.id, { ...cost, active: !cost.active });

  return {
    recurringCosts,
    loading,
    error,
    getByOwner,
    totalMonthlyEquivalent,
    createRecurringCost,
    updateRecurringCost,
    deleteRecurringCost,
    toggleActive,
  };
};

export default useRecurringCosts;
