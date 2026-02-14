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

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 p-3 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a]">
          <input
            type="text"
            className="flex-1 px-3 py-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
            autoFocus
          />
          <button
            onClick={handleSaveEdit}
            className="p-1.5 text-[#34d399] hover:bg-[rgba(16,185,129,0.12)] rounded transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setEditingItem(null)}
            className="p-1.5 text-[#6868a0] hover:bg-[rgba(255,255,255,0.05)] rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg border border-[#2a2a4a] hover:border-[#3a3a5a] transition-colors">
        <span className="text-sm text-[#b8b8d0]">{category}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(type, index)}
            className="p-1.5 text-[#6868a0] hover:text-[#60a5fa] hover:bg-[rgba(59,130,246,0.08)] rounded transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(type, index)}
            className="p-1.5 text-[#6868a0] hover:text-[#f87171] hover:bg-[rgba(239,68,68,0.08)] rounded transition-colors"
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
        <Loader2 className="w-8 h-8 text-[#60a5fa] animate-spin" />
        <span className="ml-3 text-[#8888b0]">Cargando categorias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Categorias de Gastos */}
      <div className="bg-[rgba(239,68,68,0.08)] rounded-2xl p-6 border border-[rgba(239,68,68,0.2)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(239,68,68,0.12)] rounded-lg">
            <TrendingDown className="text-[#f87171]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Categorias de Gastos</h3>
            <p className="text-sm text-[#f87171]">{expenseCategories.length} categorias</p>
          </div>
        </div>

        {/* Agregar nueva categoria de gasto */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nueva categoria de gasto..."
            className="flex-1 px-3 py-2 text-sm border border-[rgba(239,68,68,0.25)] rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none bg-[#1a1a2e]"
            value={newExpense}
            onChange={(e) => setNewExpense(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
          />
          <button
            onClick={handleAddExpense}
            className="flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-colors"
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

      {/* Categorias de Ingresos */}
      <div className="bg-[rgba(16,185,129,0.08)] rounded-2xl p-6 border border-[rgba(16,185,129,0.2)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-[rgba(16,185,129,0.12)] rounded-lg">
            <TrendingUp className="text-[#34d399]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-800">Categorias de Ingresos</h3>
            <p className="text-sm text-[#34d399]">{incomeCategories.length} categorias</p>
          </div>
        </div>

        {/* Agregar nueva categoria de ingreso */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nueva categoria de ingreso..."
            className="flex-1 px-3 py-2 text-sm border border-[rgba(16,185,129,0.25)] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-[#1a1a2e]"
            value={newIncome}
            onChange={(e) => setNewIncome(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddIncome()}
          />
          <button
            onClick={handleAddIncome}
            className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
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
