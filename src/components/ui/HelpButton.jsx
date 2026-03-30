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
        className="inline-flex items-center justify-center rounded-full text-[#8e8e93] hover:text-[#c7c7cc] transition-colors"
        title="Ayuda"
      >
        <HelpCircle size={size} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[300] mt-2 w-[320px] max-h-[400px] overflow-y-auto rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#1c1c1e] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] animate-scaleIn">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h4 className="text-sm font-bold text-[#e5e5ea]">{title}</h4>
            <button onClick={() => setOpen(false)} className="shrink-0 text-[#636366] hover:text-[#98989d]">
              <X size={14} />
            </button>
          </div>
          <div className="text-[13px] leading-relaxed text-[#a1a1a6] space-y-2">
            {children}
          </div>
        </div>
      )}
    </span>
  );
};

export default HelpButton;
