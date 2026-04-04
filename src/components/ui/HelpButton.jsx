import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpButton = ({ title, children, size = 16 }) => {
 const [open, setOpen] = useState(false);
 const ref = useRef(null);

 useEffect(() => {
 if (!open) return;
 const handler = (e) => {
 if (ref.current && !ref.current.contains(e.target)) setOpen(false);
 };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, [open]);

 return (
 <span className="relative inline-flex" ref={ref}>
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
 className="inline-flex items-center justify-center text-[var(--text-disabled)] hover:text-[var(--text-secondary)] transition-colors"
 title="Ayuda"
 >
 <HelpCircle size={size} />
 </button>
 {open && (
 <div className="absolute right-0 top-full z-[300] mt-2 w-[320px] max-h-[400px] overflow-y-auto rounded-xl border border-[var(--border-visible)] bg-[var(--surface)] p-4 animate-fadeIn">
 <div className="flex items-start justify-between gap-2 mb-3">
 <h4 className="font-[Space_Mono] text-[11px] uppercase tracking-[0.08em] text-[var(--text-primary)]">{title}</h4>
 <button onClick={() => setOpen(false)} className="shrink-0 text-[var(--text-disabled)] hover:text-[var(--text-secondary)]">
 <X size={14} />
 </button>
 </div>
 <div className="text-[13px] leading-relaxed text-[var(--text-secondary)] space-y-2">
 {children}
 </div>
 </div>
 )}
 </span>
 );
};

export default HelpButton;
