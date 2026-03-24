import { useMemo } from 'react';
import { balances2025 } from '../data/balances2025';
import {
  adaptLegacyTransactionToMovement,
  adaptLegacyTransactionToPayable,
  adaptLegacyTransactionToReceivable,
  adaptPayableDoc,
  adaptReceivableDoc,
  createLegacyOpeningPayables,
  createLegacyOpeningReceivables,
} from '../finance/adapters';
import { DEFAULT_CURRENCY, MAIN_ACCOUNT_ID, MOVEMENT_STATUS } from '../finance/constants';
import { compareIsoDate, getSignedMovementAmount, sumMoney } from '../finance/utils';
import { useAllTransactions } from './useAllTransactions';
import { useBankAccount } from './useBankAccount';
import { useBankMovements } from './useBankMovements';
import { useBudgets } from './useBudgets';
import { usePayables } from './usePayables';
import { useProjects } from './useProjects';
import { useReceivables } from './useReceivables';

const sortByDueDate = (left, right) => {
  const dueComparison = compareIsoDate(left.dueDate, right.dueDate);
  if (dueComparison !== 0) return dueComparison;
  return (left.counterpartyName || '').localeCompare(right.counterpartyName || '');
};

export const useFinanceLedger = (user) => {
  const { allTransactions, loading: txLoading } = useAllTransactions(user);
  const { bankAccount, loading: accountLoading } = useBankAccount(user);
  const { bankMovements, loading: movementLoading } = useBankMovements(user);
  const { receivables, loading: receivablesLoading } = useReceivables(user);
  const { payables, loading: payablesLoading } = usePayables(user);
  const { budgets, loading: budgetsLoading } = useBudgets(user);
  const { projects, loading: projectsLoading } = useProjects(user);

  return useMemo(() => {
    const loading =
      txLoading ||
      accountLoading ||
      movementLoading ||
      receivablesLoading ||
      payablesLoading ||
      budgetsLoading ||
      projectsLoading;

    const canonicalReceivables = receivables.map((entry) => adaptReceivableDoc(entry, 'receivable'));
    const canonicalPayables = payables.map((entry) => adaptPayableDoc(entry, 'payable'));

    const movementLegacyIds = new Set(
      bankMovements
        .filter((entry) => entry.status === MOVEMENT_STATUS.POSTED)
        .map((entry) => entry.legacyTransactionId)
        .filter(Boolean),
    );
    const receivableLegacyIds = new Set(
      canonicalReceivables
        .flatMap((entry) => [entry.legacyTransactionId, entry.linkedTransactionId])
        .filter(Boolean),
    );
    const payableLegacyIds = new Set(
      canonicalPayables
        .flatMap((entry) => [entry.legacyTransactionId, entry.linkedTransactionId])
        .filter(Boolean),
    );

    const legacyMovements = allTransactions
      .filter((entry) => !movementLegacyIds.has(entry.id) && !entry.canonicalMovementId)
      .map(adaptLegacyTransactionToMovement)
      .filter(Boolean);

    const legacyReceivables = allTransactions
      .filter((entry) => !receivableLegacyIds.has(entry.id) && !entry.canonicalReceivableId)
      .map(adaptLegacyTransactionToReceivable)
      .filter(Boolean);

    const legacyPayables = allTransactions
      .filter((entry) => !payableLegacyIds.has(entry.id) && !entry.canonicalPayableId)
      .map(adaptLegacyTransactionToPayable)
      .filter(Boolean);

    const openingReceivables = createLegacyOpeningReceivables();
    const openingPayables = createLegacyOpeningPayables();

    const receivableRows = [...openingReceivables, ...canonicalReceivables, ...legacyReceivables].sort(sortByDueDate);
    const payableRows = [...openingPayables, ...canonicalPayables, ...legacyPayables].sort(sortByDueDate);
    const postedMovements = [...bankMovements, ...legacyMovements]
      .filter((entry) => entry.status === MOVEMENT_STATUS.POSTED)
      .sort((left, right) => compareIsoDate(left.postedDate, right.postedDate));

    const mainAccount = {
      id: MAIN_ACCOUNT_ID,
      currency: DEFAULT_CURRENCY,
      name: bankAccount?.bankName || 'Cuenta principal',
      openingBalance: Number(bankAccount?.balance ?? balances2025.bancoDic2025),
      openingDate: bankAccount?.balanceDate || '2025-12-31',
      creditLineLimit: Number(bankAccount?.creditLineLimit || 0),
      taxReserveBalance: balances2025.ivaDic2025,
    };

    const currentCash = sumMoney(
      postedMovements.filter(
        (entry) =>
          entry.accountId === MAIN_ACCOUNT_ID && compareIsoDate(entry.postedDate, mainAccount.openingDate) > 0,
      ),
      getSignedMovementAmount,
    ) + mainAccount.openingBalance;

    const currentBalance = Math.round(currentCash * 100) / 100;
    const creditUsed = currentBalance < 0 ? Math.abs(currentBalance) : 0;
    const availableCredit = currentBalance - mainAccount.creditLineLimit;

    return {
      loading,
      allTransactions,
      bankAccount: mainAccount,
      postedMovements,
      bankMovements,
      receivables: receivableRows,
      payables: payableRows,
      budgets,
      projects,
      summary: {
        currentCash: currentBalance,
        creditUsed,
        availableCredit,
        pendingReceivables: receivableRows.reduce((sum, entry) => sum + entry.openAmount, 0),
        pendingPayables: payableRows.reduce((sum, entry) => sum + entry.openAmount, 0),
      },
    };
  }, [
    accountLoading,
    allTransactions,
    bankAccount,
    bankMovements,
    budgets,
    budgetsLoading,
    movementLoading,
    payables,
    payablesLoading,
    projects,
    projectsLoading,
    receivables,
    receivablesLoading,
    txLoading,
  ]);
};

export default useFinanceLedger;
