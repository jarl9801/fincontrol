import React, { useState, useRef } from 'react';
import {
  Download, Upload, Database, FileJson, AlertTriangle, CheckCircle2,
  Info, Loader2, Clock, HardDrive, Eye
} from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, appId } from '../../services/firebase';
import { useToast } from '../../contexts/ToastContext';

const COLLECTIONS = [
  'transactions',
  'projects',
  'costCenters',
  'categories',
  'receivables',
  'payables',
  'budgets',
  'notifications',
  'auditLog',
];

const BackupManager = ({ user, userRole }) => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const basePath = `artifacts/${appId}/public/data`;

  const handleExport = async () => {
    setExporting(true);
    setExportProgress('Iniciando backup...');
    try {
      const backupData = {
        metadata: {
          exportDate: new Date().toISOString(),
          exportedBy: user?.email || 'unknown',
          appId: appId,
          version: '1.0',
          collections: [],
        },
        data: {},
      };

      for (const col of COLLECTIONS) {
        setExportProgress(`Exportando ${col}...`);
        try {
          const ref = collection(db, `${basePath}/${col}`);
          const q = query(ref);
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          backupData.data[col] = docs;
          backupData.metadata.collections.push({
            name: col,
            count: docs.length,
          });
        } catch (err) {
          console.warn(`No se pudo exportar ${col}:`, err.message);
          backupData.data[col] = [];
          backupData.metadata.collections.push({
            name: col,
            count: 0,
            error: err.message,
          });
        }
      }

      // Generate and download file
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const date = new Date().toISOString().split('T')[0];
      const filename = `fincontrol-backup-${date}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const totalDocs = backupData.metadata.collections.reduce((sum, c) => sum + c.count, 0);
      showToast(`Backup completado: ${totalDocs} documentos en ${COLLECTIONS.length} colecciones`, 'success');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Error al generar el backup', 'error');
    }
    setExporting(false);
    setExportProgress('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Solo se aceptan archivos .json', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data.metadata || !data.data) {
          showToast('El archivo no tiene el formato de backup esperado', 'error');
          return;
        }

        const preview = {
          filename: file.name,
          fileSize: (file.size / 1024).toFixed(1),
          exportDate: data.metadata.exportDate,
          exportedBy: data.metadata.exportedBy,
          collections: Object.entries(data.data).map(([name, docs]) => ({
            name,
            count: Array.isArray(docs) ? docs.length : 0,
          })),
          totalDocs: Object.values(data.data).reduce(
            (sum, docs) => sum + (Array.isArray(docs) ? docs.length : 0),
            0
          ),
        };

        setImportPreview(preview);
      } catch (err) {
        showToast('Error al leer el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setImporting(true);
    setTimeout(() => {
      setImporting(false);
      showToast('La restauracion requiere permisos de escritura batch. Implementar via Cloud Functions para mayor seguridad.', 'info');
      setImportPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1500);
  };

  const cancelImport = () => {
    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Placeholder backup history
  const backupHistory = [
    { date: '—', type: 'Manual', status: 'placeholder', size: '—', user: '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[rgba(48,209,88,0.12)] rounded-xl">
          <Database className="text-[#30d158]" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#e5e5ea]">Backup & Restauracion</h2>
          <p className="text-sm text-[#8e8e93]">Exporta e importa los datos de FinControl</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Download className="text-[#0a84ff]" size={20} />
          <h3 className="text-lg font-bold text-[#e5e5ea]">Exportar Backup</h3>
        </div>
        <p className="text-sm text-[#8e8e93] mb-4">
          Descarga todos los datos de Firestore como un archivo JSON. Incluye: {COLLECTIONS.join(', ')}.
        </p>

        {/* Collections preview */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-6">
          {COLLECTIONS.map((col) => (
            <div key={col} className="bg-[#2c2c2e] rounded-lg p-2.5 text-center">
              <FileJson className="mx-auto text-[#0a84ff] mb-1" size={16} />
              <p className="text-xs text-[#c7c7cc] truncate">{col}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0a84ff] hover:bg-[#0070e0] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {exporting ? 'Exportando...' : 'Descargar Backup Completo'}
          </button>
          {exportProgress && (
            <span className="text-sm text-[#8e8e93] animate-pulse">{exportProgress}</span>
          )}
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="text-[#ff9f0a]" size={20} />
          <h3 className="text-lg font-bold text-[#e5e5ea]">Restaurar desde Backup</h3>
        </div>
        <p className="text-sm text-[#8e8e93] mb-4">
          Selecciona un archivo JSON de backup generado previamente para previsualizar y restaurar los datos.
        </p>

        {!importPreview ? (
          <div className="border-2 border-dashed border-[rgba(255,255,255,0.12)] rounded-xl p-8 text-center hover:border-[rgba(255,159,10,0.4)] transition-colors">
            <HardDrive className="mx-auto text-[#48484a] mb-3" size={36} />
            <p className="text-sm text-[#8e8e93] mb-3">Arrastra un archivo o haz clic para seleccionar</p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#e5e5ea] rounded-lg cursor-pointer transition-colors text-sm font-medium">
              <Upload size={16} />
              Seleccionar Archivo
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="bg-[#2c2c2e] rounded-xl p-4 border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="text-[#ff9f0a]" size={18} />
                <h4 className="text-sm font-bold text-[#e5e5ea]">Vista Previa del Backup</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-xs text-[#636366]">Archivo</p>
                  <p className="text-sm text-[#e5e5ea] font-medium truncate">{importPreview.filename}</p>
                </div>
                <div>
                  <p className="text-xs text-[#636366]">Tamano</p>
                  <p className="text-sm text-[#e5e5ea] font-medium">{importPreview.fileSize} KB</p>
                </div>
                <div>
                  <p className="text-xs text-[#636366]">Fecha de export</p>
                  <p className="text-sm text-[#e5e5ea] font-medium">
                    {importPreview.exportDate
                      ? new Date(importPreview.exportDate).toLocaleDateString('es-ES')
                      : '—'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#636366]">Total documentos</p>
                  <p className="text-sm text-[#30d158] font-bold">{importPreview.totalDocs}</p>
                </div>
              </div>

              {/* Collection breakdown */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.06)]">
                      <th className="pb-2 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Coleccion</th>
                      <th className="pb-2 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide text-right">Documentos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.collections.map((col) => (
                      <tr key={col.name} className="border-b border-[rgba(255,255,255,0.04)]">
                        <td className="py-2 text-sm text-[#c7c7cc]">{col.name}</td>
                        <td className="py-2 text-sm text-[#e5e5ea] font-medium text-right">{col.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-[rgba(255,69,58,0.08)] border border-[rgba(255,69,58,0.25)] rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="text-[#ff453a] flex-shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-[#ff453a]">
                La restauracion sobrescribira los datos existentes. Asegurate de tener un backup actual antes de continuar.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#ff9f0a] hover:bg-[#e68f00] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {importing ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                {importing ? 'Procesando...' : 'Restaurar Datos'}
              </button>
              <button
                onClick={cancelImport}
                className="px-4 py-2.5 bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[#e5e5ea] rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backup History */}
      <div className="bg-[#1c1c1e] rounded-2xl p-6 shadow-sm border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="text-[#8e8e93]" size={20} />
          <h3 className="text-lg font-bold text-[#e5e5ea]">Historial de Backups</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Fecha</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Tipo</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Estado</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Tamano</th>
                <th className="pb-3 text-xs font-semibold text-[#8e8e93] uppercase tracking-wide">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {backupHistory.map((entry, i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.04)]">
                  <td className="py-3 text-[#636366] text-sm">{entry.date}</td>
                  <td className="py-3 text-[#636366] text-sm">{entry.type}</td>
                  <td className="py-3 text-[#636366] text-sm italic">Pendiente de implementacion</td>
                  <td className="py-3 text-[#636366] text-sm">{entry.size}</td>
                  <td className="py-3 text-[#636366] text-sm">{entry.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-[#636366] mt-3 italic">
          El historial automatico se habilitara cuando se configuren Cloud Functions para backups programados.
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-[rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)] rounded-xl p-4 flex items-start gap-3">
        <Info className="text-[#0a84ff] flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-[#0a84ff] font-medium">Backups automaticos</p>
          <p className="text-xs text-[#8e8e93] mt-1">
            Para backups automaticos semanales, configurar Firebase Cloud Functions con un trigger programado (cron) que exporte los datos a Cloud Storage. Contacta al administrador para activar esta funcionalidad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
