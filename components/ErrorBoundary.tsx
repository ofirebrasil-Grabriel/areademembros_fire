import * as React from 'react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        (this as any).state = {
            hasError: false,
            error: null
        };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if ((this.state as any).hasError) {
            return (
                <div className="min-h-screen bg-[#011627] flex items-center justify-center p-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
                        <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-500" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2 font-montserrat">Ops! Algo deu errado.</h1>
                        <p className="text-gray-400 mb-6 text-sm">
                            Ocorreu um erro inesperado ao carregar a aplicação. Tente recarregar a página.
                        </p>

                        {(this.state as any).error && (
                            <div className="bg-black/30 rounded-lg p-4 mb-6 text-left overflow-auto max-h-40">
                                <p className="text-red-400 font-mono text-xs break-all">
                                    {(this.state as any).error.toString()}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-fire-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all w-full"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return (this.props as any).children;
    }
}
