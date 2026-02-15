import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Save, Loader2, RefreshCw } from 'lucide-react';
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
  costCenters = [],
  transactions = []
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
    notes: [],
    isRecurring: false,
    recurringFrequency: 'monthly',
    recurringEndDate: ''
  });

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const descriptionRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Filtrar solo proyectos activos para el selector
  const activeProjects = projects.filter(p => p.status === 'active');

  const getCategoriesByType = (type) => {
    return type === 'income' ? incomeCategories : expenseCategories;
  };

  // Compute suggestions based on description input and transaction type
  const suggestions = useMemo(() => {
    const query = formData.description.trim().toLowerCase();
    if (!query || query.length < 2) return [];

    const seen = new Set();
    return transactions
      .filter(t => t.type === formData.type && t.description?.toLowerCase().includes(query))
      .filter(t => {
        const key = t.description.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 5);
  }, [formData.description, formData.type, transactions]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
        descriptionRef.current && !descriptionRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        notes: editingTransaction.notes || [],
        isRecurring: editingTransaction.isRecurring || false,
        recurringFrequency: editingTransaction.recurringFrequency || 'monthly',
        recurringEndDate: editingTransaction.recurringEndDate || ''
      });
    } else {
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
        notes: [],
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: ''
      });
    }
    setShowSuggestions(false);
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

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, description: value });
    setShowSuggestions(value.trim().length >= 2);
    setActiveSuggestionIndex(-1);
  };

  const handleSelectSuggestion = (transaction) => {
    setFormData({
      ...formData,
      description: transaction.description,
      category: transaction.category || formData.category,
      project: transaction.project || formData.project,
      amount: transaction.amount || formData.amount
    });
    setShowSuggestions(false);
  };

  const handleDescriptionKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'Escape') {
      setShowSuggestions(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[activeSuggestionIndex]);
    }
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

  const frequencyOptions = [
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'yearly', label: 'Anual' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#1a1a2e] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2a2a4a] flex justify-between items-center bg-[#1e1e38]">
          <div>
            <h3 className="font-bold text-xl text-[#d0d0e0]">
              {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
            </h3>
            <p className="text-sm text-[#8888b0] mt-0.5">
              {editingTransaction ? 'Modifica los detalles de la transacción' : 'Ingresa los datos de la nueva transacción'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-[#6868a0] hover:text-[#9898b8] hover:bg-[rgba(255,255,255,0.05)] rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#1e1e38] rounded-2xl">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`
                flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all
                ${formData.type === 'income' 
                  ? 'bg-[#1a1a2e] text-[#34d399] shadow-md' 
                  : 'text-[#8888b0] hover:text-[#b8b8d0]'}
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
                  ? 'bg-[#1a1a2e] text-[#f87171] shadow-md' 
                  : 'text-[#8888b0] hover:text-[#b8b8d0]'}
              `}
            >
              <ArrowDownCircle size={18} />
              Gasto
            </button>
          </div>

          {/* Date & Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                Fecha <span className="text-[#f87171]">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
                Monto (EUR) <span className="text-[#f87171]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6868a0] font-medium">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Description with Autocomplete */}
          <div className="relative">
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
              Descripción <span className="text-[#f87171]">*</span>
            </label>
            <input
              ref={descriptionRef}
              type="text"
              required
              placeholder={formData.type === 'income' 
                ? "ej. Venta de servicios, Factura #123..." 
                : "ej. Compra de materiales, Pago proveedor..."}
              className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all"
              value={formData.description}
              onChange={handleDescriptionChange}
              onKeyDown={handleDescriptionKeyDown}
              onFocus={() => formData.description.trim().length >= 2 && setShowSuggestions(true)}
              autoComplete="off"
            />
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 left-0 right-0 mt-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl shadow-lg overflow-hidden"
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      idx === activeSuggestionIndex ? 'bg-[#1e1e38]' : 'hover:bg-[#13132a]'
                    } ${idx > 0 ? 'border-t border-[#2a2a4a]' : ''}`}
                  >
                    <span className="font-medium text-[#d0d0e0]">{s.description}</span>
                    <span className="text-xs text-[#6868a0] ml-2">
                      {s.category} · €{Number(s.amount).toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Transaction Toggle */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                <div className="w-10 h-5 bg-[#252540] rounded-full peer-checked:bg-[rgba(16,185,129,0.08)]0 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-[#1a1a2e] rounded-full shadow-sm transition-transform peer-checked:translate-x-5"></div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-[#8888b0]" />
                <span className="text-sm font-semibold text-[#b8b8d0]">Transacción recurrente</span>
              </div>
            </label>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-1 animate-fadeIn">
                <div>
                  <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Frecuencia</label>
                  <select
                    className="w-full px-3 py-2.5 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all text-sm"
                    value={formData.recurringFrequency}
                    onChange={e => setFormData({ ...formData, recurringFrequency: e.target.value })}
                  >
                    {frequencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9898b8] mb-1.5">Fecha fin (opcional)</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all text-sm"
                    value={formData.recurringEndDate}
                    onChange={e => setFormData({ ...formData, recurringEndDate: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Project */}
          <div>
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
              Proyecto <span className="text-[#f87171]">*</span>
            </label>
            <div className="relative">
              {projectsLoading ? (
                <div className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl flex items-center gap-2 text-[#8888b0]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando proyectos...
                </div>
              ) : activeProjects.length === 0 ? (
                <div className="w-full px-4 py-3 bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.25)] rounded-xl text-[#fbbf24] text-sm">
                  No hay proyectos activos. Crea uno primero en Configuración → Proyectos.
                </div>
              ) : (
                <select
                  required
                  className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all text-sm"
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
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">Categoría</label>
            <select
              className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all text-sm"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Cost Center - Solo para gastos */}
          {formData.type === 'expense' && (
            <div>
              <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">Centro de Costo</label>
              <select
                className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all text-sm"
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
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">Estado de Pago</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, status: 'pending'})}
                className={`
                  flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
                  ${formData.status === 'pending'
                    ? 'border-amber-400 bg-[rgba(245,158,11,0.08)] text-[#fbbf24]'
                    : 'border-[#2a2a4a] text-[#9898b8] hover:border-[rgba(245,158,11,0.25)]'}
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
                    ? 'border-emerald-400 bg-[rgba(16,185,129,0.08)] text-[#34d399]'
                    : 'border-[#2a2a4a] text-[#9898b8] hover:border-[rgba(16,185,129,0.25)]'}
                `}
              >
                Pagado
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-[#b8b8d0] mb-2">
              Comentario {editingTransaction ? '(agregar nota)' : '(opcional)'}
            </label>
            <textarea
              rows="3"
              placeholder={editingTransaction 
                ? "Agregar comentario sobre esta modificación..." 
                : "Agregar comentario inicial (opcional)..."}
              className="w-full px-4 py-3 bg-[#13132a] border border-[#2a2a4a] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-[#1a1a2e] outline-none transition-all text-sm resize-none"
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
