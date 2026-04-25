import { useState, useEffect } from 'react';
import { X, MessageSquare, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/nexus';

const safe = (v) => (v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v));

const NotesModal = ({ isOpen, onClose, transaction, onAddNote }) => {
 const [newNote, setNewNote] = useState('');
 const [activeTab, setActiveTab] = useState('comments');

 // Reset tab when modal opens
 useEffect(() => {
 if (isOpen) {
 setTimeout(() => {
 setActiveTab('comments');
 setNewNote('');
 }, 0);
 }
 }, [isOpen]);

 const handleAddNote = () => {
 if (!newNote.trim()) return;
 onAddNote(transaction, newNote.trim());
 setNewNote('');
 };

 if (!isOpen || !transaction) return null;

 const comments = transaction.notes?.filter(n => n.type === 'comment') || [];
 const systemLogs = transaction.notes?.filter(n => n.type === 'system') || [];

 return (
 <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
 <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] ">
 <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-6 py-4">
 <div>
 <h3 className="flex items-center gap-2 text-lg font-medium tracking-[-0.03em] text-[var(--text-primary)]">
 <MessageSquare size={20} /> Notas y Comentarios
 </h3>
 <p className="mt-1 text-sm text-[var(--text-secondary)]">{transaction.description}</p>
 </div>
 <button onClick={onClose} className="rounded-lg p-2 text-[var(--text-secondary)] transition hover:bg-transparent hover:text-[var(--text-disabled)]">
 <X size={20} />
 </button>
 </div>

 <div className="border-b border-[var(--border)]">
 <div className="flex">
 <button
 onClick={() => setActiveTab('comments')}
 className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
 activeTab === 'comments'
 ? 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
 : 'border-transparent text-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-disabled)]'
 }`}
 >
 <div className="flex items-center justify-center gap-2">
 <MessageSquare size={16} />
 <span>Comentarios</span>
 {comments.length > 0 && (
 <span className="rounded-full bg-transparent px-2 py-0.5 text-xs text-[var(--text-primary)]">
 {comments.length}
 </span>
 )}
 </div>
 </button>
 <button
 onClick={() => setActiveTab('logs')}
 className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
 activeTab === 'logs'
 ? 'border-[var(--text-disabled)] bg-transparent text-[var(--text-disabled)]'
 : 'border-transparent text-[var(--text-secondary)] hover:bg-transparent hover:text-[var(--text-disabled)]'
 }`}
 >
 <div className="flex items-center justify-center gap-2">
 <FileText size={16} />
 <span>Historial</span>
 {systemLogs.length > 0 && (
 <span className="rounded-full bg-transparent px-2 py-0.5 text-xs text-[var(--text-disabled)]">
 {systemLogs.length}
 </span>
 )}
 </div>
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-3">
 {activeTab === 'comments' ? (
 comments.length > 0 ? (
 comments.map((note, idx) => (
 <div key={idx} className="rounded-lg border border-[var(--border-visible)] bg-[var(--surface)] p-4">
 <div className="flex items-start justify-between mb-2">
 <div className="flex items-center gap-2">
 <MessageSquare size={14} className="text-[var(--text-primary)]" />
 <span className="text-xs font-medium text-[var(--text-primary)]">
 {safe(note.user)}
 </span>
 </div>
 <span className="text-xs text-[var(--text-primary)]">
 {new Date(note.timestamp).toLocaleString('es-ES')}
 </span>
 </div>
 <p className="text-sm font-medium text-[var(--text-primary)]">
 {safe(note.text)}
 </p>
 </div>
 ))
 ) : (
 <p className="py-8 text-center text-[var(--text-secondary)]">No hay comentarios aún.</p>
 )
 ) : (
 systemLogs.length > 0 ? (
 systemLogs.map((note, idx) => (
 <div key={idx} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
 <div className="flex items-start justify-between mb-2">
 <div className="flex items-center gap-2">
 <AlertCircle size={14} className="text-[var(--text-secondary)]" />
 <span className="text-xs font-medium text-[var(--text-secondary)]">
 Sistema
 </span>
 </div>
 <span className="text-xs text-[var(--text-secondary)]">
 {new Date(note.timestamp).toLocaleString('es-ES')}
 </span>
 </div>
 <p className="text-sm italic text-[var(--text-disabled)]">
 {safe(note.text)}
 </p>
 </div>
 ))
 ) : (
 <p className="py-8 text-center text-[var(--text-secondary)]">No hay historial aún.</p>
 )
 )}
 </div>

 {activeTab === 'comments' && (
 <div className="border-t border-[var(--border)] bg-[var(--surface-raised)] p-6">
 <div className="flex gap-2">
 <input
 type="text"
 placeholder="Agregar un comentario..."
 className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)] "
 value={newNote}
 onChange={(e) => setNewNote(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
 />
 <Button variant="primary" disabled={!newNote.trim()} onClick={handleAddNote}>
 Agregar
 </Button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};

export default NotesModal;
