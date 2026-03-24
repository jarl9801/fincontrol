import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../services/firebase';

const normalizeValue = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((entry) => normalizeValue(entry));
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, normalizeValue(entry)]),
    );
  }

  return value;
};

export const writeAuditLogEntry = async ({
  action,
  entityType,
  entityId = null,
  description,
  userEmail,
  before = null,
  after = null,
  metadata = null,
}) => {
  if (!userEmail || !action || !description) return { success: false };

  try {
    const auditLogRef = collection(db, 'artifacts', appId, 'public', 'data', 'auditLog');
    await addDoc(auditLogRef, {
      action,
      entityType,
      entityId,
      description,
      before: before ? normalizeValue(before) : null,
      after: after ? normalizeValue(after) : null,
      metadata: metadata ? normalizeValue(metadata) : null,
      user: userEmail,
      timestamp: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error writing audit log entry:', error);
    return { success: false, error };
  }
};

export default writeAuditLogEntry;
