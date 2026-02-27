import { useMemo } from 'react';
import { getDaysOverdue } from '../utils/formatters';
import { ALERT_THRESHOLDS } from '../constants/config';
import { balances2025 } from '../data/balances2025';

// Known real balances at end of 2025
const BANK_DEC2025 = balances2025.bancoDic2025;   // €28,450
const IVA_DEC2025 = balances2025.ivaDic2025;       // €7,332.94
const CXC_2025 = balances2025.totalCxC;             // €2,223.08
const CXP_2025 = balances2025.totalCxP;             // €17,016.01

export const useMetrics = (filteredTransactions) => {
  return useMemo(() => {
    // Separate 2025 and 2026 transactions
    const txn2025 = filteredTransactions.filter(t => t.source === '2025-sheet' || t.year === 2025);
    const txn2026 = filteredTransactions.filter(t => t.source === '2026-firebase' || t.year === 2026);
    const has2025 = txn2025.length > 0;
    const has2026 = txn2026.length > 0;

    // ALL income/expenses (for charts and totals)
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // COLLECTED income (paid/completed only — actual cash in)
    const collectedIncome = filteredTransactions
      .filter(t => t.type === 'income' && t.status !== 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // PAID expenses (paid/completed only — actual cash out)
    const paidExpenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.status !== 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // 2026-only income/expenses (to calculate current real balance)
    const income2026 = txn2026.filter(t => t.type === 'income' && t.status !== 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses2026 = txn2026.filter(t => t.type === 'expense' && t.status !== 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Cash balance calculation:
    // If viewing only 2025: show known bank + IVA balances
    // If viewing only 2026 or all: start from bank+IVA and add 2026 net
    let cashBalance;
    if (has2025 && !has2026) {
      // Pure 2025 view: show actual closing balances
      cashBalance = BANK_DEC2025 + IVA_DEC2025; // €35,782.94
    } else if (has2026) {
      // 2026 or mixed: bank+IVA + 2026 net flows
      cashBalance = BANK_DEC2025 + IVA_DEC2025 + income2026 - expenses2026;
    } else {
      cashBalance = collectedIncome - paidExpenses;
    }

    // Pending from Firebase 2026 transactions (include partial, use remaining amount)
    const pendingPayables2026 = txn2026
      .filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'partial'))
      .reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);
    const pendingReceivables2026 = txn2026
      .filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'partial'))
      .reduce((sum, t) => sum + (t.amount - (t.paidAmount || 0)), 0);

    // Partial payment metrics
    const partialPayables = txn2026
      .filter(t => t.type === 'expense' && t.status === 'partial')
      .reduce((sum, t) => sum + (t.paidAmount || 0), 0);
    const partialReceivables = txn2026
      .filter(t => t.type === 'income' && t.status === 'partial')
      .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

    // Include 2025 CxC/CxP when showing 2025 or all
    const pendingPayables = pendingPayables2026 + (has2025 ? CXP_2025 : 0);
    const pendingReceivables = pendingReceivables2026 + (has2025 ? CXC_2025 : 0);

    // Projected liquidity = cash + what we'll collect - what we owe
    const projectedLiquidity = cashBalance + pendingReceivables - pendingPayables;

    // Monthly trend
    const monthlyData = {};
    filteredTransactions.forEach(t => {
      if (!t.date) return;
      const month = t.date.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { month, ingresos: 0, gastos: 0 };
      }
      if (t.type === 'income') {
        monthlyData[month].ingresos += t.amount;
      } else {
        monthlyData[month].gastos += t.amount;
      }
    });
    const monthlyTrend = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Category distribution
    const categoryData = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Sin Categoría';
      if (!categoryData[cat]) {
        categoryData[cat] = 0;
      }
      categoryData[cat] += t.amount;
    });
    const categoryDistribution = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    // Project margins
    const projectData = {};
    filteredTransactions.forEach(t => {
      const pName = (t.project || 'Sin Proyecto').split(' ')[0];
      if (!projectData[pName]) {
        projectData[pName] = { name: pName, ingresos: 0, gastos: 0, margen: 0 };
      }
      if (t.type === 'income') {
        projectData[pName].ingresos += t.amount;
      } else {
        projectData[pName].gastos += t.amount;
      }
    });
    Object.values(projectData).forEach(p => {
      p.margen = ((p.ingresos - p.gastos) / p.ingresos * 100) || 0;
    });
    const projectMargins = Object.values(projectData);

    // Cash flow
    const cashFlowData = [];
    let cumulative = 0;
    const sortedByDate = [...filteredTransactions].sort((a, b) => a.date.localeCompare(b.date));
    sortedByDate.forEach(t => {
      if (t.type === 'income') {
        cumulative += t.amount;
      } else {
        cumulative -= t.amount;
      }
      cashFlowData.push({
        date: t.date,
        flujo: cumulative
      });
    });

    // Debt comparison
    const debtComparison = [
      { name: 'CXC', valor: pendingReceivables },
      { name: 'CXP', valor: pendingPayables }
    ];

    // Overdue transactions
    const overdueTransactions = filteredTransactions.filter(t =>
      (t.status === 'pending' || t.status === 'partial') && t.date && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays
    );

    const negativeProjects = projectMargins.filter(p => p.ingresos > 0 && p.gastos > p.ingresos);

    return {
      totalIncome,
      totalExpenses,
      collectedIncome,
      paidExpenses,
      cashBalance,
      projectedLiquidity,
      netBalance: totalIncome - totalExpenses,
      pendingPayables,
      pendingReceivables,
      partialPayables,
      partialReceivables,
      monthlyTrend,
      categoryDistribution,
      projectMargins,
      cashFlowData,
      debtComparison,
      overdueTransactions,
      negativeProjects,
      alerts: {
        negativeBalance: cashBalance < 0,
        highCXP: pendingPayables > ALERT_THRESHOLDS.cxpLimit,
        highCXC: pendingReceivables > ALERT_THRESHOLDS.cxcLimit,
        hasOverdue: overdueTransactions.length > 0,
        hasNegativeProjects: negativeProjects.length > 0
      }
    };
  }, [filteredTransactions]);
};
