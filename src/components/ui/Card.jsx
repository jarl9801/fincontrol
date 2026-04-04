import { formatCurrency } from '../../utils/formatters';

const Card = ({ title, amount, icon, subtext, alert, trend }) => {
 const Icon = icon;
 const isNegative = amount < 0;

 const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null;
 const trendColor =
 trend === 'up' ? 'text-[var(--success)]' : trend === 'down' ? 'text-[var(--negative)]' : '';

 return (
 <div
 className={`px-5 py-4 border transition-colors ${
 alert
 ? 'border-l-2 border-l-[var(--accent)] border-[var(--border)] bg-[var(--surface)]'
 : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-visible)]'
 } rounded-lg`}
 >
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <p className="font-[Space_Mono] text-[11px] uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">
 {title}
 </p>
 <p
 className={`font-[Space_Mono] text-[22px] tabular-nums tracking-tight ${
 isNegative ? 'text-[var(--negative)]' : 'text-[var(--text-primary)]'
 }`}
 >
 {formatCurrency(amount)}
 </p>
 {(subtext || trendSymbol) && (
 <div className="flex items-center gap-1.5 mt-2">
 {trendSymbol && (
 <span className={`font-[Space_Mono] text-[11px] ${trendColor}`}>{trendSymbol}</span>
 )}
 {subtext && (
 <p className="font-[Space_Mono] text-[11px] text-[var(--text-disabled)]">{subtext}</p>
 )}
 </div>
 )}
 </div>
 <Icon size={16} className="text-[var(--text-disabled)] flex-shrink-0 mt-0.5" />
 </div>

 {alert && (
 <div className="mt-3 pt-3 border-t border-[var(--border)]">
 <p className="font-[Space_Mono] text-[11px] uppercase tracking-[0.08em] text-[var(--negative)]">
 [ATENCION]
 </p>
 </div>
 )}
 </div>
 );
};

export default Card;
