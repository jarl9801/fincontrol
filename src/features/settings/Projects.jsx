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
            <p className="text-[#8e8e93]">Cargando proyectos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Configuración operativa</p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Proyectos</h2>
          <p className="mt-1 text-sm text-[#6b7a99]">
            Administra el catálogo de proyectos para reportes, cobros, pagos y seguimiento financiero.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f56cf]"
        >
          <Plus size={18} /> Nuevo proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(59,130,246,0.12)]">
              <Briefcase className="h-5 w-5 text-[#2563eb]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Total proyectos</p>
              <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#1f2a44]">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(15,159,110,0.12)]">
              <CheckCircle2 className="h-5 w-5 text-[#0f9f6e]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Activos</p>
              <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#0f9f6e]">{activeProjects.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/86 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(107,122,153,0.12)]">
              <AlertCircle className="h-5 w-5 text-[#6b7a99]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Inactivos</p>
              <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#6b7a99]">{inactiveProjects.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a879d]" size={18} />
        <input
          type="text"
          placeholder="Buscar proyectos por código, nombre o cliente..."
          className="w-full rounded-[22px] border border-[#d8e3f7] bg-white/88 py-3 pl-12 pr-4 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#dce6f8] bg-white/88 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Código</th>
                <th className="px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Nombre</th>
                <th className="hidden px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f] md:table-cell">Cliente</th>
                <th className="hidden px-6 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f] sm:table-cell">Fechas</th>
                <th className="px-6 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Estado</th>
                <th className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1fb]">
              {activeProjects.map((project) => (
                <tr key={project.id} className="transition-colors hover:bg-[rgba(241,246,255,0.8)]">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-xl bg-[rgba(59,130,246,0.12)] px-2.5 py-1 text-sm font-semibold text-[#2563eb]">
                      {project.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#1f2a44]">{project.name}</p>
                      {project.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-[#70819f]">{project.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#7a879d]" />
                      <span className="text-sm text-[#5f6f8d]">{project.client || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm text-[#6b7a99]">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.startDate ? formatDate(project.startDate) : '-'} 
                        {project.endDate && ` → ${formatDate(project.endDate)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,159,110,0.1)] px-3 py-1 text-xs font-medium text-[#0f9f6e]">
                      <CheckCircle2 className="h-3 w-3" />
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(project)}
                        className="rounded-xl p-2 text-[#7a879d] transition hover:bg-[rgba(107,122,153,0.08)] hover:text-[#5f6f8d]"
                        title="Desactivar"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="rounded-xl p-2 text-[#7a879d] transition hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="rounded-xl p-2 text-[#7a879d] transition hover:bg-[rgba(208,76,54,0.08)] hover:text-[#d04c36]"
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
                <tr key={project.id} className="bg-[rgba(248,250,255,0.88)] transition-colors hover:bg-[rgba(241,246,255,0.92)]">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-xl bg-[rgba(107,122,153,0.12)] px-2.5 py-1 text-sm font-semibold text-[#6b7a99]">
                      {project.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#8090ab] line-through">{project.name}</p>
                      {project.description && (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-[#93a0b6]">{project.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-[#93a0b6]" />
                      <span className="text-sm text-[#93a0b6]">{project.client || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm text-[#93a0b6]">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.startDate ? formatDate(project.startDate) : '-'} 
                        {project.endDate && ` → ${formatDate(project.endDate)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(107,122,153,0.12)] px-3 py-1 text-xs font-medium text-[#6b7a99]">
                      Inactivo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(project)}
                        className="rounded-xl p-2 text-[#7a879d] transition hover:bg-[rgba(15,159,110,0.08)] hover:text-[#0f9f6e]"
                        title="Activar"
                      >
                        <Power className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="rounded-xl p-2 text-[#7a879d] transition hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="rounded-xl p-2 text-[#7a879d] transition hover:bg-[rgba(208,76,54,0.08)] hover:text-[#d04c36]"
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
                    <div className="flex flex-col items-center gap-3 text-[#636366]">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(107,122,153,0.1)]">
                        <Briefcase className="h-8 w-8 text-[#7a879d]" />
                      </div>
                      <p className="text-sm text-[#6b7a99]">No se encontraron proyectos</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-sm font-medium text-[#2563eb]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[30px] border border-[#dce6f8] bg-[rgba(255,255,255,0.96)] shadow-[0_35px_120px_rgba(15,23,42,0.24)] animate-scaleIn">
            <div className="flex items-center justify-between border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)] px-6 py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5b7bd6]">Ficha de proyecto</p>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-[#1f2a44]">
                  {editingProject ? 'Editar proyecto' : 'Nuevo proyecto'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="rounded-2xl p-2 text-[#7a879d] transition hover:bg-[rgba(94,115,159,0.08)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                    Código <span className="text-[#ff453a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PROY-001"
                    className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-3 text-sm uppercase text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                    Nombre <span className="text-[#ff453a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del proyecto"
                    className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-3 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                  Cliente
                </label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-3 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                  value={formData.client}
                  onChange={e => setFormData({...formData, client: e.target.value})}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                  Descripción
                </label>
                <textarea
                  rows="2"
                  placeholder="Descripción breve del proyecto..."
                  className="w-full resize-none rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-3 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-3 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-4 py-3 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">
                  Presupuesto (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-[#7a879d]">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-2xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] py-3 pl-8 pr-4 text-sm text-[#22304f] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#6f7f9e]">Estado</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'active'})}
                    className={`
                      flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
                      ${formData.status === 'active'
                        ? 'border-[#83d5ba] bg-[rgba(15,159,110,0.08)] text-[#0f9f6e]'
                        : 'border-[#d8e3f7] text-[#6b7a99] hover:border-[rgba(15,159,110,0.25)]'}
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
                        ? 'border-[#cbd7eb] bg-[rgba(107,122,153,0.08)] text-[#5f6f8d]'
                        : 'border-[#d8e3f7] text-[#6b7a99] hover:border-[#cbd7eb]'}
                    `}
                  >
                    Inactivo
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] py-4 text-sm font-semibold text-white transition hover:bg-[#1f56cf]"
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
