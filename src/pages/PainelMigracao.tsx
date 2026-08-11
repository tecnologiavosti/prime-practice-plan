import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Copy, ShieldAlert, Key, Loader2, Code2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const PainelMigracao = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const revealAll = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/painel-migracao`, {
        headers: {
          'Authorization': `Bearer ${session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na função:', errorText);
        throw new Error('Falha ao buscar dados');
      }
      
      const json = await response.json();
      setData(json);
      toast.success('Credenciais reveladas com sucesso');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar credenciais. Verifique se o backend está ativo e as funções implantadas.');
    } finally {
      setLoading(false);
    }
  };

  const mask = (val: string) => val ? val.slice(0, 12) + '•••••' + val.slice(-8) : '---';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Painel de Migração</h1>
      <p className="text-muted-foreground">Copie os itens abaixo na ordem e cole na extensão DataClone.</p>
      
      <Button onClick={revealAll} disabled={loading}>
        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
        Revelar Tudo
      </Button>

      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-blue-600"><Key /> Passo 1 — Credenciais do Banco</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">URL do Projeto (API URL)</p>
                    <code className="text-sm font-mono break-all">{data.project_url}</code>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    navigator.clipboard.writeText(data.project_url);
                    toast.success('Copiado!');
                  }}><Copy size={16} /></Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                  <div className="overflow-hidden">
                    <p className="text-xs text-muted-foreground">Anon Key</p>
                    <code className="text-sm font-mono break-all">{mask(data.anon_key)}</code>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    navigator.clipboard.writeText(data.anon_key);
                    toast.success('Copiado!');
                  }}><Copy size={16} /></Button>
                </div>

                <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200">
                  <div className="overflow-hidden">
                    <p className="text-xs text-amber-700 font-bold">SERVICE_ROLE_KEY (Segredo Crítico)</p>
                    <code className="text-sm font-mono break-all text-amber-900">{mask(data.service_role_key)}</code>
                  </div>
                  <Button variant="ghost" size="sm" className="text-amber-700" onClick={() => {
                    navigator.clipboard.writeText(data.service_role_key);
                    toast.success('Copiado! USE COM CUIDADO');
                  }}><Copy size={16} /></Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-green-600"><Database /> Passo 2 — Variáveis de Ambiente (Secrets)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {Object.entries(data.secrets || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-xs">
                    <span className="font-mono font-bold">{key}</span>
                    <div className="flex items-center gap-2">
                      <code className="text-muted-foreground italic">••••••••</code>
                      <Button variant="ghost" size="sm" onClick={() => {
                        navigator.clipboard.writeText(value as string);
                        toast.success(`${key} copiado!`);
                      }}><Copy size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-purple-600"><Code2 /> Passo 3 — Instrução para DataClone</CardTitle></CardHeader>
            <CardContent className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto">
              <pre>
                {`1. Abra a extensão DataClone
2. Selecione este projeto como ORIGEM
3. Use a SERVICE_ROLE_KEY revelada acima
4. Selecione o destino (seu novo projeto Supabase)
5. Clique em 'Iniciar Migração'`}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PainelMigracao;
