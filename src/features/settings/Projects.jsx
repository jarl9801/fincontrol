import React, { useState } from 'react';
import {
 Briefcase,
 Plus,
 Edit2,
 Trash2,
 X,
 Check,
 Search,
 Calendar,
 User,
 Power,
 CheckCircle2,
 AlertCircle,
 Building2,
 MapPin,
 Download,
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { formatDate } from '../../utils/formatters';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Toast from '../../components/ui/Toast';

// ============================================
// Operators (Auftraggeber) — known UMTELKOMD project owners.
// Add new operators here as the company onboards more clients.
// ============================================
const OPERATORS = [
 { value: 'INSYTE', label: 'Insyte' },
 { value: 'VANCOM', label: 'Vancom' },
];

// ============================================
// Default project catalog — used by the "Importar predefinidos" button
// to bootstrap the project list. Idempotent: only creates projects whose
// `code` doesn't already exist.
// ============================================
const DEFAULT_PROJECTS = [
 { code: 'FBX', name: 'FBX', operator: 'INSYTE', zone: '' },
 { code: 'QFF', name: 'QFF', operator: 'INSYTE', zone: '' },
 { code: 'BIE', name: 'Bielefeld', operator: 'INSYTE', zone: 'Nordrhein-Westfalen' },
 { code: 'WUR', name: 'Würzburg', operator: 'INSYTE', zone: 'Bayern' },
 { code: 'BAM', name: 'Bamberg', operator: 'INSYTE', zone: 'Bayern' },
 { code: 'LGN', name: 'Langenau', operator: 'VANCOM', zone: 'Baden-Württemberg' },
 { code: 'EHR', name: 'Ehrenkirchen', operator: 'VANCOM', zone: 'Baden-Württemberg' },
];

const operatorLabel = (value) =>
 OPERATORS.find((op) => op.value === value)?.label || value || '—';

const operatorColor = (value) => {
 if (value === 'INSYTE') return 'text-[var(--success)] border-[var(--border-visible)]';
 if (value === 'VANCOM') return 'text-[var(--accent)] border-[var(--border-visible)]';
 return 'text-[var(--text-secondary)] border-[var(--border)]';
};

const Projects = ({ user }) => {
 const { projects, loading, createProject, updateProject, deleteProject } = useProjects(user);
 const [searchTerm, setSearchTerm] = useState('');
 const [showAddModal, setShowAddModal] = useState(false);
 const [editingProject, setEditingProject] = useState(null);
 const [projectToDelete, setProjectToDelete] = useState(null);
 const [toast, setToast] = useState(null);

 const [formData, setFormData] = useState({
 code: '',
 name: '',
 client: '',
 operator: 'INSYTE',
 zone: '',
 description: '',
 startDate: '',
 endDate: '',
 budget: '',
 status: 'active'
 });

 const resetForm = () => {
 setFormData({
 code: '',
 name: '',
 client: '',
 operator: 'INSYTE',
 zone: '',
 description: '',
 startDate: '',
 endDate: '',
 budget: '',
 status: 'active'
 });
 };

 const handleOpenAdd = () => {
 resetForm();
 setEditingProject(null);
 setShowAddModal(true);
 };

 const handleOpenEdit = (project) => {
 setEditingProject(project);
 setFormData({
 code: project.code || '',
 name: project.name || '',
 client: project.client || '',
 operator: project.operator || 'INSYTE',
 zone: project.zone || '',
 description: project.description || '',
 startDate: project.startDate || '',
 endDate: project.endDate || '',
 budget: project.budget || '',
 status: project.status || 'active'
 });
 setShowAddModal(true);
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 
 if (!formData.code.trim() || !formData.name.trim()) {
 setToast({ message: 'Código y nombre son requeridos', type: 'error' });
 return;
 }

 const projectData = {
 code: formData.code.trim().toUpperCase(),
 name: formData.name.trim(),
 client: formData.client.trim(),
 operator: formData.operator || 'INSYTE',
 zone: formData.zone.trim(),
 description: formData.description.trim(),
 startDate: formData.startDate,
 endDate: formData.endDate,
 budget: parseFloat(formData.budget) || 0,
 status: formData.status,
 displayName: `${formData.code.trim().toUpperCase()} (${formData.name.trim()})`
 };

 if (editingProject) {
 const result = await updateProject(editingProject.id, projectData);
 if (result.success) {
 setToast({ message: 'Proyecto actualizado exitosamente', type: 'success' });
 } else {
 setToast({ message: 'Error al actualizar el proyecto', type: 'error' });
 }
 } else {
 const result = await createProject(projectData);
 if (result.success) {
 setToast({ message: 'Proyecto creado exitosamente', type: 'success' });
 } else {
 setToast({ message: 'Error al crear el proyecto', type: 'error' });
 }
 }

 setShowAddModal(false);
 resetForm();
 };

 const handleDelete = async () => {
 if (projectToDelete) {
 const result = await deleteProject(projectToDelete.id);
 if (result.success) {
 setToast({ message: 'Proyecto eliminado exitosamente', type: 'success' });
 } else {
 setToast({ message: 'Error al eliminar el proyecto', type: 'error' });
 }
 setProjectToDelete(null);
 }
 };

 const handleToggleStatus = async (project) => {
 const newStatus = project.status === 'active' ? 'inactive' : 'active';
 const result = await updateProject(project.id, { status: newStatus });
 if (result.success) {
 setToast({
 message: `Proyecto ${newStatus === 'active' ? 'activado' : 'desactivado'}`,
 type: 'success'
 });
 }
 };

 // ============================================
 // Inline edit (operator + zone) — saves directly to Firestore on change/blur.
 // Used to enrich legacy projects with operator/zone metadata without opening
 // the full edit modal for each one.
 // ============================================
 const [zoneDrafts, setZoneDrafts] = useState({}); // { [projectId]: 'draft text' }

 const handleInlineOperatorChange = async (project, newOperator) => {
 if ((project.operator || '') === newOperator) return;
 const result = await updateProject(project.id, { operator: newOperator });
 if (result.success) {
 setToast({ message: `${project.code}: operador → ${newOperator || 'ninguno'}`, type: 'success' });
 } else {
 setToast({ message: `Error al cambiar operador de ${project.code}`, type: 'error' });
 }
 };

 const handleInlineZoneBlur = async (project) => {
 const draft = zoneDrafts[project.id];
 if (draft == null) return; // never edited
 const trimmed = draft.trim();
 if (trimmed === (project.zone || '')) {
 // No change — just clear the draft
 setZoneDrafts((prev) => {
 const next = { ...prev };
 delete next[project.id];
 return next;
 });
 return;
 }
 const result = await updateProject(project.id, { zone: trimmed });
 if (result.success) {
 setToast({ message: `${project.code}: zona → ${trimmed || '(vacía)'}`, type: 'success' });
 setZoneDrafts((prev) => {
 const next = { ...prev };
 delete next[project.id];
 return next;
 });
 } else {
 setToast({ message: `Error al cambiar zona de ${project.code}`, type: 'error' });
 }
 };

 // Idempotent bootstrap: creates any DEFAULT_PROJECTS whose `code` doesn't
 // already exist in the current Firestore collection. Existing projects are
 // never touched, so this is safe to click multiple times.
 const [importing, setImporting] = useState(false);
 const handleImportDefaults = async () => {
 if (importing) return;
 if (!window.confirm('Importar los 7 proyectos predefinidos de UMTELKOMD? Solo se crearán los que aún no existan.')) return;
 setImporting(true);
 const existingCodes = new Set(projects.map((p) => (p.code || '').toUpperCase()));
 let created = 0;
 let skipped = 0;
 for (const def of DEFAULT_PROJECTS) {
 if (existingCodes.has(def.code.toUpperCase())) {
 skipped += 1;
 continue;
 }
 const result = await createProject({
 ...def,
 client: '',
 description: '',
 startDate: '',
 endDate: '',
 budget: 0,
 status: 'active',
 displayName: `${def.code} (${def.name})`,
 });
 if (result.success) created += 1;
 }
 setImporting(false);
 setToast({
 message: `Importación completa: ${created} creados, ${skipped} ya existían`,
 type: created > 0 ? 'success' : 'info',
 });
 };

 const filteredProjects = projects.filter(p => {
 const q = searchTerm.toLowerCase();
 return (
 p.name?.toLowerCase().includes(q) ||
 p.code?.toLowerCase().includes(q) ||
 p.client?.toLowerCase().includes(q) ||
 p.operator?.toLowerCase().includes(q) ||
 p.zone?.toLowerCase().includes(q)
 );
 });

 const activeProjects = filteredProjects.filter(p => p.status === 'active');
 const inactiveProjects = filteredProjects.filter(p => p.status !== 'active');

 if (loading) {
 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex items-center justify-center py-12">
 <div className="flex flex-col items-center gap-4">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--text-secondary)]"></div>
 <p className="text-[var(--text-secondary)]">Cargando proyectos...</p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-6 py-5 ">
 <p className="nd-label text-[var(--text-primary)]">Configuración operativa</p>
 <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Proyectos</h2>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">
 Administra el catálogo de proyectos para reportes, cobros, pagos y seguimiento financiero.
 </p>
 </div>
 <div className="flex flex-wrap gap-2">
 <button
 onClick={handleImportDefaults}
 disabled={importing}
 title="Crear los 8 proyectos predefinidos de UMTELKOMD (idempotente)"
 className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:opacity-85 disabled:opacity-50"
 >
 <Download size={16} /> {importing ? 'Importando…' : 'Importar predefinidos'}
 </button>
 <button
 onClick={handleOpenAdd}
 className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-[var(--black)] transition hover:opacity-85"
 >
 <Plus size={18} /> Nuevo proyecto
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
 <Briefcase className="h-5 w-5 text-[var(--text-primary)]" />
 </div>
 <div>
 <p className="nd-label text-[var(--text-secondary)]">Total proyectos</p>
 <p className="nd-display text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{projects.length}</p>
 </div>
 </div>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
 <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
 </div>
 <div>
 <p className="nd-label text-[var(--text-secondary)]">Activos</p>
 <p className="nd-display text-[28px] font-semibold tracking-[-0.03em] text-[var(--success)]">{activeProjects.length}</p>
 </div>
 </div>
 </div>
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
 <AlertCircle className="h-5 w-5 text-[var(--text-secondary)]" />
 </div>
 <div>
 <p className="nd-label text-[var(--text-secondary)]">Inactivos</p>
 <p className="nd-display text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-secondary)]">{inactiveProjects.length}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Operator breakdown — small line under the stats cards */}
 {projects.length > 0 && (
 <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 py-3">
 <Building2 size={14} className="text-[var(--text-secondary)]" />
 <span className="nd-label text-[var(--text-secondary)]">Por operador:</span>
 {OPERATORS.map((op) => {
 const count = projects.filter((p) => p.operator === op.value && p.status === 'active').length;
 return (
 <span
 key={op.value}
 className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${operatorColor(op.value)}`}
 >
 {op.label}: {count}
 </span>
 );
 })}
 {(() => {
 const unassigned = projects.filter((p) => !p.operator && p.status === 'active').length;
 if (unassigned === 0) return null;
 return (
 <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]">
 Sin operador: {unassigned}
 </span>
 );
 })()}
 </div>
 )}

 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
 <input
 type="text"
 placeholder="Buscar proyectos por código, nombre o cliente..."
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>

 <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] ">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
 <tr>
 <th className="px-6 py-4 text-left nd-label text-[var(--text-secondary)]">Código</th>
 <th className="px-6 py-4 text-left nd-label text-[var(--text-secondary)]">Nombre</th>
 <th className="hidden px-6 py-4 text-left nd-label text-[var(--text-secondary)] md:table-cell">Operador</th>
 <th className="hidden px-6 py-4 text-left nd-label text-[var(--text-secondary)] lg:table-cell">Cliente</th>
 <th className="hidden px-6 py-4 text-left nd-label text-[var(--text-secondary)] sm:table-cell">Fechas</th>
 <th className="px-6 py-4 text-center nd-label text-[var(--text-secondary)]">Estado</th>
 <th className="px-6 py-4 text-right nd-label text-[var(--text-secondary)]">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)]">
 {activeProjects.map((project) => (
 <tr key={project.id} className="transition-colors hover:bg-[var(--surface)]">
 <td className="px-6 py-4">
 <span className="inline-flex items-center rounded-md bg-transparent px-2.5 py-1 text-sm font-semibold text-[var(--text-primary)]">
 {project.code}
 </span>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-secondary)]">
 <MapPin size={10} />
 <input
 type="text"
 placeholder="zona…"
 value={zoneDrafts[project.id] ?? project.zone ?? ''}
 onChange={(e) => setZoneDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))}
 onBlur={() => handleInlineZoneBlur(project)}
 onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
 className="w-[110px] bg-transparent text-[10px] text-[var(--text-secondary)] outline-none border-b border-transparent hover:border-[var(--border)] focus:border-[var(--text-primary)] focus:text-[var(--text-primary)]"
 title="Click para editar zona, Enter o blur para guardar"
 />
 </div>
 </td>
 <td className="px-6 py-4">
 <div>
 <p className="font-semibold text-[var(--text-primary)]">{project.name}</p>
 {project.description && (
 <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--text-secondary)]">{project.description}</p>
 )}
 </div>
 </td>
 <td className="px-6 py-4 hidden md:table-cell">
 <select
 value={project.operator || ''}
 onChange={(e) => handleInlineOperatorChange(project, e.target.value)}
 className={`rounded-full border bg-transparent px-2 py-1 text-xs font-semibold outline-none transition focus:border-[var(--text-primary)] ${operatorColor(project.operator)}`}
 title="Cambiar operador (se guarda automáticamente)"
 >
 <option value="">— sin operador</option>
 {OPERATORS.map((op) => (
 <option key={op.value} value={op.value}>{op.label}</option>
 ))}
 </select>
 </td>
 <td className="px-6 py-4 hidden lg:table-cell">
 <div className="flex items-center gap-2">
 <User className="h-4 w-4 text-[var(--text-secondary)]" />
 <span className="text-sm text-[var(--text-disabled)]">{project.client || '-'}</span>
 </div>
 </td>
 <td className="px-6 py-4 hidden sm:table-cell">
 <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
 <Calendar className="h-4 w-4" />
 <span>
 {project.startDate ? formatDate(project.startDate) : '-'}
 {project.endDate && ` → ${formatDate(project.endDate)}`}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center gap-1 rounded-full bg-transparent px-3 py-1 text-xs font-medium text-[var(--success)]">
 <CheckCircle2 className="h-3 w-3" />
 Activo
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-1">
 <button
 onClick={() => handleToggleStatus(project)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
 title="Desactivar"
 >
 <Power className="h-4 w-4" />
 </button>
 <button
 onClick={() => handleOpenEdit(project)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-primary)]"
 title="Editar"
 >
 <Edit2 className="h-4 w-4" />
 </button>
 <button
 onClick={() => setProjectToDelete(project)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--accent)]"
 title="Eliminar"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 
 {/* Inactive Projects */}
 {inactiveProjects.map((project) => (
 <tr key={project.id} className="bg-[var(--surface)] transition-colors hover:bg-[var(--surface)]">
 <td className="px-6 py-4">
 <span className="inline-flex items-center rounded-md bg-transparent px-2.5 py-1 text-sm font-semibold text-[var(--text-secondary)]">
 {project.code}
 </span>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--text-secondary)] opacity-60">
 <MapPin size={10} />
 <input
 type="text"
 placeholder="zona…"
 value={zoneDrafts[project.id] ?? project.zone ?? ''}
 onChange={(e) => setZoneDrafts((prev) => ({ ...prev, [project.id]: e.target.value }))}
 onBlur={() => handleInlineZoneBlur(project)}
 onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
 className="w-[110px] bg-transparent text-[10px] text-[var(--text-secondary)] outline-none border-b border-transparent hover:border-[var(--border)] focus:border-[var(--text-primary)] focus:text-[var(--text-primary)]"
 />
 </div>
 </td>
 <td className="px-6 py-4">
 <div>
 <p className="font-semibold text-[var(--text-disabled)] line-through">{project.name}</p>
 {project.description && (
 <p className="mt-0.5 max-w-xs truncate text-xs text-[var(--text-secondary)]">{project.description}</p>
 )}
 </div>
 </td>
 <td className="px-6 py-4 hidden md:table-cell">
 <select
 value={project.operator || ''}
 onChange={(e) => handleInlineOperatorChange(project, e.target.value)}
 className={`rounded-full border bg-transparent px-2 py-1 text-xs font-semibold outline-none transition focus:border-[var(--text-primary)] opacity-60 ${operatorColor(project.operator)}`}
 title="Cambiar operador (se guarda automáticamente)"
 >
 <option value="">— sin operador</option>
 {OPERATORS.map((op) => (
 <option key={op.value} value={op.value}>{op.label}</option>
 ))}
 </select>
 </td>
 <td className="px-6 py-4 hidden lg:table-cell">
 <div className="flex items-center gap-2">
 <User className="h-4 w-4 text-[var(--text-secondary)]" />
 <span className="text-sm text-[var(--text-secondary)]">{project.client || '-'}</span>
 </div>
 </td>
 <td className="px-6 py-4 hidden sm:table-cell">
 <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
 <Calendar className="h-4 w-4" />
 <span>
 {project.startDate ? formatDate(project.startDate) : '-'} 
 {project.endDate && ` → ${formatDate(project.endDate)}`}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center gap-1 rounded-full bg-transparent px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
 Inactivo
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center justify-end gap-1">
 <button
 onClick={() => handleToggleStatus(project)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--success)]"
 title="Activar"
 >
 <Power className="h-4 w-4" />
 </button>
 <button
 onClick={() => handleOpenEdit(project)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-primary)]"
 title="Editar"
 >
 <Edit2 className="h-4 w-4" />
 </button>
 <button
 onClick={() => setProjectToDelete(project)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--accent)]"
 title="Eliminar"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 
 {filteredProjects.length === 0 && (
 <tr>
 <td colSpan="7" className="px-6 py-12 text-center">
 <div className="flex flex-col items-center gap-3 text-[var(--text-disabled)]">
 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-transparent">
 <Briefcase className="h-8 w-8 text-[var(--text-secondary)]" />
 </div>
 <p className="text-sm text-[var(--text-secondary)]">No se encontraron proyectos</p>
 {searchTerm && (
 <button
 onClick={() => setSearchTerm('')}
 className="text-sm font-medium text-[var(--text-primary)]"
 >
 Limpiar búsqueda
 </button>
 )}
 </div>
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* Add/Edit Modal */}
 {showAddModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
 <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-[var(--border)] bg-[var(--surface)] animate-scaleIn">
 <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-5">
 <div>
 <p className="nd-label text-[var(--text-primary)]">Ficha de proyecto</p>
 <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
 {editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}
 </h3>
 </div>
 <button 
 onClick={() => setShowAddModal(false)} 
 className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-transparent"
 >
 <X size={20} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-5">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Código <span className="text-[var(--accent)]">*</span>
 </label>
 <input
 type="text"
 required
 placeholder="PROY-001"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm uppercase text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.code}
 onChange={e => setFormData({...formData, code: e.target.value})}
 />
 </div>
 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Nombre <span className="text-[var(--accent)]">*</span>
 </label>
 <input
 type="text"
 required
 placeholder="Nombre del proyecto"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Operador (Auftraggeber) <span className="text-[var(--accent)]">*</span>
 </label>
 <div className="grid grid-cols-2 gap-3">
 {OPERATORS.map((op) => {
 const selected = formData.operator === op.value;
 return (
 <button
 key={op.value}
 type="button"
 onClick={() => setFormData({ ...formData, operator: op.value })}
 className={`flex items-center justify-center gap-2 rounded-md border-2 px-4 py-3 text-sm font-semibold transition-all ${
 selected
 ? `bg-transparent ${operatorColor(op.value)}`
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-visible)]'
 }`}
 >
 <Building2 size={14} />
 {op.label}
 </button>
 );
 })}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Zona
 </label>
 <input
 type="text"
 placeholder="Bayern, Baden-Württemberg, ..."
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)]"
 value={formData.zone}
 onChange={e => setFormData({...formData, zone: e.target.value})}
 />
 </div>
 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Cliente final
 </label>
 <input
 type="text"
 placeholder="Cliente / contratante directo"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.client}
 onChange={e => setFormData({...formData, client: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Descripción
 </label>
 <textarea
 rows="2"
 placeholder="Descripción breve del proyecto..."
 className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.description}
 onChange={e => setFormData({...formData, description: e.target.value})}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Fecha inicio
 </label>
 <input
 type="date"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.startDate}
 onChange={e => setFormData({...formData, startDate: e.target.value})}
 />
 </div>
 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Fecha fin
 </label>
 <input
 type="date"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.endDate}
 onChange={e => setFormData({...formData, endDate: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">
 Presupuesto (EUR)
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-[var(--text-secondary)]">€</span>
 <input
 type="number"
 step="0.01"
 min="0"
 placeholder="0.00"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-3 pl-8 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.budget}
 onChange={e => setFormData({...formData, budget: e.target.value})}
 />
 </div>
 </div>

 <div>
 <label className="mb-2 block nd-label text-[var(--text-secondary)]">Estado</label>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setFormData({...formData, status: 'active'})}
 className={`
 flex-1 py-3 px-4 rounded-md text-sm font-medium border-2 transition-all
 ${formData.status === 'active'
 ? 'border-[var(--success)] bg-transparent text-[var(--success)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-visible)]'}
 `}
 >
 Activo
 </button>
 <button
 type="button"
 onClick={() => setFormData({...formData, status: 'inactive'})}
 className={`
 flex-1 py-3 px-4 rounded-md text-sm font-medium border-2 transition-all
 ${formData.status === 'inactive'
 ? 'border-[var(--border)] bg-transparent text-[var(--text-disabled)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border)]'}
 `}
 >
 Inactivo
 </button>
 </div>
 </div>

 <button
 type="submit"
 className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] py-4 text-sm font-semibold text-[var(--black)] transition hover:opacity-85"
 >
 <Check size={18} />
 {editingProject ? 'Guardar cambios' : 'Crear proyecto'}
 </button>
 </form>
 </div>
 </div>
 )}

 {/* Delete Confirmation */}
 <ConfirmModal
 isOpen={!!projectToDelete}
 onClose={() => setProjectToDelete(null)}
 onConfirm={handleDelete}
 title="Eliminar Proyecto"
 message={`¿Estás seguro de eliminar el proyecto "${projectToDelete?.name}" (${projectToDelete?.code})? Esta acción no se puede deshacer.`}
 confirmText="Eliminar"
 cancelText="Cancelar"
 variant="danger"
 />

 {/* Toast */}
 {toast && (
 <Toast
 message={toast.message}
 type={toast.type}
 onClose={() => setToast(null)}
 />
 )}
 </div>
 );
};

export default Projects;
