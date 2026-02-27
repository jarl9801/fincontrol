// Excel Export Utility
// Genera archivos Excel-compatible (CSV con formato avanzado)

import { formatCurrency, formatDate } from './formatters';

/**
 * Exporta transacciones a CSV compatible con Excel
 */
export const exportToExcel = (transactions, filename = 'fincontrol_export') => {
  // Headers
  const headers = [
    'Fecha',
    'Tipo',
    'Categoría',
    'Proyecto',
    'Centro de Costo',
    'Descripción',
    'Monto',
    'Estado',
    'Notas'
  ];

  // Rows
  const rows = transactions.map(t => [
    formatDate(t.date),
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    t.category || '',
    t.project || '',
    t.costCenter || '',
    t.description || '',
    t.amount,
    t.status === 'paid' ? 'Pagado' : 'Pendiente',
    t.notes?.map(n => n.text).join('; ') || ''
  ]);

  // Create CSV content with BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => {
      // Escape cells with semicolons or quotes
      const cellStr = String(cell || '');
      if (cellStr.includes(';') || cellStr.includes('"')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(';'))
  ].join('\n');

  // Download
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta resumen ejecutivo
 */
export const exportSummaryToExcel = (metrics, period) => {
  const headers = ['Métrica', 'Valor'];
  const rows = [
    ['Período', period],
    ['Total Ingresos', metrics.totalIncome],
    ['Total Gastos', metrics.totalExpense],
    ['Balance', metrics.balance],
    ['Transacciones', metrics.transactionCount],
    ['Promedio por transacción', metrics.averageTransaction],
    ['CXP Pendientes', metrics.pendingCXP],
    ['CXC Pendientes', metrics.pendingCXC]
  ];

  const BOM = '\uFEFF';
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `resumen_ejecutivo_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta reporte por proyecto
 */
export const exportProjectReportToExcel = (projectsData) => {
  const headers = ['Proyecto', 'Ingresos', 'Gastos', 'Balance', 'Transacciones'];
  
  const rows = Object.entries(projectsData).map(([project, data]) => [
    project,
    data.income,
    data.expense,
    data.income - data.expense,
    data.count
  ]);

  const BOM = '\uFEFF';
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_proyectos_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
