import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

const fieldClassName =
 'w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)] focus:';

const buildInitialFormData = (record) => ({
 direction: record?.rawRecord?.direction || 'in',
 amount: String(record?.amount ?? ''),
 postedDate: record?.rawRecord?.postedDate || record?.date || '',
 issueDate: record?.rawRecord?.issueDate || record?.date || '',
 dueDate: record?.rawRecord?.dueDate || '',
 description: record?.rawRecord?.description || record?.description || '',
 counterpartyName: record?.rawRecord?.counterpartyName || record?.counterpartyName || '',
 documentNumber: record?.rawRecord?.documentNumber || record?.documentNumber || '',
 projectId: record?.rawRecord?.projectId || '',
 costCenterId: record?.rawRecord?.costCenterId || '',
 categoryName: record?.rawRecord?.categoryName || record?.categoryLabel || '',
});

const CanonicalRecordModal = ({ isOpen, onClose, record, onSubmit, projects = [], costCenters = [], categories = [], submitting = false }) => {
 const [formData, setFormData] = useState(() => buildInitialFormData(record));

 if (!isOpen || !record) return null;

 const projectLabel = record.recordFamily === 'movement' ? 'Movimiento bancario' : record.recordFamily === 'receivable' ? 'Factura CXC' : 'Factura CXP';

 const handleSubmit = async (event) => {
 event.preventDefault();
 await onSubmit(formData);
 };

 return (
 <div className="fixed inset-0 z-[240] flex items-center justify-center bg-[var(--surface)] p-4 ">
 <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] ">
 <div className="flex items-start justify-between border-b border-[var(--border)] px-5 py-4">
 <div>
 <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-disabled)]">Edición operativa</p>
 <h3 className="mt-1 text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">Editar {projectLabel}</h3>
 <p className="mt-1 text-[12px] text-[var(--text-secondary)]">{record.description}</p>
 </div>
 <button
 type="button"
 aria-label="Cerrar edición"
 onClick={onClose}
 className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
 >
 <X size={18} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
 {record.recordFamily === 'movement' && (
 <div className="grid gap-4 md:grid-cols-3">
 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Dirección</span>
 <select
 className={fieldClassName}
 value={formData.direction}
 onChange={(event) => setFormData((current) => ({ ...current, direction: event.target.value }))}
 >
 <option value="in">Entrada</option>
 <option value="out">Salida</option>
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Fecha</span>
 <input
 type="date"
 className={fieldClassName}
 value={formData.postedDate}
 onChange={(event) => setFormData((current) => ({ ...current, postedDate: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Importe</span>
 <input
 type="number"
 step="0.01"
 min="0.01"
 className={fieldClassName}
 value={formData.amount}
 onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
 />
 </label>
 </div>
 )}

 {record.recordFamily !== 'movement' && (
 <div className="grid gap-4 md:grid-cols-3">
 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Emisión</span>
 <input
 type="date"
 className={fieldClassName}
 value={formData.issueDate}
 onChange={(event) => setFormData((current) => ({ ...current, issueDate: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Vencimiento</span>
 <input
 type="date"
 className={fieldClassName}
 value={formData.dueDate}
 onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Importe</span>
 <input
 type="number"
 step="0.01"
 min={record.paidAmount || 0}
 className={fieldClassName}
 value={formData.amount}
 onChange={(event) => setFormData((current) => ({ ...current, amount: event.target.value }))}
 />
 </label>
 </div>
 )}

 <div className="grid gap-4 md:grid-cols-2">
 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Contraparte</span>
 <input
 type="text"
 className={fieldClassName}
 value={formData.counterpartyName}
 onChange={(event) => setFormData((current) => ({ ...current, counterpartyName: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Documento</span>
 <input
 type="text"
 className={fieldClassName}
 value={formData.documentNumber}
 onChange={(event) => setFormData((current) => ({ ...current, documentNumber: event.target.value }))}
 />
 </label>
 </div>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Descripción</span>
 <textarea
 rows="3"
 className={fieldClassName}
 value={formData.description}
 onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
 />
 </label>

 <div className="grid gap-4 md:grid-cols-3">
 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Categoría</span>
 <select
 className={fieldClassName}
 value={formData.categoryName}
 onChange={(event) => setFormData((current) => ({ ...current, categoryName: event.target.value }))}
 >
 <option value="">Sin categoría</option>
 {categories.map((cat) => (
 <option key={cat} value={cat}>{cat}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Centro de costo</span>
 <select
 className={fieldClassName}
 value={formData.costCenterId}
 onChange={(event) => setFormData((current) => ({ ...current, costCenterId: event.target.value }))}
 >
 <option value="">Sin centro</option>
 {costCenters.map((center) => (
 <option key={center.id || center.name} value={center.name || center.id}>
 {center.name || center.id}
 </option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-disabled)]">Proyecto</span>
 <select
 className={fieldClassName}
 value={formData.projectId}
 onChange={(event) => setFormData((current) => ({ ...current, projectId: event.target.value }))}
 >
 <option value="">Sin proyecto</option>
 {projects.map((project) => (
 <option key={project.id} value={project.id}>
 {project.name || project.displayName || project.code}
 </option>
 ))}
 </select>
 </label>
 </div>

 <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={submitting}
 className="inline-flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2.5 text-[13px] font-semibold text-[var(--black)] transition-colors hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {submitting ? <Loader2 size={15} className="animate-spin" /> : null}
 Guardar cambios
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default CanonicalRecordModal;
