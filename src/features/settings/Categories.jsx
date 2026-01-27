import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Edit2, Trash2, X, Check, Plus } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';

const Categories = () => {
  const [expenseCategories, setExpenseCategories] = useState(EXPENSE_CATEGORIES);
  const [incomeCategories, setIncomeCategories] = useState(INCOME_CATEGORIES);
  const [editingItem, setEditingItem] = useState(null); // { type: 'expense' | 'income', index: number }
  const [editValue, setEditValue] = useState('');
  const [newExpense, setNewExpense] = useState('');
  const [newIncome, setNewIncome] = useState('');

  const handleEdit = (type, index) => {
    setEditingItem({ type, index });
    setEditValue(type === 'expense' ? expenseCategories[index] : incomeCategories[index]);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim() || !editingItem) return;

    if (editingItem.type === 'expense') {
      const updated = [...expenseCategories];
      updated[editingItem.index] = editValue.trim();
      setExpenseCategories(updated);
    } else {
      const updated = [...incomeCategories];
      updated[editingItem.index] = editValue.trim();
      setIncomeCategories(updated);
    }
    setEditingItem(null);
    setEditValue('');
  };

  const handleDelete = (type, index) => {
    if (type === 'expense') {
      setExpenseCategories(expenseCategories.filter((_, i) => i !== index));
    } else {
      setIncomeCategories(incomeCategories.filter((_, i) => i !== index));
    }
  };

  const handleAddExpense = () => {
    if (newExpense.trim() && !expenseCategories.includes(newExpense.trim())) {
      setExpenseCategories([...expenseCategories, newExpense.trim()].sort());
      setNewExpense('');
    }
  };

  const handleAddIncome = () => {
    if (newIncome.trim() && !incomeCategories.includes(newIncome.trim())) {
      setIncomeCategories([...incomeCategories, newIncome.trim()].sort());
      setNewIncome('');
    }
  };

  const CategoryItem = ({ category, index, type }) => {
    const isEditing = editingItem?.type === type && editingItem?.index === index;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200">
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
            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => setEditingItem(null)}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
        <span className="text-sm text-slate-700">{category}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(type, index)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(type, index)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Categorías de Gastos */}
      <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-100 rounded-lg">
            <TrendingDown className="text-rose-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-rose-800">Categorias de Gastos</h3>
            <p className="text-sm text-rose-600">{expenseCategories.length} categorias</p>
          </div>
        </div>

        {/* Agregar nueva categoría de gasto */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nueva categoria de gasto..."
            className="flex-1 px-3 py-2 text-sm border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none bg-white"
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

      {/* Categorías de Ingresos */}
      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <TrendingUp className="text-emerald-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-800">Categorias de Ingresos</h3>
            <p className="text-sm text-emerald-600">{incomeCategories.length} categorias</p>
          </div>
        </div>

        {/* Agregar nueva categoría de ingreso */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nueva categoria de ingreso..."
            className="flex-1 px-3 py-2 text-sm border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
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
