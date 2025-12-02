import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDays } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import { ChallengeDay } from '../../types';
import { Button } from '../../components/Button';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CheckSquare, 
  Paperclip, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

export const AdminChallenges: React.FC = () => {
  const [days, setDays] = useState<ChallengeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDays();
  }, []);

  const fetchDays = async () => {
    setLoading(true);
    const data = await getDays();
    setDays(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este dia? Esta ação não pode ser desfeita.')) return;

    setDeleteLoading(id);
    try {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      
      if (error) {
        console.warn("Could not delete from DB (might be mock data), removing from UI only.");
      }

      setDays(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Error deleting day:", err);
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-fire-gray">
        <Loader2 className="animate-spin mr-2" /> Carregando desafios...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-montserrat">Gerenciar Desafios</h1>
          <p className="text-fire-gray text-sm mt-1">
            Organize os 15 dias de conteúdo, tarefas e materiais.
          </p>
        </div>
        <Button onClick={() => navigate('/admin/challenges/new')} className="flex items-center gap-2">
          <Plus size={18} /> Novo Dia
        </Button>
      </div>

      <div className="bg-fire-secondary/20 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-fire-gray text-xs uppercase tracking-wider border-b border-white/5">
                <th className="p-4 font-medium">Dia</th>
                <th className="p-4 font-medium">Título & Descrição</th>
                <th className="p-4 font-medium text-center">Tarefas</th>
                <th className="p-4 font-medium text-center">Materiais</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {days.map((day) => (
                <tr key={day.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-fire-secondary/40 border border-white/10 font-bold text-white">
                      <span className="text-xs text-fire-orange uppercase">DIA</span>
                      <span className="text-lg">{day.day_number}</span>
                    </div>
                  </td>
                  <td className="p-4 max-w-md">
                    <div className="font-bold text-white mb-1 font-montserrat line-clamp-1">
                      {day.title.replace(/^Dia \d+: /, '')}
                    </div>
                    <div className="text-xs text-fire-gray line-clamp-2">
                      {day.description}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                      <CheckSquare size={14} />
                      {day.tasks?.length || 0}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-medium">
                      <Paperclip size={14} />
                      {day.resources?.length || 0}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/admin/challenges/edit/${day.day_number}`)}
                        className="p-2 rounded-lg text-fire-gray hover:text-white hover:bg-white/10 transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(day.id)}
                        disabled={deleteLoading === day.id}
                        className="p-2 rounded-lg text-fire-gray hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Excluir"
                      >
                        {deleteLoading === day.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {days.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-fire-gray">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle size={32} className="opacity-50" />
                      <p>Nenhum desafio encontrado.</p>
                      <Button variant="outline" size="sm" onClick={() => fetchDays()} className="mt-2">
                        Recarregar
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};