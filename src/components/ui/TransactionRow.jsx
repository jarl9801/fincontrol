import {
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  Edit2,
  History,
  MessageSquare,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime, getDaysOverdue } from '../../utils/formatters';
import { ALERT_THRESHOLDS } from '../../constants/config';

const safe = (value) => (value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value));

const TransactionRow = ({ t, onDelete, onEdit, onViewNotes, onRegisterPayment, onVoid, onChangeStatus, onViewAuditTrail, userRole, searchTerm }) => {
  const normalizedStatus = safe(t.status).toLowerCase();
  const isOverdue = normalizedStatus === 'overdue' || (normalizedStatus === 'pending' && getDaysOverdue(t.date) > ALERT_THRESHOLDS.overdueDays);
  const isNew = t.hasUnreadUpdates === true;
  const isIncome = t.type === 'income';
  const daysOverdue = getDaysOverdue(t.date);

  const highlightText = (text) => {
    const str = safe(text);
    if (!searchTerm) return str;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = str.split(new RegExp(`(${escaped})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase()
        ? <mark key={index} className="rounded px-0.5 text-[#b35b15] bg-[rgba(255,215,153,0.55)]">{part}</mark>
        : part,
    );
  };

  const commentCount = Array.isArray(t.notes) ? t.notes.filter((note) => note.type === 'comment').length : 0;
  const hasRecentComments = Array.isArray(t.notes) && t.notes.some((note) => {
    if (note.type !== 'comment') return false;
    const noteDate = new Date(note.timestamp);
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    return noteDate >= oneDayAgo;
  });

  const isPartial = normalizedStatus === 'partial';
  const paidAmount = Number(t.paidAmount) || 0;
  const paidPct = Number(t.amount) > 0 ? (paidAmount / Number(t.amount)) * 100 : 0;
  const lastEditedLabel = t.lastEditedAt ? formatDateTime(t.lastEditedAt) : '';

  const getStatusConfig = () => {
    if (normalizedStatus === 'paid') {
      return {
        icon: CheckCircle2,
        text: t.statusLabel || 'Liquidado',
        class: 'bg-[rgba(208,244,220,0.72)] text-[#0f8f4b] border-[rgba(48,165,105,0.25)]',
      };
    }

    if (normalizedStatus === 'partial') {
      return {
        icon: Circle,
        text: t.statusLabel || 'Parcial',
        class: 'bg-[rgba(255,239,209,0.82)] text-[#d46a13] border-[rgba(212,106,19,0.18)]',
      };
    }

    if (normalizedStatus === 'cancelled' || normalizedStatus === 'void') {
      return {
        icon: Circle,
        text: t.statusLabel || 'Anulado',
        class: 'bg-[rgba(236,239,245,0.88)] text-[#6f7d96] border-[rgba(177,188,208,0.36)]',
      };
    }

    if (isOverdue) {
      return {
        icon: Circle,
        text: t.statusLabel || `Vencido (${daysOverdue}d)`,
        class: 'bg-[rgba(255,234,231,0.9)] text-[#cc4b3f] border-[rgba(204,75,63,0.18)] ring-1 ring-[rgba(204,75,63,0.12)]',
      };
    }

    return {
      icon: Circle,
      text: t.statusLabel || 'Pendiente',
      class: 'bg-[rgba(255,244,223,0.88)] text-[#c47a09] border-[rgba(196,122,9,0.16)]',
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const canRegisterPayment = Boolean(t.canRegisterPayment && onRegisterPayment);
  const canViewNotes = Boolean(t.canViewNotes && onViewNotes);
  const canEdit = Boolean(t.canEdit && onEdit && userRole === 'admin');
  const canDelete = Boolean(t.canDelete && onDelete && userRole === 'admin');
  const canVoid = Boolean(t.canVoid && onVoid && userRole === 'admin');
  const canChangeStatus = Boolean(t.canChangeStatus && onChangeStatus && userRole === 'admin');
  const canViewAuditTrail = Boolean(onViewAuditTrail && userRole === 'admin');

  return (
    <tr
      className={`
        group border-b border-[rgba(201,214,238,0.58)] transition-all duration-200 last:border-0
        ${isOverdue ? 'bg-[rgba(255,236,234,0.72)]' : 'hover:bg-[rgba(90,141,221,0.05)]'}
        ${isNew ? 'animate-pulse-glow' : ''}
      `}
    >
      <td className="px-4 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-[#243251]">{formatDate(t.date)}</span>
          <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#7b8cab]">{t.recordFamilyLabel}</span>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`
              flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl
              ${isIncome ? 'bg-[rgba(208,244,220,0.78)]' : 'bg-[rgba(255,234,231,0.82)]'}
            `}
          >
            {isIncome ? (
              <ArrowUpCircle className="h-4 w-4 text-[#0f8f4b]" />
            ) : (
              <ArrowDownCircle className="h-4 w-4 text-[#cc4b3f]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isNew && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#00C853]" />}
              <span className="text-[13px] font-semibold text-[#101938]">{highlightText(t.description)}</span>

              <span className="inline-flex items-center rounded-full border border-[rgba(201,214,238,0.76)] bg-white/76 px-2 py-0.5 text-[10px] font-medium text-[#6b7a96]">
                {t.sourceLabel}
              </span>

              {isNew && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#daf7e5] px-2 py-0.5 text-[10px] font-bold text-[#0f8f4b] shadow-sm">
                  Nueva
                </span>
              )}

              {t.isRecurring && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(210,214,246,0.8)] bg-[rgba(239,240,255,0.88)] px-2 py-0.5 text-[10px] font-medium text-[#6662cc]">
                  <RefreshCw size={10} />
                  Recurrente
                </span>
              )}

              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(255,239,209,0.88)] px-2 py-0.5 text-[10px] font-medium text-[#c47a09]">
                  <MessageSquare size={10} />
                  {commentCount}
                </span>
              )}

              {hasRecentComments && (
                <span className="text-[#8da0c2]" title="Comentario reciente">
                  <MessageSquare size={12} className="fill-[rgba(141,160,194,0.18)]" />
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#6b7a96]">
              <span>{safe(t.project || t.secondaryMeta)}</span>
              {t.costCenter && (
                <span className="rounded-full border border-[rgba(201,214,238,0.68)] bg-white/72 px-2 py-0.5 text-[10px] text-[#7b8cab]" title="Centro de costo">
                  {safe(t.costCenter)}
                </span>
              )}
              {t.documentNumber && (
                <span className="rounded-full border border-[rgba(201,214,238,0.68)] bg-white/72 px-2 py-0.5 text-[10px] text-[#7b8cab]">
                  {t.documentNumber}
                </span>
              )}
            </div>

            {isPartial && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-[rgba(183,195,220,0.38)]">
                  <div className="h-full rounded-full bg-[#0f8f4b] transition-all" style={{ width: `${paidPct}%` }} />
                </div>
                <span className="mt-0.5 block text-[10px] text-[#7b8cab]">
                  Pagado: {formatCurrency(paidAmount)} / {formatCurrency(t.amount)}
                </span>
              </div>
            )}
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <span
          className={`
            inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-medium
            ${isIncome
              ? 'border-[rgba(48,165,105,0.18)] bg-[rgba(208,244,220,0.72)] text-[#0f8f4b]'
              : 'border-[rgba(204,75,63,0.16)] bg-[rgba(255,234,231,0.78)] text-[#cc4b3f]'}
          `}
        >
          {safe(t.categoryLabel || t.category)}
        </span>
      </td>

      <td className="px-4 py-4 text-right whitespace-nowrap">
        <span className={`text-[13px] font-bold ${isIncome ? 'text-[#0f8f4b]' : 'text-[#cc4b3f]'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
        </span>
      </td>

      <td className="px-4 py-4 text-center">
        <span
          className={`
            inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium
            ${statusConfig.class}
          `}
        >
          <StatusIcon size={14} />
          {statusConfig.text}
        </span>
      </td>

      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-1 opacity-50 transition-opacity group-hover:opacity-100">
          {canRegisterPayment && (
            <button
              onClick={() => onRegisterPayment(t)}
              className="rounded-lg border border-[rgba(48,165,105,0.18)] bg-[rgba(208,244,220,0.72)] px-2.5 py-1.5 text-[11px] font-semibold text-[#0f8f4b] transition-all duration-200 hover:bg-[rgba(208,244,220,0.96)]"
              title={t.paymentActionLabel || 'Abono'}
            >
              {t.paymentActionLabel || 'Abono'}
            </button>
          )}

          {canChangeStatus && (
            <button
              onClick={() => onChangeStatus(t)}
              className="rounded-lg border border-[rgba(90,141,221,0.22)] bg-[rgba(233,240,254,0.78)] px-2.5 py-1.5 text-[11px] font-semibold text-[#3156d3] transition-all duration-200 hover:bg-[rgba(233,240,254,0.96)]"
              title="Cambiar estado de la transacción"
            >
              <ArrowRightLeft size={14} className="inline mr-1" />
              Estado
            </button>
          )}

          {canViewNotes && (
            <button
              onClick={() => onViewNotes(t)}
              className={`
                rounded-lg p-2 transition-all duration-200
                ${isNew
                  ? 'text-[#0f8f4b] hover:bg-[rgba(208,244,220,0.7)]'
                  : 'text-[#7b8cab] hover:bg-[rgba(90,141,221,0.08)] hover:text-[#0f8f4b]'}
              `}
              title="Ver notas"
            >
              <MessageSquare size={16} />
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => onEdit(t)}
              className={`
                rounded-lg p-2 transition-all duration-200
                ${isNew
                  ? 'text-[#3156d3] hover:bg-[rgba(90,141,221,0.08)]'
                  : 'text-[#7b8cab] hover:bg-[rgba(90,141,221,0.08)] hover:text-[#3156d3]'}
              `}
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
          )}

          {canViewAuditTrail && (
            <button
              onClick={() => onViewAuditTrail(t)}
              className="rounded-lg p-2 text-[#7b8cab] transition-all duration-200 hover:bg-[rgba(90,141,221,0.08)] hover:text-[#3156d3]"
              title="Ver trazabilidad"
            >
              <History size={16} />
            </button>
          )}

          {canVoid && (
            <button
              onClick={() => onVoid(t)}
              className="rounded-lg border border-[rgba(204,75,63,0.16)] bg-[rgba(255,234,231,0.64)] px-2.5 py-1.5 text-[11px] font-semibold text-[#cc4b3f] transition-all duration-200 hover:bg-[rgba(255,234,231,0.92)]"
              title={t.voidActionLabel || 'Anular'}
            >
              {t.voidActionLabel || 'Anular'}
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => onDelete(t)}
              className="rounded-lg p-2 text-[#7b8cab] transition-all duration-200 hover:bg-[rgba(255,234,231,0.82)] hover:text-[#cc4b3f]"
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
