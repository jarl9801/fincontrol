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

const INSURANCES_COLLECTION = 'insurances';

/**
 * useInsurances — CRUD hook for the insurances collection.
 *
 * Path: artifacts/{appId}/public/data/insurances
 *
 * Insurance model: see src/finance/assetSchemas.js (insuranceDefaults)
 * Recurring premiums (monthly/annual) live in `recurringCosts` with
 * ownerType='insurance'.
 */
export const useInsurances = (user) => {
  const [insurances, setInsurances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const insurancesRef = useMemo(
    () => collection(db, 'artifacts', appId, 'public', 'data', INSURANCES_COLLECTION),
    [],
  );

  useEffect(() => {
    if (!user) return undefined;

    const q = query(insurancesRef, orderBy('name', 'asc'));
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
            name: raw.name || '',
            type: raw.type || 'business',
            insurer: raw.insurer || '',
            policyNumber: raw.policyNumber || '',
            coverageAmount: num(raw.coverageAmount),
            premiumAnnual: num(raw.premiumAnnual),
            startDate: raw.startDate || '',
            endDate: raw.endDate || '',
            renewalDate: raw.renewalDate || '',
            status: raw.status || 'active',
            linkedAssetType: raw.linkedAssetType || '',
            linkedAssetId: raw.linkedAssetId || '',
            defaultCostCenter: raw.defaultCostCenter || '',
            notes: raw.notes || '',
            createdAt: raw.createdAt?.toDate?.()?.toISOString() || null,
            updatedAt: raw.updatedAt?.toDate?.()?.toISOString() || null,
            createdBy: raw.createdBy || '',
          };
        });
        setInsurances(data);
        setLoading(false);
      },
      (err) => {
        logError('Error loading insurances:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [insurancesRef, user]);

  const getActiveInsurances = useCallback(
    () => insurances.filter((i) => i.status === 'active'),
    [insurances],
  );

  const normalizePayload = (data) => {
    const allowedTypes = [
      'haftpflicht', 'kasko', 'business', 'health', 'life',
      'property', 'equipment', 'liability', 'other',
    ];
    const allowedStatuses = ['active', 'expired', 'cancelled'];
    const allowedLinkedTypes = ['', 'vehicle', 'property', 'employee'];
    const num = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      name: (data.name || '').trim(),
      type: allowedTypes.includes(data.type) ? data.type : 'business',
      insurer: (data.insurer || '').trim(),
      policyNumber: (data.policyNumber || '').trim(),
      coverageAmount: num(data.coverageAmount),
      premiumAnnual: num(data.premiumAnnual),
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      renewalDate: data.renewalDate || '',
      status: allowedStatuses.includes(data.status) ? data.status : 'active',
      linkedAssetType: allowedLinkedTypes.includes(data.linkedAssetType)
        ? data.linkedAssetType
        : '',
      linkedAssetId: (data.linkedAssetId || '').trim(),
      defaultCostCenter: (data.defaultCostCenter || '').trim(),
      notes: (data.notes || '').trim(),
    };
  };

  const createInsurance = async (data) => {
    if (!user) return { success: false, error: new Error('No user') };
    try {
      const payload = {
        ...normalizePayload(data),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.email || '',
      };
      const docRef = await addDoc(insurancesRef, payload);
      await writeAuditLogEntry({
        action: 'create',
        entityType: 'insurance',
        entityId: docRef.id,
        description: `Seguro creado: ${payload.name}`,
        userEmail: user.email,
        after: { ...payload, id: docRef.id },
      });
      return { success: true, id: docRef.id };
    } catch (err) {
      logError('Error creating insurance:', err);
      return { success: false, error: err };
    }
  };

  const updateInsurance = async (insuranceId, data) => {
    if (!user) return { success: false, error: new Error('No user') };
    try {
      const ref = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        INSURANCES_COLLECTION,
        insuranceId,
      );
      const payload = { ...normalizePayload(data), updatedAt: serverTimestamp() };
      await updateDoc(ref, payload);
      await writeAuditLogEntry({
        action: 'update',
        entityType: 'insurance',
        entityId: insuranceId,
        description: `Seguro actualizado: ${payload.name}`,
        userEmail: user.email,
        after: { ...payload, id: insuranceId },
      });
      return { success: true };
    } catch (err) {
      logError('Error updating insurance:', err);
      return { success: false, error: err };
    }
  };

  const deleteInsurance = async (insuranceId) => {
    if (!user) return { success: false, error: new Error('No user') };
    try {
      const ref = doc(
        db,
        'artifacts',
        appId,
        'public',
        'data',
        INSURANCES_COLLECTION,
        insuranceId,
      );
      const before = insurances.find((i) => i.id === insuranceId);
      await deleteDoc(ref);
      await writeAuditLogEntry({
        action: 'delete',
        entityType: 'insurance',
        entityId: insuranceId,
        description: `Seguro eliminado: ${before?.name || insuranceId}`,
        userEmail: user.email,
        before,
      });
      return { success: true };
    } catch (err) {
      logError('Error deleting insurance:', err);
      return { success: false, error: err };
    }
  };

  return {
    insurances,
    loading,
    error,
    getActiveInsurances,
    createInsurance,
    updateInsurance,
    deleteInsurance,
  };
};

export default useInsurances;
