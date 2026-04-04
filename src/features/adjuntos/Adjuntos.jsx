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
 <div className="w-6 h-6 border-2 border-[var(--interactive)] border-t-transparent rounded-full animate-spin" />
 </div>
 );
 }

 return (
 <div className="space-y-6 animate-fadeIn">
 <div className="flex items-center justify-between">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5 ">
 <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-primary)]">Documentación</p>
 <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">Adjuntos</h2>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">Centraliza facturas, justificantes y respaldos de cada registro financiero.</p>
 </div>
 <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-visible)] bg-transparent px-3 py-2">
 <CloudOff size={14} className="text-[var(--warning)]" />
 <span className="text-[11px] font-medium text-[var(--warning)]">Almacenamiento pendiente</span>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center justify-between mb-2">
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Total archivos</p>
 <Paperclip size={18} className="text-[var(--text-primary)]" />
 </div>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">0</p>
 </div>
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center justify-between mb-2">
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Registros con adjuntos</p>
 <FileText size={18} className="text-[var(--success)]" />
 </div>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--success)]">0</p>
 </div>
 <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 ">
 <div className="flex items-center justify-between mb-2">
 <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Espacio usado</p>
 <Image size={18} className="text-[var(--warning)]" />
 </div>
 <p className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--warning)]">0 MB</p>
 </div>
 </div>

 <div
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={handleFileSelect}
 className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
 isDragging
 ? 'border-[var(--text-primary)] bg-transparent'
 : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border)]'
 }`}
 >
 <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`} />
 <p className="mb-1 text-[14px] font-medium text-[var(--text-primary)]">
 {isDragging ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic para subir'}
 </p>
 <p className="text-[12px] text-[var(--text-secondary)]">PDF, imágenes y documentos de respaldo, hasta 10 MB.</p>
 <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border-visible)] bg-transparent px-4 py-2">
 <CloudOff size={14} className="text-[var(--warning)]" />
 <span className="text-[12px] text-[var(--warning)]">Hace falta activar Firebase Storage para habilitar esta función</span>
 </div>
 </div>

 <div className="relative">
 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
 <input
 type="text"
 placeholder="Buscar por transacción o archivo..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-[13px] text-[var(--text-primary)] placeholder-[#999] outline-none transition focus:border-[var(--text-primary)] "
 />
 </div>

 <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] ">
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Transacción</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Archivos</th>
 <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Fecha</th>
 <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">Tamaño</th>
 </tr>
 </thead>
 <tbody>
 </tbody>
 </table>
 </div>

 <div className="text-center py-16">
 <File className="mx-auto mb-3 h-8 w-8 text-[var(--text-secondary)]" />
 <p className="mb-1 text-sm text-[var(--text-secondary)]">Los adjuntos estarán disponibles cuando se active el almacenamiento del proyecto.</p>
 <p className="text-[11px] text-[var(--text-secondary)]">Hace falta habilitar Firebase Storage en `umtelkomd-finance`.</p>
 </div>
 </div>
 </div>
 );
};

export default Adjuntos;
