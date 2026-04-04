import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Save, Loader2, RefreshCw, Calculator, UserPlus, Building2 } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../constants/categories';
import { useProjects } from '../../hooks/useProjects';
import { usePartners } from '../../hooks/usePartners';
import { TAX_RATES } from '../../constants/config';
import { formatCurrency, formatTaxRate } from '../../utils/formatters';

const TransactionFormModal = ({
 isOpen,
 onClose,
 onSubmit,
 editingTransaction,
 user,
 expenseCategories = EXPENSE_CATEGORIES,
 incomeCategories = INCOME_CATEGORIES,
 costCenters = [],
 transactions = [],
 defaultType = null
}) => {
 const { projects, loading: projectsLoading } = useProjects(user);
 const { partners, loading: partnersLoading } = usePartners(user);

 const [submitting, setSubmitting] = useState(false);

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
 recurringEndDate: '',
 taxRate: TAX_RATES.STANDARD, // Default 19% German VAT
 counterpartyId: '',
 counterpartyName: '',
 });

 // Description autocomplete state (legacy — kept for backward compat)
 const [showSuggestions, setShowSuggestions] = useState(false);
 const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
 const descriptionRef = useRef(null);
 const suggestionsRef = useRef(null);

 // Partner autocomplete state
 const [showPartnerSuggestions, setShowPartnerSuggestions] = useState(false);
 const [activePartnerIndex, setActivePartnerIndex] = useState(-1);
 const [partnerInput, setPartnerInput] = useState('');
 const partnerInputRef = useRef(null);
 const partnerSuggestionsRef = useRef(null);
 const [showCreateNewPartner, setShowCreateNewPartner] = useState(false);

 // Filtrar solo proyectos activos para el selector
 const activeProjects = useMemo(() => projects.filter(p => p.status === 'active'), [projects]);

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

 // Partner type filter: for income → client, for expense → vendor
 const partnerTypeFilter = formData.type === 'income' ? 'client' : 'vendor';

 // Compute active partners for autocomplete (filter by type + status active)
 const partnerSuggestions = useMemo(() => {
 const query = partnerInput.trim().toLowerCase();
 if (!query || query.length < 1) return [];
 return partners
 .filter(p => {
 const typeOk = p.type === partnerTypeFilter || p.type === 'both';
 return p.status === 'active' && typeOk && p.name.toLowerCase().includes(query);
 })
 .slice(0, 8);
 }, [partnerInput, partners, partnerTypeFilter]);

 // Whether user typed a name that doesn't exist as a partner
 const typedPartnerNotInList = useMemo(() => {
 const query = partnerInput.trim();
 if (!query || query.length < 2) return false;
 return !partners.some(p => p.name.toLowerCase() === query.toLowerCase());
 }, [partnerInput, partners]);

 // Close suggestions on click outside
 useEffect(() => {
 const handleClickOutside = (e) => {
 if (
 suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
 descriptionRef.current && !descriptionRef.current.contains(e.target)
 ) {
 setShowSuggestions(false);
 }
 if (
 partnerSuggestionsRef.current && !partnerSuggestionsRef.current.contains(e.target) &&
 partnerInputRef.current && !partnerInputRef.current.contains(e.target)
 ) {
 setShowPartnerSuggestions(false);
 setShowCreateNewPartner(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 useEffect(() => {
 if (editingTransaction) {
 // Backward compat: if taxRate is missing, default to 19%
 const existingTaxRate = editingTransaction.taxRate ?? TAX_RATES.STANDARD;
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
 recurringEndDate: editingTransaction.recurringEndDate || '',
 taxRate: existingTaxRate,
 counterpartyId: editingTransaction.counterpartyId || '',
 counterpartyName: editingTransaction.counterpartyName || '',
 });
 // Pre-fill partner input if editing a transaction with a known counterparty
 setPartnerInput(editingTransaction.counterpartyName || '');
 setShowPartnerSuggestions(false);
 setShowCreateNewPartner(false);
 } else {
 const firstProject = activeProjects[0]?.displayName || activeProjects[0]?.name || '';
 const initialType = defaultType || 'expense';
 const categories = initialType === 'income' ? incomeCategories : expenseCategories;
 setFormData({
 date: new Date().toISOString().split('T')[0],
 description: '',
 amount: '',
 type: initialType,
 category: categories[0] || '',
 project: firstProject,
 costCenter: 'Sin asignar',
 status: 'pending',
 comment: '',
 notes: [],
 isRecurring: false,
 recurringFrequency: 'monthly',
 recurringEndDate: '',
 taxRate: TAX_RATES.STANDARD,
 counterpartyId: '',
 counterpartyName: '',
 });
 setPartnerInput('');
 setShowPartnerSuggestions(false);
 setShowCreateNewPartner(false);
 }
 setShowSuggestions(false);
 }, [isOpen, editingTransaction]);

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
 amount: transaction.amount || formData.amount,
 // Carry forward tax rate from suggestion if available
 taxRate: transaction.taxRate ?? formData.taxRate ?? TAX_RATES.STANDARD,
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

 const handlePartnerInputChange = (e) => {
 const value = e.target.value;
 setPartnerInput(value);
 setShowPartnerSuggestions(value.trim().length >= 1);
 setActivePartnerIndex(-1);
 setShowCreateNewPartner(false);
 // Clear counterparty if user clears the input
 if (!value.trim()) {
 setFormData(prev => ({ ...prev, counterpartyId: '', counterpartyName: '' }));
 }
 };

 const handleSelectPartner = (partner) => {
 setPartnerInput(partner.name);
 setFormData(prev => ({
 ...prev,
 counterpartyId: partner.id,
 counterpartyName: partner.name,
 // Auto-fill partner's default tax rate if current tax rate is still the default
 taxRate: prev.taxRate === TAX_RATES.STANDARD
 ? (partner.defaultTaxRate ?? TAX_RATES.STANDARD)
 : prev.taxRate,
 }));
 setShowPartnerSuggestions(false);
 setShowCreateNewPartner(false);
 };

 const handlePartnerKeyDown = (e) => {
 const totalItems = partnerSuggestions.length + (typedPartnerNotInList ? 1 : 0);
 if (!showPartnerSuggestions || totalItems === 0) return;

 if (e.key === 'Escape') {
 setShowPartnerSuggestions(false);
 setShowCreateNewPartner(false);
 return;
 }
 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setActivePartnerIndex(prev => Math.min(prev + 1, totalItems - 1));
 } else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setActivePartnerIndex(prev => Math.max(prev - 1, 0));
 } else if (e.key === 'Enter') {
 e.preventDefault();
 if (activePartnerIndex >= 0 && activePartnerIndex < partnerSuggestions.length) {
 handleSelectPartner(partnerSuggestions[activePartnerIndex]);
 } else if (activePartnerIndex === partnerSuggestions.length && typedPartnerNotInList) {
 // "Crear nuevo" selected via keyboard
 handleSelectPartner({
 id: '__new__',
 name: partnerInput.trim(),
 defaultTaxRate: TAX_RATES.STANDARD,
 });
 }
 }
 };

 const handleCreateNewPartner = () => {
 // Signal that user wants to create a new partner — store typed name
 setFormData(prev => ({
 ...prev,
 counterpartyId: '__new__',
 counterpartyName: partnerInput.trim(),
 }));
 setShowPartnerSuggestions(false);
 setShowCreateNewPartner(false);
 // Parent should detect counterpartyId === '__new__' and open partner creation modal
 // For now we just store the name; partner will be created on first transaction save
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (submitting) return;

 const amount = parseFloat(formData.amount);
 if (!formData.description?.trim()) return;
 if (!amount || amount <= 0 || amount > 999999999) {
 return;
 }
 if (formData.description.trim().length > 200) {
 return;
 }
 if (!formData.project) {
 return;
 }

 setSubmitting(true);
 try {
 await onSubmit(formData);
 } finally {
 setSubmitting(false);
 }
 };

 if (!isOpen) return null;

 // Compute net amount from gross for display
 const grossAmount = parseFloat(formData.amount) || 0;
 const taxRate = formData.taxRate ?? TAX_RATES.STANDARD;
 const netAmount = taxRate > 0 ? grossAmount / (1 + taxRate) : grossAmount;
 const taxAmount = grossAmount - netAmount;

 const currentCategories = getCategoriesByType(formData.type);

 const frequencyOptions = [
 { value: 'weekly', label: 'Semanal' },
 { value: 'biweekly', label: 'Quincenal' },
 { value: 'monthly', label: 'Mensual' },
 { value: 'quarterly', label: 'Trimestral' },
 { value: 'yearly', label: 'Anual' }
 ];

 return (
 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 animate-fadeIn" role="dialog" aria-modal="true">
 <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] animate-scaleIn">
 <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-5">
 <div>
 <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
 {editingTransaction ? 'Editar transacción' : 'Nueva transacción'}
 </h3>
 <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
 {editingTransaction ? 'Actualiza los datos del registro seleccionado' : 'Ingresa los datos del nuevo registro'}
 </p>
 </div>
 <button
 onClick={onClose}
 className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
 aria-label="Cerrar"
 >
 <X size={20} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-5">
 <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-1.5">
 <button
 type="button"
 onClick={() => handleTypeChange('income')}
 className={`
 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all
 ${formData.type === 'income' 
 ? 'bg-white text-[var(--success)] ' 
 : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
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
 ? 'bg-white text-[var(--accent)] ' 
 : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
 `}
 >
 <ArrowDownCircle size={18} />
 Gasto
 </button>
 </div>

 <div className="flex items-center gap-2 pt-1">
 <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Detalles</span>
 <div className="h-px flex-1 bg-[var(--border)]" />
 </div>

 {/* Date & Amount & VAT */}
 <div className="grid grid-cols-3 gap-4">
 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
 Fecha <span className="text-[var(--accent)]">*</span>
 </label>
 <input
 type="date"
 required
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.date}
 onChange={e => setFormData({...formData, date: e.target.value})}
 />
 </div>
 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
 Bruto (EUR) <span className="text-[var(--accent)]">*</span>
 </label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium text-[var(--text-secondary)]">€</span>
 <input
 type="number"
 step="0.01"
 min="0.01"
 required
 placeholder="0.00"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-3 pl-8 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.amount}
 onChange={e => setFormData({...formData, amount: e.target.value})}
 />
 </div>
 </div>
 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
 IVA (USt) <span className="text-[var(--accent)]">*</span>
 </label>
 <div className="relative">
 <select
 required
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.taxRate}
 onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value)})}
 >
 <option value={TAX_RATES.STANDARD}>19% Std.</option>
 <option value={TAX_RATES.REDUCED}>7% Red.</option>
 <option value={TAX_RATES.ZERO}>0% Ex.</option>
 </select>
 </div>
 </div>
 </div>

 {/* Net/Bruto breakdown — shown when amount > 0 and tax > 0 */}
 {grossAmount > 0 && taxRate > 0 && (
 <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
 <div className="mb-2 flex items-center gap-1.5">
 <Calculator size={13} className="text-[var(--text-secondary)]" />
 <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Desglose IVA</span>
 </div>
 <div className="grid grid-cols-3 gap-3 text-sm">
 <div>
 <p className="text-[10px] text-[var(--text-secondary)]]">Neto (netto)</p>
 <p className="font-semibold text-[var(--text-primary)]">{formatCurrency(netAmount)}</p>
 </div>
 <div>
 <p className="text-[10px] text-[var(--text-secondary)]]">IVA {formatTaxRate(taxRate)}</p>
 <p className="font-semibold text-[var(--warning)]">{formatCurrency(taxAmount)}</p>
 </div>
 <div>
 <p className="text-[10px] text-[var(--text-secondary)]]">Bruto (brutto)</p>
 <p className="font-semibold text-[var(--text-primary)]">{formatCurrency(grossAmount)}</p>
 </div>
 </div>
 </div>
 )}

 {/* Partner / Geschäftspartner autocomplete */}
 <div className="relative">
 <label className="mb-2 flex items-center gap-2 block text-sm font-semibold text-[var(--text-disabled)]">
 <Building2 size={14} className="text-[var(--text-secondary)]" />
 {formData.type === 'income' ? 'Cliente' : 'Proveedor'}
 <span className="text-xs font-normal text-[var(--text-secondary)]">(opcional — autocompletado)</span>
 </label>
 {partnersLoading ? (
 <div className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-secondary)]">
 <Loader2 className="w-4 h-4 animate-spin" />
 Cargando partners...
 </div>
 ) : (
 <>
 <input
 ref={partnerInputRef}
 type="text"
 placeholder={
 formData.type === 'income'
 ? "Buscar o crear cliente..."
 : "Buscar o crear proveedor..."
 }
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={partnerInput}
 onChange={handlePartnerInputChange}
 onKeyDown={handlePartnerKeyDown}
 onFocus={() => partnerInput.trim().length >= 1 && setShowPartnerSuggestions(true)}
 autoComplete="off"
 />
 {showPartnerSuggestions && (partnerSuggestions.length > 0 || typedPartnerNotInList) && (
 <div
 ref={partnerSuggestionsRef}
 className="absolute left-0 right-0 z-[300] mt-1 overflow-hidden rounded-lg border border-[var(--border)] bg-white/98"
 style={{ boxShadow: 'none' }}
 >
 {partnerSuggestions.map((p, idx) => (
 <button
 key={p.id}
 type="button"
 onClick={() => handleSelectPartner(p)}
 className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
 idx === activePartnerIndex ? 'bg-transparent' : 'hover:bg-[var(--surface)]'
 } ${idx > 0 ? 'border-t border-[var(--surface)]' : ''}`}
 >
 <span className="font-medium text-[var(--text-primary)]">{p.name}</span>
 {p.email && <span className="ml-2 text-xs text-[var(--text-secondary)]">{p.email}</span>}
 {p.defaultTaxRate != null && p.defaultTaxRate !== 0.19 && (
 <span className="ml-2 rounded bg-transparent px-1.5 py-0.5 text-xs text-[var(--warning)]">
 IVA {(p.defaultTaxRate * 100).toFixed(0)}%
 </span>
 )}
 </button>
 ))}
 {typedPartnerNotInList && (
 <button
 type="button"
 onClick={handleCreateNewPartner}
 className={`w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors border-t border-[var(--surface)] hover:bg-[var(--surface)] ${
 activePartnerIndex === partnerSuggestions.length ? 'bg-transparent' : ''
 }`}
 >
 <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
 <UserPlus size={14} />
 Crear nuevo: "{partnerInput.trim()}"
 </span>
 <span className="ml-6 text-xs text-[var(--text-secondary)]">
 Se creará automáticamente al guardar la transacción
 </span>
 </button>
 )}
 </div>
 )}
 </>
 )}
 </div>

 <div className="relative">
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
 Descripción <span className="text-[var(--accent)]">*</span>
 </label>
 <input
 ref={descriptionRef}
 type="text"
 required
 placeholder={formData.type === 'income' 
 ? "ej. Venta de servicios, Factura #123..." 
 : "ej. Compra de materiales, Pago proveedor..."}
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.description}
 onChange={handleDescriptionChange}
 onKeyDown={handleDescriptionKeyDown}
 onFocus={() => formData.description.trim().length >= 2 && setShowSuggestions(true)}
 autoComplete="off"
 />
 {showSuggestions && suggestions.length > 0 && (
 <div
 ref={suggestionsRef}
 className="absolute left-0 right-0 z-[300] mt-1 overflow-hidden rounded-lg border border-[var(--border)] bg-white/98"
 style={{ boxShadow: 'none' }}
 >
 {suggestions.map((s, idx) => (
 <button
 key={s.id}
 type="button"
 onClick={() => handleSelectSuggestion(s)}
 className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
 idx === activeSuggestionIndex ? 'bg-transparent' : 'hover:bg-[var(--surface)]'
 } ${idx > 0 ? 'border-t border-[var(--surface)]' : ''}`}
 >
 <span className="font-medium text-[var(--text-primary)]">{s.description}</span>
 <span className="ml-2 text-xs text-[var(--text-secondary)]">
 {s.category} · €{Number(s.amount).toFixed(2)}
 </span>
 </button>
 ))}
 </div>
 )}
 </div>

 <div className="space-y-3">
 <label className="flex items-center gap-3 cursor-pointer group">
 <div className="relative">
 <input
 type="checkbox"
 className="sr-only peer"
 checked={formData.isRecurring}
 onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
 />
 <div className="h-5 w-10 rounded-full bg-[var(--border)] transition-colors peer-checked:bg-transparent"></div>
 <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[var(--surface)] transition-transform peer-checked:translate-x-5"></div>
 </div>
 <div className="flex items-center gap-2">
 <RefreshCw size={16} className="text-[var(--text-secondary)]" />
 <span className="text-sm font-semibold text-[var(--text-disabled)]">Transacción recurrente</span>
 </div>
 </label>

 {formData.isRecurring && (
 <div className="grid grid-cols-2 gap-4 pl-1 animate-fadeIn">
 <div>
 <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Frecuencia</label>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.recurringFrequency}
 onChange={e => setFormData({ ...formData, recurringFrequency: e.target.value })}
 >
 {frequencyOptions.map(opt => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Fecha fin (opcional)</label>
 <input
 type="date"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.recurringEndDate}
 onChange={e => setFormData({ ...formData, recurringEndDate: e.target.value })}
 />
 </div>
 </div>
 )}
 </div>

 <div className="flex items-center gap-2 pt-1">
 <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Clasificación</span>
 <div className="h-px flex-1 bg-[var(--border)]" />
 </div>

 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
 Proyecto <span className="text-[var(--accent)]">*</span>
 </label>
 <div className="relative">
 {projectsLoading ? (
 <div className="flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-[var(--text-secondary)]">
 <Loader2 className="w-4 h-4 animate-spin" />
 Cargando proyectos...
 </div>
 ) : activeProjects.length === 0 ? (
 <div className="w-full rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-3 text-sm text-[var(--warning)]">
 No hay proyectos activos. Crea uno primero en Configuración → Proyectos.
 </div>
 ) : (
 <select
 required
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
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

 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">Categoría</label>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.category}
 onChange={e => setFormData({...formData, category: e.target.value})}
 >
 {currentCategories.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>

 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">Centro de costo</label>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.costCenter}
 onChange={e => setFormData({...formData, costCenter: e.target.value})}
 >
 <option value="">Sin asignar</option>
 {costCenters.map(cc => (
 <option key={cc.id} value={cc.name}>{cc.name}</option>
 ))}
 </select>
 </div>

 <div className="flex items-center gap-2 pt-1">
 <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">Estado y notas</span>
 <div className="h-px flex-1 bg-[var(--border)]" />
 </div>

 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">Estado de pago</label>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setFormData({...formData, status: 'pending'})}
 className={`
 flex-1 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all
 ${formData.status === 'pending'
 ? 'border-[#e0b460] bg-transparent text-[var(--warning)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-visible)]'}
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
 ? 'border-[#7fcfb5] bg-transparent text-[var(--success)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-visible)]'}
 `}
 >
 Pagado
 </button>
 </div>
 </div>

 <div>
 <label className="mb-2 block text-sm font-semibold text-[var(--text-disabled)]">
 Comentario {editingTransaction ? '(agregar nota)' : '(opcional)'}
 </label>
 <textarea
 rows="3"
 placeholder={editingTransaction 
 ? "Agregar comentario sobre esta modificación..." 
 : "Agregar comentario inicial (opcional)..."}
 className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--text-primary)] "
 value={formData.comment}
 onChange={e => setFormData({...formData, comment: e.target.value})}
 />
 </div>

 <div className="flex gap-3 pt-1">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] py-3.5 font-semibold text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={submitting || projectsLoading || activeProjects.length === 0}
 className={`
 flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white
 transition-all duration-200 
 ${formData.type === 'income'
 ? 'bg-[var(--success)] hover:bg-[var(--success)]'
 : 'bg-[var(--text-primary)] hover:opacity-85'}
 ${(submitting || projectsLoading || activeProjects.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:'}
 `}
 >
 {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
 {submitting ? 'Guardando...' : editingTransaction ? 'Guardar cambios' : 'Crear transacción'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default TransactionFormModal;
