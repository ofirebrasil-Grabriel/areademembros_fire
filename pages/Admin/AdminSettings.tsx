import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Database, AlertTriangle, Loader2, Webhook, Link as LinkIcon, CreditCard, FileText } from 'lucide-react';
import { Button } from '../../components/Button';
import { seedDatabase } from '../../services/dataService';
import { supabase } from '../../services/supabaseClient';

export const AdminSettings: React.FC = () => {
  // const [hotmartUrl] = useState(`${window.location.origin}/api/webhooks/hotmart`); // Unused and potentially risky

  const [n8nWelcomeUrl, setN8nWelcomeUrl] = useState('');
  const [n8nRecoveryUrl, setN8nRecoveryUrl] = useState('');
  const [hotmartToken, setHotmartToken] = useState('');
  const [salesPageUrl, setSalesPageUrl] = useState('');

  const [saved, setSaved] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean, message: string } | null>(null);

  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const { data, error } = await supabase.from('app_config').select('key, value');
      if (error) throw error;

      if (data) {
        const configMap: Record<string, string> = {};
        data.forEach(item => {
          configMap[item.key] = item.value;
        });

        setN8nWelcomeUrl(configMap['n8n_welcome_url'] || '');
        setN8nRecoveryUrl(configMap['n8n_recovery_url'] || '');
        setHotmartToken(configMap['hotmart_token'] || '');
        setSalesPageUrl(configMap['sales_page_url'] || '');
      }
    } catch (err) {
      // console.error("Error fetching config:", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSave = async () => {
    const configs = [
      { key: 'n8n_welcome_url', value: n8nWelcomeUrl },
      { key: 'n8n_recovery_url', value: n8nRecoveryUrl },
      { key: 'hotmart_token', value: hotmartToken },
      { key: 'sales_page_url', value: salesPageUrl }
    ];

    try {
      const { error } = await supabase.from('app_config').upsert(configs, { onConflict: 'key' });
      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      alert('Erro ao salvar configurações: ' + err.message);
    }
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
    setSeeding(false);
    setSeedResult(result);
  };

  const handleFetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-actions', {
        body: { action: 'getWebhookLogs' }
      });

      if (error) throw error;
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      alert("Erro ao buscar logs: " + err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  if (loadingConfig) {
    return <div className="p-8 text-white">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl pb-20">
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
      <div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="text-fire-orange" />
          Integração Hotmart
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-fire-gray mb-2">
              Token de Verificação (H-Hotmart-Hook-Token)
            </label>
            <input
              type="text"
              value={hotmartToken}
              onChange={(e) => setHotmartToken(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-fire-orange focus:outline-none"
              placeholder="Token configurado no Webhook da Hotmart"
            />
            <p className="text-xs text-fire-gray mt-2">
              Use este token para verificar se as requisições vêm realmente da Hotmart.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-fire-gray mb-2">
              URL da Página de Vendas (Checkout)
            </label>
            <input
              type="text"
              value={salesPageUrl}
              onChange={(e) => setSalesPageUrl(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-fire-orange focus:outline-none"
              placeholder="https://pay.hotmart.com/..."
            />
            <p className="text-xs text-fire-gray mt-2">
              Para onde os usuários serão redirecionados ao clicar em "Comprar Agora".
            </p>
          </div>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-fire-secondary/20 border border-white/5 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <FileText className="text-fire-orange" />
          Logs de Webhook (Debug)
        </h2>

        <div className="mb-4">
          <Button onClick={handleFetchLogs} disabled={loadingLogs} variant="secondary">
            {loadingLogs ? <Loader2 className="animate-spin mr-2" /> : <FileText className="mr-2" size={18} />}
            Carregar Últimos Logs
          </Button>
        </div>

        {logs.length > 0 ? (
          <div className="bg-black/50 rounded-lg p-4 overflow-x-auto max-h-96 border border-white/10">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
              {JSON.stringify(logs, null, 2)}
            </pre>
          </div>
        ) : (
          <p className="text-fire-gray text-sm">Nenhum log encontrado ou ainda não carregado.</p>
        )}
      </div>

      {/* Hotmart Integration (Desativada) - This section was originally for Hotmart but is now replaced by the new Hotmart Integration */}
      <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6 opacity-50 pointer-events-none">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <LinkIcon className="text-fire-gray" size={24} />
          Integração Hotmart (Desativada)
        </h2>
        <p className="text-fire-gray mb-4 text-sm">
          A integração principal agora é via Stripe.
        </p>
      </section>

      {/* n8n Integration */}
      <section className="bg-fire-secondary/20 border border-white/5 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Webhook className="text-fire-orange" size={24} />
          Automação de E-mail (n8n)
        </h2>
        <p className="text-fire-gray mb-6 text-sm">
          Configure as URLs dos webhooks do seu n8n Self-hosted aqui para disparar e-mails transacionais.
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
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} className="min-w-[150px]">
            {saved ? (
              <span className="flex items-center"><CheckCircle size={18} className="mr-2" /> Salvo!</span>
            ) : (
              <span className="flex items-center"><Save size={18} className="mr-2" /> Salvar Configurações</span>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
};