// FinControl Widget Component for Nexus Hub
// Componente React para mostrar en el Hub de Work Manager

import React, { useEffect, useState } from 'react';
import { 
 Wallet, 
 AlertTriangle, 
 TrendingUp, 
 TrendingDown,
 ArrowUpRight,
 ArrowDownRight,
 Bell
} from 'lucide-react';

const FinControlHubWidget = () => {
 const [summary, setSummary] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, _setError] = useState(null);

 useEffect(() => {
 fetchSummary();
 // Actualizar cada 5 minutos
 const interval = setInterval(fetchSummary, 5 * 60 * 1000);
 return () => clearInterval(interval);
 }, []);

 const fetchSummary = async () => {
 try {
 // Intentar cargar desde la API de FinControl
 // Esto requiere que el usuario esté autenticado en FinControl
 const response = await fetch('https://umtelkomd-finance.web.app/api/hub-summary', {
 credentials: 'include',
 headers: {
 'Accept': 'application/json'
 }
 });

 if (response.ok) {
 const data = await response.json();
 setSummary(data);
 } else {
 // Fallback: cargar desde localStorage (últimos datos conocidos)
 const cached = localStorage.getItem('fincontrol_hub_cache');
 if (cached) {
 try {
 setSummary(JSON.parse(cached));
 } catch {
 // Corrupted cache, ignore
 }
 }
 }
 } catch (err) {
 console.error('Error fetching FinControl summary:', err);
 // Usar datos de demo si no hay conexión
 setSummary(getDemoData());
 } finally {
 setLoading(false);
 }
 };

 const getDemoData = () => ({
 cashflow: {
 income: 45000,
 expense: 32000,
 balance: 13000
 },
 cxp: {
 total: 8500,
 pending: 3,
 overdue: 1,
 upcoming: 2
 },
 cxc: {
 total: 12000,
 pending: 2,
 overdue: 0,
 upcoming: 1
 },
 alerts: [
 { type: 'cxp_overdue', severity: 'high', message: 'Proveedor ABC - €2,500' }
 ],
 lastUpdate: new Date().toISOString()
 });

 const formatCurrency = (amount) => {
 return new Intl.NumberFormat('de-DE', {
 style: 'currency',
 currency: 'EUR',
 minimumFractionDigits: 0,
 maximumFractionDigits: 0
 }).format(amount);
 };

 if (loading) {
 return (
 <div className="nexus-widget nexus-widget-fincontrol skeleton">
 <div className="nexus-widget-header">
 <span>💰 FinControl</span>
 </div>
 <div className="nexus-skeleton-grid">
 <div className="nexus-skeleton-line"></div>
 <div className="nexus-skeleton-line"></div>
 </div>
 </div>
 );
 }

 if (error || !summary) {
 return (
 <div className="nexus-widget nexus-widget-fincontrol">
 <div className="nexus-widget-header">
 <span>💰 FinControl</span>
 </div>
 <div className="nexus-widget-error">
 No se pudieron cargar los datos
 <button onClick={fetchSummary}>Reintentar</button>
 </div>
 </div>
 );
 }

 const hasAlerts = summary.alerts?.length > 0 || summary.cxp.overdue > 0;

 return (
 <div className={`nexus-widget nexus-widget-fincontrol ${hasAlerts ? 'has-alerts' : ''}`}>
 <div className="nexus-widget-header">
 <div className="nexus-widget-title">
 <span>💰 FinControl</span>
 {hasAlerts && (
 <span className="nexus-alert-badge">
 <Bell size={12} />
 {summary.cxp.overdue + summary.cxc.overdue}
 </span>
 )}
 </div>
 <button 
 className="nexus-btn nexus-btn-ghost nexus-btn-sm"
 onClick={() => window.open('https://umtelkomd-finance.web.app', '_blank')}
 >
 Abrir ↗
 </button>
 </div>

 <div className="nexus-widget-content">
 {/* Cashflow */}
 <div className="nexus-fin-row">
 <div className="nexus-fin-stat">
 <div className="nexus-fin-icon nexus-fin-income">
 <ArrowUpRight size={16} />
 </div>
 <div className="nexus-fin-info">
 <div className="nexus-fin-label">Ingresos</div>
 <div className="nexus-fin-value nexus-text-success">
 {formatCurrency(summary.cashflow.income)}
 </div>
 </div>
 </div>

 <div className="nexus-fin-stat">
 <div className="nexus-fin-icon nexus-fin-expense">
 <ArrowDownRight size={16} />
 </div>
 <div className="nexus-fin-info">
 <div className="nexus-fin-label">Gastos</div>
 <div className="nexus-fin-value nexus-text-danger">
 {formatCurrency(summary.cashflow.expense)}
 </div>
 </div>
 </div>
 </div>

 {/* Balance */}
 <div className="nexus-fin-balance">
 <Wallet size={20} />
 <div className="nexus-fin-balance-info">
 <div className="nexus-fin-balance-label">Balance 30 días</div>
 <div className={`nexus-fin-balance-value ${summary.cashflow.balance >= 0 ? 'positive' : 'negative'}`}>
 {formatCurrency(summary.cashflow.balance)}
 </div>
 </div>
 </div>

 {/* CXP / CXC */}
 <div className="nexus-fin-pending">
 <div className="nexus-pending-item">
 <span className="nexus-pending-label">Por Pagar (CXP)</span>
 <div className="nexus-pending-values">
 {summary.cxp.overdue > 0 && (
 <span className="nexus-pending-overdue">{summary.cxp.overdue} venc.</span>
 )}
 <span className="nexus-pending-total">{formatCurrency(summary.cxp.total)}</span>
 </div>
 </div>

 <div className="nexus-pending-item">
 <span className="nexus-pending-label">Por Cobrar (CXC)</span>
 <div className="nexus-pending-values">
 {summary.cxc.overdue > 0 && (
 <span className="nexus-pending-overdue">{summary.cxc.overdue} venc.</span>
 )}
 <span className="nexus-pending-total">{formatCurrency(summary.cxc.total)}</span>
 </div>
 </div>
 </div>

 {/* Alerts */}
 {hasAlerts && (
 <div className="nexus-fin-alerts">
 {summary.alerts.slice(0, 2).map((alert, idx) => (
 <div key={idx} className={`nexus-alert-item nexus-alert-${alert.severity}`}>
 <AlertTriangle size={14} />
 <span>{alert.message}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
};

// CSS para el widget (agregar al CSS del Hub)
const _widgetStyles = `
.nexus-widget-fincontrol {
 min-height: 280px;
}

.nexus-widget-fincontrol.has-alerts {
 border-color: var(--accent);
}

.nexus-alert-badge {
 display: flex;
 align-items: center;
 gap: 4px;
 background: rgba(239, 68, 68, 0.15);
 color: var(--accent);
 padding: 2px 8px;
 border-radius: 12px;
 font-size: 11px;
 font-weight: 700;
}

.nexus-fin-row {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 12px;
 margin-bottom: 16px;
}

.nexus-fin-stat {
 display: flex;
 align-items: center;
 gap: 10px;
 padding: 12px;
 background: rgba(255,255,255,0.03);
 border-radius: 8px;
}

.nexus-fin-icon {
 width: 32px;
 height: 32px;
 display: flex;
 align-items: center;
 justify-content: center;
 border-radius: 8px;
}

.nexus-fin-income {
 background: rgba(34, 197, 94, 0.15);
 color: var(--success);
}

.nexus-fin-expense {
 background: rgba(239, 68, 68, 0.15);
 color: var(--accent);
}

.nexus-fin-label {
 font-size: 11px;
 color: var(--text-disabled);
 text-transform: uppercase;
 letter-spacing: 0.5px;
}

.nexus-fin-value {
 font-size: 15px;
 font-weight: 700;
}

.nexus-text-success { color: var(--success); }
.nexus-text-danger { color: var(--accent); }

.nexus-fin-balance {
 display: flex;
 align-items: center;
 gap: 12px;
 padding: 16px;
 background: rgba(255,255,255,0.03);
 border-radius: 8px;
 margin-bottom: 16px;
}

.nexus-fin-balance-info {
 flex: 1;
}

.nexus-fin-balance-label {
 font-size: 12px;
 color: var(--text-disabled);
}

.nexus-fin-balance-value {
 font-size: 24px;
 font-weight: 700;
}

.nexus-fin-balance-value.positive { color: var(--success); }
.nexus-fin-balance-value.negative { color: var(--accent); }

.nexus-fin-pending {
 display: flex;
 flex-direction: column;
 gap: 8px;
}

.nexus-pending-item {
 display: flex;
 align-items: center;
 justify-content: space-between;
 padding: 10px 12px;
 background: rgba(255,255,255,0.03);
 border-radius: 6px;
}

.nexus-pending-label {
 font-size: 12px;
 color: var(--text-secondary);
}

.nexus-pending-values {
 display: flex;
 align-items: center;
 gap: 8px;
}

.nexus-pending-overdue {
 font-size: 10px;
 font-weight: 600;
 color: var(--accent);
 background: rgba(239, 68, 68, 0.15);
 padding: 2px 6px;
 border-radius: 4px;
}

.nexus-pending-total {
 font-size: 13px;
 font-weight: 600;
 color: var(--text-display);
}

.nexus-fin-alerts {
 margin-top: 12px;
 padding-top: 12px;
 border-top: 1px solid var(--border);
}

.nexus-alert-item {
 display: flex;
 align-items: center;
 gap: 8px;
 padding: 8px 10px;
 border-radius: 6px;
 font-size: 12px;
}

.nexus-alert-high {
 background: rgba(239, 68, 68, 0.1);
 color: var(--accent);
}

.nexus-alert-medium {
 background: rgba(245, 158, 11, 0.1);
 color: var(--warning);
}
`;

export default FinControlHubWidget;
