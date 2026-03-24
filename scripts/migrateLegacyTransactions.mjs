import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import admin from 'firebase-admin';

const DEFAULT_APP_ID = '1:597712756560:web:ad12cd9794f11992641655';
const DEFAULT_KEY_PATH = path.join(os.homedir(), '.credentials', 'umtelkomd-firebase.json');

const expandHome = (value) => (value.startsWith('~/') ? path.join(os.homedir(), value.slice(2)) : value);
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const appIdArg = args.find((entry) => entry.startsWith('--app-id='))?.split('=')[1];
const keyPathArg = args.find((entry) => entry.startsWith('--service-account='))?.split('=')[1];

const appId = process.env.FINCONTROL_APP_ID || appIdArg || DEFAULT_APP_ID;
const serviceAccountPath = expandHome(
  process.env.GOOGLE_APPLICATION_CREDENTIALS || keyPathArg || DEFAULT_KEY_PATH,
);

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account not found: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const nowIso = new Date().toISOString();
const nowTimestamp = admin.firestore.FieldValue.serverTimestamp();

const basePath = ['artifacts', appId, 'public', 'data'];
const transactionsCollection = db.collection([...basePath, 'transactions'].join('/'));
const receivablesCollection = db.collection([...basePath, 'receivables'].join('/'));
const payablesCollection = db.collection([...basePath, 'payables'].join('/'));
const bankMovementsCollection = db.collection([...basePath, 'bankMovements'].join('/'));

const clampMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;
const toISODate = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  return parsed.toISOString().slice(0, 10);
};

const classify = (raw) => {
  const amount = clampMoney(raw.amount);
  const paidAmount = clampMoney(raw.paidAmount);
  const status = String(raw.status || '').toLowerCase();
  const settledAmount =
    status === 'paid' || status === 'completed'
      ? amount
      : status === 'partial'
        ? paidAmount
        : 0;
  const openAmount = Math.max(0, clampMoney(amount - settledAmount));
  return {
    amount,
    paidAmount,
    settledAmount,
    openAmount,
    status,
  };
};

const createDocumentPayload = (docId, transaction, shape, kind) => ({
  accountId: 'main',
  currency: 'EUR',
  invoiceNumber: transaction.invoiceNumber || '',
  documentNumber: transaction.invoiceNumber || '',
  [kind === 'receivable' ? 'client' : 'vendor']: transaction.counterparty || transaction.description || '',
  counterpartyName: transaction.counterparty || transaction.description || '',
  projectId: transaction.projectId || '',
  projectName: transaction.project || '',
  costCenterId: transaction.costCenter || '',
  description: transaction.description || '',
  grossAmount: shape.amount,
  amount: shape.amount,
  openAmount: shape.openAmount,
  pendingAmount: shape.openAmount,
  paidAmount: clampMoney(shape.amount - shape.openAmount),
  issueDate: toISODate(transaction.issueDate || transaction.date),
  dueDate: toISODate(transaction.dueDate || transaction.date),
  paymentTerms: transaction.paymentTerms || 'legacy',
  status: shape.openAmount > 0 ? (shape.openAmount < shape.amount ? 'partial' : 'issued') : 'settled',
  payments: Array.isArray(transaction.payments) ? transaction.payments : [],
  notes: transaction.notes || '',
  linkedTransactionId: transaction.id,
  legacyTransactionId: transaction.id,
  migrationSource: 'legacy-transaction',
  migrationVersion: 1,
  migratedAt: nowIso,
  migratedBy: 'migrateLegacyTransactions',
  updatedAt: nowTimestamp,
  updatedBy: 'migrateLegacyTransactions',
  createdAt: transaction.createdAt || nowTimestamp,
  createdBy: transaction.createdBy || 'legacy',
  canonicalId: docId,
});

const createMovementPayload = (docId, transaction, shape) => ({
  accountId: 'main',
  currency: 'EUR',
  kind: transaction.type === 'income' ? 'legacy-collection' : 'legacy-payment',
  status: 'posted',
  direction: transaction.type === 'income' ? 'in' : 'out',
  amount: shape.settledAmount,
  postedDate: toISODate(transaction.paidDate || transaction.date),
  valueDate: toISODate(transaction.paidDate || transaction.date),
  description: transaction.description || '',
  counterpartyName: transaction.counterparty || transaction.description || '',
  documentNumber: transaction.invoiceNumber || '',
  projectId: transaction.projectId || '',
  projectName: transaction.project || '',
  costCenterId: transaction.costCenter || '',
  linkedTransactionId: transaction.id,
  legacyTransactionId: transaction.id,
  migrationSource: 'legacy-transaction',
  migrationVersion: 1,
  migratedAt: nowIso,
  migratedBy: 'migrateLegacyTransactions',
  updatedAt: nowTimestamp,
  updatedBy: 'migrateLegacyTransactions',
  createdAt: transaction.createdAt || nowTimestamp,
  createdBy: transaction.createdBy || 'legacy',
  canonicalId: docId,
});

const chunk = (items, size) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const snapshot = await transactionsCollection.get();
const docs = snapshot.docs.filter((entry) => {
  const raw = entry.data();
  const year = raw.date ? Number(String(raw.date).slice(0, 4)) : null;
  return year == null || year >= 2026;
});

const operations = [];

for (const entry of docs) {
  const raw = entry.data();
  const transaction = { id: entry.id, ...raw };
  const shape = classify(transaction);
  const updates = {
    canonicalMigrationVersion: 1,
    canonicalMigratedAt: nowIso,
  };

  if (shape.settledAmount > 0) {
    const movementId = `legacy-tx-${transaction.id}-movement`;
    const movementRef = bankMovementsCollection.doc(movementId);
    operations.push({ type: 'set', ref: movementRef, data: createMovementPayload(movementId, transaction, shape) });
    updates.canonicalMovementId = movementId;
  }

  if (shape.openAmount > 0) {
    const documentId = `legacy-tx-${transaction.id}-${transaction.type === 'income' ? 'receivable' : 'payable'}`;
    const collectionRef = transaction.type === 'income' ? receivablesCollection : payablesCollection;
    const payload = createDocumentPayload(documentId, transaction, shape, transaction.type === 'income' ? 'receivable' : 'payable');
    operations.push({ type: 'set', ref: collectionRef.doc(documentId), data: payload });
    if (transaction.type === 'income') updates.canonicalReceivableId = documentId;
    else updates.canonicalPayableId = documentId;
  }

  operations.push({ type: 'update', ref: entry.ref, data: updates });
}

console.log(`Transactions scanned: ${docs.length}`);
console.log(`Operations prepared: ${operations.length}`);
console.log(`Mode: ${dryRun ? 'dry-run' : 'write'}`);

if (!dryRun) {
  for (const batchOps of chunk(operations, 400)) {
    const batch = db.batch();
    batchOps.forEach((operation) => {
      if (operation.type === 'set') batch.set(operation.ref, operation.data, { merge: true });
      if (operation.type === 'update') batch.set(operation.ref, operation.data, { merge: true });
    });
    await batch.commit();
  }
}

const summary = {
  transactions: docs.length,
  writes: operations.filter((operation) => operation.type === 'set').length,
  transactionUpdates: operations.filter((operation) => operation.type === 'update').length,
};

console.log(JSON.stringify(summary, null, 2));
