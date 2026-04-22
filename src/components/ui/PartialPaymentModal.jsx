import { useEffect, useState, useCallback } from 'react';
import { X, Loader2, DollarSign } from 'lucide-react';
import { formatCurrency, safe, MONEY_TOLERANCE } from '../../utils/formatters';

const PartialPaymentModalInner = ({ transaction, onClose, onSubmit }) => {
 const [submitting, setSubmitting] = useState(false);
 const paidAmount = transaction.paidAmount || 0;
 const remaining = transaction.amount - paidAmount;

 const getDefaultFormData = useCallback(() => ({
 amount: '',
 date: new Date().toISOString().split('T')[0],
 method: 'Transferencia',
 note: ''
 }), []);

 const [formData, setFormData] = useState(getDefaultFormData);

 // Reset form when transaction changes — FIX: was direct setState in render
 useEffect(() => {
 setFormData(getDefaultFormData());
 }, [transaction.id, getDefaultFormData]);

 useEffect(() => {
 const handleKeyDown = (event) => {
 if (event.key === 'Escape') {
 onClose();
 }
 };

 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [onClose]);

 const setQuickAmount = (pct) => {
 setFormData({ ...formData, amount: (remaining * pct).toFixed(2) });
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 const amount = parseFloat(formData.amount);
 if (!amount || amount <= 0) return;
 if (amount > remaining + MONEY_TOLERANCE) {
 // Validation: amount exceeds remaining balance
 return;
 }
 setSubmitting(true);
 try {
 await onSubmit(transaction, {
 amount,
 date: formData.date,
 method: formData.method,
 note: formData.note
 });
 onClose();
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--surface)] p-4 animate-fadeIn" role="dialog" aria-modal="true">
 <div className="w-full max-w-md overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] animate-scaleIn">
 <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
 <div>
 <h3 className="text-xl font-bold text-[var(--text-primary)]">
 {transaction.type === 'income' ? 'Registrar cobro' : 'Registrar pago'}
 </h3>
 <p className="mt-0.5 max-w-[280px] truncate text-sm text-[var(--text-secondary)]">{safe(transaction.description)}</p>
 </div>
 <button
 type="button"
 aria-label="Cerrar registro de pago"
 onClick={onClose}
 className="rounded-md p-2 text-[var(--text-secondary)] transition-all hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
 >
 <X size={20} />
 </button>
 </div>

 <div className="px-6 pt-5 pb-3 grid grid-cols-3 gap-3">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
 <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--text-disabled)]">Total</p>
 <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(transaction.amount)}</p>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
 <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--text-disabled)]">Pagado</p>
 <p className="text-sm font-bold text-[var(--success)]">{formatCurrency(paidAmount)}</p>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3 text-center">
 <p className="mb-1 text-[10px] font-semibold uppercase text-[var(--text-disabled)]">Restante</p>
 <p className="text-sm font-bold text-[var(--warning)]">{formatCurrency(remaining)}</p>
 </div>
 </div>

 <div className="px-6 pb-4">
 <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
 <div
 className="h-full rounded-full bg-[var(--success)] transition-all duration-500"
 style={{ width: `${Math.min((paidAmount / transaction.amount) * 100, 100)}%` }}
 />
 </div>
 <p className="mt-1 text-right text-[10px] text-[var(--text-secondary)]">
 {(transaction.amount > 0 ? (paidAmount / transaction.amount) * 100 : 0).toFixed(0)}% pagado
 </p>
 </div>

 <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
 Monto del pago <span className="text-[var(--accent)]">*</span>
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-[var(--text-secondary)]">€</span>
 <input
 type="number"
 step="0.01"
 min="0.01"
 max={remaining}
 required
 placeholder="0.00"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-3 pl-8 pr-4 text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)] focus:"
 value={formData.amount}
 onChange={e => setFormData({ ...formData, amount: e.target.value })}
 />
 </div>
 <div className="flex gap-2 mt-2">
 {[
 { label: '25%', pct: 0.25 },
 { label: '50%', pct: 0.5 },
 { label: '100%', pct: 1 }
 ].map(({ label, pct }) => (
 <button
 key={label}
 type="button"
 onClick={() => setQuickAmount(pct)}
 className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
 >
 {label}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Fecha</label>
 <input
 type="date"
 required
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)] focus:"
 value={formData.date}
 onChange={e => setFormData({ ...formData, date: e.target.value })}
 />
 </div>
 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Método</label>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)] focus:"
 value={formData.method}
 onChange={e => setFormData({ ...formData, method: e.target.value })}
 >
 <option value="Transferencia">Transferencia</option>
 <option value="Efectivo">Efectivo</option>
 <option value="Tarjeta">Tarjeta</option>
 </select>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Nota (opcional)</label>
 <input
 type="text"
 placeholder="ej. Pago parcial factura #123"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)] focus:"
 value={formData.note}
 onChange={e => setFormData({ ...formData, note: e.target.value })}
 />
 </div>

 <button
 type="submit"
 disabled={submitting}
 className={`flex w-full items-center justify-center gap-2 rounded-md bg-[var(--text-primary)] py-4 font-bold text-[var(--black)] transition-all duration-200 ${submitting ? 'cursor-not-allowed opacity-50' : 'hover:opacity-85 hover:'}`}
 >
 {submitting ? <Loader2 size={18} className="animate-spin" /> : <DollarSign size={18} />}
 {submitting ? 'Registrando...' : transaction.type === 'income' ? 'Registrar cobro' : 'Registrar pago'}
 </button>
 </form>
 </div>
 </div>
 );
};

const PartialPaymentModal = ({ isOpen, onClose, transaction, onSubmit }) => {
 if (!isOpen || !transaction) return null;
 return <PartialPaymentModalInner transaction={transaction} onClose={onClose} onSubmit={onSubmit} />;
};

export default PartialPaymentModal;
