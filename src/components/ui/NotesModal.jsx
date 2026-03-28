import { useState, useEffect } from 'react';
import { X, MessageSquare, FileText, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-[#dce6f8] bg-[rgba(255,255,255,0.96)] shadow-[0_35px_120px_rgba(15,23,42,0.24)]">
        <div className="flex items-center justify-between border-b border-[#e2ebfb] bg-[rgba(245,248,255,0.94)] px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-[-0.03em] text-[#1f2a44]">
              <MessageSquare size={20} /> Notas y Comentarios
            </h3>
            <p className="mt-1 text-sm text-[#6b7a99]">{transaction.description}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl p-2 text-[#7a879d] transition hover:bg-[rgba(94,115,159,0.08)] hover:text-[#5f6f8d]">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-[#e2ebfb]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'comments'
                  ? 'border-[#7aa2ff] bg-[rgba(59,130,246,0.08)] text-[#2563eb]'
                  : 'border-transparent text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)] hover:text-[#5f6f8d]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                <span>Comentarios</span>
                {comments.length > 0 && (
                  <span className="rounded-full bg-[rgba(59,130,246,0.12)] px-2 py-0.5 text-xs text-[#2563eb]">
                    {comments.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'logs'
                  ? 'border-[#9eb0cf] bg-[rgba(107,122,153,0.08)] text-[#5f6f8d]'
                  : 'border-transparent text-[#6b7a99] hover:bg-[rgba(94,115,159,0.08)] hover:text-[#5f6f8d]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={16} />
                <span>Historial</span>
                {systemLogs.length > 0 && (
                  <span className="rounded-full bg-[rgba(107,122,153,0.12)] px-2 py-0.5 text-xs text-[#5f6f8d]">
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
                <div key={idx} className="rounded-2xl border border-[rgba(59,130,246,0.22)] bg-[rgba(240,246,255,0.94)] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-[#2563eb]" />
                      <span className="text-xs font-semibold text-[#2563eb]">
                        {safe(note.user)}
                      </span>
                    </div>
                    <span className="text-xs text-[#2563eb]">
                      {new Date(note.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#1f2a44]">
                    {safe(note.text)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-[#6b7a99]">No hay comentarios aún.</p>
            )
          ) : (
            systemLogs.length > 0 ? (
              systemLogs.map((note, idx) => (
                <div key={idx} className="rounded-2xl border border-[#dce6f8] bg-[rgba(246,249,255,0.92)] p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-[#6b7a99]" />
                      <span className="text-xs font-semibold text-[#6b7a99]">
                        Sistema
                      </span>
                    </div>
                    <span className="text-xs text-[#93a0b6]">
                      {new Date(note.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm italic text-[#5f6f8d]">
                    {safe(note.text)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-[#6b7a99]">No hay historial aún.</p>
            )
          )}
        </div>

        {activeTab === 'comments' && (
          <div className="border-t border-[#e2ebfb] bg-[rgba(245,248,255,0.94)] p-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agregar un comentario..."
                className="flex-1 rounded-2xl border border-[#d8e3f7] bg-white/92 px-4 py-2.5 text-sm text-[#22304f] outline-none focus:border-[#7aa2ff] focus:ring-2 focus:ring-[rgba(59,130,246,0.12)]"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  newNote.trim()
                    ? 'bg-[#2563eb] text-white hover:bg-[#1f56cf]'
                    : 'cursor-not-allowed bg-[#bdd0f8] text-white'
                }`}
              >
                Agregar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesModal;
