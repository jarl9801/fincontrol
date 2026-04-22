import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({
 isOpen,
 onClose,
 onConfirm,
 title,
 message,
 confirmText = 'Eliminar',
 cancelText = 'Cancelar',
 variant = 'danger',
 details = [],
 confirmKeyword = '',
 confirmKeywordLabel = 'Confirmación',
 confirmKeywordPlaceholder = '',
 warning = '',
}) => {
 const [confirmationValue, setConfirmationValue] = useState('');

 if (!isOpen) return null;

 const requiresKeyword = Boolean(confirmKeyword);
 const keywordMatches = !requiresKeyword || confirmationValue.trim().toUpperCase() === confirmKeyword.trim().toUpperCase();

 const handleClose = () => {
 setConfirmationValue('');
 onClose();
 };

 const handleConfirm = async () => {
 if (!keywordMatches) return;
 const shouldClose = await onConfirm();
 if (shouldClose !== false) {
 handleClose();
 }
 };

 const variantStyles = {
 danger: {
 icon: 'text-[var(--accent)]',
 button: 'border border-[var(--accent)] text-[var(--accent)] hover:bg-transparent'
 },
 warning: {
 icon: 'text-[var(--warning)]',
 button: 'border border-[var(--warning)] text-[var(--warning)] hover:bg-transparent'
 }
 };

 const style = variantStyles[variant] || variantStyles.danger;

 return (
 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" role="dialog" aria-modal="true">
 <div className="bg-[var(--surface)] border border-[var(--border-visible)] rounded-md w-full max-w-md overflow-hidden animate-scaleIn">
 <div className="px-6 py-4 border-b border-[var(--border)] flex justify-between items-center">
 <h3 className="nd-mono text-[13px] uppercase tracking-[0.06em] text-[var(--text-primary)]">{title}</h3>
 <button onClick={handleClose} className="text-[var(--text-disabled)] hover:text-[var(--text-secondary)] transition-colors" aria-label="Cerrar">
 <X size={20} />
 </button>
 </div>

 <div className="p-6">
 <div className="flex items-start gap-4">
 <div className="flex-shrink-0">
 <AlertTriangle className={style.icon} size={24} />
 </div>
 <div className="flex-1">
 <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{message}</p>

 {details.length > 0 && (
 <div className="mt-4 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
 {details.map((detail) => (
 <div key={`${detail.label}-${detail.value}`} className="flex items-center justify-between gap-3 text-[12px]">
 <span className="nd-label text-[var(--text-disabled)]">{detail.label}</span>
 <span className={`text-right nd-mono ${detail.emphasis ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
 {detail.value}
 </span>
 </div>
 ))}
 </div>
 )}

 {warning && (
 <p className="mt-4 rounded-lg border border-[var(--warning)] px-3 py-2 text-[12px] leading-relaxed text-[var(--warning)]">
 {warning}
 </p>
 )}

 {requiresKeyword && (
 <label className="mt-4 block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">
 {confirmKeywordLabel}: escribe <span className="text-[var(--text-primary)]">{confirmKeyword}</span>
 </span>
 <input
 type="text"
 value={confirmationValue}
 onChange={(event) => setConfirmationValue(event.target.value)}
 placeholder={confirmKeywordPlaceholder || confirmKeyword}
 className="w-full rounded-lg border border-[var(--border-visible)] bg-transparent px-3 py-2.5 text-sm nd-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)]"
 />
 </label>
 )}
 </div>
 </div>

 <div className="flex gap-3 mt-6">
 <button
 onClick={handleClose}
 className="flex-1 px-4 py-2.5 border border-[var(--border-visible)] text-[var(--text-secondary)] nd-mono text-[13px] uppercase tracking-[0.06em] rounded-full transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
 >
 {cancelText}
 </button>
 <button
 onClick={handleConfirm}
 disabled={!keywordMatches}
 className={`flex-1 px-4 py-2.5 nd-mono text-[13px] uppercase tracking-[0.06em] rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${style.button}`}
 >
 {confirmText}
 </button>
 </div>
 </div>
 </div>
 </div>
 );
};

export default ConfirmModal;
