import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { transactions2025 as data2025 } from '../data/transactions2025';

/**
 * useAllTransactions — merges 2025 static data + 2026 Firebase transactions.
 * 2025 data is bundled at build time (no CORS issues).
 */
export const useAllTransactions = (user) => {
  const { transactions: firebaseTransactions, loading: fbLoading } = useTransactions(user);

  const transactions2026 = useMemo(() => {
    return firebaseTransactions.map((t) => ({
      ...t,
      source: '2026-firebase',
      year: 2026,
    }));
  }, [firebaseTransactions]);

  const allTransactions = useMemo(() => {
    return [...data2025, ...transactions2026].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [transactions2026]);

  return {
    allTransactions,
    loading: fbLoading,
    csvError: null,
    transactions2025: data2025,
    transactions2026,
  };
};
