import { Filter } from 'lucide-react';
import { PROJECTS } from '../../constants/projects';
import { CATEGORIES } from '../../constants/categories';

const FilterPanel = ({ filters, setFilters, onApply }) => (
  <div className="bg-[#1a1a2e] p-6 rounded-xl shadow-sm border border-[#2a2a4a] space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-bold text-[#d0d0e0] flex items-center gap-2">
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
        className="text-sm text-[#60a5fa] hover:text-[#60a5fa]"
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
            ? 'bg-[rgba(59,130,246,0.08)] border-blue-500 text-[#60a5fa]'
            : 'border-[#2a2a4a] text-[#9898b8] hover:bg-[#13132a]'
        }`}
      >
        Este mes
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'quarter' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'quarter'
            ? 'bg-[rgba(59,130,246,0.08)] border-blue-500 text-[#60a5fa]'
            : 'border-[#2a2a4a] text-[#9898b8] hover:bg-[#13132a]'
        }`}
      >
        Trimestre
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'year' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'year'
            ? 'bg-[rgba(59,130,246,0.08)] border-blue-500 text-[#60a5fa]'
            : 'border-[#2a2a4a] text-[#9898b8] hover:bg-[#13132a]'
        }`}
      >
        Este año
      </button>
      <button
        onClick={() => setFilters(prev => ({ ...prev, quickFilter: 'all' }))}
        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
          filters.quickFilter === 'all'
            ? 'bg-[rgba(59,130,246,0.08)] border-blue-500 text-[#60a5fa]'
            : 'border-[#2a2a4a] text-[#9898b8] hover:bg-[#13132a]'
        }`}
      >
        Todo
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-xs font-semibold text-[#8888b0] mb-1">Desde</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-[#3a3a5a] rounded-lg text-sm"
          value={filters.dateFrom}
          onChange={e => setFilters({...filters, dateFrom: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#8888b0] mb-1">Hasta</label>
        <input
          type="date"
          className="w-full px-3 py-2 border border-[#3a3a5a] rounded-lg text-sm"
          value={filters.dateTo}
          onChange={e => setFilters({...filters, dateTo: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#8888b0] mb-1">Proyecto</label>
        <select
          className="w-full px-3 py-2 border border-[#3a3a5a] rounded-lg text-sm"
          value={filters.project}
          onChange={e => setFilters({...filters, project: e.target.value})}
        >
          <option value="">Todos</option>
          {PROJECTS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#8888b0] mb-1">Categoría</label>
        <select
          className="w-full px-3 py-2 border border-[#3a3a5a] rounded-lg text-sm"
          value={filters.category}
          onChange={e => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Todas</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#8888b0] mb-1">Tipo</label>
        <select
          className="w-full px-3 py-2 border border-[#3a3a5a] rounded-lg text-sm"
          value={filters.type}
          onChange={e => setFilters({...filters, type: e.target.value})}
        >
          <option value="">Todos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#8888b0] mb-1">Estado</label>
        <select
          className="w-full px-3 py-2 border border-[#3a3a5a] rounded-lg text-sm"
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
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
    >
      Aplicar Filtros
    </button>
  </div>
);

export default FilterPanel;
