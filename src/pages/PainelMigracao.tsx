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
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert /> Passo 1 — Credenciais</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>URL: {mask(data.project_url)}</span>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(data.project_url)}><Copy size={16} /></Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Anon Key: {mask(data.anon_key)}</span>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(data.anon_key)}><Copy size={16} /></Button>
              </div>
              <div className="flex items-center justify-between font-bold">
                <span>Service Role: {mask(data.service_role_key)}</span>
                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(data.service_role_key)}><Copy size={16} /></Button>
              </div>
            </CardContent>
          </Card>
          {/* Add more cards for other steps as per requirements */}
        </div>
      )}
    </div>
  );
};

export default PainelMigracao;
