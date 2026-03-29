import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Landmark,
  Link2,
  Scale,
  Search,
  X,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useBankMovements } from '../../hooks/useBankMovements';
import { useAllTransactions } from '../../hooks/useAllTransactions';
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

  // Date proximity
  if (movement.postedDate && transaction.date) {
    const mDate = new Date(movement.postedDate);
    const tDate = new Date(transaction.date);
    const daysDiff = Math.abs((mDate - tDate) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) score += 30;
    else if (daysDiff <= 3) score += 20;
    else if (daysDiff <= 7) score += 10;
    else if (daysDiff <= 30) score += 5;
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
  const { bankMovements, loading: movLoading } = useBankMovements(user);
  const { allTransactions, loading: txLoading } = useAllTransactions(user);

  const [month, setMonth] = useState(currentMonth());
  const [searchBank, setSearchBank] = useState('');
  const [searchTx, setSearchTx] = useState('');
  const [selectedMovement, setSelectedMovement] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]); // [{movementId, transactionId}]
  const [showMatched, setShowMatched] = useState(false);

  const loading = movLoading || txLoading;

  // Filter bank movements by month
  const monthMovements = useMemo(() => {
    return bankMovements
      .filter(m => m.status === 'posted' && (m.postedDate || '').slice(0, 7) === month)
      .filter(m => {
        if (!searchBank) return true;
        const q = searchBank.toLowerCase();
        return (m.description || '').toLowerCase().includes(q) ||
          (m.counterpartyName || '').toLowerCase().includes(q) ||
          String(m.amount).includes(q);
      });
  }, [bankMovements, month, searchBank]);

  // Filter transactions by month
  const monthTransactions = useMemo(() => {
    return allTransactions
      .filter(t => t.source === '2026-firebase' || t.year === 2026 || t.year === 2025 || true)
      .filter(t => (t.date || '').slice(0, 7) === month)
      .filter(t => {
        if (!searchTx) return true;
        const q = searchTx.toLowerCase();
        return (t.description || '').toLowerCase().includes(q) ||
          (t.project || '').toLowerCase().includes(q) ||
          String(t.amount).includes(q);
      });
  }, [allTransactions, month, searchTx]);

  // Already matched IDs
  const matchedMovementIds = useMemo(() => new Set(matchedPairs.map(p => p.movementId)), [matchedPairs]);
  const matchedTransactionIds = useMemo(() => new Set(matchedPairs.map(p => p.transactionId)), [matchedPairs]);

  // Unmatched items
  const unmatchedMovements = monthMovements.filter(m => !matchedMovementIds.has(m.id) && !m.reconciledAt);
  const unmatchedTransactions = monthTransactions.filter(t => !matchedTransactionIds.has(t.id));

  // Auto-suggestions for selected movement
  const suggestions = useMemo(() => {
    if (!selectedMovement) return [];
    return unmatchedTransactions
      .map(t => ({ transaction: t, score: scoreMatch(selectedMovement, t) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [selectedMovement, unmatchedTransactions]);

  // Auto-match all: find best 1:1 matches
  const autoMatch = () => {
    const pairs = [];
    const usedMovements = new Set(matchedMovementIds);
    const usedTransactions = new Set(matchedTransactionIds);

    // Build all possible matches sorted by score
    const allMatches = [];
    unmatchedMovements.forEach(m => {
      unmatchedTransactions.forEach(t => {
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

    setMatchedPairs(prev => [...prev, ...pairs]);
    setSelectedMovement(null);
    showToast(`${pairs.length} coincidencias encontradas`, 'success');
  };

  const manualMatch = (movementId, transactionId) => {
    setMatchedPairs(prev => [...prev, { movementId, transactionId }]);
    setSelectedMovement(null);
  };

  const removeMatch = (movementId) => {
    setMatchedPairs(prev => prev.filter(p => p.movementId !== movementId));
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Preparando conciliación bancaria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(185,248,238,0.22),transparent_22%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Conciliación bancaria</p>
            <h2 className="text-[28px] font-semibold tracking-tight text-[#101938]">Banco vs. Sistema</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#5f7091]">
              Compara los movimientos importados del banco con las transacciones registradas en FinControl.
              Vincula registros por monto, fecha y descripción.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none"
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
              className="inline-flex items-center gap-2 rounded-2xl bg-[#3156d3] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2748b6]"
            >
              <Link2 size={16} />
              Auto-conciliar
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-4 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Mov. banco</p>
          <p className="mt-1 text-[22px] font-semibold text-[#101938]">{monthMovements.length}</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-4 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Transacciones</p>
          <p className="mt-1 text-[22px] font-semibold text-[#101938]">{monthTransactions.length}</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(15,159,110,0.18)] bg-[rgba(244,252,248,0.94)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#648277]">Conciliados</p>
          <p className="mt-1 text-[22px] font-semibold text-[#0f8f4b]">{matchedPairs.length}</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(208,76,54,0.18)] bg-[rgba(255,248,246,0.94)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6d66]">Sin conciliar (banco)</p>
          <p className="mt-1 text-[22px] font-semibold text-[#d04c36]">{unmatchedMovements.length}</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(214,149,44,0.18)] bg-[rgba(255,248,234,0.94)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a6d40]">Sin conciliar (sistema)</p>
          <p className="mt-1 text-[22px] font-semibold text-[#c98717]">{unmatchedTransactions.length}</p>
        </div>
      </div>

      {/* Totals comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Banco — {month}</p>
          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-[10px] text-[#648277]">Entradas</p>
              <p className="text-sm font-semibold text-[#0f8f4b]">+€{formatCurrency(totalBankIn)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8a6d66]">Salidas</p>
              <p className="text-sm font-semibold text-[#d04c36]">-€{formatCurrency(totalBankOut)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#6980ac]">Neto</p>
              <p className="text-sm font-bold text-[#101938]">€{formatCurrency(totalBankIn - totalBankOut)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Sistema — {month}</p>
          <div className="mt-3 flex gap-6">
            <div>
              <p className="text-[10px] text-[#648277]">Ingresos</p>
              <p className="text-sm font-semibold text-[#0f8f4b]">+€{formatCurrency(totalTxIncome)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#8a6d66]">Gastos</p>
              <p className="text-sm font-semibold text-[#d04c36]">-€{formatCurrency(totalTxExpense)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#6980ac]">Neto</p>
              <p className="text-sm font-bold text-[#101938]">€{formatCurrency(totalTxIncome - totalTxExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Matched pairs */}
      {matchedPairs.length > 0 && (
        <section className="rounded-[28px] border border-[rgba(15,159,110,0.22)] bg-[rgba(244,252,248,0.94)] p-5">
          <button
            onClick={() => setShowMatched(!showMatched)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#0f8f4b]" />
              <h3 className="text-[15px] font-semibold text-[#101938]">Conciliados ({matchedPairs.length})</h3>
            </div>
            <ChevronDown size={18} className={`text-[#6b7a96] transition ${showMatched ? 'rotate-180' : ''}`} />
          </button>
          {showMatched && (
            <div className="mt-4 space-y-2">
              {matchedPairs.map(pair => {
                const mov = bankMovements.find(m => m.id === pair.movementId);
                const tx = allTransactions.find(t => t.id === pair.transactionId);
                if (!mov || !tx) return null;
                return (
                  <div key={pair.movementId} className="flex items-center gap-3 rounded-2xl border border-[rgba(15,159,110,0.14)] bg-white/80 px-4 py-3">
                    <Check size={16} className="flex-shrink-0 text-[#0f8f4b]" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[12px] font-medium text-[#101938]">
                        {mov.counterpartyName || mov.description}
                      </p>
                      <p className="truncate text-[11px] text-[#6b7a96]">{mov.postedDate}</p>
                    </div>
                    <Link2 size={14} className="flex-shrink-0 text-[#6b7a96]" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[12px] font-medium text-[#101938]">{tx.description}</p>
                      <p className="truncate text-[11px] text-[#6b7a96]">{tx.date} · {tx.project}</p>
                    </div>
                    <span className={`flex-shrink-0 text-[13px] font-semibold ${mov.direction === 'in' ? 'text-[#0f8f4b]' : 'text-[#d04c36]'}`}>
                      €{formatCurrency(mov.amount)}
                    </span>
                    <button onClick={() => removeMatch(pair.movementId)} className="flex-shrink-0 rounded-lg p-1 text-[#6b7a96] hover:text-[#d04c36]">
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
        <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-[#3156d3]" />
              <h3 className="text-[16px] font-semibold text-[#101938]">Movimientos banco</h3>
              <span className="text-[11px] text-[#6b7a96]">({unmatchedMovements.length})</span>
            </div>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a879d]" />
            <input
              type="text"
              placeholder="Buscar movimiento..."
              className="w-full rounded-xl border border-[rgba(201,214,238,0.82)] bg-white/88 py-2 pl-9 pr-3 text-[12px] text-[#16223f] outline-none focus:border-[rgba(90,141,221,0.56)]"
              value={searchBank}
              onChange={e => setSearchBank(e.target.value)}
            />
          </div>
          <div className="max-h-[500px] space-y-2 overflow-y-auto">
            {unmatchedMovements.length === 0 && (
              <p className="py-8 text-center text-sm text-[#6b7a96]">
                {monthMovements.length === 0 ? 'No hay movimientos bancarios para este mes. Importa un CSV en la sección de Importar.' : 'Todos los movimientos están conciliados.'}
              </p>
            )}
            {unmatchedMovements.map(m => {
              const isSelected = selectedMovement?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMovement(isSelected ? null : m)}
                  className={`w-full rounded-[18px] border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'border-[rgba(49,86,211,0.4)] bg-[rgba(49,86,211,0.08)] shadow-[0_0_0_2px_rgba(49,86,211,0.12)]'
                      : 'border-[rgba(201,214,238,0.74)] bg-white/78 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-semibold text-[#101938]">
                      {m.counterpartyName || m.description || 'Sin descripción'}
                    </span>
                    <span className={`flex-shrink-0 text-[13px] font-bold ${m.direction === 'in' ? 'text-[#0f8f4b]' : 'text-[#d04c36]'}`}>
                      {m.direction === 'in' ? '+' : '-'}€{formatCurrency(m.amount)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-[#6b7a96]">
                    {m.postedDate} · {m.description?.slice(0, 60)}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Transactions / Suggestions */}
        <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          {selectedMovement ? (
            <>
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 size={18} className="text-[#c98717]" />
                    <h3 className="text-[16px] font-semibold text-[#101938]">Sugerencias de coincidencia</h3>
                  </div>
                  <button onClick={() => setSelectedMovement(null)} className="rounded-lg p-1 text-[#6b7a96] hover:text-[#d04c36]">
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-2 rounded-xl border border-[rgba(49,86,211,0.2)] bg-[rgba(49,86,211,0.04)] px-3 py-2">
                  <p className="text-[11px] text-[#5b7bd6]">Buscando coincidencias para:</p>
                  <p className="text-[13px] font-semibold text-[#101938]">
                    {selectedMovement.counterpartyName || selectedMovement.description} —{' '}
                    <span className={selectedMovement.direction === 'in' ? 'text-[#0f8f4b]' : 'text-[#d04c36]'}>
                      {selectedMovement.direction === 'in' ? '+' : '-'}€{formatCurrency(selectedMovement.amount)}
                    </span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {suggestions.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#6b7a96]">
                    No se encontraron coincidencias para este movimiento.
                  </p>
                )}
                {suggestions.map(({ transaction: t, score }) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-[18px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-3 transition hover:bg-white"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-semibold text-[#101938]">{t.description}</span>
                        <span className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          score >= 150 ? 'bg-[rgba(15,159,110,0.1)] text-[#0f8f4b]' :
                          score >= 100 ? 'bg-[rgba(214,149,44,0.1)] text-[#c98717]' :
                          'bg-[rgba(107,122,150,0.1)] text-[#6b7a96]'
                        }`}>
                          {score >= 150 ? 'Exacto' : score >= 100 ? 'Probable' : 'Posible'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#6b7a96]">
                        {t.date} · {t.project || 'Sin proyecto'} · {t.category}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 text-[13px] font-bold ${t.type === 'income' ? 'text-[#0f8f4b]' : 'text-[#d04c36]'}`}>
                      €{formatCurrency(t.amount)}
                    </span>
                    <button
                      onClick={() => manualMatch(selectedMovement.id, t.id)}
                      className="flex-shrink-0 rounded-xl bg-[#3156d3] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#2748b6]"
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
                  <Scale size={18} className="text-[#c98717]" />
                  <h3 className="text-[16px] font-semibold text-[#101938]">Transacciones sistema</h3>
                  <span className="text-[11px] text-[#6b7a96]">({unmatchedTransactions.length})</span>
                </div>
              </div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a879d]" />
                <input
                  type="text"
                  placeholder="Buscar transacción..."
                  className="w-full rounded-xl border border-[rgba(201,214,238,0.82)] bg-white/88 py-2 pl-9 pr-3 text-[12px] text-[#16223f] outline-none focus:border-[rgba(90,141,221,0.56)]"
                  value={searchTx}
                  onChange={e => setSearchTx(e.target.value)}
                />
              </div>
              <div className="max-h-[500px] space-y-2 overflow-y-auto">
                {unmatchedTransactions.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#6b7a96]">No hay transacciones sin conciliar para este mes.</p>
                )}
                {unmatchedTransactions.map(t => (
                  <div
                    key={t.id}
                    className="rounded-[18px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] font-semibold text-[#101938]">{t.description}</span>
                      <span className={`flex-shrink-0 text-[13px] font-bold ${t.type === 'income' ? 'text-[#0f8f4b]' : 'text-[#d04c36]'}`}>
                        {t.type === 'income' ? '+' : '-'}€{formatCurrency(t.amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#6b7a96]">
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
      <div className="rounded-[22px] border border-dashed border-[rgba(201,214,238,0.78)] px-5 py-4 text-center">
        <p className="text-[12px] text-[#6b7a96]">
          <strong>Cómo usar:</strong> Haz clic en un movimiento bancario (izquierda) para ver sugerencias de coincidencia.
          Usa <strong>"Auto-conciliar"</strong> para vincular automáticamente los que coinciden por monto y dirección.
          Los movimientos del banco se importan desde <strong>Importar → Importar movimientos bancarios</strong>.
        </p>
      </div>
    </div>
  );
};

export default Conciliacion;
