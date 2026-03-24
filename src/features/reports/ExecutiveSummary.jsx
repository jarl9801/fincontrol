import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { useTreasuryMetrics } from '../../hooks/useTreasuryMetrics';
import { formatCurrency } from '../../utils/formatters';

const Card = ({ title, value, subtitle, accent, icon }) => {
  const IconComponent = icon;
  return (
    <div className="rounded-[24px] border border-[rgba(205,219,243,0.78)] bg-white/84 p-5 shadow-[0_18px_44px_rgba(126,147,190,0.1)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6980ac]">{title}</p>
          <p className="mt-2 text-[26px] font-semibold tracking-tight text-[#101938]">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}20`, color: accent }}>
          <IconComponent size={18} />
        </div>
      </div>
      <p className="text-sm text-[#6b7a96]">{subtitle}</p>
    </div>
  );
};

const ExecutiveSummary = ({ user }) => {
  const metrics = useTreasuryMetrics({ user });

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#64d2ff] border-t-transparent" />
          <p className="text-sm text-[#6b7a96]">Preparando resumen ejecutivo...</p>
        </div>
      </div>
    );
  }

  const alerts = [
    {
      id: 'cash',
      title: 'Posicion de caja',
      body: `Caja actual ${formatCurrency(metrics.currentCash)} y liquidez proyectada ${formatCurrency(metrics.projectedLiquidity)}.`,
      tone: metrics.projectedLiquidity >= 0 ? 'good' : 'bad',
    },
    {
      id: 'collections',
      title: 'Riesgo de cobranza',
      body: `${metrics.overdueReceivables.length} documentos vencidos por cobrar por ${formatCurrency(metrics.overdueReceivables.reduce((sum, entry) => sum + entry.openAmount, 0))}.`,
      tone: metrics.overdueReceivables.length > 0 ? 'bad' : 'good',
    },
    {
      id: 'payments',
      title: 'Presion de pagos',
      body: `${metrics.upcomingPayables.length} pagos dentro de la siguiente ventana por ${formatCurrency(metrics.upcomingPayables.reduce((sum, entry) => sum + entry.openAmount, 0))}.`,
      tone: metrics.upcomingPayables.length > 0 ? 'warning' : 'good',
    },
  ];

  const recommendations = [
    'Actualizar conciliacion bancaria semanalmente antes de revisar caja proyectada.',
    'Convertir la cartera vencida en foco comercial hasta que caiga por debajo del 10% de la CXC abierta.',
    'Usar presupuesto anual por proyecto como techo operativo y no solo como referencia historica.',
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <Card title="Caja actual" value={formatCurrency(metrics.currentCash)} subtitle="Saldo operativo real." accent="#30d158" icon={Landmark} />
        <Card title="Liquidez proyectada" value={formatCurrency(metrics.projectedLiquidity)} subtitle="Caja mas CXC menos CXP." accent="#64d2ff" icon={Target} />
        <Card title="CXC vencida" value={formatCurrency(metrics.overdueReceivables.reduce((sum, entry) => sum + entry.openAmount, 0))} subtitle={`${metrics.overdueReceivables.length} documentos`} accent="#ff453a" icon={AlertTriangle} />
        <Card title="Runway" value={metrics.runwayMonths == null ? 'N/A' : `${metrics.runwayMonths.toFixed(1)}m`} subtitle="Caja actual sobre egreso promedio 90d." accent="#ff9f0a" icon={ShieldAlert} />
      </div>

      <section className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
        <div className="mb-5">
          <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Lectura ejecutiva</h3>
          <p className="mt-1 text-sm text-[#6b7a96]">Resumen del estado operativo financiero a partir de la operación registrada.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-[24px] border px-4 py-4 ${
                alert.tone === 'good'
                  ? 'border-[rgba(15,143,75,0.14)] bg-[rgba(240,250,244,0.88)]'
                  : alert.tone === 'warning'
                    ? 'border-[rgba(212,122,34,0.14)] bg-[rgba(255,248,236,0.92)]'
                    : 'border-[rgba(214,106,19,0.14)] bg-[rgba(255,244,239,0.92)]'
              }`}
            >
              <p className="text-sm font-semibold text-[#101938]">{alert.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#5f7091]">{alert.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          <div className="mb-5">
            <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Frente de vencimientos</h3>
            <p className="mt-1 text-sm text-[#6b7a96]">Prioridades inmediatas de caja.</p>
          </div>
          <div className="space-y-3">
            {[...metrics.upcomingReceivables.slice(0, 3), ...metrics.upcomingPayables.slice(0, 3)].map((entry) => {
              const isInflow = entry.kind === 'receivable';
              return (
                <div key={entry.id} className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isInflow ? <ArrowUpRight size={16} className="text-[#0f8f4b]" /> : <ArrowDownRight size={16} className="text-[#c46a19]" />}
                      <span className="text-sm font-semibold text-[#101938]">{entry.counterpartyName}</span>
                    </div>
                    <span className={`text-sm font-semibold ${isInflow ? 'text-[#0f8f4b]' : 'text-[#c46a19]'}`}>
                      {isInflow ? '+' : '-'}
                      {formatCurrency(entry.openAmount)}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7a96]">{entry.documentNumber || 'Sin documento'} · {entry.dueDate}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-[rgba(205,219,243,0.82)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,249,255,0.9))] p-5 shadow-[0_24px_72px_rgba(126,147,190,0.12)]">
          <div className="mb-5">
            <h3 className="text-[18px] font-semibold tracking-tight text-[#101938]">Recomendaciones</h3>
            <p className="mt-1 text-sm text-[#6b7a96]">Acciones sugeridas para la siguiente semana operativa.</p>
          </div>
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation} className="rounded-[22px] border border-[rgba(201,214,238,0.74)] bg-white/78 px-4 py-4">
                <p className="text-sm leading-7 text-[#5f7091]">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExecutiveSummary;
