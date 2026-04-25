import { Filter } from 'lucide-react';
import { PROJECTS } from '../../constants/projects';
import { CATEGORIES } from '../../constants/categories';

const FilterPanel = ({ filters, setFilters, onApply }) => (
 <div className="space-y-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-6 ">
 <div className="flex items-center justify-between">
 <h3 className="flex items-center gap-2 text-base font-medium tracking-[-0.02em] text-[var(--text-primary)]">
 <Filter size={18} /> Filtros
 </h3>
 <button
 onClick={() => {
 setFilters({
 dateFrom: '',
 dateTo: '',
 project: '',
 category: '',
 type: '',
 status: '',
 quickFilter: 'all'
 });
 onApply();
 }}
 className="text-sm font-medium text-[var(--text-primary)]"
 >
 Limpiar filtros
 </button>
 </div>

 {/* Quick Filters */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
 <button
 onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'month' }))}
 className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
 filters.quickFilter === 'month'
 ? 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-transparent'
 }`}
 >
 Este mes
 </button>
 <button
 onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'quarter' }))}
 className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
 filters.quickFilter === 'quarter'
 ? 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-transparent'
 }`}
 >
 Trimestre
 </button>
 <button
 onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'year' }))}
 className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
 filters.quickFilter === 'year'
 ? 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-transparent'
 }`}
 >
 Este año
 </button>
 <button
 onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'all' }))}
 className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
 filters.quickFilter === 'all'
 ? 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
 : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-transparent'
 }`}
 >
 Todo
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 <div>
 <label className="mb-1 block nd-label text-[var(--text-secondary)]">Desde</label>
 <input
 type="date"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={filters.dateFrom}
 onChange={e => setFilters({...filters, dateFrom: e.target.value})}
 />
 </div>
 <div>
 <label className="mb-1 block nd-label text-[var(--text-secondary)]">Hasta</label>
 <input
 type="date"
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={filters.dateTo}
 onChange={e => setFilters({...filters, dateTo: e.target.value})}
 />
 </div>
 <div>
 <label className="mb-1 block nd-label text-[var(--text-secondary)]">Proyecto</label>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={filters.project}
 onChange={e => setFilters({...filters, project: e.target.value})}
 >
 <option value="">Todos</option>
 {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 </div>
 <div>
 <label className="mb-1 block nd-label text-[var(--text-secondary)]">Categoría</label>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={filters.category}
 onChange={e => setFilters({...filters, category: e.target.value})}
 >
 <option value="">Todas</option>
 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
 </select>
 </div>
 <div>
 <label className="mb-1 block nd-label text-[var(--text-secondary)]">Tipo</label>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={filters.type}
 onChange={e => setFilters({...filters, type: e.target.value})}
 >
 <option value="">Todos</option>
 <option value="income">Ingresos</option>
 <option value="expense">Gastos</option>
 </select>
 </div>
 <div>
 <label className="mb-1 block nd-label text-[var(--text-secondary)]">Estado</label>
 <select
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={filters.status}
 onChange={e => setFilters({...filters, status: e.target.value})}
 >
 <option value="">Todos</option>
 <option value="paid">Pagados</option>
 <option value="pending">Pendientes</option>
 </select>
 </div>
 </div>

 <button
 onClick={onApply}
 className="w-full rounded-full bg-[var(--text-display)] py-2.5 nd-mono text-[13px] uppercase tracking-[0.06em] text-[var(--black)] transition hover:opacity-85"
 >
 Aplicar filtros
 </button>
</div>
);

export default FilterPanel;
