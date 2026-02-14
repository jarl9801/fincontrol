import { useMemo } from 'react';
import { getDaysOverdue } from '../utils/formatters';
import { ALERT_THRESHOLDS } from '../constants/config';

export const useMetrics = (filteredTransactions) => {
  return useMemo(() => {
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

    // Actual cash balance
    const cashBalance = collectedIncome - paidExpenses;

    const pendingPayables = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingReceivables = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    // Projected liquidity = cash + what we'll collect - what we owe
    const projectedLiquidity = cashBalance + pendingReceivables - pendingPayables;

    // Monthly trend
    const monthlyData = {};
    filteredTransactions.forEach(t => {
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
      if (!categoryData[t.category]) {
        categoryData[t.category] = 0;
      }
      categoryData[t.category] += t.amount;
    });
    const categoryDistribution = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

    // Project margins
    const projectData = {};
    filteredTransactions.forEach(t => {
      const pName = t.project.split(' ')[0];
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
      t.status === 'pending' && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays
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
