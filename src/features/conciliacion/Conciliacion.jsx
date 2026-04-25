import { useMemo, useRef, useState } from 'react';
import {
 AlertTriangle,
 Check,
 CheckCircle2,
 ChevronDown,
 Landmark,
 Link2,
 Plus,
 Scale,
 Search,
 X,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useBankMovements } from '../../hooks/useBankMovements';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useTransactionActions } from '../../hooks/useTransactionActions';
import { formatCurrency } from '../../utils/formatters';

const currentMonth = () => {
 const now = new Date();
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Score a match between a bank movement and a transaction (higher = better)
const scoreMatch = (movement, transaction) => {
 let score = 0;

 // Amount match (most important)
 const amountDiff = Math.abs(movement.amount - transaction.amount);
 if (amountDiff < 0.01) score += 100;
 else if (amountDiff < 1) score += 80;
 else if (amountDiff < 10) score += 40;
 else return 0; // Too far off

 // Direction match
 const txDirection = transaction.type === 'income' ? 'in' : 'out';
 if (movement.direction === txDirection) score += 50;
 else return 0; // Direction mismatch = not a match

 // Date proximity (bank payment can be days/weeks after work date)
 if (movement.postedDate && transaction.date) {
 const mDate = new Date(movement.postedDate);
 const tDate = new Date(transaction.date);
 const daysDiff = Math.abs((mDate - tDate) / (1000 * 60 * 60 * 24));
 if (daysDiff === 0) score += 30;
 else if (daysDiff <= 3) score += 25;
 else if (daysDiff <= 7) score += 20;
 else if (daysDiff <= 14) score += 15;
 else if (daysDiff <= 30) score += 10;
 else if (daysDiff <= 60) score += 5;
 // Beyond 60 days: no date bonus but still matches by amount+direction
 }

 // Description similarity (basic)
 const mDesc = (movement.counterpartyName || movement.description || '').toLowerCase();
 const tDesc = (transaction.description || '').toLowerCase();
 if (mDesc && tDesc) {
 const words = mDesc.split(/\s+/).filter(w => w.length > 3);
 const matchingWords = words.filter(w => tDesc.includes(w));
 if (matchingWords.length > 0) score += 15;
 }

 return score;
};

const Conciliacion = ({ user }) => {
 const { showToast } = useToast();
 const { bankMovements, loading: movLoading, reconcileMovement, unreconcileMovement } = useBankMovements(user);
 const { allTransactions, loading: txLoading } = useAllTransactions(user);
 const { markAsCompleted, createTransaction } = useTransactionActions(user);

 const [month, setMonth] = useState(currentMonth());
 const [searchBank, setSearchBank] = useState('');
 const [searchTx, setSearchTx] = useState('');
 const [selectedMovement, setSelectedMovement] = useState(null);
 const [showMatched, setShowMatched] = useState(false);
 const bankColumnRef = useRef(null);
 const systemColumnRef = useRef(null);

 // Derive matched pairs from Firestore state (persisted reconciliation)
 const matchedPairs = useMemo(() => {
 return bankMovements
 .filter(m => m.reconciledAt && m.linkedTransactionId)
 .map(m => ({ movementId: m.id, transactionId: m.linkedTransactionId }));
 }, [bankMovements]);

 const loading = movLoading || txLoading;

 // Filter bank movements by month
 // Exclude legacy-tx- movements (these are duplicates of transactions created by the ledger)
 // Exclude movements that were manually created (they are self-reconciled)
 const monthMovements = useMemo(() => {
 return bankMovements
 .filter(m => m.status === 'posted' && (m.postedDate || '').slice(0, 7) === month)
 .filter(m => !m.id.startsWith('legacy-tx-')) // Exclude ledger-generated duplicates
 .filter(m => !m.legacyTransactionId) // Exclude movements linked to legacy transactions
 .filter(m => {
 if (!searchBank) return true;
 const q = searchBank.toLowerCase();
 return (m.description || '').toLowerCase().includes(q) ||
 (m.counterpartyName || '').toLowerCase().includes(q) ||
 String(m.amount).includes(q);
 });
 }, [bankMovements, month, searchBank]);

 // Combine transactions + manual bank movements as "system records"
 // Manual bank movements (created by users, not imported from CSV) are operational records
 const allSystemRecords = useMemo(() => {
 const manualMovements = bankMovements
 .filter(m => m.status === 'posted')
 .filter(m => m.id.startsWith('legacy-tx-') || m.legacyTransactionId || m.createdBy) // manually created
 .filter(m => !m.id.startsWith('legacy-tx-')) // but not ledger duplicates — use the transaction instead
 .map(m => ({
 id: m.id,
 description: m.counterpartyName || m.description,
 amount: m.amount,
 type: m.direction === 'in' ? 'income' : 'expense',
 date: m.postedDate,
 project: m.projectName || '',
 category: m.kind || '',
 status: m.reconciledAt ? 'reconciled' : 'posted',
 source: 'manual-bankMovement',
 }));
 return [...allTransactions, ...manualMovements];
 }, [allTransactions, bankMovements]);

 // Filter system records by month
 const monthTransactions = useMemo(() => {
 return allSystemRecords
 .filter(t => (t.date || '').slice(0, 7) === month)
 .filter(t => {
 if (!searchTx) return true;
 const q = searchTx.toLowerCase();
 return (t.description || '').toLowerCase().includes(q) ||
 (t.project || '').toLowerCase().includes(q) ||
 String(t.amount).includes(q);
 });
 }, [allSystemRecords, month, searchTx]);

 // Already matched IDs
 const matchedMovementIds = useMemo(() => new Set(matchedPairs.map(p => p.movementId)), [matchedPairs]);
 const matchedTransactionIds = useMemo(() => new Set(matchedPairs.map(p => p.transactionId)), [matchedPairs]);

 // Unmatched items
 const unmatchedMovements = monthMovements.filter(m => !matchedMovementIds.has(m.id) && !m.reconciledAt);
 const unmatchedTransactions = monthTransactions.filter(t => !matchedTransactionIds.has(t.id));

 // All unmatched system records (for suggestions — wider than just month)
 const allUnmatchedTransactions = useMemo(() => {
 return allSystemRecords.filter(t => !matchedTransactionIds.has(t.id));
 }, [allSystemRecords, matchedTransactionIds]);

 // Auto-suggestions for selected movement (search ALL transactions, not just month)
 const suggestions = useMemo(() => {
 if (!selectedMovement) return [];

 const results = allUnmatchedTransactions
 .map(t => ({ transaction: t, score: scoreMatch(selectedMovement, t) }))
 .filter(s => s.score > 0)
 .sort((a, b) => b.score - a.score)
 .slice(0, 8);

 return results;
 }, [selectedMovement, allUnmatchedTransactions, allTransactions]);

 // Auto-match all: find best 1:1 matches
 const autoMatch = async () => {
 const pairs = [];
 const usedMovements = new Set(matchedMovementIds);
 const usedTransactions = new Set(matchedTransactionIds);

 // Build all possible matches sorted by score
 const allMatches = [];
 unmatchedMovements.forEach(m => {
 allUnmatchedTransactions.forEach(t => {
 const score = scoreMatch(m, t);
 if (score >= 150) { // High confidence only
 allMatches.push({ movementId: m.id, transactionId: t.id, score });
 }
 });
 });
 allMatches.sort((a, b) => b.score - a.score);

 // Greedy 1:1 assignment
 allMatches.forEach(match => {
 if (!usedMovements.has(match.movementId) && !usedTransactions.has(match.transactionId)) {
 pairs.push({ movementId: match.movementId, transactionId: match.transactionId });
 usedMovements.add(match.movementId);
 usedTransactions.add(match.transactionId);
 }
 });

 if (pairs.length === 0) {
 showToast('No se encontraron coincidencias automáticas', 'info');
 return;
 }

 // Persist all matches to Firestore
 for (const pair of pairs) {
 await reconcileMovement(pair.movementId, pair.transactionId);
 const transaction = allTransactions.find(t => t.id === pair.transactionId);
 if (transaction && transaction.source === '2026-firebase') {
 await markAsCompleted(transaction);
 }
 }

 setSelectedMovement(null);
 showToast(`${pairs.length} coincidencias conciliadas`, 'success');
 };

 const manualMatch = async (movementId, transactionId) => {
 const transaction = allTransactions.find(t => t.id === transactionId);

 // Persist reconciliation to Firestore
 await reconcileMovement(movementId, transactionId);

 // Mark transaction as completed/paid (only for Firebase transactions)
 if (transaction && transaction.source === '2026-firebase') {
 await markAsCompleted(transaction);
 }

 setSelectedMovement(null);
 showToast('Movimiento conciliado', 'success');
 };

 const removeMatch = async (movementId) => {
 await unreconcileMovement(movementId);
 showToast('Conciliación deshecha', 'info');
 };

 // Create a new transaction from an unmatched bank movement
 const handleCreateFromMovement = async (movement) => {
 const result = await createTransaction({
 date: movement.postedDate,
 description: movement.counterpartyName || movement.description || 'Movimiento bancario',
 amount: movement.amount,
 type: movement.direction === 'in' ? 'income' : 'expense',
 category: 'Sin categorizar',
 project: '',
 costCenter: 'Sin asignar',
 status: 'paid',
 comment: `Creado desde movimiento bancario del ${movement.postedDate}`,
 });

 if (result?.success && result.id) {
 await reconcileMovement(movement.id, result.id);
 showToast('Transacción creada y conciliada', 'success');
 } else if (result?.success) {
 showToast('Transacción creada. Vincúlala manualmente.', 'success');
 } else {
 showToast('Error al crear la transacción', 'error');
 }
 };

 // Stats
 const totalBankIn = monthMovements.filter(m => m.direction === 'in').reduce((s, m) => s + m.amount, 0);
 const totalBankOut = monthMovements.filter(m => m.direction === 'out').reduce((s, m) => s + m.amount, 0);
 const totalTxIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
 const totalTxExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

 // Available months from bank movements
 const availableMonths = useMemo(() => {
 const months = new Set();
 bankMovements.forEach(m => {
 if (m.postedDate) months.add(m.postedDate.slice(0, 7));
 });
 allTransactions.forEach(t => {
 if (t.date) months.add(t.date.slice(0, 7));
 });
 return [...months].sort().reverse();
 }, [bankMovements, allTransactions]);

 if (loading) {
 return (
 <div className="flex items-center justify-center py-28">
 <div className="flex flex-col items-center gap-3">
 <Scale size={24} className="text-[var(--text-disabled)]" />
 <p className="nd-mono text-xs text-[var(--text-secondary)] tracking-[0.08em] uppercase">[LOADING...]</p>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 pb-12">
 {/* Header */}
 <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-6 py-7">
 <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
 <div>
 <p className="nd-label text-[var(--text-secondary)] mb-3">Conciliación bancaria</p>
 <h2 className="nd-display text-[28px] font-medium text-[var(--text-display)]">Banco vs. Sistema</h2>
 <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[var(--text-disabled)]">
 Compara los movimientos importados del banco con las transacciones registradas en FinControl.
 Vincula registros por monto, fecha y descripción.
 </p>
 </div>
 <div className="flex items-center gap-3">
 <select
 className="rounded-full border border-[var(--border-visible)] bg-[var(--surface-raised)] px-4 py-2.5 nd-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
 value={month}
 onChange={e => setMonth(e.target.value)}
 >
 {availableMonths.map(m => (
 <option key={m} value={m}>{m}</option>
 ))}
 {!availableMonths.includes(month) && <option value={month}>{month}</option>}
 </select>
 <button
 onClick={autoMatch}
 className="btn btn-primary"
 >
 <Link2 size={16} />
 Auto-conciliar
 </button>
 </div>
 </div>
 </section>

 {/* Stats */}
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <p className="nd-label text-[var(--text-secondary)]">Mov. banco</p>
 <p className="mt-2 nd-display text-[24px] font-medium text-[var(--text-display)]">{monthMovements.length}</p>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <p className="nd-label text-[var(--text-secondary)]">Transacciones</p>
 <p className="mt-2 nd-display text-[24px] font-medium text-[var(--text-display)]">{monthTransactions.length}</p>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <p className="nd-label text-[var(--text-secondary)]">Conciliados</p>
 <p className="mt-2 nd-display text-[24px] font-medium text-[var(--success)]">{matchedPairs.length}</p>
 </div>
 <div
className="cursor-pointer rounded-md border border-[var(--border-visible)] bg-transparent p-4 transition-colors duration-200 hover:border-[var(--text-primary)] hover:bg-[var(--surface)]"
 onClick={() => bankColumnRef.current?.scrollIntoView({ behavior: 'smooth' })}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bankColumnRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
 >
 <p className="nd-label text-[var(--text-secondary)]">Sin conciliar (banco)</p>
 <p className="mt-2 nd-display text-[24px] font-medium text-[var(--accent)]">{unmatchedMovements.length}</p>
 </div>
 <div
className="cursor-pointer rounded-md border border-[var(--border-visible)] bg-transparent p-4 transition-colors duration-200 hover:border-[var(--text-primary)] hover:bg-[var(--surface)]"
 onClick={() => systemColumnRef.current?.scrollIntoView({ behavior: 'smooth' })}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); systemColumnRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
 >
 <p className="nd-label text-[var(--text-secondary)]">Sin conciliar (sistema)</p>
 <p className="mt-2 nd-display text-[24px] font-medium text-[var(--warning)]">{unmatchedTransactions.length}</p>
 </div>
 </div>

 {/* Totals comparison */}
 <div className="grid gap-4 sm:grid-cols-2">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
 <p className="nd-label text-[var(--text-secondary)]">Banco — {month}</p>
 <div className="mt-3 flex gap-6">
 <div>
 <p className="text-[10px] text-[var(--success)]">Entradas</p>
 <p className="text-sm font-medium text-[var(--success)]">+€{formatCurrency(totalBankIn)}</p>
 </div>
 <div>
 <p className="text-[10px] text-[var(--text-secondary)]">Salidas</p>
 <p className="text-sm font-medium text-[var(--accent)]">-€{formatCurrency(totalBankOut)}</p>
 </div>
 <div>
 <p className="text-[10px] text-[var(--text-disabled)]">Neto</p>
 <p className="text-sm font-medium text-[var(--text-primary)]">€{formatCurrency(totalBankIn - totalBankOut)}</p>
 </div>
 </div>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5">
 <p className="nd-label text-[var(--text-secondary)]">Sistema — {month}</p>
 <div className="mt-3 flex gap-6">
 <div>
 <p className="text-[10px] text-[var(--success)]">Ingresos</p>
 <p className="text-sm font-medium text-[var(--success)]">+€{formatCurrency(totalTxIncome)}</p>
 </div>
 <div>
 <p className="text-[10px] text-[var(--text-secondary)]">Gastos</p>
 <p className="text-sm font-medium text-[var(--accent)]">-€{formatCurrency(totalTxExpense)}</p>
 </div>
 <div>
 <p className="text-[10px] text-[var(--text-disabled)]">Neto</p>
 <p className="text-sm font-medium text-[var(--text-primary)]">€{formatCurrency(totalTxIncome - totalTxExpense)}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Matched pairs */}
 {matchedPairs.length > 0 && (
 <section className="rounded-md border border-[var(--border-visible)] bg-transparent p-5">
 <button
 onClick={() => setShowMatched(!showMatched)}
 className="flex w-full items-center justify-between"
 >
 <div className="flex items-center gap-2">
 <CheckCircle2 size={18} className="text-[var(--success)]" />
 <h3 className="nd-mono text-[15px] font-medium text-[var(--text-display)]">Conciliados ({matchedPairs.length})</h3>
 </div>
 <ChevronDown size={18} className={`text-[var(--text-secondary)] transition ${showMatched ? 'rotate-180' : ''}`} />
 </button>
 {showMatched && (
 <div className="mt-4 space-y-2">
 {matchedPairs.map(pair => {
 const mov = bankMovements.find(m => m.id === pair.movementId);
 const tx = allTransactions.find(t => t.id === pair.transactionId);
 if (!mov || !tx) return null;
 return (
 <div key={pair.movementId} className="flex items-center gap-3 rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3">
 <Check size={16} className="flex-shrink-0 text-[var(--success)]" />
 <div className="flex-1 min-w-0">
 <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
 {mov.counterpartyName || mov.description}
 </p>
 <p className="truncate text-[11px] text-[var(--text-secondary)]">{mov.postedDate}</p>
 </div>
 <Link2 size={14} className="flex-shrink-0 text-[var(--text-secondary)]" />
 <div className="flex-1 min-w-0">
 <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">{tx.description}</p>
 <p className="truncate text-[11px] text-[var(--text-secondary)]">{tx.date} · {tx.project}</p>
 </div>
 <span className={`flex-shrink-0 text-[13px] font-medium ${mov.direction === 'in' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 €{formatCurrency(mov.amount)}
 </span>
 <button onClick={() => removeMatch(pair.movementId)} className="flex-shrink-0 rounded-lg p-1 text-[var(--text-secondary)] hover:text-[var(--accent)]">
 <X size={14} />
 </button>
 </div>
 );
 })}
 </div>
 )}
 </section>
 )}

 {/* Two-column comparison */}
 <div className="grid gap-6 xl:grid-cols-2">
 {/* Bank movements */}
 <section ref={bankColumnRef} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="mb-4 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Landmark size={18} className="text-[var(--text-primary)]" />
 <h3 className="nd-mono text-[14px] font-medium text-[var(--text-display)]">Movimientos banco</h3>
 <span className="text-[11px] text-[var(--text-secondary)]">({unmatchedMovements.length})</span>
 </div>
 </div>
 <div className="relative mb-3">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
 <input
 type="text"
 placeholder="Buscar movimiento..."
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--border-visible)]"
 value={searchBank}
 onChange={e => setSearchBank(e.target.value)}
 />
 </div>
 <div className="max-h-[500px] space-y-2 overflow-y-auto">
 {unmatchedMovements.length === 0 && (
 <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
 {monthMovements.length === 0 ? 'No hay movimientos bancarios para este mes. Importa un CSV en la sección de Importar.' : 'Todos los movimientos están conciliados.'}
 </p>
 )}
 {unmatchedMovements.map(m => {
 const isSelected = selectedMovement?.id === m.id;
 return (
 <div key={m.id} className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => setSelectedMovement(isSelected ? null : m)}
 className={`flex-1 min-w-0 rounded-lg border px-4 py-3 text-left transition-all ${
 isSelected
 ? 'border-[var(--border-visible)] bg-[var(--surface)] '
: 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-raised)]'
 }`}
 >
 <div className="flex items-center justify-between gap-2">
 <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">
 {m.counterpartyName || m.description || 'Sin descripción'}
 </span>
 <span className={`flex-shrink-0 text-[13px] font-medium ${m.direction === 'in' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 {m.direction === 'in' ? '+' : '-'}€{formatCurrency(m.amount)}
 </span>
 </div>
 <p className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">
 {m.postedDate} · {m.description?.slice(0, 60)}
 </p>
 </button>
 <button
 onClick={() => handleCreateFromMovement(m)}
className="flex-shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)] transition hover:border-[var(--border-visible)] hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)]"
 title="Crear transacción desde este movimiento"
 >
 <Plus size={14} />
 </button>
 </div>
 );
 })}
 </div>
 </section>

 {/* Transactions / Suggestions */}
 <section ref={systemColumnRef} className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 {selectedMovement ? (
 <>
 <div className="mb-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Link2 size={18} className="text-[var(--warning)]" />
 <h3 className="nd-mono text-[14px] font-medium text-[var(--text-display)]">Sugerencias de coincidencia</h3>
 </div>
 <button onClick={() => setSelectedMovement(null)} className="rounded-lg p-1 text-[var(--text-secondary)] hover:text-[var(--accent)]">
 <X size={16} />
 </button>
 </div>
 <div className="mt-2 rounded-md border border-[var(--border-visible)] bg-[var(--surface)] px-3 py-2">
 <p className="text-[11px] text-[var(--text-primary)]">Buscando coincidencias para:</p>
 <p className="text-[13px] font-medium text-[var(--text-primary)]">
 {selectedMovement.counterpartyName || selectedMovement.description} —{' '}
 <span className={selectedMovement.direction === 'in' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}>
 {selectedMovement.direction === 'in' ? '+' : '-'}€{formatCurrency(selectedMovement.amount)}
 </span>
 </p>
 </div>
 </div>
 <div className="space-y-2">
 {suggestions.length === 0 && (
 <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
 No se encontraron coincidencias para este movimiento.
 </p>
 )}
 {suggestions.map(({ transaction: t, score }) => (
 <div
 key={t.id}
className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:bg-[var(--surface-raised)]"
 >
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">{t.description}</span>
 <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
 score >= 150 ? 'bg-transparent text-[var(--success)]' :
 score >= 100 ? 'bg-transparent text-[var(--warning)]' :
 'bg-transparent text-[var(--text-secondary)]'
 }`}>
 {score >= 150 ? 'Exacto' : score >= 100 ? 'Probable' : 'Posible'}
 </span>
 </div>
 <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
 {t.date} · {t.project || 'Sin proyecto'} · {t.category}
 </p>
 </div>
 <span className={`flex-shrink-0 text-[13px] font-medium ${t.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 €{formatCurrency(t.amount)}
 </span>
 <button
 onClick={() => manualMatch(selectedMovement.id, t.id)}
 className="flex-shrink-0 rounded-full bg-[var(--text-display)] px-3 py-1.5 nd-mono text-[10px] uppercase tracking-[0.06em] text-[var(--black)] transition hover:opacity-85"
 >
 Vincular
 </button>
 </div>
 ))}
 </div>
 </>
 ) : (
 <>
 <div className="mb-4 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Scale size={18} className="text-[var(--warning)]" />
 <h3 className="nd-mono text-[14px] font-medium text-[var(--text-display)]">Transacciones sistema</h3>
 <span className="text-[11px] text-[var(--text-secondary)]">({unmatchedTransactions.length})</span>
 </div>
 </div>
 <div className="relative mb-3">
 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
 <input
 type="text"
 placeholder="Buscar transacción..."
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-3 text-[12px] text-[var(--text-primary)] outline-none focus:border-[var(--border-visible)]"
 value={searchTx}
 onChange={e => setSearchTx(e.target.value)}
 />
 </div>
 <div className="max-h-[500px] space-y-2 overflow-y-auto">
 {unmatchedTransactions.length === 0 && (
 <p className="py-8 text-center text-sm text-[var(--text-secondary)]">No hay transacciones sin conciliar para este mes.</p>
 )}
 {unmatchedTransactions.map(t => (
 <div
 key={t.id}
 className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
 >
 <div className="flex items-center justify-between gap-2">
 <span className="truncate text-[12px] font-medium text-[var(--text-primary)]">{t.description}</span>
 <span className={`flex-shrink-0 text-[13px] font-medium ${t.type === 'income' ? 'text-[var(--success)]' : 'text-[var(--accent)]'}`}>
 {t.type === 'income' ? '+' : '-'}€{formatCurrency(t.amount)}
 </span>
 </div>
 <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
 {t.date} · {t.project || 'Sin proyecto'} · {t.category} · {t.status}
 </p>
 </div>
 ))}
 </div>
 </>
 )}
 </section>
 </div>

 {/* Help text */}
 <div className="rounded-lg border border-dashed border-[var(--border)] px-5 py-4 text-center">
 <p className="text-[12px] text-[var(--text-secondary)]">
 <strong>Cómo usar:</strong> Haz clic en un movimiento bancario (izquierda) para ver sugerencias de coincidencia.
 Usa <strong>"Auto-conciliar"</strong> para vincular automáticamente los que coinciden por monto y dirección.
 Los movimientos del banco se importan desde <strong>Importar → Importar movimientos bancarios</strong>.
 </p>
 </div>
 </div>
 );
};

export default Conciliacion;
