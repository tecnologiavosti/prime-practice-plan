import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  ShieldAlert, 
  Key, 
  Download, 
  Loader2, 
  Code2, 
  Database, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const PainelMigracao = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const toggleVisibility = (key: string) => {
    setVisibleKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const revealAll = async () => {
    setLoading(true);
    try {
      // Accessing the function publicly as per requirements
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/painel-migracao`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar dados das Edge Functions');
      }
      
      const json = await response.json();
      setData(json);
      toast.success('Todos os dados foram carregados!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar o painel. Verifique as Edge Functions.');
    } finally {
      setLoading(false);
    }
  };

  const mask = (val: string, key: string) => {
    if (!val) return '---';
    if (visibleKeys[key]) return val;
    return val.slice(0, 12) + '••••••••' + val.slice(-8);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const downloadEdgeFunctions = () => {
    const modules = import.meta.glob('/supabase/functions/*/index.ts', { 
      query: '?raw', 
      import: 'default', 
      eager: true 
    });
    
    let content = '// ═══ CONSOLIDATED EDGE FUNCTIONS ═══\n\n';
    Object.entries(modules).forEach(([path, code]: [string, any]) => {
      const name = path.split('/')[3];
      content += `// ═══ ${name.toUpperCase()} ═══\n${code}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edge-functions.ts';
    a.click();
    toast.success(`${Object.keys(modules).length} funções embutidas no arquivo.`);
  };

  const downloadSecrets = () => {
    if (!data?.secrets) return;
    let content = 'export const SECRETS = {\n';
    Object.entries(data.secrets).forEach(([k, v]) => {
      content += `  ${k}: "${v}",\n`;
    });
    content += '} as const;\n\nexport type SecretKey = keyof typeof SECRETS;';

    const blob = new Blob([content], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'secrets.ts';
    a.click();
    toast.success('Secrets exportados com sucesso.');
  };

  const copyAll = () => {
    if (!data) return;
    const text = `
═══ CREDENCIAIS ═══
URL: ${data.project_url}
ANON: ${data.anon_key}
SERVICE_ROLE: ${data.service_role_key}

═══ SECRETS ═══
${Object.entries(data.secrets || {}).map(([k, v]) => `${k}=${v}`).join('\n')}
    `.trim();
    copyToClipboard(text, 'Tudo');
  };

  const classifyTable = (name: string) => {
    const essential = ['profiles', 'clinic_settings', 'specialties', 'procedures', 'health_insurances'];
    const history = ['appointments', 'financial_transactions', 'medical_guides', 'blog_posts'];
    
    if (essential.includes(name)) return { label: 'Essencial', color: 'bg-green-100 text-green-800 border-green-200' };
    if (history.includes(name)) return { label: 'Histórico', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    return { label: 'Sistema/Outro', color: 'bg-slate-100 text-slate-800 border-slate-200' };
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Painel de Migração</h1>
          <p className="text-lg text-slate-600">Copie os itens abaixo na ordem e cole na extensão DataClone.</p>
        </header>

        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            size="lg" 
            onClick={revealAll} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg min-w-[200px]"
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Eye className="mr-2 h-5 w-5" />}
            {data ? 'Recarregar Dados' : 'Revelar Tudo'}
          </Button>

          {data && (
            <Button 
              size="lg" 
              variant="outline" 
              onClick={copyAll}
              className="shadow-sm"
            >
              <Copy className="mr-2 h-5 w-5" />
              Copiar Tudo
            </Button>
          )}
        </div>

        {data && (
          <div className="grid gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Passo 1 — Credenciais */}
            <Card className="border-2 border-blue-100 shadow-md">
              <CardHeader className="bg-blue-50/50 border-b border-blue-100">
                <CardTitle className="flex items-center gap-3 text-blue-900">
                  <div className="bg-blue-600 p-2 rounded-lg text-white">
                    <ShieldAlert size={20} />
                  </div>
                  Passo 1 — Credenciais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {[
                  { label: 'Project URL', value: data.project_url, id: 'url' },
                  { label: 'Anon Key', value: data.anon_key, id: 'anon' },
                  { label: 'Service Role Key', value: data.service_role_key, id: 'sr', critical: true }
                ].map((item) => (
                  <div key={item.id} className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">{item.label}</label>
                    <div className={`flex items-center gap-2 p-2 rounded-md border ${item.critical ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <code className="flex-1 font-mono text-sm break-all truncate">
                        {mask(item.value, item.id)}
                      </code>
                      <Button variant="ghost" size="icon" onClick={() => toggleVisibility(item.id)}>
                        {visibleKeys[item.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => copyToClipboard(item.value, item.label)}>
                        <Copy size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-slate-900" onClick={() => copyToClipboard(data.project_url, 'Project URL')}>
                    Copiar Project URL
                  </Button>
                  <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={() => copyToClipboard(data.service_role_key, 'Service Role Key')}>
                    Copiar Service Role Key
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Passo 2 — Edge Functions */}
            <Card className="border-2 border-indigo-100 shadow-md">
              <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                <CardTitle className="flex items-center gap-3 text-indigo-900">
                  <div className="bg-indigo-600 p-2 rounded-lg text-white">
                    <Code2 size={20} />
                  </div>
                  Passo 2 — Edge Functions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {data.edge_functions?.map((fn: string) => (
                    <Badge key={fn} variant="secondary" className="px-3 py-1 font-mono text-xs">
                      {fn}
                    </Badge>
                  ))}
                  {(!data.edge_functions || data.edge_functions.length === 0) && (
                    <span className="text-sm text-slate-500 italic">Nenhuma função detectada.</span>
                  )}
                </div>
                <Button variant="outline" className="w-full border-indigo-200 hover:bg-indigo-50" onClick={downloadEdgeFunctions}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar edge-functions.ts
                </Button>
              </CardContent>
            </Card>

            {/* Passo 3 — Secrets */}
            <Card className="border-2 border-emerald-100 shadow-md">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-3 text-emerald-900">
                  <div className="bg-emerald-600 p-2 rounded-lg text-white">
                    <Key size={20} />
                  </div>
                  Passo 3 — Secrets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(data.secrets || {}).map(([k, v]: [string, any]) => (
                    <div key={k} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 text-xs">
                      <span className="font-mono font-bold truncate pr-2">{k}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <code className="text-slate-400">••••</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(v, k)}>
                          <Copy size={12} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50" onClick={downloadSecrets}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar secrets.ts
                </Button>
              </CardContent>
            </Card>

            {/* Passo 4 — Conferência */}
            <Card className="border-2 border-slate-200 shadow-md">
              <CardHeader className="bg-slate-50 border-b border-slate-200">
                <CardTitle className="flex items-center gap-3 text-slate-900">
                  <div className="bg-slate-700 p-2 rounded-lg text-white">
                    <Database size={20} />
                  </div>
                  Passo 4 — Conferência
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Tabela</th>
                        <th className="px-4 py-2 text-center font-medium">Colunas</th>
                        <th className="px-4 py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.database_tables?.map((table: any) => {
                        const info = classifyTable(table.tablename);
                        return (
                          <tr key={table.tablename}>
                            <td className="px-4 py-2 font-mono text-slate-900">{table.tablename}</td>
                            <td className="px-4 py-2 text-center text-slate-600">{table.column_count}</td>
                            <td className="px-4 py-2 text-right">
                              <Badge className={info.color} variant="outline">
                                {info.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-amber-800">
                  <AlertTriangle className="shrink-0 h-5 w-5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Aviso sobre Senhas & Sessões</p>
                    <p>As senhas dos usuários são copiadas como hash bcrypt. Se o JWT Secret do projeto de destino for diferente, sessões ativas serão invalidadas, mas os usuários poderão fazer login normalmente com suas senhas.</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex gap-3 text-blue-800">
                  <Info className="shrink-0 h-5 w-5" />
                  <p className="text-xs">
                    Certifique-se de que a extensão <strong>DataClone</strong> está instalada e configurada com a Service Role Key do destino antes de iniciar.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PainelMigracao;
