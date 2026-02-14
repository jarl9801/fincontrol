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
  MoreVertical,
  Power,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { formatDate } from '../../utils/formatters';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Toast from '../../components/ui/Toast';

const Projects = ({ user }) => {
  const { projects, loading, createProject, updateProject, deleteProject, toggleProjectStatus } = useProjects(user);
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
            <p className="text-[#8888b0]">Cargando proyectos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#d0d0e0]">Gestión de Proyectos</h2>
          <p className="text-sm text-[#8888b0] mt-1">
            Administra los proyectos disponibles para las transacciones
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus size={18} /> Nuevo Proyecto
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#1a1a2e] p-5 rounded-2xl shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(59,130,246,0.12)] rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#60a5fa]" />
            </div>
            <div>
              <p className="text-sm text-[#8888b0]">Total Proyectos</p>
              <p className="text-2xl font-bold text-[#d0d0e0]">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a2e] p-5 rounded-2xl shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(16,185,129,0.12)] rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#34d399]" />
            </div>
            <div>
              <p className="text-sm text-[#8888b0]">Activos</p>
              <p className="text-2xl font-bold text-[#34d399]">{activeProjects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#1a1a2e] p-5 rounded-2xl shadow-sm border border-[#2a2a4a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1e1e38] rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-[#9898b8]" />
            </div>
            <div>
              <p className="text-sm text-[#8888b0]">Inactivos</p>
              <p className="text-2xl font-bold text-[#9898b8]">{inactiveProjects.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6868a0]" size={18} />
        <input
          type="text"
          placeholder="Buscar proyectos por código, nombre o cliente..."
          className="w-full pl-12 pr-4 py-3 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Projects Table */}
      <div className="bg-[#1a1a2e] rounded-2xl shadow-sm border border-[#2a2a4a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(255,255,255,0.02)] border-b border-[#2a2a4a]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#8888b0] uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#8888b0] uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#8888b0] uppercase tracking-wider hidden md:table-cell">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#8888b0] uppercase tracking-wider hidden sm:table-cell">Fechas</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#8888b0] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#8888b0] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a4a]">
              {activeProjects.map((project) => (
                <tr key={project.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-[rgba(59,130,246,0.12)] text-[#60a5fa] rounded-lg text-sm font-bold">
                      {project.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#d0d0e0]">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-[#8888b0] mt-0.5 truncate max-w-xs">{project.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#6868a0]" />
                      <span className="text-sm text-[#9898b8]">{project.client || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm text-[#8888b0]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {project.startDate ? formatDate(project.startDate) : '-'} 
                        {project.endDate && ` → ${formatDate(project.endDate)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[rgba(16,185,129,0.12)] text-[#34d399] rounded-full text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(project)}
                        className="p-2 text-[#6868a0] hover:text-[#9898b8] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all"
                        title="Desactivar"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-2 text-[#6868a0] hover:text-[#60a5fa] hover:bg-[rgba(59,130,246,0.08)] rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="p-2 text-[#6868a0] hover:text-[#f87171] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Inactive Projects */}
              {inactiveProjects.map((project) => (
                <tr key={project.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors bg-[rgba(255,255,255,0.02)]">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 bg-[#252540] text-[#9898b8] rounded-lg text-sm font-bold">
                      {project.code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-[#8888b0] line-through">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-[#6868a0] mt-0.5 truncate max-w-xs">{project.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#6868a0]" />
                      <span className="text-sm text-[#6868a0]">{project.client || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm text-[#6868a0]">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {project.startDate ? formatDate(project.startDate) : '-'} 
                        {project.endDate && ` → ${formatDate(project.endDate)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#252540] text-[#9898b8] rounded-full text-xs font-medium">
                      Inactivo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(project)}
                        className="p-2 text-[#6868a0] hover:text-[#34d399] hover:bg-[rgba(16,185,129,0.08)] rounded-lg transition-all"
                        title="Activar"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(project)}
                        className="p-2 text-[#6868a0] hover:text-[#60a5fa] hover:bg-[rgba(59,130,246,0.08)] rounded-lg transition-all"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProjectToDelete(project)}
                        className="p-2 text-[#6868a0] hover:text-[#f87171] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#6868a0]">
                      <div className="w-16 h-16 bg-[#1e1e38] rounded-full flex items-center justify-center">
                        <Briefcase className="w-8 h-8 text-[#585890]" />
                      </div>
                      <p className="text-sm">No se encontraron proyectos</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-sm text-[#60a5fa] hover:text-[#60a5fa]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1a1a2e] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[#2a2a4a] flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h3 className="font-bold text-xl text-[#d0d0e0]">
                  {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-2 text-[#6868a0] hover:text-[#9898b8] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Code and Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                    Código <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PROY-001"
                    className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all uppercase"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                    Nombre <span className="text-[#f87171]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre del proyecto"
                    className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              {/* Client */}
              <div>
                <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                  Cliente
                </label>
                <input
                  type="text"
                  placeholder="Nombre del cliente"
                  className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                  value={formData.client}
                  onChange={e => setFormData({...formData, client: e.target.value})}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                  Descripción
                </label>
                <textarea
                  rows="2"
                  placeholder="Descripción breve del proyecto..."
                  className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                    value={formData.startDate}
                    onChange={e => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                    value={formData.endDate}
                    onChange={e => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                  Presupuesto (EUR)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6868a0] font-medium">€</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">Estado</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: 'active'})}
                    className={`
                      flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
                      ${formData.status === 'active'
                        ? 'border-emerald-400 bg-[rgba(16,185,129,0.08)] text-[#34d399]'
                        : 'border-[#2a2a4a] text-[#9898b8] hover:border-[rgba(16,185,129,0.25)]'}
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
                        ? 'border-slate-400 bg-[#1e1e38] text-[#b8b8d0]'
                        : 'border-[#2a2a4a] text-[#9898b8] hover:border-[#3a3a5a]'}
                    `}
                  >
                    Inactivo
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Check size={18} />
                {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
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
