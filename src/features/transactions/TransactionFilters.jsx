import React from 'react';
import { Download, Filter, RotateCcw, Search, X } from 'lucide-react';

const FILTER_DEFAULTS = {
  dateFrom: '',
  dateTo: '',
  project: '',
  category: '',
  costCenter: '',
  type: '',
  status: '',
  origin: '',
  family: '',
  year: '',
  minAmount: '',
  maxAmount: '',
  notesMode: 'all',
  noCostCenter: false,
};

const YEAR_OPTIONS = [
  { value: '', label: 'Todos los años' },
  { value: '2025', label: '2025 — Histórico' },
  { value: '2026', label: '2026 — Operación actual' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'income', label: 'Entradas' },
  { value: 'expense', label: 'Salidas' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'partial', label: 'Parcial' },
  { value: 'overdue', label: 'Vencido' },
  { value: 'paid', label: 'Liquidado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'void', label: 'Anulado' },
];

const ORIGIN_OPTIONS = [
  { value: '', label: 'Todos los orígenes' },
  { value: 'legacy', label: 'Histórico' },
  { value: 'canonical', label: 'Operación actual' },
  { value: 'migrated', label: 'Integrado' },
];

const FAMILY_OPTIONS = [
  { value: '', label: 'Todas las familias' },
  { value: 'legacy', label: 'Registro histórico' },
  { value: 'movement', label: 'Movimiento bancario' },
  { value: 'receivable', label: 'Factura CXC' },
  { value: 'payable', label: 'Factura CXP' },
];

const TransactionFilters = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  advancedFilters,
  setAdvancedFilters,
  quickFilter,
  setQuickFilter,
  quickFilterButtons,
  activeFiltersCount,
  filteredRecords,
  unifiedRecords,
  filterOptions,
  userRole,
  onExportPDF,
  onResetFilters,
}) => {
  return (
    <section className="rounded-[28px] border border-[rgba(205,219,243,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,255,0.78))] p-4 shadow-[0_22px_60px_rgba(126,147,190,0.12)] backdrop-blur-2xl">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7390c7]" size={16} />
          <input
            type="text"
            placeholder="Buscar por descripcion, proyecto, documento, contraparte o comentarios..."
            className="w-full rounded-[20px] border border-[rgba(201,214,238,0.86)] bg-white/80 py-2.5 pl-10 pr-10 text-[13px] text-[#16223f] outline-none transition-all placeholder:text-[#7d8dac] focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8dac] transition-colors hover:text-[#101938]"
              aria-label="Limpiar busqueda"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-[16px] border px-4 py-2.5 text-[13px] font-medium transition-all ${
              showFilters || activeFiltersCount > 0
                ? 'border-[rgba(90,141,221,0.34)] bg-[rgba(90,141,221,0.12)] text-[#3156d3] shadow-[0_10px_24px_rgba(90,141,221,0.12)]'
                : 'border-[rgba(201,214,238,0.82)] bg-white/72 text-[#32415f] hover:bg-white'
            }`}
          >
            <Filter size={15} />
            Filtros avanzados
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-[rgba(90,141,221,0.12)] px-2 py-0.5 text-[11px] text-[#3156d3]">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {userRole === 'admin' && (
            <button
              type="button"
              onClick={onExportPDF}
              className="inline-flex items-center gap-2 rounded-[16px] border border-[rgba(201,214,238,0.82)] bg-white/72 px-4 py-2.5 text-[13px] font-medium text-[#16223f] transition-colors hover:bg-white"
            >
              <Download size={15} />
              Exportar PDF
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {quickFilterButtons.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setQuickFilter(key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
              quickFilter === key
                ? 'border border-[rgba(90,141,221,0.22)] bg-[rgba(90,141,221,0.12)] text-[#3156d3]'
                : 'border border-[rgba(201,214,238,0.72)] bg-white/62 text-[#62718f] hover:bg-white hover:text-[#16223f]'
            }`}
          >
            {Icon && <Icon size={13} />}
            {label}
            <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-1.5 py-0.5 text-[10px] text-inherit">
              {count}
            </span>
          </button>
        ))}
      </div>

      {showFilters && (
        <div className="mt-4 rounded-[24px] border border-[rgba(205,219,243,0.72)] bg-[linear-gradient(180deg,rgba(250,252,255,0.94),rgba(244,248,255,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] animate-fadeIn">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[#101938]">Filtros de revision</h3>
              <p className="mt-1 text-[12px] text-[#6b7a96]">Recorta por origen, tipo de registro, importe, estado y dimensión operativa.</p>
            </div>
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 text-[12px] font-medium text-[#3156d3] transition-colors hover:text-[#101938]"
            >
              <RotateCcw size={13} />
              Limpiar todo
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Desde</span>
              <input
                type="date"
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.dateFrom}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, dateFrom: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Hasta</span>
              <input
                type="date"
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.dateTo}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, dateTo: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Proyecto</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.project}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, project: event.target.value }))}
              >
                <option value="">Todos los proyectos</option>
                {filterOptions.projects.map((project) => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Categoría</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.category}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, category: event.target.value }))}
              >
                <option value="">Todas las categorias</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Centro de costo</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.costCenter}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, costCenter: event.target.value }))}
              >
                <option value="">Todos los centros</option>
                {filterOptions.centers.map((center) => (
                  <option key={center} value={center}>{center}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Tipo</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.type}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, type: event.target.value }))}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Estado</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.status}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, status: event.target.value }))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Origen</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.origin}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, origin: event.target.value }))}
              >
                {ORIGIN_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Tipo de registro</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.family}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, family: event.target.value }))}
              >
                {FAMILY_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Año fiscal</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.year}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, year: event.target.value }))}
              >
                {YEAR_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Importe mínimo</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.minAmount}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, minAmount: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Importe máximo</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.maxAmount}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, maxAmount: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Comentarios</span>
              <select
                className="w-full rounded-[14px] border border-[rgba(201,214,238,0.82)] bg-white/84 px-3 py-2.5 text-[13px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                value={advancedFilters.notesMode}
                onChange={(event) => setAdvancedFilters((current) => ({ ...current, notesMode: event.target.value }))}
              >
                <option value="all">Todos</option>
                <option value="with-notes">Con comentarios</option>
                <option value="without-notes">Sin comentarios</option>
              </select>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={advancedFilters.noCostCenter || false}
                onChange={(e) => setAdvancedFilters((current) => ({ ...current, noCostCenter: e.target.checked }))}
                className="h-4 w-4 rounded border-[#d8e3f7] accent-[#3156d3]"
              />
              <span className="text-sm font-medium text-[#4b5d83]">
                Solo sin Centro de Costo <span className="text-[#c47a09]">⚠</span>
              </span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
};

export { FILTER_DEFAULTS };
export default TransactionFilters;
