import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDays, getUserProgress, getUpcomingEvents, CommunityEvent } from '../services/dataService';
import { ChallengeDay } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { Lock, CheckCircle, PlayCircle, Clock, ChevronRight, Flame, Calendar, Video, ArrowRight, Trophy, Star, Target, Zap, ShieldCheck, Briefcase, TrendingUp, Flag, Crown } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

export const Dashboard: React.FC = () => {
  const [days, setDays] = useState<ChallengeDay[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'mock-user-id';

      // Simulate First Login check
      const lastLogin = localStorage.getItem('fire_last_login');
      if (!lastLogin) {
        setShowWelcome(true);
        localStorage.setItem('fire_last_login', new Date().toISOString());
      }

      const [daysData, progressData, eventsData] = await Promise.all([
        getDays(),
        getUserProgress(userId),
        getUpcomingEvents()
      ]);

      setCompletedTasks(progressData);
      setDays(daysData);
      setEvents(eventsData);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getDayStatus = (index: number) => {
    if (index === 0) return 'open';

    const prevDay = days[index - 1];
    if (!prevDay) return 'locked';

    const prevDayTaskIds = prevDay.tasks.map(t => t.id);
    const prevDayCompletedCount = prevDayTaskIds.filter(id => completedTasks.includes(id)).length;
    const isPrevDayComplete = prevDayCompletedCount === prevDayTaskIds.length && prevDayTaskIds.length > 0;

    return isPrevDayComplete ? 'open' : 'locked';
  };

  const calculateTotalProgress = () => {
    if (days.length === 0) return 0;
    // Only count days that actually have tasks and are fully completed
    const completedDaysCount = days.filter(day =>
      day.tasks.length > 0 && day.tasks.every(t => completedTasks.includes(t.id))
    ).length;
    return (completedDaysCount / days.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-fire-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-fire-gray animate-pulse">Carregando sua jornada...</p>
      </div>
    );
  }

  // Calculate Active Day (Sequential Logic)
  let lastCompletedDayNumber = 0;
  for (const day of days) {
    const dayTaskIds = day.tasks.map(t => t.id);
    const isDayComplete = dayTaskIds.length === 0 || dayTaskIds.every(id => completedTasks.includes(id));
    if (isDayComplete) {
      lastCompletedDayNumber = day.day_number;
    } else {
      break;
    }
  }

  const targetDayNumber = lastCompletedDayNumber + 1;
  const activeDay = days.find(d => d.day_number === targetDayNumber) || days[days.length - 1];

  const getNextBadge = () => {
    const tasksCompleted = completedTasks.length;
    let daysCompleted = 0;
    days.forEach(day => {
      const dayTaskIds = day.tasks.map(t => t.id);
      if (dayTaskIds.length > 0 && dayTaskIds.every(id => completedTasks.includes(id))) {
        daysCompleted++;
      }
    });

    const allBadges = [
      { id: 'start', title: 'Primeiro Passo', description: 'Completou o Dia 1 do desafio.', icon: <Star size={24} />, unlocked: daysCompleted >= 1, requirement: 'Completar Dia 1' },
      { id: 'focus', title: 'Foco Total', description: 'Completou 5 tarefas.', icon: <Target size={24} />, unlocked: tasksCompleted >= 5, requirement: '5 Tarefas' },
      { id: 'executor', title: 'Executor', description: 'Completou 10 tarefas.', icon: <Briefcase size={24} />, unlocked: tasksCompleted >= 10, requirement: '10 Tarefas' },
      { id: 'momentum', title: 'Pegando Ritmo', description: 'Completou 3 dias consecutivos.', icon: <Zap size={24} />, unlocked: daysCompleted >= 3, requirement: 'Completar 3 Dias' },
      { id: 'halfway', title: 'Meio Caminho', description: 'Chegou na metade! 7 dias completados.', icon: <ShieldCheck size={24} />, unlocked: daysCompleted >= 7, requirement: 'Completar 7 Dias' },
      { id: 'imparavel', title: 'Imparável', description: 'Completou 25 tarefas.', icon: <TrendingUp size={24} />, unlocked: tasksCompleted >= 25, requirement: '25 Tarefas' },
      { id: 'reta_final', title: 'Reta Final', description: 'Completou 12 dias do desafio.', icon: <Flag size={24} />, unlocked: daysCompleted >= 12, requirement: 'Completar 12 Dias' },
      { id: 'lenda_desafio', title: 'Lenda do Desafio', description: 'Completou 40 tarefas.', icon: <Crown size={24} />, unlocked: tasksCompleted >= 40, requirement: '40 Tarefas' },
      { id: 'fire_master', title: 'Mestre FIRE', description: 'Completou todo o desafio de 15 dias.', icon: <Flame size={24} />, unlocked: daysCompleted >= 15, requirement: 'Completar 15 Dias' }
    ];

    return allBadges.find(b => !b.unlocked) || null;
  };

  const nextBadge = getNextBadge();

  return (
    <div className="space-y-12 pb-12">
      {/* Welcome Banner (Simulated Onboarding) */}
      {showWelcome && (
        <div className="bg-fire-orange/10 border border-fire-orange/30 p-6 rounded-2xl flex items-start gap-4 animate-in slide-in-from-top-4">
          <div className="bg-fire-orange p-3 rounded-full text-white shrink-0">
            <Flame size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Bem-vindo ao Desafio FIRE 15 Dias!</h3>
            <p className="text-fire-light text-sm mb-4">
              Estamos felizes em ter você aqui. Sua jornada para a liberdade financeira começa agora.
              Assista ao vídeo de introdução ou vá direto para o Dia 1.
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              className="text-xs font-bold text-fire-orange hover:text-white uppercase tracking-wider"
            >
              Fechar Mensagem
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Banner */}
        <div className="lg:col-span-2 bg-gradient-to-br from-fire-dark to-fire-secondary rounded-2xl p-8 relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-fire-orange/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-fire-orange/20 text-fire-orange text-xs font-bold mb-4 border border-fire-orange/20">
              DESAFIO FIRE 15 DIAS
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-montserrat leading-tight">
              Sua Liberdade <br />Financeira Começa Aqui
            </h1>
            <p className="text-fire-gray mb-8 max-w-md text-lg">
              "A disciplina é a ponte entre metas e realizações." Você está no dia {activeDay?.day_number || 1}.
            </p>

            <button
              onClick={() => activeDay && navigate(`/day/${activeDay.day_number}`)}
              className="bg-fire-orange hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-fire-orange/30 flex items-center gap-2 group"
            >
              <PlayCircle className="fill-white text-fire-orange" />
              Continuar Jornada
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="absolute right-0 top-0 w-96 h-96 bg-fire-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        </div>

        {/* Next Achievement Widget */}
        <div className="bg-gradient-to-br from-fire-secondary/20 to-fire-dark border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-fire-orange/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 group-hover:bg-fire-orange/20 transition-colors"></div>

          <h2 className="text-lg font-bold text-white mb-4 font-montserrat flex items-center gap-2 relative z-10">
            <Trophy size={18} className="text-yellow-500" /> Próxima Conquista
          </h2>

          {nextBadge ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                <div className="text-fire-gray/50 group-hover:text-fire-orange transition-colors">
                  {nextBadge.icon}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-1">{nextBadge.title}</h3>
              <p className="text-fire-gray text-xs mb-3">{nextBadge.description}</p>
              <p className="text-[10px] text-fire-gray mt-2 uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full">
                Requer: <span className="text-white font-bold">{nextBadge.requirement}</span>
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
              <Flame size={48} className="text-fire-orange mb-2 animate-pulse" />
              <h3 className="text-white font-bold">Você é um Mestre!</h3>
              <p className="text-fire-gray text-sm">Todas as conquistas desbloqueadas.</p>
            </div>
          )}

          <button
            onClick={() => navigate('/achievements')}
            className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-fire-gray hover:text-white rounded-lg text-xs font-bold uppercase transition-colors relative z-10"
          >
            Ver Todas
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4 gap-8 shadow-xl backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute inset-0 bg-fire-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

        {/* Progress */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp size={16} />
            </div>
            <p className="text-fire-gray text-xs uppercase tracking-widest font-semibold">Progresso</p>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white tracking-tight">{Math.round(calculateTotalProgress())}%</span>
            <div className="flex-1 pb-2.5">
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  style={{ width: `${calculateTotalProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Challenge */}
        <div className="relative border-l border-white/5 pl-0 md:pl-8 lg:border-l-0 xl:border-l">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-fire-orange/10 text-fire-orange">
              <Target size={16} />
            </div>
            <p className="text-fire-gray text-xs uppercase tracking-widest font-semibold">Foco de Hoje</p>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-fire-orange uppercase mb-0.5 tracking-wide">
              Dia {activeDay?.day_number || 1}
            </span>
            <span className="text-sm font-bold text-white leading-tight line-clamp-1" title={activeDay?.title}>
              {activeDay?.title ? activeDay.title.split(': ')[1] || activeDay.title : 'Carregando...'}
            </span>
          </div>
        </div>

        {/* Tasks Stats */}
        <div className="relative border-l border-white/5 pl-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400">
              <CheckCircle size={16} />
            </div>
            <p className="text-fire-gray text-xs uppercase tracking-widest font-semibold">Tarefas</p>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <span className="text-2xl font-bold text-white block leading-none">{completedTasks.length}</span>
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider">Feitas</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div>
              <span className="text-2xl font-bold text-white/50 block leading-none">
                {days.reduce((acc, day) => acc + day.tasks.length, 0) - completedTasks.length}
              </span>
              <span className="text-[10px] text-fire-gray/50 font-bold uppercase tracking-wider">Faltam</span>
            </div>
          </div>
        </div>

        {/* Days Completed */}
        <div className="relative border-l border-white/5 pl-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Trophy size={16} />
            </div>
            <p className="text-fire-gray text-xs uppercase tracking-widest font-semibold">Conclusão</p>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {days.filter(d => d.tasks.length > 0 && d.tasks.every(t => completedTasks.includes(t.id))).length}
            </span>
            <span className="text-fire-gray text-sm font-medium">/ {days.length} dias</span>
          </div>
        </div>
      </div>

      {/* Days Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white font-montserrat mb-6 flex items-center gap-2">
          <Flame className="text-fire-orange" /> Sua Jornada
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {days.map((day, index) => {
            const status = getDayStatus(index);
            const dayTaskIds = day.tasks.map(t => t.id);
            const dayCompletedCount = dayTaskIds.filter(id => completedTasks.includes(id)).length;
            const progress = day.tasks.length > 0 ? (dayCompletedCount / day.tasks.length) * 100 : 0;
            const isComplete = progress === 100;
            const isActive = activeDay?.day_number === day.day_number;

            return (
              <div
                key={day.id}
                onClick={() => status === 'open' && navigate(`/day/${day.day_number}`)}
                className={`
                  relative group rounded-2xl border transition-all duration-300 flex flex-col justify-between h-[280px] overflow-hidden
                  ${status === 'locked'
                    ? 'bg-[#0B1219] border-white/5 opacity-70 cursor-not-allowed'
                    : isActive
                      ? 'bg-fire-secondary/40 border-fire-orange/50 shadow-lg shadow-fire-orange/10 cursor-pointer hover:translate-y-[-4px]'
                      : 'bg-fire-secondary/20 border-white/5 hover:bg-fire-secondary/30 hover:border-white/10 cursor-pointer hover:translate-y-[-4px]'}
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 pointer-events-none"></div>

                <div className="relative p-6 z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`
                        text-[10px] font-black px-3 py-1 rounded-full border tracking-widest uppercase
                        ${isComplete
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : isActive
                            ? 'bg-fire-orange text-white border-fire-orange shadow-lg shadow-fire-orange/20'
                            : 'bg-white/5 text-fire-gray border-white/10'}
                      `}>
                        DIA {day.day_number.toString().padStart(2, '0')}
                      </span>
                      {status === 'locked' ? (
                        <Lock className="text-fire-gray/30" size={20} />
                      ) : isComplete ? (
                        <CheckCircle className="text-green-400" size={20} />
                      ) : null}
                    </div>

                    <h3 className={`text-xl font-bold mb-2 font-montserrat leading-tight ${status === 'locked' ? 'text-fire-gray' : 'text-white'}`}>
                      {day.title.includes(':') ? day.title.split(': ')[1] : day.title}
                    </h3>
                    <p className="text-xs text-fire-gray/80 line-clamp-3 leading-relaxed">
                      {day.description}
                    </p>
                  </div>

                  <div className="mt-4">
                    {status === 'open' ? (
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-fire-gray uppercase tracking-wider mb-2">
                          <span>{Math.round(progress)}%</span>
                          <span>{dayCompletedCount}/{day.tasks.length}</span>
                        </div>
                        <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isComplete ? 'bg-green-500' : 'bg-fire-orange'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center pt-4 border-t border-white/5 text-fire-gray/40 text-xs uppercase tracking-widest font-bold">
                        Bloqueado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
