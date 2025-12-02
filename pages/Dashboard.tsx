import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDays, getUserProgress, getUpcomingEvents, CommunityEvent } from '../services/dataService';
import { ChallengeDay } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { Lock, CheckCircle, PlayCircle, Clock, ChevronRight, Flame, Calendar, Video, ArrowRight } from 'lucide-react';
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
    const totalTasks = days.reduce((acc, day) => acc + day.tasks.length, 0);
    if (totalTasks === 0) return 0;
    return (completedTasks.length / totalTasks) * 100;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-white gap-4">
        <div className="w-12 h-12 border-4 border-fire-orange border-t-transparent rounded-full animate-spin"></div>
        <p className="text-fire-gray animate-pulse">Carregando sua jornada...</p>
      </div>
    );
  }

  const currentDayIndex = days.findIndex((day, index) => {
     const status = getDayStatus(index);
     const dayTaskIds = day.tasks.map(t => t.id);
     const isComplete = dayTaskIds.length > 0 && dayTaskIds.every(id => completedTasks.includes(id));
     return status === 'open' && !isComplete;
  });
  
  const activeDay = days[currentDayIndex !== -1 ? currentDayIndex : days.length - 1];

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gradient-to-r from-fire-secondary to-[#011627] border border-white/5 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-fire-orange/10 border border-fire-orange/20 text-fire-orange rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              Desafio FIRE 15 Dias
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-montserrat leading-tight">
              Sua Liberdade <br/>Financeira Começa Aqui
            </h1>
            <p className="text-fire-gray text-lg max-w-xl mb-6 font-light">
              "A disciplina é a ponte entre metas e realizações." Você está no dia {activeDay ? activeDay.day_number : 15}.
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

        {/* Events Widget */}
        <div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-6 flex flex-col">
           <h2 className="text-lg font-bold text-white mb-4 font-montserrat flex items-center gap-2">
             <Calendar size={18} className="text-blue-400" /> Eventos & Aulas
           </h2>
           <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar max-h-[200px]">
             {events.length > 0 ? events.map(event => (
               <div key={event.id} className="bg-white/5 p-3 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${event.type === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {event.type === 'live' ? 'Ao Vivo' : 'Mentoria'}
                    </span>
                    <span className="text-[10px] text-fire-gray">{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1 leading-snug">{event.title}</h3>
                  <a href={event.link} target="_blank" rel="noreferrer" className="text-xs text-fire-orange hover:underline flex items-center gap-1">
                    Ver detalhes <ArrowRight size={10} />
                  </a>
               </div>
             )) : (
               <p className="text-fire-gray text-sm text-center py-4">Nenhum evento agendado.</p>
             )}
           </div>
           <button 
             onClick={() => navigate('/community')}
             className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-fire-gray hover:text-white rounded-lg text-xs font-bold uppercase transition-colors"
           >
             Ver Comunidade
           </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-fire-secondary/10 border border-white/5 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
         <div>
           <p className="text-fire-gray text-xs uppercase tracking-widest mb-1">Progresso Total</p>
           <div className="flex items-end gap-2">
             <span className="text-3xl font-bold text-white">{Math.round(calculateTotalProgress())}%</span>
             <div className="flex-1 pb-2">
               <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-fire-orange h-full rounded-full" style={{ width: `${calculateTotalProgress()}%` }}></div>
               </div>
             </div>
           </div>
         </div>
         <div>
           <p className="text-fire-gray text-xs uppercase tracking-widest mb-1">Tarefas</p>
           <div className="flex items-center gap-2">
             <span className="text-3xl font-bold text-white">{completedTasks.length}</span>
             <span className="text-fire-gray text-sm">Concluídas</span>
           </div>
         </div>
         <div>
           <p className="text-fire-gray text-xs uppercase tracking-widest mb-1">Status Atual</p>
           <div className="flex items-center gap-2">
             <span className="text-xl font-bold text-green-400">Em Andamento</span>
           </div>
         </div>
         <div>
           <p className="text-fire-gray text-xs uppercase tracking-widest mb-1">Próxima Conquista</p>
           <div className="flex items-center gap-2 text-yellow-500">
             <Flame size={20} />
             <span className="text-sm font-bold">Mestre FIRE (Dia 15)</span>
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
            const isActive = currentDayIndex === index;

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
