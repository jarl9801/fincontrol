import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PROJECTS } from '../../constants/projects';
import { CATEGORIES } from '../../constants/categories';
import { COST_CENTERS } from '../../constants/costCenters';

const TransactionFormModal = ({ isOpen, onClose, onSubmit, editingTransaction, user }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    category: 'Materials',
    project: PROJECTS[0],
    costCenter: 'Sin asignar',
    status: 'pending',
    comment: '',
    notes: []
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        date: editingTransaction.date,
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        type: editingTransaction.type,
        category: editingTransaction.category,
        project: editingTransaction.project,
        costCenter: editingTransaction.costCenter || 'Sin asignar',
        status: editingTransaction.status,
        comment: '',
        notes: editingTransaction.notes || []
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        type: 'expense',
        category: 'Materials',
        project: PROJECTS[0],
        costCenter: 'Sin asignar',
        status: 'pending',
        comment: '',
        notes: []
      });
    }
  }, [editingTransaction, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            {editingTransaction ? 'Editar Transacción' : 'Nueva Transacción'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'income'})}
              className={`py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'expense'})}
              className={`py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'expense' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Gasto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Monto (EUR)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
            <input
              type="text"
              required
              placeholder="ej. Factura #1024 o Pago Subcontratista"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Proyecto</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                value={formData.project}
                onChange={e => setFormData({...formData, project: e.target.value})}
              >
                {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoría</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Centro de Costo</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              value={formData.costCenter}
              onChange={e => setFormData({...formData, costCenter: e.target.value})}
            >
              {COST_CENTERS.map(cc => <option key={cc} value={cc}>{cc}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Estado de Pago</label>
            <select
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
            >
              <option value="pending">Pendiente (No Pagado)</option>
              <option value="paid">Pagado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">
              Comentario {editingTransaction ? '(agregar nota)' : '(opcional)'}
            </label>
            <textarea
              rows="3"
              placeholder={editingTransaction ? "Agregar comentario sobre esta modificación..." : "Agregar comentario inicial (opcional)..."}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm resize-none"
              value={formData.comment}
              onChange={e => setFormData({...formData, comment: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors mt-4 shadow-md"
          >
            {editingTransaction ? 'Actualizar Transacción' : 'Guardar Transacción'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionFormModal;
