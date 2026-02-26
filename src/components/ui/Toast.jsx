import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const styles = {
  success: 'bg-[rgba(16,185,129,0.08)] border-[rgba(16,185,129,0.25)] text-[#30d158]',
  error: 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.25)] text-[#ff453a]',
  warning: 'bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)] text-[#ff9f0a]',
  info: 'bg-[rgba(59,130,246,0.08)] border-[rgba(59,130,246,0.25)] text-[#0a84ff]'
};

const iconColors = {
  success: 'text-[#30d158]',
  error: 'text-[#ff453a]',
  warning: 'text-[#ff9f0a]',
  info: 'text-[#0a84ff]'
};

export const Toast = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slideInRight">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-[12px] border min-w-[300px] ${styles[type]}`}
        style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' }}
      >
        <Icon className={`w-5 h-5 ${iconColors[type]} flex-shrink-0`} />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#1c1c1e]/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
