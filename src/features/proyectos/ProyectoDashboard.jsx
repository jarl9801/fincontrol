import React, { useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  ChevronDown,
  FolderKanban,
  Percent,
  PieChart as PieChartIcon,
  RefreshCw,
  Target,
} from 'lucide-react';
import {
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinanceLedger } from '../../hooks/useFinanceLedger';
import { formatCurrency, formatDate } from '../../utils/formatters';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CHART_COLORS = ['#3156d3', '#0f8f4b', '#c46a19', '#d46a13', '#5f7fd6', '#5ca8e6', '#85b4f6', '#8eb39b'];

const OPEN_DOCUMENT_STATUSES = new Set(['issued', 'partial', 'overdue']);

const normalizeToken = (value) => String(value || '').trim().toLowerCase();

const buildProjectTokens = (project) => {
  const rawTokens = [
    project?.id,
    project?.code,
    project?.name,
    project?.displayName,
    `${project?.code || ''} (${project?.name || ''})`,
  ];

  return Array.from(new Set(rawTokens.map(normalizeToken).filter(Boolean)));
};

const matchesProject = (record, tokens, projectId) => {
  const directId = normalizeToken(record?.projectId);
  if (projectId && directId && directId === normalizeToken(projectId)) return true;

  const candidates = [
    record?.projectName,
    record?.project,
    record?.raw?.projectName,
    record?.raw?.project,
    record?.rawRecord?.projectName,
    record?.rawRecord?.project,
  ]
    .map(normalizeToken)
    .filter(Boolean);

  return candidates.some((candidate) => tokens.includes(candidate));
};

const formatAxis = (value) => {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return `${Math.round(value)}`;
};

const TooltipCard = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[180px] rounded-2xl border border-[rgba(201,214,238,0.82)] bg-white/96 px-3 py-3 shadow-[0_20px_50px_rgba(118,136,173,0.18)]">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6980ac]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const KpiCard = ({ title, value, subtitle, tone = 'neutral', icon }) => {
  const IconComponent = icon;
  const palette =
    tone === 'positive'
      ? {
          card: 'bg-[linear-gradient(180deg,rgba(240,250,244,0.96),rgba(231,247,236,0.92))]',
          icon: 'bg-[rgba(15,143,75,0.12)] text-[#0f8f4b]',
          value: 'text-[#0f8f4b]',
        }
      : tone === 'negative'
        ? {
            card: 'bg-[linear-gradient(180deg,rgba(255,248,236,0.96),rgba(255,241,224,0.92))]',
            icon: 'bg-[rgba(212,122,34,0.12)] text-[#c46a19]',
            value: 'text-[#c46a19]',
          }
        : {
            card: 'bg-[linear-gradient(180deg,rgba(241,246,255,0.96),rgba(233,240,254,0.92))]',
            icon: 'bg-[rgba(90,141,221,0.12)] text-[#3156d3]',
            value: 'text-[#3156d3]',
          };

  return (
    <div className={`rounded-[24px] border border-[rgba(205,219,243,0.78)] p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)] ${palette.card}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">{title}</p>
          <p className={`mt-2 text-[28px] font-semibold tracking-tight ${palette.value}`}>{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${palette.icon}`}>
          <IconComponent size={18} />
        </div>
      </div>
      <p className="text-[12px] leading-5 text-[#6b7a96]">{subtitle}</p>
    </div>
  );
};

