import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDayByNumber, getDays } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';
import { ChallengeDay, ChallengeTask, ChallengeResource, ResourceType } from '../../types';
import { Button } from '../../components/Button';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Loader2,
  FileText,
  Video,
  Link as LinkIcon,
  MessageCircle,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  Headphones,
  Users,
  Mic
} from 'lucide-react';

export const ChallengeEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [day, setDay] = useState<ChallengeDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      if (id) {
        const data = await getDayByNumber(parseInt(id));
        if (data) {
          setDay(JSON.parse(JSON.stringify(data)));
        } else {
          alert("Dia não encontrado.");
          navigate('/admin/challenges');
        }
      } else {
        const allDays = await getDays();
        const nextDayNum = allDays.length > 0 ? Math.max(...allDays.map(d => d.day_number)) + 1 : 1;

        setDay({
          id: `new-day-${Date.now()}`,
          day_number: nextDayNum,
          title: 'Novo Desafio',
          description: '',
          morning_message: '',
          morning_audio_url: '',
          fire_concept: '',
          fire_audio_url: '',
          expected_result: '',
          reflection_prompt: '',
          tasks: [],
          resources: []
        });
      }
      setLoading(false);
    };
    initData();
  }, [id]);

  const handleDayChange = (field: keyof ChallengeDay, value: any) => {
    if (!day) return;
    setDay({ ...day, [field]: value });
  };

  const handleTaskChange = (taskId: string, field: keyof ChallengeTask, value: any) => {
    if (!day) return;
    setDay({
      ...day,
      tasks: day.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
    });
  };

  const handleAddTask = () => {
    if (!day) return;
    const newTask: ChallengeTask = {
      id: `new-task-${Date.now()}`,
      day_id: day.id,
      title: 'Nova Tarefa',
      is_completed: false,
      order_index: day.tasks.length
    };
    setDay({ ...day, tasks: [...day.tasks, newTask] });
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!day) return;
    if (!window.confirm('Remover esta tarefa?')) return;

    if (!taskId.startsWith('new-')) {
      await supabase.from('challenge_tasks').delete().eq('id', taskId);
    }
    setDay({ ...day, tasks: day.tasks.filter(t => t.id !== taskId) });
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (!day) return;
    const newTasks = [...day.tasks];
    if (direction === 'up' && index > 0) {
      [newTasks[index], newTasks[index - 1]] = [newTasks[index - 1], newTasks[index]];
    } else if (direction === 'down' && index < newTasks.length - 1) {
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
    }
    const reordered = newTasks.map((t, i) => ({ ...t, order_index: i }));
    setDay({ ...day, tasks: reordered });
  };

  const handleResourceChange = (resId: string, field: keyof ChallengeResource, value: any) => {
    if (!day) return;
    setDay({
      ...day,
      resources: day.resources.map(r => r.id === resId ? { ...r, [field]: value } : r)
    });
  };

  const handleAddResource = () => {
    if (!day) return;
    const newRes: ChallengeResource = {
      id: `new-res-${Date.now()}`,
      day_id: day.id,
      title: 'Novo Material',
      url: '',
      type: 'link'
    };
    setDay({ ...day, resources: [...day.resources, newRes] });
  };

  const handleDeleteResource = async (resId: string) => {
    if (!day) return;
    if (!window.confirm('Remover este material?')) return;

    if (!resId.startsWith('new-')) {
      await supabase.from('challenge_resources').delete().eq('id', resId);
    }
    setDay({ ...day, resources: day.resources.filter(r => r.id !== resId) });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, targetId: string, isResource: boolean = true) => {
    if (!event.target.files || event.target.files.length === 0 || !day) return;
    const file = event.target.files[0];

    if (file.size > 50 * 1024 * 1024) {
      alert('Arquivo muito grande. O limite é 50MB.');
      return;
    }

    setUploading(targetId);
    try {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const dayPrefix = `day-${day.day_number.toString().padStart(2, '0')}`;
      const filePath = `${dayPrefix}/${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges_assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenges_assets')
        .getPublicUrl(filePath);

      if (isResource) {
        handleResourceChange(targetId, 'url', publicUrl);
        if (file.type.includes('pdf')) handleResourceChange(targetId, 'type', 'pdf');
        else if (file.type.includes('sheet') || file.name.includes('xls')) handleResourceChange(targetId, 'type', 'sheet');
        else if (file.type.includes('audio')) handleResourceChange(targetId, 'type', 'audio');
        else if (file.type.includes('video')) handleResourceChange(targetId, 'type', 'video');
        else if (file.type.includes('image')) handleResourceChange(targetId, 'type', 'link');
      } else {
        // Handle direct field update (morning_audio_url or fire_audio_url)
        handleDayChange(targetId as keyof ChallengeDay, publicUrl);
      }

    } catch (error: any) {
      console.error('Upload failed:', error);
      alert('Erro no upload: ' + error.message);
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'pdf': return <FileText size={20} className="text-red-400" />;
      case 'sheet': return <FileSpreadsheet size={20} className="text-green-400" />;
      case 'video': return <Video size={20} className="text-purple-400" />;
      case 'audio': return <Headphones size={20} className="text-yellow-400" />;
      case 'community': return <Users size={20} className="text-blue-400" />;
      case 'link':
      default: return <LinkIcon size={20} className="text-fire-gray" />;
    }
  };

  const handleSave = async () => {
    if (!day) return;
    setSaving(true);
    try {
      const isNewDay = day.id.startsWith('new-');
      const dayPayload = {
        day_number: day.day_number,
        title: day.title,
        description: day.description,
        morning_message: day.morning_message,
        morning_audio_url: day.morning_audio_url,
        fire_concept: day.fire_concept,
        fire_audio_url: day.fire_audio_url,
        expected_result: day.expected_result,
        reflection_prompt: day.reflection_prompt
      };

      let dayId = day.id;

      if (isNewDay) {
        const { data: insertedDay, error: insertError } = await supabase
          .from('challenges')
          .insert(dayPayload)
          .select()
          .single();

        if (insertError) throw insertError;
        if (insertedDay) dayId = insertedDay.id;
      } else {
        const { error: updateError } = await supabase
          .from('challenges')
          .update(dayPayload)
          .eq('id', day.id);
        if (updateError) throw updateError;
      }

      if (day.tasks.length > 0) {
        const tasksToUpsert = day.tasks.map(t => {
          const { id, is_completed, ...rest } = t; // Exclude is_completed
          const taskData = { ...rest, day_id: dayId };
          return id.startsWith('new-') ? taskData : { ...taskData, id };
        });
        const { error: tasksError } = await supabase.from('challenge_tasks').upsert(tasksToUpsert);
        if (tasksError) throw tasksError;
      }

      if (day.resources.length > 0) {
        const resToUpsert = day.resources.map(r => {
          const { id, ...rest } = r;
          const resData = { ...rest, day_id: dayId };
          return id.startsWith('new-') ? resData : { ...resData, id };
        });
        const { error: resError } = await supabase.from('challenge_resources').upsert(resToUpsert);
        if (resError) throw resError;
      }

      alert('Salvo com sucesso!');
      navigate('/admin/challenges');

    } catch (error: any) {
      console.error('Save failed:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white p-8">Carregando editor...</div>;
  if (!day) return <div className="text-white p-8">Erro ao carregar dia.</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/challenges')} className="text-fire-gray hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <span className="text-fire-orange text-xs font-bold uppercase tracking-wider">
              {day.id.startsWith('new-') ? 'Novo Conteúdo' : 'Editar Conteúdo'}
            </span>
            <h1 className="text-2xl font-bold text-white font-montserrat">
              {day.id.startsWith('new-') ? 'Criar Novo Dia' : `Dia ${day.day_number}`}
            </h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/admin/challenges')}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving ? <Loader2 className="animate-spin" /> : <span className="flex items-center"><Save size={18} className="mr-2" /> Salvar</span>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText size={20} className="text-fire-orange" /> Dados do Dia
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fire-gray mb-1">Número do Dia</label>
                <input
                  type="number"
                  value={day.day_number}
                  onChange={(e) => handleDayChange('day_number', parseInt(e.target.value))}
                  className="w-24 bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fire-gray mb-1">Título</label>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => handleDayChange('title', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fire-gray mb-1">Descrição</label>
                <textarea
                  value={day.description}
                  onChange={(e) => handleDayChange('description', e.target.value)}
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none resize-none"
                />
              </div>

              {/* Morning Message Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-fire-gray">Mensagem Matinal</label>
                  <label className="cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-bold text-fire-orange hover:text-orange-400 transition-colors bg-fire-orange/10 px-2 py-1 rounded">
                    {uploading === 'morning_audio_url' ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
                    {uploading === 'morning_audio_url' ? 'Enviando...' : 'Upload Áudio'}
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'morning_audio_url', false)} />
                  </label>
                </div>
                {day.morning_audio_url && (
                  <div className="text-xs text-green-400 flex items-center gap-1 mb-1">
                    <Headphones size={12} /> Áudio vinculado
                  </div>
                )}
                <textarea
                  value={day.morning_message || ''}
                  onChange={(e) => handleDayChange('morning_message', e.target.value)}
                  rows={4}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none"
                />
              </div>

              {/* Fire Concept Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-fire-gray">Conceito FIRE</label>
                  <label className="cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-bold text-fire-orange hover:text-orange-400 transition-colors bg-fire-orange/10 px-2 py-1 rounded">
                    {uploading === 'fire_audio_url' ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
                    {uploading === 'fire_audio_url' ? 'Enviando...' : 'Upload Áudio'}
                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'fire_audio_url', false)} />
                  </label>
                </div>
                {day.fire_audio_url && (
                  <div className="text-xs text-green-400 flex items-center gap-1 mb-1">
                    <Headphones size={12} /> Áudio vinculado
                  </div>
                )}
                <textarea
                  value={day.fire_concept || ''}
                  onChange={(e) => handleDayChange('fire_concept', e.target.value)}
                  rows={3}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none"
                />
              </div>
            </div>
          </section>

          <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <MessageCircle size={20} className="text-fire-orange" /> Reflexão & Resultado
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fire-gray mb-1">Resultado Esperado</label>
                <input
                  type="text"
                  value={day.expected_result || ''}
                  onChange={(e) => handleDayChange('expected_result', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fire-gray mb-1">Pergunta de Reflexão</label>
                <input
                  type="text"
                  value={day.reflection_prompt || ''}
                  onChange={(e) => handleDayChange('reflection_prompt', e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white focus:border-fire-orange outline-none"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GripVertical size={20} className="text-fire-orange" /> Tarefas ({day.tasks.length})
              </h2>
              <Button size="sm" onClick={handleAddTask} variant="secondary">
                <Plus size={16} />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {day.tasks.map((task, index) => (
                <div key={task.id} className="bg-white/5 p-3 rounded-lg border border-transparent hover:border-white/10 group transition-colors">
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                      className="flex-1 bg-transparent border-b border-white/10 focus:border-fire-orange outline-none text-sm text-white pb-1"
                      placeholder="Título da tarefa..."
                    />
                    <div className="flex gap-1">
                      <button onClick={() => moveTask(index, 'up')} disabled={index === 0} className="p-1 text-fire-gray hover:text-white disabled:opacity-30"><ArrowUp size={14} /></button>
                      <button onClick={() => moveTask(index, 'down')} disabled={index === day.tasks.length - 1} className="p-1 text-fire-gray hover:text-white disabled:opacity-30"><ArrowDown size={14} /></button>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-fire-gray hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {day.tasks.length === 0 && <div className="text-center text-fire-gray text-xs py-8 border-2 border-dashed border-white/10 rounded-lg">Nenhuma tarefa.</div>}
            </div>
          </section>

          <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon size={20} className="text-fire-orange" /> Materiais
              </h2>
              <Button size="sm" onClick={handleAddResource} variant="secondary">
                <Plus size={16} />
              </Button>
            </div>
            <div className="space-y-4">
              {day.resources.map((res) => (
                <div key={res.id} className="bg-white/5 p-4 rounded-lg border border-transparent hover:border-white/10">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-3">
                      <div className="shrink-0 bg-black/20 p-2 rounded-lg">
                        {getResourceIcon(res.type)}
                      </div>
                      <input
                        type="text"
                        value={res.title}
                        onChange={(e) => handleResourceChange(res.id, 'title', e.target.value)}
                        className="flex-1 bg-transparent border-b border-white/10 focus:border-fire-orange outline-none text-sm text-white font-medium"
                        placeholder="Título"
                      />
                      <button onClick={() => handleDeleteResource(res.id)} className="text-fire-gray hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={res.type}
                        onChange={(e) => handleResourceChange(res.id, 'type', e.target.value as ResourceType)}
                        className="bg-black/30 text-xs text-fire-gray border border-white/10 rounded px-2 py-1 outline-none"
                      >
                        <option value="pdf">PDF</option>
                        <option value="sheet">Planilha</option>
                        <option value="video">Vídeo</option>
                        <option value="audio">Áudio</option>
                        <option value="community">Comunidade</option>
                        <option value="link">Link</option>
                      </select>
                      <input
                        type="text"
                        value={res.url}
                        onChange={(e) => handleResourceChange(res.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-black/30 text-xs text-white border border-white/10 rounded px-2 py-1 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer flex items-center gap-1.5 text-[10px] uppercase font-bold text-fire-orange hover:text-orange-400 transition-colors bg-fire-orange/10 px-2 py-1 rounded">
                        {uploading === res.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                        {uploading === res.id ? 'Enviando...' : 'Upload'}
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, res.id)} />
                      </label>
                      <span className="text-[10px] text-fire-gray italic max-w-[150px] truncate">{res.url ? 'Arquivo vinculado' : ''}</span>
                    </div>
                  </div>
                </div>
              ))}
              {day.resources.length === 0 && <div className="text-center text-fire-gray text-xs py-8 border-2 border-dashed border-white/10 rounded-lg">Nenhum material.</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};