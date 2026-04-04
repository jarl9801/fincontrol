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
 AlertCircle
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { formatDate } from '../../utils/formatters';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Toast from '../../components/ui/Toast';

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

 const filteredProjects = projects.filter(p => 
 p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 p.client?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const activeProjects = filteredProjects.filter(p => p.status === 'active');
 const inactiveProjects = filteredProjects.filter(p => p.status !== 'active');

 if (loading) {
 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex items-center justify-center py-12">
 <div className="flex flex-col items-center gap-4">
 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
 <p className="text-[var(--text-secondary)]">Cargando proyectos...</p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 ">
 <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-primary)]">Configuración operativa</p>
 <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Proyectos</h2>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">
 Administra el catálogo de proyectos para reportes, cobros, pagos y seguimiento financiero.
 </p>
 </div>
 <button
 onClick={handleOpenAdd}
 className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] px-5 py-3 text-sm font-semibold text-[var(--black)] transition hover:opacity-85"
 >
 <Plus size={18} /> Nuevo proyecto
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
 <Briefcase className="h-5 w-5 text-[var(--text-primary)]" />
 </div>
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Total proyectos</p>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{projects.length}</p>
 </div>
 </div>
 </div>
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
 <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
 </div>
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Activos</p>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--success)]">{activeProjects.length}</p>
 </div>
 </div>
 </div>
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-transparent">
 <AlertCircle className="h-5 w-5 text-[var(--text-secondary)]" />
 </div>
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Inactivos</p>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-secondary)]">{inactiveProjects.length}</p>
 </div>
 </div>
 </div>
 </div>

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

 <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] ">
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
 <tr>
 <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Código</th>
 <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Nombre</th>
 <th className="hidden px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] md:table-cell">Cliente</th>
 <th className="hidden px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] sm:table-cell">Fechas</th>
 <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Estado</th>
 <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--border)]">
 {activeProjects.map((project) => (
 <tr key={project.id} className="transition-colors hover:bg-[var(--surface)]">
 <td className="px-6 py-4">
 <span className="inline-flex items-center rounded-xl bg-transparent px-2.5 py-1 text-sm font-semibold text-[var(--text-primary)]">
 {project.code}
 </span>
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
 className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
 title="Desactivar"
 >
 <Power className="h-4 w-4" />
 </button>
 <button
 onClick={() => handleOpenEdit(project)}
 className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-primary)]"
 title="Editar"
 >
 <Edit2 className="h-4 w-4" />
 </button>
 <button
 onClick={() => setProjectToDelete(project)}
 className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--accent)]"
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
 <span className="inline-flex items-center rounded-xl bg-transparent px-2.5 py-1 text-sm font-semibold text-[var(--text-secondary)]">
 {project.code}
 </span>
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
 className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--success)]"
 title="Activar"
 >
 <Power className="h-4 w-4" />
 </button>
 <button
 onClick={() => handleOpenEdit(project)}
 className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-primary)]"
 title="Editar"
 >
 <Edit2 className="h-4 w-4" />
 </button>
 <button
 onClick={() => setProjectToDelete(project)}
 className="rounded-xl p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--accent)]"
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
 <td colSpan="6" className="px-6 py-12 text-center">
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
 <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-scaleIn">
 <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-5">
 <div>
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">Ficha de proyecto</p>
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
 Cliente
 </label>
 <input
 type="text"
 placeholder="Nombre del cliente"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.client}
 onChange={e => setFormData({...formData, client: e.target.value})}
 />
 </div>

 <div>
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
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
 <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Estado</label>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setFormData({...formData, status: 'active'})}
 className={`
 flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
 ${formData.status === 'active'
 ? 'border-[#83d5ba] bg-transparent text-[var(--success)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-visible)]'}
 `}
 >
 Activo
 </button>
 <button
 type="button"
 onClick={() => setFormData({...formData, status: 'inactive'})}
 className={`
 flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
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
