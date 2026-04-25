import React, { useState } from 'react';
import { TrendingDown, TrendingUp, Edit2, Trash2, X, Check, Plus, Loader2 } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import { Button } from '@/components/ui/nexus';

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
 card: 'border-[var(--border-visible)] bg-transparent',
 text: 'text-[var(--text-primary)]',
 subtle: 'text-[var(--text-secondary)]',
 edit: 'hover:bg-transparent hover:text-[var(--text-primary)]',
 delete: 'hover:bg-transparent hover:text-[var(--accent)]'
 }
 : {
 card: 'border-[var(--border-visible)] bg-transparent',
 text: 'text-[var(--text-primary)]',
 subtle: 'text-[var(--success)]',
 edit: 'hover:bg-transparent hover:text-[var(--text-primary)]',
 delete: 'hover:bg-transparent hover:text-[var(--accent)]'
 };

 if (isEditing) {
 return (
 <div className={`flex items-center gap-2 rounded-lg border p-3 ${accent.card}`}>
 <input
 type="text"
 className="flex-1 rounded-md border border-[var(--border-visible)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={editValue}
 onChange={(e) => setEditValue(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
 autoFocus
 />
 <button
 onClick={handleSaveEdit}
 className="rounded-md p-2 text-[var(--success)] transition-colors hover:bg-transparent"
 >
 <Check size={16} />
 </button>
 <button
 onClick={() => setEditingItem(null)}
 className="rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-transparent"
 >
 <X size={16} />
 </button>
 </div>
 );
 }

 return (
 <div className={`flex items-center justify-between rounded-lg border p-3 transition ${accent.card}`}>
 <span className={`text-sm font-medium ${accent.text}`}>{category}</span>
 <div className="flex items-center gap-1">
 <button
 onClick={() => handleEdit(type, index)}
 className={`rounded-md p-2 text-[var(--text-secondary)] transition-colors ${accent.edit}`}
 >
 <Edit2 size={14} />
 </button>
 <button
 onClick={() => handleDelete(type, index)}
 className={`rounded-md p-2 text-[var(--text-secondary)] transition-colors ${accent.delete}`}
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
 <Loader2 className="w-8 h-8 text-[var(--interactive)] animate-spin" />
 <span className="ml-3 text-[var(--text-secondary)]">Cargando categorias...</span>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-6 py-5 ">
 <p className="nd-label text-[var(--text-primary)]">Configuración financiera</p>
 <h2 className="mt-2 nd-display text-[24px] font-light tracking-[-0.03em] text-[var(--text-primary)]">Categorías</h2>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">Mantén el catálogo de ingresos y gastos con una estructura clara para el análisis financiero.</p>
 </div>

 <div className="rounded-md border border-[var(--border-visible)] bg-transparent p-6 ">
 <div className="flex items-center gap-3 mb-4">
 <div className="rounded-lg bg-transparent p-2.5">
 <TrendingDown className="text-[var(--text-disabled)]" size={16} />
 </div>
 <div>
 <h3 className="text-base font-medium tracking-[-0.02em] text-[var(--text-primary)]">Categorías de gastos</h3>
 <p className="text-sm text-[var(--text-secondary)]">{expenseCategories.length} categorías activas</p>
 </div>
 </div>

 <div className="flex gap-2 mb-4">
 <input
 type="text"
 placeholder="Nueva categoría de gasto..."
 className="flex-1 rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-visible)] "
 value={newExpense}
 onChange={(e) => setNewExpense(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddExpense()}
 />
 <Button variant="primary" icon={Plus} onClick={handleAddExpense}>
 Agregar
 </Button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
 {expenseCategories.map((category, index) => (
 <CategoryItem key={index} category={category} index={index} type="expense" />
 ))}
 </div>
 </div>

 <div className="rounded-md border border-[var(--border-visible)] bg-transparent p-6 ">
 <div className="flex items-center gap-3 mb-4">
 <div className="rounded-lg bg-transparent p-2.5">
 <TrendingUp className="text-[var(--text-disabled)]" size={16} />
 </div>
 <div>
 <h3 className="text-base font-medium tracking-[-0.02em] text-[var(--text-primary)]">Categorías de ingresos</h3>
 <p className="text-sm text-[var(--success)]">{incomeCategories.length} categorías activas</p>
 </div>
 </div>

 <div className="flex gap-2 mb-4">
 <input
 type="text"
 placeholder="Nueva categoría de ingreso..."
 className="flex-1 rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--border-visible)] "
 value={newIncome}
 onChange={(e) => setNewIncome(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddIncome()}
 />
 <Button variant="primary" icon={Plus} onClick={handleAddIncome}>
 Agregar
 </Button>
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