const Section = ({ title, subtitle, children, action }) => (
  <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-[#6b7a96]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

const ProyectoDashboard = ({ user }) => {
  const ledger = useFinanceLedger(user);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const availableProjects = useMemo(
    () =>
      (ledger.projects || [])
        .filter((project) => project.status !== 'inactive')
        .sort((left, right) => (left.name || left.code || '').localeCompare(right.name || right.code || '')),
    [ledger.projects],
  );

  const effectiveProjectId = selectedProjectId || availableProjects[0]?.id || '';

  const selectedProject = useMemo(
    () => availableProjects.find((project) => project.id === effectiveProjectId) || null,
    [availableProjects, effectiveProjectId],
  );

  const projectTokens = useMemo(() => buildProjectTokens(selectedProject), [selectedProject]);

  const projectMovements = useMemo(() => {
    if (!selectedProject) return [];

    return (ledger.postedMovements || [])
      .filter((entry) => matchesProject(entry, projectTokens, selectedProject.id))
      .sort((left, right) => (right.postedDate || '').localeCompare(left.postedDate || ''));
  }, [ledger.postedMovements, projectTokens, selectedProject]);

  const openReceivables = useMemo(() => {
    if (!selectedProject) return [];
    return (ledger.receivables || []).filter(
      (entry) => OPEN_DOCUMENT_STATUSES.has(entry.status) && matchesProject(entry, projectTokens, selectedProject.id),
    );
  }, [ledger.receivables, projectTokens, selectedProject]);

  const openPayables = useMemo(() => {
    if (!selectedProject) return [];
    return (ledger.payables || []).filter(
      (entry) => OPEN_DOCUMENT_STATUSES.has(entry.status) && matchesProject(entry, projectTokens, selectedProject.id),
    );
  }, [ledger.payables, projectTokens, selectedProject]);

  const projectBudget = useMemo(() => {
    if (!selectedProject) return null;

    return (ledger.budgets || []).find((entry) => {
      const budgetTokens = [
        entry.projectId,
        entry.projectName,
        selectedProject.code,
        selectedProject.name,
        selectedProject.displayName,
      ]
        .map(normalizeToken)
        .filter(Boolean);

      return (
        normalizeToken(entry.projectId) === normalizeToken(selectedProject.id) ||
        budgetTokens.some((token) => projectTokens.includes(token))
      );
    }) || null;
  }, [ledger.budgets, projectTokens, selectedProject]);

  const kpis = useMemo(() => {
    const income = projectMovements
      .filter((entry) => entry.direction === 'in')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const expenses = projectMovements
      .filter((entry) => entry.direction === 'out')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const net = income - expenses;
    const margin = income > 0 ? (net / income) * 100 : 0;

    return {
      income,
      expenses,
      net,
      margin,
      openReceivableAmount: openReceivables.reduce((sum, entry) => sum + Number(entry.openAmount || 0), 0),
      openPayableAmount: openPayables.reduce((sum, entry) => sum + Number(entry.openAmount || 0), 0),
    };
  }, [openPayables, openReceivables, projectMovements]);

  const monthlyData = useMemo(() => {
    const months = new Map();

    projectMovements.forEach((entry) => {
      if (!entry.postedDate) return;
      const [year, month] = entry.postedDate.split('-');
      const key = `${year}-${month}`;
      const current = months.get(key) || { month: key, ingresos: 0, gastos: 0 };

      if (entry.direction === 'in') current.ingresos += Number(entry.amount || 0);
      else current.gastos += Number(entry.amount || 0);

      months.set(key, current);
    });

    return Array.from(months.values())
      .sort((left, right) => left.month.localeCompare(right.month))
      .map((entry) => {
        const [, month] = entry.month.split('-');
        return {
          ...entry,
          margen: entry.ingresos - entry.gastos,
          label: `${MONTHS_ES[Number(month) - 1]} ${entry.month.slice(2, 4)}`,
        };
      });
  }, [projectMovements]);

  const categoryData = useMemo(() => {
    const categories = new Map();

    projectMovements
      .filter((entry) => entry.direction === 'out')
      .forEach((entry) => {
        const key = entry.kind || entry.costCenterId || 'Sin categoría';
        categories.set(key, (categories.get(key) || 0) + Number(entry.amount || 0));
      });

    return Array.from(categories.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value);
  }, [projectMovements]);

  const recentRows = useMemo(() => projectMovements.slice(0, 50), [projectMovements]);

  if (ledger.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-7 w-7 animate-spin text-[#3156d3]" />
          <p className="text-sm text-[#6b7a96]">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      <section className="rounded-[34px] border border-[rgba(205,219,243,0.82)] bg-[radial-gradient(circle_at_top_right,rgba(185,248,238,0.24),transparent_22%),radial-gradient(circle_at_top_left,rgba(147,196,255,0.34),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(244,248,255,0.86))] px-6 py-7 shadow-[0_32px_90px_rgba(126,147,190,0.14)]">
        <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5a8ddd]">Proyectos</p>
            <h2 className="text-[32px] font-semibold tracking-tight text-[#101938]">Rentabilidad y seguimiento por proyecto.</h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#5f7091]">
              Revisa ingresos, gastos, documentos abiertos y evolución mensual de cada proyecto desde una sola vista.
            </p>
          </div>

          <div className="flex flex-col gap-3 justify-end">
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">Proyecto</span>
              <div className="relative">
                <select
                  value={effectiveProjectId}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                  className="w-full appearance-none rounded-[20px] border border-[rgba(201,214,238,0.86)] bg-white/86 px-4 py-3 pr-10 text-[14px] text-[#16223f] outline-none transition-all focus:border-[rgba(90,141,221,0.56)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(90,141,221,0.12)]"
                >
                  {availableProjects.length === 0 && <option value="">Sin proyectos activos</option>}
                  {availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.code ? `${project.code} · ${project.name}` : project.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7b8dae]" />
              </div>
            </label>

            {selectedProject ? (
              <div className="rounded-[22px] border border-[rgba(201,214,238,0.78)] bg-white/74 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">Proyecto activo</p>
                <p className="mt-2 text-[18px] font-semibold tracking-tight text-[#101938]">{selectedProject.name}</p>
                <p className="mt-1 text-[12px] text-[#6b7a96]">
                  {selectedProject.code || 'Sin código'}{selectedProject.client ? ` · ${selectedProject.client}` : ''}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {!selectedProject ? (
        <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] px-6 py-16 text-center shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          <FolderKanban size={40} className="mx-auto text-[#7b8dae]" />
          <p className="mt-4 text-[16px] font-semibold text-[#101938]">No hay proyecto seleccionado</p>
          <p className="mt-2 text-[13px] text-[#6b7a96]">Selecciona un proyecto para revisar su comportamiento financiero.</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Ingresos realizados"
              value={formatCurrency(kpis.income)}
              subtitle={`${projectMovements.filter((entry) => entry.direction === 'in').length} cobros y entradas registradas`}
              tone="positive"
              icon={ArrowUpCircle}
            />
            <KpiCard
              title="Gastos realizados"
              value={formatCurrency(kpis.expenses)}
              subtitle={`${projectMovements.filter((entry) => entry.direction === 'out').length} pagos y salidas registradas`}
              tone="negative"
              icon={ArrowDownCircle}
            />
            <KpiCard
              title="Balance neto"
              value={`${kpis.net >= 0 ? '+' : ''}${formatCurrency(kpis.net)}`}
              subtitle={`CXC abierta ${formatCurrency(kpis.openReceivableAmount)} · CXP abierta ${formatCurrency(kpis.openPayableAmount)}`}
              tone={kpis.net >= 0 ? 'positive' : 'negative'}
              icon={Target}
            />
            <KpiCard
              title="Margen"
              value={`${kpis.margin.toFixed(1)}%`}
              subtitle="Balance neto sobre ingresos realizados"
              tone={kpis.margin >= 0 ? 'neutral' : 'negative'}
              icon={Percent}
            />
          </div>

          {projectBudget ? (
            <Section title="Presupuesto frente a ejecución" subtitle="Comparativa entre objetivo y comportamiento real del proyecto.">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#101938]">Ingresos frente a meta</p>
                    <span className="text-xs text-[#6b7a96]">{formatCurrency(projectBudget.incomeTarget || 0)}</span>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-[rgba(201,214,238,0.74)]">
                    <div
                      className="h-full rounded-full bg-[#0f8f4b]"
                      style={{
                        width: `${Math.min(100, (projectBudget.incomeTarget || 0) > 0 ? (kpis.income / projectBudget.incomeTarget) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[12px] text-[#6b7a96]">
                    {formatCurrency(kpis.income)} registrados ·{' '}
                    {(projectBudget.incomeTarget || 0) > 0 ? ((kpis.income / projectBudget.incomeTarget) * 100).toFixed(1) : '0.0'}% alcanzado
                  </p>
                </div>

                <div className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#101938]">Gastos frente a límite</p>
                    <span className="text-xs text-[#6b7a96]">{formatCurrency(projectBudget.expenseLimit || 0)}</span>
                  </div>
                  <div className="mb-3 h-2 overflow-hidden rounded-full bg-[rgba(201,214,238,0.74)]">
                    <div
                      className={`h-full rounded-full ${kpis.expenses > (projectBudget.expenseLimit || 0) ? 'bg-[#d46a13]' : 'bg-[#c46a19]'}`}
                      style={{
                        width: `${Math.min(100, (projectBudget.expenseLimit || 0) > 0 ? (kpis.expenses / projectBudget.expenseLimit) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[12px] text-[#6b7a96]">
                    {formatCurrency(kpis.expenses)} registrados ·{' '}
                    {(projectBudget.expenseLimit || 0) > 0 ? ((kpis.expenses / projectBudget.expenseLimit) * 100).toFixed(1) : '0.0'}% utilizado
                  </p>
                </div>
              </div>
            </Section>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.9fr,1.1fr]">
            <Section
              title="Evolución mensual"
              subtitle="Barras de ingresos y gastos con la línea de balance neto por mes."
              action={<span className="text-xs text-[#7b8dae]">{monthlyData.length} meses</span>}
            >
              {monthlyData.length > 0 ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(176,194,226,0.42)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7b8dae' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#7b8dae' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#7b8dae' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<TooltipCard />} />
                      <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 12, fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" fill="#0f8f4b" maxBarSize={28} radius={[8, 8, 0, 0]} />
                      <Bar yAxisId="left" dataKey="gastos" name="Gastos" fill="#c46a19" maxBarSize={28} radius={[8, 8, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="margen" name="Balance" stroke="#3156d3" strokeWidth={2.8} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-[#6b7a96]">
                  No hay movimientos suficientes para mostrar una evolución mensual.
                </div>
              )}
            </Section>

            <Section title="Gastos por categoría" subtitle="Distribución de las salidas realizadas del proyecto.">
              {categoryData.length > 0 ? (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={82}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={0} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid rgba(201,214,238,0.82)', borderRadius: 18 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {categoryData.slice(0, 6).map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between rounded-[18px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                          <span className="text-[13px] font-medium text-[#101938]">{entry.name}</span>
                        </div>
                        <span className="text-[12px] font-semibold text-[#6b7a96]">{formatCurrency(entry.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-[320px] items-center justify-center text-sm text-[#6b7a96]">
                  No hay gastos registrados en este proyecto.
                </div>
              )}
            </Section>
          </div>

          <Section
            title="Movimientos del proyecto"
            subtitle="Últimos registros confirmados asociados al proyecto seleccionado."
            action={<span className="rounded-full border border-[rgba(201,214,238,0.74)] bg-white/78 px-3 py-1 text-[11px] text-[#6b7a96]">{recentRows.length} registros</span>}
          >
            {recentRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left">
                  <thead>
                    <tr className="border-b border-[rgba(201,214,238,0.78)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6980ac]">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Contraparte</th>
                      <th className="px-4 py-3 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(201,214,238,0.58)]">
                    {recentRows.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[rgba(90,141,221,0.04)]">
                        <td className="px-4 py-3 text-sm text-[#6b7a96]">{formatDate(entry.postedDate)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-[#101938]">{entry.description || 'Movimiento sin descripción'}</td>
                        <td className="px-4 py-3 text-sm text-[#6b7a96]">{entry.kind || 'Movimiento'}</td>
                        <td className="px-4 py-3 text-sm text-[#6b7a96]">{entry.counterpartyName || 'Sin contraparte'}</td>
                        <td className={`px-4 py-3 text-right text-sm font-semibold ${entry.direction === 'in' ? 'text-[#0f8f4b]' : 'text-[#c46a19]'}`}>
                          {entry.direction === 'in' ? '+' : '-'}
                          {formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[rgba(201,214,238,0.78)] px-4 py-12 text-center text-sm text-[#6b7a96]">
                No hay movimientos registrados para este proyecto en la base actual.
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
};

export default ProyectoDashboard;
