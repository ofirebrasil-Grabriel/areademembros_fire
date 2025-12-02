import React, { useEffect, useState } from 'react';
import { getUpcomingEvents, CommunityEvent } from '../services/dataService';
import { MessageSquare, Calendar, Users, Video, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../components/Button';

export const Community: React.FC = () => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const data = await getUpcomingEvents();
      setEvents(data);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white font-montserrat">Comunidade FIRE</h1>
        <p className="text-fire-gray text-lg">
          Você não está sozinho. Conecte-se com outros membros, tire dúvidas e participe de eventos exclusivos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Community Channels */}
        <section className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
            <MessageSquare size={100} className="text-green-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Users className="text-green-400" /> Grupo Oficial
            </h2>
            <p className="text-fire-light/80 mb-8 leading-relaxed">
              Participe do nosso grupo exclusivo no WhatsApp. É lá que trocamos experiências diárias, 
              dicas rápidas e nos motivamos mutuamente.
            </p>
            <Button className="bg-green-600 hover:bg-green-700 text-white border-none w-full md:w-auto flex items-center gap-2">
              <MessageSquare size={18} /> Entrar no Grupo VIP
            </Button>
          </div>
        </section>

        <section className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-8 relative overflow-hidden">
           <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
            <Video size={100} className="text-blue-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Video className="text-blue-400" /> Mentorias Gravadas
            </h2>
            <p className="text-fire-light/80 mb-8 leading-relaxed">
              Perdeu algum encontro ao vivo? Acesse o arquivo completo de todas as mentorias e Q&A 
              que já rolaram no desafio.
            </p>
            <Button variant="secondary" className="w-full md:w-auto flex items-center gap-2">
              Acessar Arquivo <ArrowRight size={18} />
            </Button>
          </div>
        </section>
      </div>

      {/* Events Calendar */}
      <div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-white mb-6 font-montserrat flex items-center gap-3">
          <Calendar className="text-fire-orange" /> Próximos Eventos
        </h2>
        
        {loading ? (
          <div className="text-center py-8 text-fire-gray">Carregando agenda...</div>
        ) : (
          <div className="space-y-4">
             {events.map((event) => (
               <div key={event.id} className="bg-white/5 rounded-xl p-6 border border-transparent hover:border-white/10 transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="bg-black/30 px-6 py-4 rounded-lg text-center border border-white/5 min-w-[100px]">
                     <div className="text-xs text-fire-gray uppercase tracking-widest mb-1">
                       {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                     </div>
                     <div className="text-3xl font-bold text-white">
                       {new Date(event.date).getDate()}
                     </div>
                     <div className="text-xs text-white/50">
                       {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                     </div>
                  </div>
                  
                  <div className="flex-1">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block ${event.type === 'live' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {event.type === 'live' ? 'Live Exclusiva' : 'Mentoria Q&A'}
                     </span>
                     <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                     <p className="text-sm text-fire-gray">Evento online • Link será liberado 15min antes</p>
                  </div>

                  <Button variant="outline" className="shrink-0 w-full md:w-auto flex items-center gap-2">
                     Adicionar à Agenda <ExternalLink size={16} />
                  </Button>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
