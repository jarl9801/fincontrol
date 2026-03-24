import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit3, ExternalLink, FileText, History, Plus, Trash2, User, X } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportAuditTrailToPDF } from '../../utils/pdfExport';

const ACTION_STYLES = {
  create: { color: 'text-[#0f8f4b]', bg: 'bg-[rgba(208,244,220,0.72)]', label: 'Creación', icon: Plus },
  update: { color: 'text-[#3156d3]', bg: 'bg-[rgba(90,141,221,0.12)]', label: 'Edición', icon: Edit3 },
  delete: { color: 'text-[#cc4b3f]', bg: 'bg-[rgba(255,234,231,0.88)]', label: 'Eliminación', icon: Trash2 },
  payment: { color: 'text-[#c47a09]', bg: 'bg-[rgba(255,239,209,0.88)]', label: 'Pago', icon: FileText },
  status_change: { color: 'text-[#6662cc]', bg: 'bg-[rgba(239,240,255,0.88)]', label: 'Cambio de estado', icon: Edit3 },
  cancel: { color: 'text-[#d46a13]', bg: 'bg-[rgba(255,239,209,0.88)]', label: 'Cancelación', icon: Trash2 },
  void: { color: 'text-[#cc4b3f]', bg: 'bg-[rgba(255,234,231,0.88)]', label: 'Anulación', icon: Trash2 },
};

const ENTITY_TYPE_BY_FAMILY = {
  legacy: 'transaction',
  movement: 'bankMovement',
  receivable: 'receivable',
  payable: 'payable',
};

const safeString = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const toIso = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const buildEmbeddedEntries = (record) => {
  const trail = Array.isArray(record?.rawRecord?.auditTrail) ? record.rawRecord.auditTrail : [];
  return trail.map((entry, index) => ({
    id: `embedded-${record.id}-${index}`,
    action: entry.action || 'update',
    description: entry.detail || 'Cambio interno registrado en el documento',
    user: entry.user || 'Sistema',
    timestamp: toIso(entry.timestamp),
    source: 'document',
    metadata: null,
    before: null,
    after: null,
  }));
};

const getChangedFields = (entry) => {
  if (!entry?.before || !entry?.after) return [];
  const keys = new Set([...Object.keys(entry.before), ...Object.keys(entry.after)]);
  return [...keys].filter((key) => JSON.stringify(entry.before[key]) !== JSON.stringify(entry.after[key]));
};

