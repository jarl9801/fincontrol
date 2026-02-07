import { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Save, Loader2 } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { useProjects } from '../../hooks/useProjects';

const TransactionFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
  user,
  expenseCategories = EXPENSE_CATEGORIES,
  incomeCategories = INCOME_CATEGORIES,
  costCenters = []
}) => {
  const { projects, loading: projectsLoading } = useProjects(user);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    category: expenseCategories[0] || '',
    project: '',
    costCenter: 'Sin asignar',
    status: 'pending',
    comment: '',
    notes: []
  });

  // Filtrar solo proyectos activos para el selector
  const activeProjects = projects.filter(p => p.status === 'active');

  const getCategoriesByType = (type) => {
    return type === 'income' ? incomeCategories : expenseCategories;
  };

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        date: editingTransaction.date,
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        project: editingTransaction.project || '',
        costCenter: editingTransaction.costCenter || 'Sin asignar',
        status: editingTransaction.status,
        comment: '',
        notes: editingTransaction.notes || []
      });
    } else {
      // Reset form with first active project if available
      const firstProject = activeProjects[0]?.displayName || activeProjects[0]?.name || '';
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'expense',
        category: expenseCategories[0] || '',
        project: firstProject,
        costCenter: 'Sin asignar',
        status: 'pending',
        comment: '',
        notes: []
      });
    }
  }, [editingTransaction, isOpen, projects]);

  const handleTypeChange = (newType) => {
    const categories = getCategoriesByType(newType);
    setFormData({
      ...formData,
      type: newType,
      category: categories[0],
      costCenter: newType === 'income' ? 'Sin asignar' : formData.costCenter
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    if (!formData.project) {
      alert('Por favor selecciona un proyecto');
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const currentCategories = getCategoriesByType(formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h3 className="font-bold text-xl text-slate-800">
              {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {editingTransaction ? 'Modifica los detalles de la transacción' : 'Ingresa los datos de la nueva transacción'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`
                flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all
                ${formData.type === 'income' 
                  ? 'bg-white text-emerald-600 shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              <ArrowUpCircle size={18} />
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`
                flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all
                ${formData.type === 'expense' 
                  ? 'bg-white text-rose-600 shadow-md' 
                  : 'text-slate-500 hover:text-slate-700'}
              `}
            >
              <ArrowDownCircle size={18} />
              Gasto
            </button>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Monto (EUR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Descripción <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder={formData.type === 'income' 
                ? "ej. Venta de servicios, Factura #123..." 
                : "ej. Compra de materiales, Pago proveedor..."}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Proyecto <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              {projectsLoading ? (
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando proyectos...
                </div>
              ) : activeProjects.length === 0 ? (
                <div className="w-full px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                  No hay proyectos activos. Crea uno primero en Configuración → Proyectos.
                </div>
              ) : (
                <select
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm"
                  value={formData.project}
                  onChange={e => setFormData({...formData, project: e.target.value})}
                >
                  <option value="">Seleccionar proyecto...</option>
                  {activeProjects.map(p => (
                    <option key={p.id} value={p.displayName || `${p.code} (${p.name})`}>
                      {p.code} - {p.name} {p.client ? `| ${p.client}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Cost Center - Solo para gastos */}
          {formData.type === 'expense' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Centro de Costo</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm"
                value={formData.costCenter}
                onChange={e => setFormData({...formData, costCenter: e.target.value})}
              >
                <option value="Sin asignar">Sin asignar</option>
                {costCenters.map(cc => (
                  <option key={cc.id} value={cc.name}>{cc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Estado de Pago</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'pending'})}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
                  ${formData.status === 'pending'
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:border-amber-200'}
                `}
              >
                Pendiente
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'paid'})}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
                  ${formData.status === 'paid'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:border-emerald-200'}
                `}
              >
                Pagado
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Comentario {editingTransaction ? '(agregar nota)' : '(opcional)'}
            </label>
            <textarea
              rows="3"
              placeholder={editingTransaction 
                ? "Agregar comentario sobre esta modificación..." 
                : "Agregar comentario inicial (opcional)..."}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all text-sm resize-none"
              value={formData.comment}
              onChange={e => setFormData({...formData, comment: e.target.value})}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={projectsLoading || activeProjects.length === 0}
            className={`
              w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white
              transition-all duration-200 shadow-lg
              ${formData.type === 'income'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'}
              ${(projectsLoading || activeProjects.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl transform hover:-translate-y-0.5'}
            `}
          >
            <Save size={18} />
            {editingTransaction ? 'Guardar Cambios' : 'Crear Transacción'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
