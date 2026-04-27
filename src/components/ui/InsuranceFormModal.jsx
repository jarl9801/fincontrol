import { useState, useEffect, useMemo } from 'react';
import { X, Save, Shield } from 'lucide-react';
import {
 insuranceDefaults,
 INSURANCE_TYPES,
 INSURANCE_STATUSES,
} from '../../finance/assetSchemas';
import { Button } from '@/components/ui/nexus';

const TYPE_LABELS = {
 haftpflicht: 'Responsabilidad civil (Haftpflicht)',
 kasko: 'Vehículo (Kasko)',
 business: 'Empresa (Betriebshaftpflicht)',
 health: 'Salud',
 life: 'Vida',
 property: 'Edificio / Inhalt',
 equipment: 'Equipos / herramientas',
 liability: 'Responsabilidad profesional',
 other: 'Otro',
};

const STATUS_LABELS = {
 active: 'Activo',
 expired: 'Expirado',
 cancelled: 'Cancelado',
};

const LINKED_TYPE_LABELS = {
 '': 'Ninguno',
 vehicle: 'Vehículo',
 property: 'Vivienda',
 employee: 'Empleado',
};

const InsuranceFormModal = ({
 isOpen,
 onClose,
 onSubmit,
 editingInsurance,
 vehicles = [],
 properties = [],
 employees = [],
}) => {
 const [form, setForm] = useState(insuranceDefaults());
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
 if (isOpen) {
 setForm(editingInsurance ? { ...insuranceDefaults(), ...editingInsurance } : insuranceDefaults());
 setError('');
 }
 }, [isOpen, editingInsurance]);

 const linkedOptions = useMemo(() => {
 if (form.linkedAssetType === 'vehicle') return vehicles.map((v) => ({ id: v.id, name: v.name }));
 if (form.linkedAssetType === 'property') return properties.map((p) => ({ id: p.id, name: p.name }));
 if (form.linkedAssetType === 'employee') return employees.map((e) => ({ id: e.id, name: e.fullName }));
 return [];
 }, [form.linkedAssetType, vehicles, properties, employees]);

 if (!isOpen) return null;

 const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!form.name.trim()) {
 setError('El nombre es obligatorio');
 return;
 }
 setSubmitting(true);
 const result = await onSubmit(form);
 setSubmitting(false);
 if (result?.success) onClose();
 else setError(result?.error?.message || 'Error al guardar');
 };

 return (
 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-fadeIn" onClick={onClose}>
 <div className="bg-[var(--surface)] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
 <header className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Shield size={18} className="text-[var(--text-disabled)]" />
 <h2 className="text-lg font-medium text-[var(--text-primary)]">
 {editingInsurance ? 'Editar seguro' : 'Nuevo seguro'}
 </h2>
 </div>
 <button type="button" onClick={onClose} className="text-[var(--text-disabled)] hover:text-[var(--text-primary)]">
 <X size={20} />
 </button>
 </header>

 <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 flex-1 space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <label className="block md:col-span-2">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Nombre *</span>
 <input
 type="text"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-visible)]"
 value={form.name}
 onChange={(e) => set('name', e.target.value)}
 placeholder="Ej: Haftpflicht UMTELKOMD GmbH"
 autoFocus
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Tipo</span>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.type}
 onChange={(e) => set('type', e.target.value)}
 >
 {INSURANCE_TYPES.map((t) => (
 <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Estado</span>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.status}
 onChange={(e) => set('status', e.target.value)}
 >
 {INSURANCE_STATUSES.map((s) => (
 <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Aseguradora</span>
 <input
 type="text"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.insurer}
 onChange={(e) => set('insurer', e.target.value)}
 placeholder="Ej: Allianz, HUK-Coburg"
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Nº póliza</span>
 <input
 type="text"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none nd-mono"
 value={form.policyNumber}
 onChange={(e) => set('policyNumber', e.target.value)}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Cobertura €</span>
 <input
 type="number"
 step="0.01"
 min="0"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none nd-mono tabular-nums"
 value={form.coverageAmount || ''}
 onChange={(e) => set('coverageAmount', e.target.value)}
 placeholder="0.00"
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Prima anual €</span>
 <input
 type="number"
 step="0.01"
 min="0"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none nd-mono tabular-nums"
 value={form.premiumAnnual || ''}
 onChange={(e) => set('premiumAnnual', e.target.value)}
 placeholder="0.00"
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Inicio</span>
 <input
 type="date"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.startDate}
 onChange={(e) => set('startDate', e.target.value)}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Fin</span>
 <input
 type="date"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.endDate}
 onChange={(e) => set('endDate', e.target.value)}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Próxima renovación</span>
 <input
 type="date"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.renewalDate}
 onChange={(e) => set('renewalDate', e.target.value)}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Asociado a</span>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.linkedAssetType}
 onChange={(e) => {
 const t = e.target.value;
 setForm((f) => ({ ...f, linkedAssetType: t, linkedAssetId: '' }));
 }}
 >
 {Object.entries(LINKED_TYPE_LABELS).map(([k, v]) => (
 <option key={k} value={k}>{v}</option>
 ))}
 </select>
 </label>

 {form.linkedAssetType && (
 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">{LINKED_TYPE_LABELS[form.linkedAssetType]}</span>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.linkedAssetId}
 onChange={(e) => set('linkedAssetId', e.target.value)}
 >
 <option value="">— Seleccionar —</option>
 {linkedOptions.map((o) => (
 <option key={o.id} value={o.id}>{o.name}</option>
 ))}
 </select>
 </label>
 )}
 </div>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Notas</span>
 <textarea
 rows={3}
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none"
 value={form.notes}
 onChange={(e) => set('notes', e.target.value)}
 />
 </label>

 {error && <p className="text-sm text-[var(--error)]">{error}</p>}
 </form>

 <footer className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
 <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
 <Button variant="primary" icon={Save} loading={submitting} disabled={submitting} onClick={handleSubmit}>
 {editingInsurance ? 'Guardar cambios' : 'Crear seguro'}
 </Button>
 </footer>
 </div>
 </div>
 );
};

export default InsuranceFormModal;
