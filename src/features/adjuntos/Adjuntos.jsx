import React, { useState } from 'react';
import { Paperclip, Upload, CloudOff, FileText, Image, File, Search } from 'lucide-react';
import { useAllTransactions } from '../../hooks/useAllTransactions';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

const Adjuntos = ({ user, userRole }) => {
  const { allTransactions, loading } = useAllTransactions(user);
  const [isDragging, setIsDragging] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  let toastCtx;
  try { toastCtx = useToast(); } catch { toastCtx = null; }
  const showToast = toastCtx?.showToast;

  // Placeholder: no real attachments yet
  const attachments = [];

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
    showToast?.('Firebase Storage no está configurado aún. Los adjuntos estarán disponibles próximamente.', 'warning');
  };

  const handleFileSelect = () => {
    showToast?.('Firebase Storage no está configurado aún. Los adjuntos estarán disponibles próximamente.', 'warning');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Documentos Adjuntos</h2>
          <p className="text-[13px] text-[#636366] mt-0.5">Gestiona archivos adjuntos a transacciones</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)]">
          <CloudOff size={14} className="text-[#ff9f0a]" />
          <span className="text-[11px] font-medium text-[#ff9f0a]">Storage no configurado</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(10,132,255,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(10,132,255,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Total Archivos</p>
            <Paperclip size={18} className="text-[#0a84ff]" />
          </div>
          <p className="text-[28px] font-bold text-[#0a84ff]">0</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(48,209,88,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Transacciones con Adjuntos</p>
            <FileText size={18} className="text-[#30d158]" />
          </div>
          <p className="text-[28px] font-bold text-[#30d158]">0</p>
        </div>
        <div className="bg-[#1c1c1e] rounded-xl p-5 border border-[rgba(255,159,10,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08) 0%, #1c1c1e 55%)' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Espacio Usado</p>
            <Image size={18} className="text-[#ff9f0a]" />
          </div>
          <p className="text-[28px] font-bold text-[#ff9f0a]">0 MB</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileSelect}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging
            ? 'border-[#0a84ff] bg-[rgba(10,132,255,0.08)]'
            : 'border-[rgba(255,255,255,0.06)] bg-[#1c1c1e] hover:border-[rgba(255,255,255,0.15)]'
        }`}
      >
        <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-[#0a84ff]' : 'text-[#636366]'}`} />
        <p className="text-[14px] font-medium text-white mb-1">
          {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para subir'}
        </p>
        <p className="text-[12px] text-[#636366]">PDF, imágenes, documentos (max 10MB)</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(255,159,10,0.08)] border border-[rgba(255,159,10,0.2)]">
          <CloudOff size={14} className="text-[#ff9f0a]" />
          <span className="text-[12px] text-[#ff9f0a]">Firebase Storage necesita ser configurado</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#636366]" />
        <input
          type="text"
          placeholder="Buscar por transacción o archivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#1c1c1e] border border-[rgba(255,255,255,0.06)] rounded-xl text-[13px] text-white placeholder-[#636366] focus:outline-none focus:border-[rgba(10,132,255,0.4)]"
        />
      </div>

      {/* Table */}
      <div className="bg-[#1c1c1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Transaccion</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Archivos</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider text-right">Tamano</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty state */}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <File className="w-8 h-8 text-[#636366] mx-auto mb-3" />
          <p className="text-sm text-[#636366] mb-1">Los adjuntos estaran disponibles cuando se configure Firebase Storage</p>
          <p className="text-[11px] text-[#48484a]">Se necesita habilitar Firebase Storage en el proyecto umtelkomd-finance</p>
        </div>
      </div>
    </div>
  );
};

export default Adjuntos;