const RecordAuditTrailModal = ({ isOpen, onClose, record, logs = [], loading = false }) => {
  const navigate = useNavigate();
  const timeline = useMemo(() => {
    if (!record) return [];

    const entityType = ENTITY_TYPE_BY_FAMILY[record.recordFamily];
    const globalEntries = logs
      .filter((entry) => entry.entityId === record.entityId && entry.entityType === entityType)
      .map((entry) => ({
        ...entry,
        source: 'global',
        timestamp: toIso(entry.timestamp),
      }));

    const embeddedEntries = buildEmbeddedEntries(record);
    const merged = [...globalEntries, ...embeddedEntries];
    const seen = new Set();

    return merged
      .filter((entry) => {
        const key = [
          entry.action || '',
          entry.user || '',
          entry.timestamp || '',
          entry.description || '',
        ].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((left, right) => {
        const leftTime = left.timestamp ? new Date(left.timestamp).getTime() : 0;
        const rightTime = right.timestamp ? new Date(right.timestamp).getTime() : 0;
        return rightTime - leftTime;
      });
  }, [logs, record]);

  if (!isOpen || !record) return null;

  const handleOpenGlobalAudit = () => {
    const entityType = ENTITY_TYPE_BY_FAMILY[record.recordFamily];
    navigate(`/auditoria?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(record.entityId)}&label=${encodeURIComponent(record.description || record.documentNumber || record.entityId)}`);
    onClose();
  };

  const handleExport = async () => {
    await exportAuditTrailToPDF(record, timeline);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[rgba(18,29,54,0.22)] p-4 backdrop-blur-md">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(243,247,255,0.94))] shadow-[0_40px_120px_rgba(95,117,162,0.24)]">
        <div className="flex items-start justify-between border-b border-[rgba(205,219,243,0.82)] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Trazabilidad del registro</p>
            <h3 className="mt-2 text-[24px] font-semibold tracking-tight text-[#101938]">{record.description || 'Registro sin descripción'}</h3>
            <p className="mt-2 text-[13px] text-[#62718f]">
              {record.recordFamilyLabel} · {record.documentNumber || 'Sin documento'} · {record.counterpartyName || 'Sin contraparte'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,214,238,0.82)] bg-white/76 px-4 py-2 text-[12px] font-medium text-[#3156d3] transition-colors hover:bg-white hover:text-[#101938]"
            >
              <Download size={14} />
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={handleOpenGlobalAudit}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,214,238,0.82)] bg-white/76 px-4 py-2 text-[12px] font-medium text-[#3156d3] transition-colors hover:bg-white hover:text-[#101938]"
            >
              <ExternalLink size={14} />
              Auditoría global
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/74 p-2 text-[#7b8cab] transition-colors hover:text-[#101938]"
              aria-label="Cerrar trazabilidad"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-[rgba(205,219,243,0.72)] px-6 py-4 md:grid-cols-4">
          <div className="rounded-[18px] border border-[rgba(201,214,238,0.72)] bg-white/76 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Importe</p>
            <p className="mt-1 text-[18px] font-semibold text-[#101938]">€{formatCurrency(record.amount || 0)}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(201,214,238,0.72)] bg-white/76 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Estado</p>
            <p className="mt-1 text-[18px] font-semibold text-[#101938]">{record.statusLabel || record.status || '—'}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(201,214,238,0.72)] bg-white/76 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Último editor</p>
            <p className="mt-1 truncate text-[14px] font-semibold text-[#101938]">{record.lastEditor || 'Sin rastro'}</p>
          </div>
          <div className="rounded-[18px] border border-[rgba(201,214,238,0.72)] bg-white/76 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Último cambio</p>
            <p className="mt-1 text-[14px] font-semibold text-[#101938]">{formatDateTime(record.lastEditedAt) || 'Sin fecha'}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-18">
              <div className="flex items-center gap-3 text-[#62718f]">
                <History size={18} className="animate-pulse" />
                Cargando trazabilidad...
              </div>
            </div>
          ) : timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-18 text-center">
              <History className="h-8 w-8 text-[#8da0c2]" />
              <p className="mt-3 text-[14px] font-semibold text-[#101938]">No hay eventos de auditoría todavía</p>
              <p className="mt-1 max-w-md text-[13px] leading-6 text-[#62718f]">
                Las próximas ediciones, pagos, anulaciones o cancelaciones de este registro aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {timeline.map((entry) => {
                const style = ACTION_STYLES[entry.action] || ACTION_STYLES.update;
                const Icon = style.icon;
                const changedFields = getChangedFields(entry);

                return (
                  <div
                    key={entry.id}
                    className="rounded-[22px] border border-[rgba(201,214,238,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(247,250,255,0.82))] px-4 py-4 shadow-[0_12px_28px_rgba(124,148,191,0.08)]"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-[14px] ${style.bg} ${style.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#101938]">{entry.description}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.color}`}>
                              {style.label}
                            </span>
                            <span className="rounded-full border border-[rgba(201,214,238,0.68)] bg-white/70 px-2 py-0.5 text-[10px] text-[#7b8cab]">
                              {entry.source === 'global' ? 'Auditoría global' : 'Rastro interno'}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[#62718f]">
                            <span className="inline-flex items-center gap-1">
                              <User size={11} />
                              {entry.user || 'Sistema'}
                            </span>
                            <span>{formatDateTime(entry.timestamp) || 'Sin fecha'}</span>
                          </div>

                          {changedFields.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {changedFields.slice(0, 8).map((field) => (
                                <span key={field} className="rounded-full border border-[rgba(201,214,238,0.68)] bg-[rgba(244,248,255,0.84)] px-2 py-0.5 text-[10px] text-[#6980ac]">
                                  {field}
                                </span>
                              ))}
                            </div>
                          )}

                          {entry.metadata && (
                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                              {Object.entries(entry.metadata).map(([key, value]) => (
                                <div key={key} className="rounded-[14px] border border-[rgba(201,214,238,0.58)] bg-white/64 px-3 py-2 text-[11px] text-[#62718f]">
                                  <span className="font-medium text-[#7b8cab]">{key}: </span>
                                  <span className="text-[#101938]">{safeString(value) || '—'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordAuditTrailModal;
