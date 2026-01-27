import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency, formatDate } from './formatters';

export const exportTransactionsToPDF = (transactions, title = 'Reporte de Transacciones') => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 58, 138); // blue-800
  doc.text('UMTELKOMD', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Sistema Financiero', 14, 26);

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 40);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 48);
  doc.text(`Total de registros: ${transactions.length}`, 14, 54);

  // Calculate totals
  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'income') {
      acc.income += t.amount;
    } else {
      acc.expense += t.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  // Summary box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(14, 60, 180, 25, 'F');

  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94); // green-500
  doc.text(`Total Ingresos: ${formatCurrency(totals.income)}`, 20, 70);

  doc.setTextColor(239, 68, 68); // red-500
  doc.text(`Total Gastos: ${formatCurrency(totals.expense)}`, 80, 70);

  doc.setTextColor(30, 41, 59);
  doc.text(`Balance: ${formatCurrency(totals.income - totals.expense)}`, 140, 70);

  // Table
  const tableData = transactions.map(t => [
    formatDate(t.date),
    t.description,
    t.project || '-',
    t.category || '-',
    t.type === 'income' ? formatCurrency(t.amount) : '-',
    t.type === 'expense' ? formatCurrency(t.amount) : '-',
    t.status === 'paid' ? 'Pagado' : 'Pendiente'
  ]);

  doc.autoTable({
    startY: 90,
    head: [['Fecha', 'Descripción', 'Proyecto', 'Categoría', 'Ingreso', 'Gasto', 'Estado']],
    body: tableData,
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'center' }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const exportCXPToPDF = (transactions) => {
  const cxp = transactions.filter(t => t.type === 'expense' && t.status === 'pending');
  exportTransactionsToPDF(cxp, 'Cuentas por Pagar (CXP)');
};

export const exportCXCToPDF = (transactions) => {
  const cxc = transactions.filter(t => t.type === 'income' && t.status === 'pending');
  exportTransactionsToPDF(cxc, 'Cuentas por Cobrar (CXC)');
};

export const exportReportToPDF = (transactions, reportType = 'general') => {
  const titles = {
    general: 'Reporte General',
    monthly: 'Reporte Mensual',
    project: 'Reporte por Proyecto'
  };
  exportTransactionsToPDF(transactions, titles[reportType] || 'Reporte');
};
