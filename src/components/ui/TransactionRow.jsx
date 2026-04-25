import {
 ArrowDownCircle,
 ArrowUpCircle,
 Edit2,
 History,
 MessageSquare,
 RefreshCw,
 Trash2,
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysOverdue } from '../../utils/formatters';
import { ALERT_THRESHOLDS } from '../../constants/config';
import { Badge } from '@/components/ui/nexus';

const safe = (value) => (value == null ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value));

const TransactionRow = ({ t, onDelete, onEdit, onViewNotes, onRegisterPayment, onVoid, onChangeStatus, onViewAuditTrail, onViewDetail, userRole, searchTerm }) => {
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
 ? <mark key={index} className="bg-transparent text-[var(--text-display)] font-medium">{part}</mark>
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

 const getStatus = () => {
 if (normalizedStatus === 'paid') return { variant: 'ok', text: t.statusLabel || 'Liquidado' };
 if (normalizedStatus === 'partial') return { variant: 'warn', text: t.statusLabel || 'Parcial' };
 if (normalizedStatus === 'cancelled' || normalizedStatus === 'void') return { variant: 'neutral', text: t.statusLabel || 'Anulado' };
 if (isOverdue) return { variant: 'err', text: t.statusLabel || 'Vencida' };
 return { variant: 'warn', text: t.statusLabel || 'Emitida' };
 };

 const status = getStatus();
 const canRegisterPayment = Boolean(t.canRegisterPayment && onRegisterPayment);
 const canViewNotes = Boolean(t.canViewNotes && onViewNotes);
 const canEdit = Boolean(t.canEdit && onEdit && userRole === 'admin');
 const canDelete = Boolean(t.canDelete && onDelete && userRole === 'admin');
 const canVoid = Boolean(t.canVoid && onVoid && userRole === 'admin');
 const canChangeStatus = Boolean(t.canChangeStatus && onChangeStatus && userRole === 'admin');
 const canViewAuditTrail = Boolean(onViewAuditTrail && userRole === 'admin');

 return (
 <tr
 className={`group border-b border-[var(--border)] transition-colors last:border-0 cursor-pointer ${
 isOverdue ? 'border-l-2 border-l-[var(--accent)]' : ''
 } hover:bg-[var(--surface-raised)]`}
 onClick={() => onViewDetail?.(t)}
 >
 {/* Date */}
 <td className="px-4 py-3.5 whitespace-nowrap">
 <span className="nd-mono text-[13px] tabular-nums text-[var(--text-primary)]">{formatDate(t.date)}</span>
 <span className="block nd-mono text-[10px] uppercase tracking-[0.08em] text-[var(--text-disabled)] mt-0.5">{t.recordFamilyLabel}</span>
 </td>

 {/* Description */}
 <td className="px-4 py-3.5">
 <div className="flex items-start gap-2.5">
 {isIncome ? (
 <ArrowUpCircle size={14} className="flex-shrink-0 mt-0.5 text-[var(--text-secondary)]" />
 ) : (
 <ArrowDownCircle size={14} className="flex-shrink-0 mt-0.5 text-[var(--text-secondary)]" />
 )}

 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-1.5">
 {isNew && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--text-display)]" />}
 <span className="text-[13px] text-[var(--text-primary)]">{highlightText(t.description)}</span>

 <span className="nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--border-visible)] rounded-sm px-1.5 py-0.5 text-[var(--text-disabled)]">
 {t.sourceLabel}
 </span>

 {isNew && (
 <span className="nd-mono text-[10px] uppercase tracking-[0.06em] text-[var(--text-display)]">
 [NEW]
 </span>
 )}

 {t.isRecurring && (
 <span className="inline-flex items-center gap-1 nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--border)] rounded-sm px-1.5 py-0.5 text-[var(--text-disabled)]">
 <RefreshCw size={9} />
 Rec
 </span>
 )}

 {commentCount > 0 && (
 <span className="inline-flex items-center gap-1 nd-mono text-[10px] text-[var(--text-disabled)]">
 <MessageSquare size={10} />
 {commentCount}
 </span>
 )}
 </div>

 <div className="mt-1 flex flex-wrap items-center gap-1.5">
 <span className="text-[11px] text-[var(--text-disabled)]">{safe(t.project || t.secondaryMeta)}</span>
 {t.costCenter ? (
 <span className="nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--border)] rounded-sm px-1.5 py-0.5 text-[var(--text-disabled)]">
 {safe(t.costCenter)}
 </span>
 ) : (t.type === 'expense' || t.type === 'income') && (
 <span className="nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--warning)] rounded-sm px-1.5 py-0.5 text-[var(--warning)]">
 Sin CC
 </span>
 )}
 {t.documentNumber && (
 <span className="nd-mono text-[10px] tracking-[0.04em] border border-[var(--border)] rounded-sm px-1.5 py-0.5 text-[var(--text-disabled)]">
 {t.documentNumber}
 </span>
 )}
 </div>

 {isPartial && (
 <div className="mt-1.5 max-w-[160px]">
 <div className="flex gap-[2px]">
 {Array.from({ length: 10 }).map((_, i) => (
 <div
 key={i}
 className="flex-1 h-[4px]"
 style={{ background: i < Math.round(paidPct / 10) ? 'var(--success)' : 'var(--border)' }}
 />
 ))}
 </div>
 <span className="nd-mono text-[10px] text-[var(--text-disabled)] mt-0.5 block">
 {formatCurrency(paidAmount)} / {formatCurrency(t.amount)}
 </span>
 </div>
 )}
 </div>
 </div>
 </td>

 {/* Category */}
 <td className="px-4 py-3.5">
 <span className="nd-label border border-[var(--border-visible)] rounded-sm px-2 py-1 text-[var(--text-secondary)]">
 {safe(t.categoryLabel || t.category)}
 </span>
 </td>

 {/* Amount */}
 <td className="px-4 py-3.5 text-right whitespace-nowrap">
 <span className="nd-mono text-[14px] tabular-nums text-[var(--text-primary)]">
 {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
 </span>
 </td>

 {/* Status */}
 <td className="px-4 py-3.5 text-center">
 <Badge variant={status.variant} dot>{status.text}</Badge>
 </td>

 {/* Actions */}
 <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
 {canRegisterPayment && (
 <button
 onClick={() => onRegisterPayment(t)}
 className="nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--border-visible)] rounded-full px-2.5 py-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-display)] hover:border-[var(--text-display)]"
 title={t.paymentActionLabel || 'Abono'}
 >
 {t.paymentActionLabel || 'Abono'}
 </button>
 )}

 {canChangeStatus && (
 <button
 onClick={() => onChangeStatus(t)}
 className="nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--border-visible)] rounded-full px-2.5 py-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-display)] hover:border-[var(--text-display)]"
 title="Cambiar estado"
 >
 Estado
 </button>
 )}

 {canViewNotes && (
 <button
 onClick={() => onViewNotes(t)}
 className="p-1.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-primary)]"
 title="Notas"
 >
 <MessageSquare size={14} />
 </button>
 )}

 {canEdit && (
 <button
 onClick={() => onEdit(t)}
 className="p-1.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-primary)]"
 title="Editar"
 >
 <Edit2 size={14} />
 </button>
 )}

 {canViewAuditTrail && (
 <button
 onClick={() => onViewAuditTrail(t)}
 className="p-1.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-primary)]"
 title="Trazabilidad"
 >
 <History size={14} />
 </button>
 )}

 {canVoid && (
 <button
 onClick={() => onVoid(t)}
 className="nd-mono text-[10px] uppercase tracking-[0.06em] border border-[var(--error)] rounded-full px-2.5 py-1.5 text-[var(--error)] transition-colors hover:text-[var(--text-display)] hover:border-[var(--text-display)]"
 title={t.voidActionLabel || 'Anular'}
 >
 {t.voidActionLabel || 'Anular'}
 </button>
 )}

 {canDelete && (
 <button
 onClick={() => onDelete(t)}
 className="p-1.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--accent)]"
 title="Eliminar"
 >
 <Trash2 size={14} />
 </button>
 )}
 </div>
 </td>
 </tr>
 );
};

export default TransactionRow;
