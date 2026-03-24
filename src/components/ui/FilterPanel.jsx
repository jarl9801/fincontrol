import { Filter } from 'lucide-react';
import { PROJECTS } from '../../constants/projects';
import { CATEGORIES } from '../../constants/categories';

const FilterPanel = ({ filters, setFilters, onApply }) => (
  <div className="space-y-4 rounded-[28px] border border-[#dce6f8] bg-white/88 p-6 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-base font-semibold tracking-[-0.02em] text-[#1f2a44]">
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
        className="text-sm font-medium text-[#2563eb]"
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
            ? 'border-[#7aa2ff] bg-[rgba(59,130,246,0.08)] text-[#2563eb]'
            : 'border-[#d8e3f7] text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)]'
        }`}
      >
        Este mes
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'quarter' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'quarter'
            ? 'border-[#7aa2ff] bg-[rgba(59,130,246,0.08)] text-[#2563eb]'
            : 'border-[#d8e3f7] text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)]'
        }`}
      >
        Trimestre
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'year' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'year'
            ? 'border-[#7aa2ff] bg-[rgba(59,130,246,0.08)] text-[#2563eb]'
            : 'border-[#d8e3f7] text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)]'
        }`}
      >
        Este año
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'all' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'all'
            ? 'border-[#7aa2ff] bg-[rgba(59,130,246,0.08)] text-[#2563eb]'
            : 'border-[#d8e3f7] text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)]'
        }`}
      >
        Todo
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#70819f]">Desde</label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
          value={filters.dateFrom}
          onChange={e => setFilters({...filters, dateFrom: e.target.value})}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#70819f]">Hasta</label>
        <input
          type="date"
          className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
          value={filters.dateTo}
          onChange={e => setFilters({...filters, dateTo: e.target.value})}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#70819f]">Proyecto</label>
        <select
          className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
          value={filters.project}
          onChange={e => setFilters({...filters, project: e.target.value})}
        >
          <option value="">Todos</option>
          {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#70819f]">Categoría</label>
        <select
          className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Todas</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#70819f]">Tipo</label>
        <select
          className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
        >
          <option value="">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-[#70819f]">Estado</label>
        <select
          className="w-full rounded-xl border border-[#d8e3f7] bg-[rgba(247,250,255,0.95)] px-3 py-2 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
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
      className="w-full rounded-2xl bg-[#2563eb] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1f56cf]"
    >
      Aplicar filtros
  </button>
</div>
);

export default FilterPanel;
