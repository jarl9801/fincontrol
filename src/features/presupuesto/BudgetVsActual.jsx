import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import { useBudgets } from '../../hooks/useBudgets';
import { useFinanceLedger } from '../../hooks/useFinanceLedger';
import { useProjects } from '../../hooks/useProjects';
import { formatCurrency } from '../../utils/formatters';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TooltipCard = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/96 px-3 py-3 shadow-[0_20px_50px_rgba(118,136,173,0.18)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6980ac]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const CreateBudgetModal = ({ isOpen, onClose, onSubmit, projects, yearOptions }) => {
  const [form, setForm] = useState({
    projectId: '',
    projectName: '',
    year: String(yearOptions[0] || new Date().getFullYear()),
    month: '',
    incomeTarget: '',
    expenseLimit: '',
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(20,27,42,0.34)] p-4 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[30px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,248,255,0.94))] p-6 shadow-[0_36px_110px_rgba(93,117,161,0.22)]">
        <h3 className="text-[24px] font-semibold tracking-tight text-[#101938]">Nuevo presupuesto</h3>
        <p className="mt-2 text-sm text-[#6b7a96]">Define objetivo de ingresos y límite de gasto por proyecto o empresa.</p>

        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({
              ...form,
              year: Number(form.year),
              month: form.month ? Number(form.month) : null,
              incomeTarget: Number(form.incomeTarget || 0),
              expenseLimit: Number(form.expenseLimit || 0),
            });
            onClose();
          }}
        >
          <label className="block md:col-span-2">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Proyecto</span>
            <select
              className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              value={form.projectId}
              onChange={(event) => {
                const projectId = event.target.value;
                const project = projects.find((entry) => entry.id === projectId);
                setForm((state) => ({
                  ...state,
                  projectId,
                  projectName: project?.name || project?.displayName || project?.code || 'Empresa',
                }));
              }}
            >
              <option value="">Empresa</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.displayName || project.code}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Año</span>
            <select
              className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              value={form.year}
              onChange={(event) => setForm((state) => ({ ...state, year: event.target.value }))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Mes</span>
            <select
              className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              value={form.month}
              onChange={(event) => setForm((state) => ({ ...state, month: event.target.value }))}
            >
              <option value="">Anual</option>
              {MONTHS.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Ingreso objetivo</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              value={form.incomeTarget}
              onChange={(event) => setForm((state) => ({ ...state, incomeTarget: event.target.value }))}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Límite de gasto</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              value={form.expenseLimit}
              onChange={(event) => setForm((state) => ({ ...state, expenseLimit: event.target.value }))}
            />
          </label>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/84 px-4 py-3 text-sm font-medium text-[#6b7a96] transition-colors hover:bg-white hover:text-[#101938]"
            >
              Cancelar
            </button>
            <button type="submit" className="rounded-2xl bg-[#3156d3] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2748b6]">
              Guardar presupuesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BudgetVsActual = ({ user, userRole }) => {
  const { showToast } = useToast();
  const { budgets, loading, createBudget } = useBudgets(user);
  const { projects } = useProjects(user);
  const ledger = useFinanceLedger(user);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const yearOptions = useMemo(() => {
    const years = new Set();
    ledger.postedMovements.forEach((entry) => {
      if (entry.postedDate) years.add(Number(entry.postedDate.slice(0, 4)));
    });
    budgets.forEach((entry) => years.add(entry.year));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((left, right) => right - left);
  }, [budgets, ledger.postedMovements]);

  const [selectedYear, setSelectedYear] = useState(yearOptions[0] || new Date().getFullYear());

  const actuals = useMemo(() => {
    const byProject = new Map();
    ledger.postedMovements
      .filter((entry) => Number(entry.postedDate?.slice(0, 4)) === Number(selectedYear))
      .forEach((entry) => {
        const month = Number(entry.postedDate?.slice(5, 7));
        const projectName = entry.projectName || 'Empresa';
        const annualKey = `${projectName}-annual`;
        const monthlyKey = `${projectName}-${month}`;

        const write = (key) => {
          const current = byProject.get(key) || { income: 0, expense: 0 };
          if (entry.direction === 'in') current.income += entry.amount;
          else current.expense += entry.amount;
          byProject.set(key, current);
        };

        write(annualKey);
        write(monthlyKey);
      });
    return byProject;
  }, [ledger.postedMovements, selectedYear]);

  const comparisonRows = useMemo(() => {
    return budgets
      .filter((entry) => Number(entry.year) === Number(selectedYear))
      .map((entry) => {
        const key = entry.month ? `${entry.projectName || 'Empresa'}-${entry.month}` : `${entry.projectName || 'Empresa'}-annual`;
        const actual = actuals.get(key) || { income: 0, expense: 0 };
        return {
          ...entry,
          actualIncome: actual.income,
          actualExpense: actual.expense,
          incomeDeviation: entry.incomeTarget > 0 ? ((actual.income - entry.incomeTarget) / entry.incomeTarget) * 100 : 0,
          expenseDeviation: entry.expenseLimit > 0 ? ((actual.expense - entry.expenseLimit) / entry.expenseLimit) * 100 : 0,
          label: entry.month ? `${entry.projectName || 'Empresa'} · ${MONTHS[entry.month - 1]}` : `${entry.projectName || 'Empresa'} · Anual`,
        };
      })
      .sort((left, right) => (right.expenseDeviation || 0) - (left.expenseDeviation || 0));
  }, [actuals, budgets, selectedYear]);

  const chartData = comparisonRows.slice(0, 8).map((entry) => ({
    name: entry.projectName?.slice(0, 14) || 'Empresa',
    'Ingreso objetivo': entry.incomeTarget || 0,
    'Ingreso real': entry.actualIncome || 0,
    'Gasto limite': entry.expenseLimit || 0,
    'Gasto real': entry.actualExpense || 0,
  }));

  const totalBudgetIncome = comparisonRows.reduce((sum, entry) => sum + (entry.incomeTarget || 0), 0);
  const totalBudgetExpense = comparisonRows.reduce((sum, entry) => sum + (entry.expenseLimit || 0), 0);
  const totalActualIncome = comparisonRows.reduce((sum, entry) => sum + (entry.actualIncome || 0), 0);
  const overspendCount = comparisonRows.filter((entry) => entry.expenseLimit > 0 && entry.actualExpense > entry.expenseLimit).length;

  const canAct = userRole === 'admin';

  if (loading || ledger.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Sincronizando presupuesto y ejecución...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(185,248,238,0.22),transparent_22%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Presupuesto</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-[#101938]">Objetivo frente a ejecución real.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5f7091]">
              Compara lo presupuestado con el comportamiento real de caja por proyecto y por periodo.
            </p>
          </div>
          <div className="flex gap-3">
            <select
              className="rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/88 px-4 py-3 text-sm text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {canAct && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#3156d3] px-4 py-3 text-sm font-semibold text-white hover:bg-[#2748b6]"
              >
                <Plus size={16} />
                Nuevo presupuesto
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Ingreso objetivo</p>
            <Target size={18} className="text-[#3156d3]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">{formatCurrency(totalBudgetIncome)}</p>
          <p className="mt-2 text-sm text-[#6b7a96]">Suma de presupuestos cargados para {selectedYear}.</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Ingreso realizado</p>
            <TrendingUp size={18} className="text-[#0f8f4b]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">{formatCurrency(totalActualIncome)}</p>
          <p className="mt-2 text-sm text-[#6b7a96]">Entradas ya registradas en tesorería.</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Gasto objetivo</p>
            <TrendingDown size={18} className="text-[#c46a19]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">{formatCurrency(totalBudgetExpense)}</p>
          <p className="mt-2 text-sm text-[#6b7a96]">Límite total fijado para {selectedYear}.</p>
        </div>
        <div className="rounded-[26px] border border-[rgba(205,219,243,0.78)] bg-white/82 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Desviaciones</p>
            <AlertTriangle size={18} className="text-[#d46a13]" />
          </div>
          <p className="text-[28px] font-semibold tracking-tight text-[#101938]">{overspendCount}</p>
          <p className="mt-2 text-sm text-[#6b7a96]">Presupuestos con gasto real por encima del límite.</p>
        </div>
      </div>

      <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
        <div className="mb-5">
          <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Comparativa principal</h3>
          <p className="mt-1 text-sm text-[#6b7a96]">Presupuesto cargado frente a ejecución real por proyecto.</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(176,194,226,0.42)" vertical={false} />
              <XAxis dataKey="name" stroke="#7b8dae" tickLine={false} axisLine={false} />
              <YAxis stroke="#7b8dae" tickLine={false} axisLine={false} tickFormatter={(value) => `€${Math.round(value / 1000)}k`} />
              <Tooltip content={<TooltipCard />} />
              <Bar dataKey="Ingreso objetivo" fill="#3156d3" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Ingreso real" fill="#0f8f4b" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Gasto limite" fill="#d47a22" radius={[10, 10, 0, 0]} />
              <Bar dataKey="Gasto real" fill="#d46a13" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
        <div className="mb-5">
          <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Detalle de desviación</h3>
          <p className="mt-1 text-sm text-[#6b7a96]">Cada fila compara objetivo y realizado sobre la misma base temporal.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead>
              <tr className="border-b border-[rgba(201,214,238,0.78)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3 text-right">Obj. ingreso</th>
                <th className="px-4 py-3 text-right">Real ingreso</th>
                <th className="px-4 py-3 text-right">Obj. gasto</th>
                <th className="px-4 py-3 text-right">Real gasto</th>
                <th className="px-4 py-3 text-right">Desvio gasto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(201,214,238,0.58)]">
              {comparisonRows.map((row) => (
                <tr key={row.id} className="hover:bg-[rgba(90,141,221,0.04)]">
                  <td className="px-4 py-4 text-sm font-semibold text-[#101938]">{row.label}</td>
                  <td className="px-4 py-4 text-right text-sm text-[#101938]">{formatCurrency(row.incomeTarget || 0)}</td>
                  <td className="px-4 py-4 text-right text-sm text-[#0f8f4b]">{formatCurrency(row.actualIncome || 0)}</td>
                  <td className="px-4 py-4 text-right text-sm text-[#101938]">{formatCurrency(row.expenseLimit || 0)}</td>
                  <td className="px-4 py-4 text-right text-sm text-[#c46a19]">{formatCurrency(row.actualExpense || 0)}</td>
                  <td className={`px-4 py-4 text-right text-sm font-semibold ${row.expenseDeviation > 0 ? 'text-[#d46a13]' : 'text-[#0f8f4b]'}`}>
                    {row.expenseDeviation >= 0 ? '+' : ''}
                    {row.expenseDeviation.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CreateBudgetModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projects={projects}
        yearOptions={yearOptions}
        onSubmit={async (payload) => {
          const result = await createBudget(payload);
          if (result.success) showToast('Presupuesto guardado');
          else showToast('No se pudo guardar el presupuesto', 'error');
        }}
      />
    </div>
  );
};

export default BudgetVsActual;
