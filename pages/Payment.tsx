import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Button } from '../components/Button';
import { CreditCard, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

export const Payment: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [salesUrl, setSalesUrl] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchSalesUrl = async () => {
            const { data } = await supabase
                .from('app_config')
                .select('value')
                .eq('key', 'sales_page_url')
                .single();

            if (data?.value) {
                setSalesUrl(data.value);
            }
        };
        fetchSalesUrl();
    }, []);

    const handleSubscribe = () => {
        if (salesUrl) {
            window.open(salesUrl, '_blank');
        } else {
            alert('Link de pagamento não configurado. Entre em contato com o suporte.');
        }
    };

    return (
        <div className="min-h-screen bg-[#011627] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-fire-secondary/20 border border-white/10 rounded-2xl p-8 text-center space-y-8 shadow-2xl">
                <div className="w-20 h-20 bg-fire-orange/20 rounded-full flex items-center justify-center mx-auto border-2 border-fire-orange/30">
                    <CreditCard size={40} className="text-fire-orange" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white font-montserrat">Desbloqueie o Desafio</h1>
                    <p className="text-fire-gray text-lg">
                        Tenha acesso completo aos 15 dias de conteúdo e transforme sua vida financeira.
                    </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 text-left space-y-4">
                    <div className="flex items-center gap-3 text-white">
                        <CheckCircle size={20} className="text-green-400" />
                        <span>Acesso vitalício ao método</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                        <CheckCircle size={20} className="text-green-400" />
                        <span>Planilhas e materiais exclusivos</span>
                    </div>
                    <div className="flex items-center gap-3 text-white">
                        <CheckCircle size={20} className="text-green-400" />
                        <span>Comunidade VIP</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={handleSubscribe}
                        disabled={loading}
                        fullWidth
                        className="py-4 text-lg shadow-lg shadow-fire-orange/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Quero Minha Liberdade'}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-xs text-fire-gray/60">
                        <ShieldCheck size={12} /> Pagamento seguro via Hotmart
                    </div>
                </div>
            </div>
        </div>
    );
};
