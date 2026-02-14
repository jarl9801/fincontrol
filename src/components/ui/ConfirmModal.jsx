import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Eliminar', cancelText = 'Cancelar', variant = 'danger' }) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const variantStyles = {
    danger: {
      icon: 'text-[#f87171]',
      bg: 'bg-[rgba(239,68,68,0.08)]',
      button: 'bg-rose-600 hover:bg-rose-700 text-white'
    },
    warning: {
      icon: 'text-[#fbbf24]',
      bg: 'bg-[rgba(245,158,11,0.08)]',
      button: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
        <div className="px-6 py-4 border-b border-[#2a2a4a] flex justify-between items-center">
          <h3 className="font-bold text-lg text-[#d0d0e0]">{title}</h3>
          <button onClick={onClose} className="text-[#6868a0] hover:text-[#9898b8] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${style.bg} flex-shrink-0`}>
              <AlertTriangle className={style.icon} size={24} />
            </div>
            <div className="flex-1">
              <p className="text-[#b8b8d0] text-sm leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#1e1e38] hover:bg-[#252540] text-[#b8b8d0] font-medium rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 font-medium rounded-lg transition-colors ${style.button}`}
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
