import { CheckCircle2, Circle, MessageSquare, Edit2, Trash2, Sparkles } from 'lucide-react';
import { formatDate, formatCurrency, getDaysOverdue } from '../../utils/formatters';
import { ALERT_THRESHOLDS } from '../../constants/config';

const TransactionRow = ({ t, onToggleStatus, onDelete, onEdit, onViewNotes, userRole, searchTerm }) => {
  const isOverdue = t.status === 'pending' && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays;

  // Verificar si tiene actualizaciones no leídas
  const isNew = t.hasUnreadUpdates === true;

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ?
        <mark key={i} className="bg-yellow-200">{part}</mark> : part
    );
  };

  const commentCount = t.notes?.filter(n => n.type === 'comment').length || 0;

  return (
    <tr className={`
      transition-all border-b border-slate-100 last:border-0
      ${isOverdue ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}
      ${isNew ? 'animate-new-transaction' : ''}
    `}>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDate(t.date)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-800">{highlightText(t.description)}</span>
            {isNew && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm animate-pulse">
                <Sparkles size={10} />
                Nueva
              </span>
            )}
            {commentCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {commentCount}
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{t.project}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">{t.category}</td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleStatus(t)}
          disabled={userRole === 'editor'}
          className={`flex items-center justify-center w-full gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
            t.status === 'paid'
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          } ${userRole === 'editor' ? 'opacity-50 cursor-not-allowed' : ''} ${isOverdue ? 'ring-2 ring-rose-400' : ''}`}
        >
          {t.status === 'paid' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
          {t.status === 'paid' ? 'Pagado' : isOverdue ? `Vencido (${getDaysOverdue(t.date)}d)` : 'Pendiente'}
        </button>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onViewNotes(t)}
            className={`transition-colors ${isNew ? 'text-blue-500 hover:text-blue-700' : 'text-slate-400 hover:text-blue-500'}`}
            title="Ver notas"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={() => onEdit(t)}
            className={`transition-colors ${isNew ? 'text-blue-500 hover:text-blue-700' : 'text-slate-400 hover:text-blue-500'}`}
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => onDelete(t)}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TransactionRow;
