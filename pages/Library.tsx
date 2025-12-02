import React, { useEffect, useState } from 'react';
import { getAllResources, LibraryResource } from '../services/dataService';
import { Search, FileText, Download, Video, Headphones, Link as LinkIcon, Users, Filter } from 'lucide-react';

export const Library: React.FC = () => {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const fetchResources = async () => {
      const data = await getAllResources();
      setResources(data);
      setLoading(false);
    };
    fetchResources();
  }, []);

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || res.type === filterType;
    return matchesSearch && matchesType;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText size={20} />;
      case 'sheet': return <Download size={20} />;
      case 'video': return <Video size={20} />;
      case 'audio': return <Headphones size={20} />;
      case 'community': return <Users size={20} />;
      default: return <LinkIcon size={20} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'pdf': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'sheet': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'video': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'audio': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      default: return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-montserrat">Biblioteca</h1>
          <p className="text-fire-gray">Todos os seus materiais, planilhas e guias em um só lugar.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fire-gray" size={18} />
             <input 
               type="text" 
               placeholder="Buscar materiais..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-fire-orange outline-none"
             />
          </div>
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-fire-gray" size={16} />
             <select 
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
               className="bg-black/30 border border-white/10 rounded-lg pl-10 pr-8 py-2.5 text-white focus:border-fire-orange outline-none appearance-none"
             >
               <option value="all">Todos</option>
               <option value="pdf">PDFs</option>
               <option value="sheet">Planilhas</option>
               <option value="video">Vídeos</option>
               <option value="audio">Áudios</option>
             </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-fire-gray py-12">Carregando biblioteca...</div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => (
            <a 
              key={res.id} 
              href={res.url} 
              target="_blank" 
              rel="noreferrer"
              className="bg-fire-secondary/20 border border-white/5 rounded-xl p-5 hover:bg-fire-secondary/40 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                 <div className={`p-3 rounded-lg border ${getColor(res.type)}`}>
                   {getIcon(res.type)}
                 </div>
                 <span className="text-[10px] font-bold uppercase tracking-wider text-fire-gray bg-white/5 px-2 py-1 rounded">
                   Dia {res.day_number}
                 </span>
              </div>
              <h3 className="text-white font-bold mb-1 group-hover:text-fire-orange transition-colors line-clamp-2">{res.title}</h3>
              <p className="text-xs text-fire-gray mb-4">Vinculado ao desafio: {res.day_title}</p>
              
              <div className="flex items-center text-xs text-fire-gray/60 font-medium uppercase tracking-wider group-hover:text-white transition-colors">
                 {res.type === 'link' ? 'Acessar Link' : 'Baixar Arquivo'} <LinkIcon size={12} className="ml-2" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl">
           <p className="text-fire-gray">Nenhum material encontrado com os filtros atuais.</p>
        </div>
      )}
    </div>
  );
};
