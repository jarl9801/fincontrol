import { CheckCircle2, Circle, MessageSquare, Edit2, Trash2, Sparkles, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatDate, formatCurrency, getDaysOverdue } from '../../utils/formatters';
import { ALERT_THRESHOLDS } from '../../constants/config';

const TransactionRow = ({ t, onToggleStatus, onDelete, onEdit, onViewNotes, userRole, searchTerm }) => {
  const isOverdue = t.status === 'pending' && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays;
  const isNew = t.hasUnreadUpdates === true;
  const isIncome = t.type === 'income';
  const daysOverdue = getDaysOverdue(t.date);

  const highlightText = (text) => {
    if (!searchTerm) return text;
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ?
        <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark> : part
    );
  };

  const commentCount = t.notes?.filter(n => n.type === 'comment').length || 0;

  // Status badge config
  const getStatusConfig = () => {
    if (t.status === 'paid') {
      return {
        icon: CheckCircle2,
        text: 'Pagado',
        class: 'bg-emerald-100 text-emerald-700 border-emerald-200'
      };
    }
    if (isOverdue) {
      return {
        icon: Circle,
        text: `Vencido (${daysOverdue}d)`,
        class: 'bg-rose-100 text-rose-700 border-rose-200 ring-2 ring-rose-200'
      };
    }
    return {
      icon: Circle,
      text: 'Pendiente',
      class: 'bg-amber-100 text-amber-700 border-amber-200'
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <tr className={`
      group transition-all duration-200 border-b border-slate-100 last:border-0
      ${isOverdue ? 'bg-rose-50/50' : 'hover:bg-slate-50/80'}
      ${isNew ? 'animate-pulse-glow' : ''}
    `}>
      {/* Fecha */}
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700">{formatDate(t.date)}</span>
          {isOverdue && (
            <span className="text-[10px] text-rose-500 font-medium">Vencido</span>
          )}
        </div>
      </td>

      {/* Descripción */}
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Type Icon */}
          <div className={`
            w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
            ${isIncome ? 'bg-emerald-100' : 'bg-rose-100'}
          `}>
            {isIncome ? (
              <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <ArrowDownCircle className="w-5 h-5 text-rose-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">
                {highlightText(t.description)}
              </span>
              
              {/* New Badge */}
              {isNew && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white shadow-sm">
                  <Sparkles size={10} />
                  Nueva
                </span>
              )}
              
              {/* Comments Badge */}
              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">
                  <MessageSquare size={10} />
                  {commentCount}
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 block mt-0.5">{t.project}</span>
          </div>
        </div>
      </td>

      {/* Categoría */}
      <td className="px-4 py-4 hidden md:table-cell">
        <span className={`
          inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium
          ${isIncome 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
            : 'bg-rose-50 text-rose-700 border border-rose-100'}
        `}>
          {t.category}
        </span>
      </td>

      {/* Monto */}
      <td className="px-4 py-4 text-right whitespace-nowrap">
        <span className={`text-sm font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      </td>

      {/* Estado */}
      <td className="px-4 py-4 text-center">
        <button
          onClick={() => onToggleStatus(t)}
          disabled={userRole === 'editor'}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            border transition-all duration-200
            ${statusConfig.class}
            ${userRole === 'editor' ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
          `}
        >
          <StatusIcon size={14} />
          {statusConfig.text}
        </button>
      </td>

      {/* Acciones */}
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onViewNotes(t)}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isNew 
                ? 'text-blue-500 hover:bg-blue-50' 
                : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}
            `}
            title="Ver notas"
          >
            <MessageSquare size={16} />
          </button>
          <button
            onClick={() => onEdit(t)}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${isNew 
                ? 'text-blue-500 hover:bg-blue-50' 
                : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}
            `}
            title="Editar"
          >
            <Edit2 size={16} />
          </button>
          {userRole === 'admin' && (
            <button
              onClick={() => onDelete(t)}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all duration-200"
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
