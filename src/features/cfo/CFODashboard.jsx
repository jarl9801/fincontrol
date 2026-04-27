import { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CalendarRange,
  Clock,
  Coins,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Badge, Button, KPI, KPIGrid, Panel } from '@/components/ui/nexus';
import { useCFOSnapshot } from './hooks/useCFOSnapshot';
import { formatCurrency } from '../../utils/formatters';

/**
 * CFODashboard — CFO entry point at /cfo.
 *
 * Phase A: layout + single-fetch snapshot only. The six panels are
 * placeholders that will be filled in subsequent phases (B → cash position,
 * C → forecast 13W, D → margin, E → aging, F → variance, G → alerts).
 *
 * The whole page derives from one Firestore snapshot — no panel triggers
 * its own query. Refresh is explicit via the header button to respect the
 * Spark-plan quota.
 */

const PANELS = [
  {
    key: 'cash',
    title: 'Cash Position',
    description: 'Efectivo hoy + burn 30/90d + runway',
    icon: Wallet,
    phase: 'Fase B',
  },
  {
    key: 'forecast',
    title: 'Forecast 13 semanas',
    description: 'Cashflow rolling con escenarios base / optimista / pesimista',
    icon: CalendarRange,
    phase: 'Fase C',
  },
  {
    key: 'aging',
    title: 'AR / AP Aging',
    description: 'Buckets 0-30 / 31-60 / 61-90 / >90 con totales y conteo',
    icon: Coins,
    phase: 'Fase E',
  },
  {
    key: 'margin',
    title: 'Margen por proyecto',
    description: 'NE3 / NE4 / Soplado / Fusión — ingresos vs costos directos',
    icon: TrendingUp,
    phase: 'Fase D',
  },
  {
    key: 'variance',
    title: 'Variance MTD',
    description: 'Mes en curso vs promedio últimos 3 meses',
    icon: BarChart3,
    phase: 'Fase F',
  },
  {
    key: 'alerts',
    title: 'Alertas CFO',
    description: 'Top 5 alertas críticas / altas con impacto € desc',
    icon: AlertTriangle,
    phase: 'Fase G',
  },
];

const formatTimestamp = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

const CFODashboard = ({ user }) => {
  const { snapshot, loading, error, fetchedAt, fromCache, refetch } = useCFOSnapshot(user);

  const counts = useMemo(() => {
    if (!snapshot) return null;
    return {
      bankMovements: snapshot.bankMovements?.length || 0,
      receivables: snapshot.receivables?.length || 0,
      payables: snapshot.payables?.length || 0,
      projects: snapshot.projects?.length || 0,
      recurringCosts: snapshot.recurringCosts?.length || 0,
      employees: snapshot.employees?.length || 0,
    };
  }, [snapshot]);

  // Quick-look totals — kept light here; Phase B replaces with proper KPIs.
  const cashHints = useMemo(() => {
    if (!snapshot) return null;
    const openReceivables = (snapshot.receivables || [])
      .filter((r) => r.status !== 'settled' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + Number(r.openAmount || r.grossAmount || r.amount || 0), 0);
    const openPayables = (snapshot.payables || [])
      .filter((p) => p.status !== 'settled' && p.status !== 'cancelled')
      .reduce((sum, p) => sum + Number(p.openAmount || p.grossAmount || p.amount || 0), 0);
    return { openReceivables, openPayables };
  }, [snapshot]);

  return (
    <div className="space-y-6 pb-12">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="nd-label text-[var(--text-secondary)]">Capa CFO</p>
          <h2 className="mt-2 nd-display text-[28px] font-light tracking-tight text-[var(--text-primary)]">
            CFO<span className="text-[var(--accent)]">.OS</span> — Vista ejecutiva
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-2xl">
            Una pantalla, una decisión. Cash position, forecast 13 semanas, margen por proyecto,
            aging, variance y alertas que mueven la aguja. Read-mostly, single-fetch, exportable.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center gap-1.5 nd-mono text-[11px] text-[var(--text-disabled)]">
              <Clock size={12} />
              Datos a las {formatTimestamp(fetchedAt)}
            </span>
            {fromCache && (
              <Badge variant="neutral">Cache local · TTL 1h</Badge>
            )}
          </div>
          <Button
            variant="secondary"
            icon={RefreshCw}
            disabled={loading}
            loading={loading}
            onClick={refetch}
          >
            Refrescar
          </Button>
        </div>
      </header>

      {error && (
        <Panel padding>
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-[var(--error)] flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-[14px] text-[var(--text-primary)]">
                No se pudo cargar el snapshot.
              </p>
              <p className="mt-1 nd-mono text-[12px] text-[var(--text-disabled)]">
                {error.message || String(error)}
              </p>
            </div>
          </div>
        </Panel>
      )}

      {snapshot && (
        <KPIGrid cols={4}>
          <KPI
            label="Movimientos bancarios"
            value={counts?.bankMovements ?? 0}
            meta={`Lookback ${snapshot.meta?.bankMovementsLookbackDays || 120}d`}
            icon={Wallet}
          />
          <KPI
            label="CXC abiertas (€)"
            value={formatCurrency(cashHints?.openReceivables || 0)}
            meta={`${counts?.receivables ?? 0} totales`}
            tone="ok"
          />
          <KPI
            label="CXP abiertas (€)"
            value={formatCurrency(cashHints?.openPayables || 0)}
            meta={`${counts?.payables ?? 0} totales`}
            tone="warn"
          />
          <KPI
            label="Proyectos activos"
            value={counts?.projects ?? 0}
            meta={`${counts?.recurringCosts ?? 0} reglas recurrentes`}
            icon={Briefcase}
          />
        </KPIGrid>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PANELS.map((p) => {
          const Icon = p.icon;
          return (
            <Panel
              key={p.key}
              title={p.title}
              meta={p.phase}
            >
              <div className="flex flex-col items-start gap-3 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-raised)]">
                  <Icon size={18} className="text-[var(--text-disabled)]" />
                </div>
                <p className="text-[13px] text-[var(--text-secondary)]">{p.description}</p>
                <Badge variant="neutral">Coming soon</Badge>
              </div>
            </Panel>
          );
        })}
      </div>

      {!loading && !error && snapshot && (
        <Panel title="Snapshot diagnostics" meta="Solo para verificar Fase A">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 nd-mono text-[12px] text-[var(--text-secondary)]">
            <DiagRow label="bankMovements" value={counts.bankMovements} />
            <DiagRow label="receivables" value={counts.receivables} />
            <DiagRow label="payables" value={counts.payables} />
            <DiagRow label="projects" value={counts.projects} />
            <DiagRow label="recurringCosts" value={counts.recurringCosts} />
            <DiagRow label="employees" value={counts.employees} />
            <DiagRow
              label="categories.expense"
              value={(snapshot.categories?.expense || []).length}
            />
            <DiagRow
              label="categories.income"
              value={(snapshot.categories?.income || []).length}
            />
            <DiagRow
              label="cutoff bankMovements"
              value={snapshot.meta?.bankMovementsCutoffDate || '—'}
            />
          </div>
        </Panel>
      )}
    </div>
  );
};

const DiagRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b border-[var(--border)] pb-1">
    <span className="text-[var(--text-disabled)]">{label}</span>
    <span className="text-[var(--text-primary)] tabular-nums">{value}</span>
  </div>
);

export default CFODashboard;
