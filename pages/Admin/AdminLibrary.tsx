import React, { useEffect, useState } from 'react';
import { getStorageFiles, deleteStorageFile } from '../../services/dataService';
import { StorageFile } from '../../types';
import { Button } from '../../components/Button';
import { 
  Folder, 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  Loader2, 
  AlertTriangle, 
  Image as ImageIcon 
} from 'lucide-react';

export const AdminLibrary: React.FC = () => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    const data = await getStorageFiles();
    setFiles(data);
    setLoading(false);
  };

  const handleDelete = async (fileName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o arquivo "${fileName}"?`)) return;
    
    setDeleting(fileName);
    try {
      await deleteStorageFile(fileName);
      setFiles(prev => prev.filter(f => f.name !== fileName));
    } catch (err) {
      alert("Erro ao excluir arquivo.");
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <ImageIcon size={20} className="text-purple-400" />;
    if (mimeType.includes('pdf')) return <FileText size={20} className="text-red-400" />;
    return <FileText size={20} className="text-fire-gray" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-montserrat">Biblioteca de Arquivos</h1>
        <p className="text-fire-gray mt-1">Gerencie os uploads feitos no Supabase Storage (bucket: challenges_assets).</p>
      </div>

      <div className="bg-fire-secondary/20 border border-white/5 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-fire-gray">
             <Loader2 className="animate-spin mr-2" /> Carregando arquivos...
          </div>
        ) : files.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 text-fire-gray text-xs uppercase tracking-wider border-b border-white/5">
                  <th className="p-4 font-medium">Arquivo</th>
                  <th className="p-4 font-medium">Tamanho</th>
                  <th className="p-4 font-medium">Tipo</th>
                  <th className="p-4 font-medium">Data Upload</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded border border-white/10">
                          {getFileIcon(file.metadata?.mimetype || '')}
                        </div>
                        <span className="text-sm font-medium text-white break-all max-w-xs">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-fire-gray font-mono">
                      {formatSize(file.metadata?.size || 0)}
                    </td>
                    <td className="p-4 text-sm text-fire-gray">
                      {file.metadata?.mimetype || 'Desconhecido'}
                    </td>
                    <td className="p-4 text-sm text-fire-gray">
                      {new Date(file.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => file.url && handleCopy(file.url, file.id)}
                           className="p-2 rounded-lg text-fire-gray hover:text-white hover:bg-white/10 transition-colors relative"
                           title="Copiar Link"
                         >
                           {copied === file.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                         </button>
                         <button 
                           onClick={() => handleDelete(file.name)}
                           disabled={deleting === file.name}
                           className="p-2 rounded-lg text-fire-gray hover:text-red-400 hover:bg-red-500/10 transition-colors"
                           title="Excluir"
                         >
                           {deleting === file.name ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <Folder size={48} className="text-fire-gray/30 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Biblioteca Vazia</h3>
            <p className="text-fire-gray text-sm">
              Nenhum arquivo encontrado na raiz do bucket. Os arquivos podem estar dentro de pastas de dias (ex: day-01/).
            </p>
          </div>
        )}
      </div>
    </div>
  );
};