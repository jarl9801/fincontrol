import React from 'react';
import { Download, Filter, RotateCcw, Search, X } from 'lucide-react';
import { Button, Badge } from '@/components/ui/nexus';

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
 <section className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <div className="relative flex-1">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={16} />
 <input
 type="text"
 placeholder="Buscar por descripcion, proyecto, documento, contraparte o comentarios..."
 className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-10 text-[13px] text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-disabled)] focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={searchTerm}
 onChange={(event) => setSearchTerm(event.target.value)}
 />
 {searchTerm && (
 <button
 type="button"
 onClick={() => setSearchTerm('')}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-primary)]"
 aria-label="Limpiar busqueda"
 >
 <X size={15} />
 </button>
 )}
 </div>

 <div className="flex flex-wrap gap-2">
 <Button
 variant={showFilters || activeFiltersCount > 0 ? 'secondary' : 'ghost'}
 icon={Filter}
 onClick={() => setShowFilters((current) => !current)}
 >
 <span className="inline-flex items-center gap-2">
 Filtros avanzados
 {activeFiltersCount > 0 && (
 <Badge variant="neutral">{activeFiltersCount}</Badge>
 )}
 </span>
 </Button>

 {userRole === 'admin' && (
 <Button variant="ghost" icon={Download} onClick={onExportPDF}>
 Exportar PDF
 </Button>
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
 ? 'border border-[var(--accent)] bg-transparent text-[var(--accent)]'
 : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-disabled)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
 }`}
 >
 {Icon && <Icon size={13} />}
 {label}
 <span className="rounded-full bg-[var(--surface)] px-1.5 py-0.5 text-[10px] text-inherit">
 {count}
 </span>
 </button>
 ))}
 </div>

 {showFilters && (
 <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 animate-fadeIn">
 <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
 <div>
 <h3 className="text-[14px] font-medium text-[var(--text-primary)]">Filtros de revision</h3>
 <p className="mt-1 text-[12px] text-[var(--text-secondary)]">Recorta por origen, tipo de registro, importe, estado y dimensión operativa.</p>
 </div>
 <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onResetFilters}>
 Limpiar todo
 </Button>
 </div>

 <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Desde</span>
 <input
 type="date"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.dateFrom}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, dateFrom: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Hasta</span>
 <input
 type="date"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.dateTo}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, dateTo: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Proyecto</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
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
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Categoría</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
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
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Centro de costo</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
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
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Tipo</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.type}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, type: event.target.value }))}
 >
 {TYPE_OPTIONS.map((option) => (
 <option key={option.value || 'all'} value={option.value}>{option.label}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Estado</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.status}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, status: event.target.value }))}
 >
 {STATUS_OPTIONS.map((option) => (
 <option key={option.value || 'all'} value={option.value}>{option.label}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Origen</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.origin}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, origin: event.target.value }))}
 >
 {ORIGIN_OPTIONS.map((option) => (
 <option key={option.value || 'all'} value={option.value}>{option.label}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Tipo de registro</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.family}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, family: event.target.value }))}
 >
 {FAMILY_OPTIONS.map((option) => (
 <option key={option.value || 'all'} value={option.value}>{option.label}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Año fiscal</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.year}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, year: event.target.value }))}
 >
 {YEAR_OPTIONS.map((option) => (
 <option key={option.value || 'all'} value={option.value}>{option.label}</option>
 ))}
 </select>
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Importe mínimo</span>
 <input
 type="number"
 min="0"
 step="0.01"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.minAmount}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, minAmount: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Importe máximo</span>
 <input
 type="number"
 min="0"
 step="0.01"
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
 value={advancedFilters.maxAmount}
 onChange={(event) => setAdvancedFilters((current) => ({ ...current, maxAmount: event.target.value }))}
 />
 </label>

 <label className="block">
 <span className="mb-1.5 block nd-label text-[var(--text-disabled)]">Comentarios</span>
 <select
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none transition-all focus:border-[var(--border-visible)] focus:bg-[var(--surface)]"
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
 className="h-4 w-4 rounded border-[var(--border)] accent-[var(--text-primary)]"
 />
 <span className="text-sm font-medium text-[var(--text-disabled)]">
 Solo sin Centro de Costo <span className="text-[var(--warning)]">⚠</span>
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
