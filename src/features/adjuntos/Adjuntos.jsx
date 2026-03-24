import React, { useState } from 'react';
import { Paperclip, Upload, CloudOff, FileText, Image, File, Search } from 'lucide-react';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { useToast } from '../../contexts/ToastContext';

const Adjuntos = ({ user }) => {
  const { loading } = useAllTransactions(user);
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    showToast('Firebase Storage no está configurado aún. Los adjuntos estarán disponibles próximamente.', 'warning');
  };

  const handleFileSelect = () => {
    showToast('Firebase Storage no está configurado aún. Los adjuntos estarán disponibles próximamente.', 'warning');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0a84ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="rounded-[28px] border border-[#dbe7ff] bg-[rgba(255,255,255,0.82)] px-6 py-5 shadow-[0_22px_70px_rgba(128,150,196,0.12)] backdrop-blur-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#5b7bd6]">Documentación</p>
          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#1f2a44]">Adjuntos</h2>
          <p className="mt-1 text-sm text-[#6b7a99]">Centraliza facturas, justificantes y respaldos de cada registro financiero.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl border border-[rgba(214,149,44,0.22)] bg-[rgba(255,248,234,0.92)] px-3 py-2">
          <CloudOff size={14} className="text-[#c98717]" />
          <span className="text-[11px] font-medium text-[#c98717]">Almacenamiento pendiente</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Total archivos</p>
            <Paperclip size={18} className="text-[#2563eb]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#1f5fbf]">0</p>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Registros con adjuntos</p>
            <FileText size={18} className="text-[#0f9f6e]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#0f9f6e]">0</p>
        </div>
        <div className="rounded-[24px] border border-[#dce6f8] bg-white/88 p-5 shadow-[0_18px_55px_rgba(134,153,186,0.12)]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Espacio usado</p>
            <Image size={18} className="text-[#c98717]" />
          </div>
          <p className="text-[28px] font-semibold tracking-[-0.03em] text-[#c98717]">0 MB</p>
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'border-[#7aa2ff] bg-[rgba(59,130,246,0.08)]'
            : 'border-[#d8e3f7] bg-white/88 hover:border-[#b7caef]'
        }`}
      >
        <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-[#2563eb]' : 'text-[#7a879d]'}`} />
        <p className="mb-1 text-[14px] font-medium text-[#1f2a44]">
          {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para subir'}
        </p>
        <p className="text-[12px] text-[#6b7a99]">PDF, imágenes y documentos de respaldo, hasta 10 MB.</p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[rgba(214,149,44,0.22)] bg-[rgba(255,248,234,0.92)] px-4 py-2">
          <CloudOff size={14} className="text-[#c98717]" />
          <span className="text-[12px] text-[#c98717]">Hace falta activar Firebase Storage para habilitar esta función</span>
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a879d]" />
        <input
          type="text"
          placeholder="Buscar por transacción o archivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-[22px] border border-[#d8e3f7] bg-white/88 py-2.5 pl-10 pr-4 text-[13px] text-[#22304f] placeholder-[#93a0b6] outline-none transition focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
        />
      </div>

      <div className="overflow-hidden rounded-[28px] border border-[#dce6f8] bg-white/88 shadow-[0_20px_65px_rgba(134,153,186,0.12)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)]">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Transacción</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Archivos</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Fecha</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[#70819f]">Tamaño</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>

        <div className="text-center py-16">
          <File className="mx-auto mb-3 h-8 w-8 text-[#93a0b6]" />
          <p className="mb-1 text-sm text-[#6b7a99]">Los adjuntos estarán disponibles cuando se active el almacenamiento del proyecto.</p>
          <p className="text-[11px] text-[#93a0b6]">Hace falta habilitar Firebase Storage en `umtelkomd-finance`.</p>
        </div>
      </div>
    </div>
  );
};

export default Adjuntos;
