import { useState, useEffect } from 'react';
import { X, MessageSquare, FileText, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#13132a]">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <MessageSquare size={20} /> Notas y Comentarios
            </h3>
            <p className="text-sm text-slate-500 mt-1">{transaction.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'comments'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-[#13132a]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                <span>Comentarios</span>
                {comments.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'logs'
                  ? 'border-slate-500 text-slate-700 bg-[#13132a]'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-[#13132a]'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText size={16} />
                <span>Historial</span>
                {systemLogs.length > 0 && (
                  <span className="bg-slate-400 text-white text-xs px-2 py-0.5 rounded-full">
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
                <div key={idx} className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">
                        {note.user}
                      </span>
                    </div>
                    <span className="text-xs text-blue-500">
                      {new Date(note.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm text-blue-900 font-medium">
                    {note.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No hay comentarios aún.</p>
            )
          ) : (
            systemLogs.length > 0 ? (
              systemLogs.map((note, idx) => (
                <div key={idx} className="p-4 rounded-lg border bg-[#13132a] border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500">
                        Sistema
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(note.timestamp).toLocaleString('es-ES')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 italic">
                    {note.text}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-8">No hay historial aún.</p>
            )
          )}
        </div>

        {activeTab === 'comments' && (
          <div className="p-6 border-t border-slate-100 bg-blue-50">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Agregar un comentario..."
                className="flex-1 px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  newNote.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-300 text-white cursor-not-allowed'
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
