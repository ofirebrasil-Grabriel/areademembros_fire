import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Database, AlertTriangle, Loader2, Webhook, Link as LinkIcon } from 'lucide-react';
import { Button } from '../../components/Button';
import { seedDatabase } from '../../services/dataService';

export const AdminSettings: React.FC = () => {
  const [hotmartUrl] = useState(`${window.location.origin}/api/webhooks/hotmart`);
  
  const [n8nWelcomeUrl, setN8nWelcomeUrl] = useState('');
  const [n8nRecoveryUrl, setN8nRecoveryUrl] = useState('');
  const [saved, setSaved] = useState(false);
  
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{success: boolean, message: string} | null>(null);

  useEffect(() => {
    const savedConfig = localStorage.getItem('fire_admin_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setN8nWelcomeUrl(config.n8nWelcomeUrl || '');
      setN8nRecoveryUrl(config.n8nRecoveryUrl || '');
    }
  }, []);

  const handleSave = () => {
    const config = {
      n8nWelcomeUrl,
      n8nRecoveryUrl
    };
    localStorage.setItem('fire_admin_config', JSON.stringify(config));
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm("ATENÇÃO: Isso irá inserir dados padrão no banco de dados. Certifique-se de que as tabelas estão vazias ou isso pode duplicar dados. Continuar?")) {
      return;
    }

    setSeeding(true);
    setSeedResult(null);
    
    const result = await seedDatabase();
    
    setSeeding(false);
    setSeedResult(result);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-white font-montserrat">Configurações do Sistema</h1>

      {/* Database Management */}
      <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Database className="text-fire-orange" size={24} />
          Banco de Dados
        </h2>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
           <div className="flex items-start gap-3">
             <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
             <p className="text-sm text-yellow-200">
               <strong>Inicialização de Conteúdo:</strong> Se você acabou de criar as tabelas no Supabase, elas estarão vazias.
               Use o botão abaixo para preencher o banco de dados com os 15 dias do desafio, tarefas e exemplos de materiais.
             </p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button onClick={handleSeedDatabase} disabled={seeding} variant="primary">
             {seeding ? <span className="flex items-center"><Loader2 className="animate-spin mr-2" /> Inicializando...</span> : 'Inicializar Banco de Dados (Seed)'}
          </Button>
          {seedResult && (
            <span className={`text-sm font-medium ${seedResult.success ? 'text-green-400' : 'text-red-400'}`}>
              {seedResult.message}
            </span>
          )}
        </div>
      </section>

      {/* Hotmart Integration */}
      <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="text-fire-orange" size={24} />
          Integração Hotmart
        </h2>
        <p className="text-fire-gray mb-4 text-sm">
          Copie a URL abaixo e configure na plataforma da Hotmart em (Ferramentas > Webhooks) para liberar o acesso automaticamente.
        </p>
        <div className="flex gap-2">
          <input 
            type="text" 
            readOnly 
            value={hotmartUrl}
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-fire-gray font-mono text-sm"
          />
          <button 
            onClick={() => {
                navigator.clipboard.writeText(hotmartUrl);
                alert('URL copiada!');
            }}
            className="bg-fire-secondary hover:bg-fire-secondary/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Copiar
          </button>
        </div>
      </section>

      {/* n8n Integration */}
      <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Webhook className="text-fire-orange" size={24} />
          Automação de E-mail (n8n)
        </h2>
        <p className="text-fire-gray mb-6 text-sm">
          Configure as URLs dos webhooks do seu n8n Self-hosted aqui para disparar e-mails transacionais.
          Essas configurações são salvas localmente para demonstração.
        </p>
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-fire-gray uppercase tracking-wider mb-2">Webhook de Boas-vindas</label>
            <input 
              type="url" 
              value={n8nWelcomeUrl}
              onChange={(e) => setN8nWelcomeUrl(e.target.value)}
              placeholder="https://n8n.seudominio.com.br/webhook/welcome-email"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-fire-orange outline-none transition-colors"
            />
            <p className="text-[10px] text-fire-gray mt-1">Disparado quando um novo usuário é cadastrado com sucesso.</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-fire-gray uppercase tracking-wider mb-2">Webhook de Recuperação de Senha</label>
            <input 
              type="url" 
              value={n8nRecoveryUrl}
              onChange={(e) => setN8nRecoveryUrl(e.target.value)}
              placeholder="https://n8n.seudominio.com.br/webhook/password-recovery"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:border-fire-orange outline-none transition-colors"
            />
             <p className="text-[10px] text-fire-gray mt-1">Disparado quando o usuário solicita redefinição de senha.</p>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="min-w-[150px]">
            {saved ? (
                <span className="flex items-center"><CheckCircle size={18} className="mr-2"/> Salvo!</span>
            ) : (
                <span className="flex items-center"><Save size={18} className="mr-2"/> Salvar Configurações</span>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
};