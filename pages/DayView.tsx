import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDays, getUserProgress, toggleTaskCompletion, getUserNote, saveUserNote, getUserReflectionAnswers, saveUserReflectionAnswer } from '../services/dataService';
import { ChallengeDay, ChallengeTask } from '../types';
import { Button } from '../components/Button';
import { VideoPlayer } from '../components/VideoPlayer';
import {
  ArrowLeft,
  CheckSquare,
  Download,
  Video,
  FileText,
  MessageCircle,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Save,
  CheckCircle,
  Sun,
  Flame,
  Target,
  Wrench,
  BrainCircuit,
  Handshake,
  Calendar,
  Lock,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const DayView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [day, setDay] = useState<ChallengeDay | null>(null);
  const [prevDay, setPrevDay] = useState<ChallengeDay | null>(null);
  const [nextDay, setNextDay] = useState<ChallengeDay | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  // UI State for Collapsible Text
  const [morningTextOpen, setMorningTextOpen] = useState(false);
  const [fireTextOpen, setFireTextOpen] = useState(false);

  // Note State
  const [userNote, setUserNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  // New state for reflection answers
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [savingReflections, setSavingReflections] = useState<Record<string, boolean>>({});

  // Commitment State (Local UI state)
  const [committed, setCommitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      const days = await getDays();
      const dayNum = Number(id);

      const currentDay = days.find(d => d.day_number === dayNum);
      const prev = days.find(d => d.day_number === dayNum - 1);
      const next = days.find(d => d.day_number === dayNum + 1);

      setPrevDay(prev || null);
      setNextDay(next || null);

      if (currentDay) {
        setDay(currentDay);
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'mock-user-id';

        // Parallel Fetch
        const [progress, note, reflectionAnswersData] = await Promise.all([
          getUserProgress(userId),
          getUserNote(userId, currentDay.id),
          currentDay.reflections && currentDay.reflections.length > 0
            ? getUserReflectionAnswers(userId, currentDay.reflections.map(r => r.id))
            : Promise.resolve({})
        ]);

        setCompletedTasks(progress);
        setUserNote(note);
        setReflectionAnswers(reflectionAnswersData);

        // Auto-set committed if tasks are started
        if (progress.some(pid => currentDay.tasks.some(t => t.id === pid))) {
          setCommitted(true);
        }

        // Lock Logic: If prev day exists and NOT all tasks are in progress array
        if (prev) {
          const prevDayTaskIds = prev.tasks.map(t => t.id);
          const isPrevComplete = prevDayTaskIds.every(tid => progress.includes(tid));
          // If previous day has tasks and they aren't all done, lock current day
          if (prev.tasks.length > 0 && !isPrevComplete) {
            setIsLocked(true);
          } else {
            setIsLocked(false);
          }
        } else {
          // Day 1 is always unlocked
          setIsLocked(false);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleTaskToggle = async (taskId: string) => {
    if (isLocked) return;

    const isCompleted = completedTasks.includes(taskId);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'mock-user-id';

    if (isCompleted) {
      setCompletedTasks(prev => prev.filter(id => id !== taskId));
    } else {
      setCompletedTasks(prev => [...prev, taskId]);
      setCommitted(true);
    }

    await toggleTaskCompletion(userId, taskId, !isCompleted);
  };

  const handleSaveNote = async () => {
    if (!day || isLocked) return;
    setSavingNote(true);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'mock-user-id';

    await saveUserNote(userId, day.id, userNote);

    setSavingNote(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  const handleReflectionChange = (id: string, value: string) => {
    setReflectionAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveReflection = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSavingReflections(prev => ({ ...prev, [id]: true }));
    try {
      await saveUserReflectionAnswer(user.id, id, reflectionAnswers[id]);
    } catch (error) {
      console.error('Error saving reflection', error);
    } finally {
      setTimeout(() => {
        setSavingReflections(prev => ({ ...prev, [id]: false }));
      }, 500);
    }
  };

  const calculateProgress = () => {
    if (!day || day.tasks.length === 0) return 0;
    const completedCount = day.tasks.filter(t => completedTasks.includes(t.id)).length;
    return Math.round((completedCount / day.tasks.length) * 100);
  };

  const navigateDay = (targetId: number) => {
    navigate(`/day/${targetId}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Flame className="text-fire-orange animate-bounce" size={40} />
        <span>Carregando seu desafio...</span>
      </div>
    </div>
  );

  if (!day) return <div className="p-8 text-white">Dia não encontrado.</div>;

  const progress = calculateProgress();
  const isDayComplete = progress === 100;

  const videoResources = day.resources.filter(r => r.type === 'video');
  const otherResources = day.resources.filter(r => r.type !== 'video');

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-32">

      {/* HEADER NAVIGATION */}
      <div className="sticky top-0 z-30 bg-fire-dark/95 backdrop-blur-md py-4 border-b border-white/5 -mx-6 px-6 md:mx-0 md:px-0 md:static md:bg-transparent md:border-none">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center text-fire-gray hover:text-white transition-colors text-sm font-medium"
          >
            <div className="bg-white/5 p-1.5 rounded-lg mr-2 group-hover:bg-white/10 transition-colors">
              <ArrowLeft size={14} />
            </div>
            Voltar
          </button>

          <div className="text-right">
            <div className="flex items-center justify-end gap-3">
              <span className="text-xs font-bold text-fire-orange tracking-widest uppercase">
                DIA {day.day_number.toString().padStart(2, '0')}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLocked ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {isLocked ? 'BLOQUEADO' : 'LIBERADO'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-fire-secondary rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ease-out ${isDayComplete ? 'bg-green-500' : 'bg-fire-orange'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-white min-w-[3rem] text-right">{progress}%</span>
        </div>
      </div>

      {/* TITLE HERO */}
      <header className="text-center space-y-4 pt-4 md:pt-0">
        <h1 className="text-3xl md:text-5xl font-bold text-white font-montserrat tracking-tight leading-tight">
          {day.title.includes(':') ? day.title.split(': ')[1] : day.title}
        </h1>
        <p className="text-fire-gray text-lg max-w-2xl mx-auto leading-relaxed">
          {day.description}
        </p>
      </header>

      {/* LOCKED STATE OVERLAY */}
      {isLocked ? (
        <div className="bg-fire-secondary/20 border border-red-500/20 rounded-2xl p-8 text-center py-20 space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border-2 border-red-500/20">
            <Lock size={40} className="text-red-400" />
          </div>
          <div className="max-w-md mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-white font-montserrat">Conteúdo Bloqueado</h2>
            <p className="text-fire-gray">
              Para acessar o conteúdo do <strong>Dia {day.day_number}</strong>, você precisa completar todas as tarefas do dia anterior.
            </p>
            {prevDay && (
              <Button onClick={() => navigateDay(prevDay.day_number)} variant="outline" className="mt-4">
                Voltar para o Dia {prevDay.day_number}
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* UNLOCKED CONTENT */
        <div className="space-y-12 animate-in fade-in duration-500">

          {/* 1. MENSAGEM MATINAL */}
          <section className="bg-gradient-to-br from-fire-secondary/30 to-fire-dark border border-white/5 rounded-2xl p-6 md:p-8 relative overflow-hidden group hover:border-fire-orange/20 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Sun size={100} className="text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-6 font-montserrat flex items-center gap-3">
              <span className="bg-yellow-500/20 text-yellow-400 p-2 rounded-lg"><Sun size={20} /></span>
              Mensagem Matinal
            </h2>
            <div className="space-y-4">
              {day.morning_audio_url ? (
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner">
                    <audio controls className="w-full h-12 accent-fire-orange" src={day.morning_audio_url} />
                  </div>

                  <button
                    onClick={() => setMorningTextOpen(!morningTextOpen)}
                    className="flex items-center gap-2 text-sm text-fire-gray hover:text-white transition-colors font-medium"
                  >
                    {morningTextOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {morningTextOpen ? 'Ocultar texto' : 'Ler mensagem completa'}
                  </button>

                  {morningTextOpen && (
                    <div className="prose prose-invert prose-lg text-fire-light/90 leading-relaxed font-light italic border-l-4 border-yellow-500/30 pl-6 animate-in fade-in slide-in-from-top-2">
                      "{day.morning_message}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="prose prose-invert prose-lg text-fire-light/90 leading-relaxed font-light italic border-l-4 border-yellow-500/30 pl-6">
                  "{day.morning_message}"
                </div>
              )}
            </div>
          </section>

          {/* 2. CONCEITO FIRE */}
          <section className="bg-[#011627] border border-fire-secondary rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-lg">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-fire-orange/10 rounded-full blur-3xl pointer-events-none"></div>
            <h2 className="text-xl font-bold text-white mb-6 font-montserrat flex items-center gap-3 relative z-10">
              <span className="bg-fire-orange/20 text-fire-orange p-2 rounded-lg"><Flame size={20} /></span>
              Conceito FIRE do Dia
            </h2>
            <div className="bg-fire-secondary/20 p-6 rounded-xl border border-white/5 relative z-10 space-y-4">
              {day.fire_audio_url ? (
                <div className="space-y-4">
                  <div className="bg-black/40 p-4 rounded-xl border border-white/10 shadow-inner">
                    <audio controls className="w-full h-12 accent-fire-orange" src={day.fire_audio_url} />
                  </div>

                  <button
                    onClick={() => setFireTextOpen(!fireTextOpen)}
                    className="flex items-center gap-2 text-sm text-fire-gray hover:text-white transition-colors font-medium"
                  >
                    {fireTextOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    {fireTextOpen ? 'Ocultar texto' : 'Ler conceito completo'}
                  </button>

                  {fireTextOpen && (
                    <p className="text-lg font-medium text-white text-center md:text-left leading-relaxed animate-in fade-in slide-in-from-top-2">
                      {day.fire_concept}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-lg font-medium text-white text-center md:text-left leading-relaxed">
                  {day.fire_concept}
                </p>
              )}
            </div>
          </section>

          {/* 3. SEU DESAFIO HOJE (Video & Description) */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white font-montserrat flex items-center gap-3">
              <Target className="text-fire-orange" size={28} />
              Seu Desafio Hoje
            </h2>

            {/* Video Player */}
            {videoResources.length > 0 && (
              <div className="grid gap-6">
                {videoResources.map(vid => (
                  <VideoPlayer key={vid.id} url={vid.url} title={vid.title} />
                ))}
              </div>
            )}

            <div className="bg-fire-secondary/10 border border-white/10 rounded-xl p-6 text-fire-light leading-relaxed">
              <p className="mb-4">
                Hoje vamos focar em: <span className="text-white font-bold">{day.description}</span>.
              </p>
              {day.challenge_details && (
                <div className="whitespace-pre-wrap text-white/90 font-medium border-t border-white/10 pt-4 mt-4">
                  {day.challenge_details}
                </div>
              )}
            </div>
          </section>

          {/* 4. PASSO A PASSO (Checklist) */}
          <section className="bg-fire-secondary/20 border border-white/5 rounded-2xl overflow-hidden">
            <div className="bg-fire-secondary/40 p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white font-montserrat flex items-center gap-3">
                <CheckSquare className="text-green-400" size={24} />
                Passo a Passo
              </h2>
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${isDayComplete ? 'bg-green-500 text-white' : 'bg-black/20 text-fire-gray'}`}>
                {isDayComplete ? 'Completo!' : `${day.tasks.filter(t => completedTasks.includes(t.id)).length}/${day.tasks.length}`}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {day.tasks.map((task, index) => {
                const isDone = completedTasks.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskToggle(task.id)}
                    className={`
                      relative group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all border
                      ${isDone
                        ? 'bg-green-500/5 border-green-500/20 shadow-[0_0_15px_-5px_rgba(34,197,94,0.3)]'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20 hover:shadow-lg'}
                    `}
                  >
                    <div className="mt-1 relative">
                      <div className={`
                        w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-300
                        ${isDone ? 'bg-green-500 border-green-500' : 'border-fire-gray group-hover:border-fire-orange'}
                      `}>
                        {isDone && <CheckSquare size={16} className="text-white" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 transition-colors ${isDone ? 'text-fire-gray line-through' : 'text-white group-hover:text-fire-orange'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-fire-gray">{task.description}</p>
                      )}
                    </div>
                    <div className="absolute right-4 top-4 text-fire-gray/20 font-bold text-4xl select-none group-hover:text-fire-gray/40 transition-colors">
                      {index + 1}
                    </div>
                  </div>
                );
              })}
              {day.tasks.length === 0 && (
                <p className="text-fire-gray text-center text-sm py-4">Nenhuma tarefa cadastrada para este dia.</p>
              )}
            </div>
          </section>

          {/* 5. FERRAMENTAS NECESSÁRIAS */}
          {otherResources.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white font-montserrat flex items-center gap-3 px-2">
                <Wrench className="text-blue-400" size={24} />
                Ferramentas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherResources.map(res => {
                  const Icon = res.type === 'pdf' ? FileText
                    : res.type === 'sheet' ? Download
                      : res.type === 'community' ? MessageCircle
                        : LinkIcon;

                  const colorClass = res.type === 'sheet' ? 'text-green-400 bg-green-400/10'
                    : res.type === 'pdf' ? 'text-red-400 bg-red-400/10'
                      : res.type === 'community' ? 'text-blue-400 bg-blue-400/10'
                        : 'text-fire-gray bg-white/10';

                  return (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-4 bg-fire-secondary/20 border border-white/5 p-4 rounded-xl hover:bg-fire-secondary/40 hover:border-fire-orange/30 transition-all group"
                    >
                      <div className={`p-3 rounded-lg ${colorClass} group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm group-hover:text-fire-orange transition-colors">{res.title}</h3>
                        <span className="text-xs text-fire-gray uppercase tracking-wider">{res.type}</span>
                      </div>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download size={16} className="text-fire-gray" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* 6. RESULTADO ESPERADO */}
          <section className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-6 flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-full shrink-0">
              <Target size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-blue-200 font-bold mb-1 uppercase text-xs tracking-wider">Resultado Esperado</h3>
              <p className="text-white font-medium italic">
                "{day.expected_result}"
              </p>
            </div>
          </section>

          {/* 7. REFLEXÃO GUIADA */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white font-montserrat flex items-center gap-3 px-2">
              <BrainCircuit className="text-purple-400" size={24} />
              Reflexão Guiada
            </h2>
            <div className="bg-gradient-to-br from-fire-secondary/20 to-fire-dark border border-white/10 rounded-2xl p-6 md:p-8 space-y-8">
              {day.reflections && day.reflections.length > 0 ? (
                day.reflections.map((ref) => (
                  <div key={ref.id} className="space-y-3">
                    <p className="text-lg text-white font-medium leading-relaxed flex items-start gap-2">
                      <span className="text-fire-orange mt-1">•</span>
                      {ref.question}
                    </p>
                    <div className="relative">
                      <textarea
                        value={reflectionAnswers[ref.id] || ''}
                        onChange={(e) => handleReflectionChange(ref.id, e.target.value)}
                        onBlur={() => handleSaveReflection(ref.id)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-fire-light placeholder-white/20 focus:outline-none focus:border-fire-orange/50 focus:ring-1 focus:ring-fire-orange/50 transition-all h-32 resize-none leading-relaxed"
                        placeholder="Sua resposta..."
                      />
                      <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        {savingReflections[ref.id] && (
                          <span className="text-xs text-fire-gray flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Salvando...
                          </span>
                        )}
                        {!savingReflections[ref.id] && reflectionAnswers[ref.id] && (
                          <span className="text-xs text-green-400 flex items-center gap-1">
                            <CheckCircle size={12} /> Salvo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Fallback for old single prompt
                <div className="space-y-4">
                  <p className="text-lg text-white font-medium max-w-2xl">{day.reflection_prompt}</p>
                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-6 text-fire-light placeholder-white/20 focus:outline-none focus:border-fire-orange/50 focus:ring-1 focus:ring-fire-orange/50 transition-all h-48 resize-none leading-relaxed"
                    placeholder="Este é o seu diário de bordo. Escreva seus insights, dificuldades e vitórias de hoje..."
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ml-auto
                                ${noteSaved
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-white/5 text-fire-gray hover:bg-fire-orange/10 hover:text-fire-orange'}
                                `}
                  >
                    {noteSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                    {noteSaved ? 'Salvo' : savingNote ? 'Salvando...' : 'Salvar Anotação'}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 8. COMPROMISSO */}
          <section className="flex flex-col items-center justify-center py-8 border-t border-white/5 space-y-6">
            <h2 className="text-xl font-bold text-fire-gray font-montserrat flex items-center gap-2 opacity-70">
              <Handshake size={20} />
              Compromisso do Dia
            </h2>

            {day.commitment_text && (
              <div className="max-w-4xl w-full bg-gradient-to-br from-fire-secondary/20 to-fire-secondary/5 border border-white/5 rounded-2xl p-8 md:p-10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-fire-orange group-hover:w-2 transition-all duration-300"></div>
                <div className="absolute -right-6 -bottom-6 text-white/5 transform rotate-12">
                  <Handshake size={120} />
                </div>
                <p className="text-lg md:text-xl text-white/90 leading-relaxed italic whitespace-pre-line text-center md:text-left relative z-10 font-medium">
                  "{day.commitment_text}"
                </p>
              </div>
            )}

            <div className="text-center w-full max-w-md">
              {!committed ? (
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => setCommitted(true)}
                  className="animate-pulse shadow-[0_0_20px_rgba(255,102,0,0.4)]"
                >
                  Eu me comprometo a executar!
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-2 animate-in fade-in zoom-in duration-500 bg-green-500/10 p-6 rounded-2xl border border-green-500/20">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 mb-2">
                    <CheckCircle size={24} />
                  </div>
                  <p className="text-green-400 font-bold text-lg">Compromisso Firmado!</p>
                  <p className="text-fire-gray text-sm">Continue completando as tarefas acima.</p>
                </div>
              )}
            </div>
          </section>

          {/* 9. NEXT DAY TEASER */}
          {day.next_day_teaser && (
            <section className="bg-black/40 border border-white/10 rounded-xl p-6 md:p-8">
              <h3 className="text-lg font-bold text-fire-orange mb-3 flex items-center gap-2">
                <Calendar size={20} />
                Amanhã
              </h3>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">
                {day.next_day_teaser}
              </p>
            </section>
          )}

        </div>
      )}

      {/* FOOTER NAVIGATION (Sticky or Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-fire-dark/95 backdrop-blur-lg border-t border-white/10 z-20 md:static md:bg-transparent md:border-none md:p-0 md:pt-12">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          {/* Prev Button */}
          <Button
            variant="secondary"
            disabled={!prevDay}
            onClick={() => prevDay && navigateDay(prevDay.day_number)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2"
          >
            <ChevronLeft size={18} />
            <span className="hidden md:inline">Dia Anterior</span>
            <span className="md:hidden">Anterior</span>
          </Button>

          {/* Next Button */}
          <Button
            variant={isDayComplete ? 'primary' : 'outline'}
            disabled={!nextDay || (!isDayComplete && !isLocked)} // Disable next only if unlocked and incomplete
            onClick={() => {
              if (nextDay && isDayComplete) navigateDay(nextDay.day_number);
              else if (isLocked && nextDay) navigateDay(nextDay.day_number); // Allow skipping if locked (admin testing) or strict mode? No, usually keep strict. 
              // Strict Logic: Disable next until current is complete
            }}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 min-w-[140px] ${!isDayComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="hidden md:inline">Próximo Dia</span>
            <span className="md:hidden">Próximo</span>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

    </div>
  );
};