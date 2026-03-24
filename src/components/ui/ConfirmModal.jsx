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
      icon: 'text-[#ff453a]',
      bg: 'bg-[rgba(239,68,68,0.08)]',
      button: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    warning: {
      icon: 'text-[#ff9f0a]',
      bg: 'bg-[rgba(245,158,11,0.08)]',
      button: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1c1c1e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.08)] flex justify-between items-center">
          <h3 className="font-bold text-lg text-[#e5e5ea]">{title}</h3>
          <button onClick={handleClose} className="text-[#636366] hover:text-[#98989d] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${style.bg} flex-shrink-0`}>
              <AlertTriangle className={style.icon} size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[#c7c7cc] text-sm leading-relaxed">{message}</p>

              {details.length > 0 && (
                <div className="mt-4 space-y-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#15161a] p-3">
                  {details.map((detail) => (
                    <div key={`${detail.label}-${detail.value}`} className="flex items-center justify-between gap-3 text-[12px]">
                      <span className="text-[#8e8e93]">{detail.label}</span>
                      <span className={`text-right font-medium ${detail.emphasis ? 'text-white' : 'text-[#c7c7cc]'}`}>
                        {detail.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {warning && (
                <p className="mt-4 rounded-lg border border-[rgba(255,159,10,0.16)] bg-[rgba(255,159,10,0.08)] px-3 py-2 text-[12px] leading-relaxed text-[#ffcc80]">
                  {warning}
                </p>
              )}

              {requiresKeyword && (
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-[11px] font-medium text-[#8e8e93]">
                    {confirmKeywordLabel}: escribe <span className="text-white">{confirmKeyword}</span>
                  </span>
                  <input
                    type="text"
                    value={confirmationValue}
                    onChange={(event) => setConfirmationValue(event.target.value)}
                    placeholder={confirmKeywordPlaceholder || confirmKeyword}
                    className="w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#2c2c2e] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[rgba(255,255,255,0.16)]"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-[#2c2c2e] hover:bg-[#2c2c2e] text-[#c7c7cc] font-medium rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!keywordMatches}
              className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${style.button}`}
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
