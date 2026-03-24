import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Edit2, Trash2, X, Check, Plus, Loader2 } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';

const Categories = ({ user }) => {
  const {
    expenseCategories,
    incomeCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCategories(user);

  const [editingItem, setEditingItem] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [newExpense, setNewExpense] = useState('');
  const [newIncome, setNewIncome] = useState('');

  const handleEdit = (type, index) => {
    setEditingItem({ type, index });
    setEditValue(type === 'expense' ? expenseCategories[index] : incomeCategories[index]);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || !editingItem) return;

    const oldValue = editingItem.type === 'expense'
      ? expenseCategories[editingItem.index]
      : incomeCategories[editingItem.index];

    await updateCategory(oldValue, editValue.trim(), editingItem.type);
    setEditingItem(null);
    setEditValue('');
  };

  const handleDelete = async (type, index) => {
    const category = type === 'expense' ? expenseCategories[index] : incomeCategories[index];
    await deleteCategory(category, type);
  };

  const handleAddExpense = async () => {
    if (newExpense.trim() && !expenseCategories.includes(newExpense.trim())) {
      await addCategory(newExpense.trim(), 'expense');
      setNewExpense('');
    }
  };

  const handleAddIncome = async () => {
    if (newIncome.trim() && !incomeCategories.includes(newIncome.trim())) {
      await addCategory(newIncome.trim(), 'income');
      setNewIncome('');
    }
  };

  const CategoryItem = ({ category, index, type }) => {
    const isEditing = editingItem?.type === type && editingItem?.index === index;
    const accent = type === 'expense'
      ? {
          card: 'border-[rgba(208,76,54,0.14)] bg-[rgba(255,248,246,0.94)]',
          text: 'text-[#2a3550]',
          subtle: 'text-[#7b6b67]',
          edit: 'hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]',
          delete: 'hover:bg-[rgba(208,76,54,0.08)] hover:text-[#d04c36]'
        }
      : {
          card: 'border-[rgba(15,159,110,0.14)] bg-[rgba(244,252,248,0.96)]',
          text: 'text-[#2a3550]',
          subtle: 'text-[#648277]',
          edit: 'hover:bg-[rgba(59,130,246,0.08)] hover:text-[#2563eb]',
          delete: 'hover:bg-[rgba(208,76,54,0.08)] hover:text-[#d04c36]'
        };

    if (isEditing) {
      return (
        <div className={`flex items-center gap-2 rounded-2xl border p-3 shadow-[0_12px_32px_rgba(134,153,186,0.08)] ${accent.card}`}>
          <input
            type="text"
            className="flex-1 rounded-xl border border-[#cfe0fb] bg-white/90 px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
          />
          <button
            onClick={handleSaveEdit}
            className="rounded-xl p-2 text-[#0f9f6e] transition-colors hover:bg-[rgba(15,159,110,0.08)]"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setEditingItem(null)}
            className="rounded-xl p-2 text-[#7a879d] transition-colors hover:bg-[rgba(94,115,159,0.08)]"
          >
            <X size={16} />
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center justify-between rounded-2xl border p-3 shadow-[0_12px_32px_rgba(134,153,186,0.08)] transition ${accent.card}`}>
        <span className={`text-sm font-medium ${accent.text}`}>{category}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(type, index)}
            className={`rounded-xl p-2 text-[#7a879d] transition-colors ${accent.edit}`}
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(type, index)}
            className={`rounded-xl p-2 text-[#7a879d] transition-colors ${accent.delete}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#0a84ff] animate-spin" />
        <span className="ml-3 text-[#8e8e93]">Cargando categorias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Configuración financiera</p>
        <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Categorías</h2>
        <p className="mt-1 text-sm text-[#6b7a99]">Mantén el catálogo de ingresos y gastos con una estructura clara para el análisis financiero.</p>
      </div>

      <div className="rounded-[28px] border border-[rgba(208,76,54,0.16)] bg-[rgba(255,252,250,0.88)] p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-[rgba(208,76,54,0.1)] p-2.5">
            <TrendingDown className="text-[#d04c36]" size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">Categorías de gastos</h3>
            <p className="text-sm text-[#8a6d66]">{expenseCategories.length} categorías activas</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nueva categoría de gasto..."
            className="flex-1 rounded-2xl border border-[rgba(208,76,54,0.18)] bg-white/90 px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[rgba(208,76,54,0.34)] focus:ring-2 focus:ring-[rgba(208,76,54,0.12)]"
            value={newExpense}
            onChange={(e) => setNewExpense(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
          />
          <button
            onClick={handleAddExpense}
            className="inline-flex items-center gap-1 rounded-2xl bg-[#d04c36] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8412f]"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenseCategories.map((category, index) => (
            <CategoryItem key={index} category={category} index={index} type="expense" />
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-[rgba(15,159,110,0.16)] bg-[rgba(247,253,250,0.9)] p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-[rgba(15,159,110,0.1)] p-2.5">
            <TrendingUp className="text-[#0f9f6e]" size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">Categorías de ingresos</h3>
            <p className="text-sm text-[#628173]">{incomeCategories.length} categorías activas</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nueva categoría de ingreso..."
            className="flex-1 rounded-2xl border border-[rgba(15,159,110,0.18)] bg-white/90 px-4 py-2.5 text-sm text-[#22304f] outline-none transition focus:border-[rgba(15,159,110,0.34)] focus:ring-2 focus:ring-[rgba(15,159,110,0.12)]"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddIncome()}
          />
          <button
            onClick={handleAddIncome}
            className="inline-flex items-center gap-1 rounded-2xl bg-[#0f9f6e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c875d]"
          >
            <Plus size={16} /> Agregar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {incomeCategories.map((category, index) => (
            <CategoryItem key={index} category={category} index={index} type="income" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
