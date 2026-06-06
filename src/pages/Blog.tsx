import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Search, Sparkles, Loader2 } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  author: string | null;
  published: boolean;
  published_at: string;
}

const slugify = (s: string) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', cover_url: '', author: '', published: true,
  });

  useEffect(() => { fetchPosts(); }, []);

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
    setPosts(data || []);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ title: '', slug: '', excerpt: '', content: '', cover_url: '', author: '', published: true });
    setDialogOpen(true);
  }
  function openEdit(p: Post) {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt || '', content: p.content || '',
      cover_url: p.cover_url || '', author: p.author || '', published: p.published,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title.trim(),
      slug: (form.slug.trim() || slugify(form.title)),
      excerpt: form.excerpt || null,
      content: form.content || null,
      cover_url: form.cover_url || null,
      author: form.author || null,
      published: form.published,
    };

    if (editing) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', editing.id);
      if (error) return toast({ variant: 'destructive', title: 'Erro', description: error.message });
      toast({ title: 'Post atualizado!' });
    } else {
      const { error } = await supabase.from('blog_posts').insert(payload);
      if (error) return toast({ variant: 'destructive', title: 'Erro', description: error.message });
      toast({ title: 'Post criado!' });
    }
    setDialogOpen(false);
    fetchPosts();
  }

  async function handleDelete() {
    if (!deleteId) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', deleteId);
    if (error) toast({ variant: 'destructive', title: 'Erro', description: error.message });
    else toast({ title: 'Post removido!' });
    setDeleteId(null);
    fetchPosts();
  }

  async function handleGenerateAI() {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { topic: aiTopic.trim() || undefined, publish: true },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: 'Post gerado com IA!', description: (data as any)?.post?.title });
      setAiOpen(false);
      setAiTopic('');
      fetchPosts();
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao gerar', description: e.message });
    } finally {
      setAiLoading(false);
    }
  }

  const filtered = posts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-muted-foreground">Publique artigos que aparecerão na home do site. Gere automaticamente com IA ou crie manualmente.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={aiOpen} onOpenChange={setAiOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Sparkles className="mr-2 h-4 w-4" /> Gerar com IA</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gerar artigo com IA</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Tema (opcional)</Label>
                  <Input
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Ex: ansiedade no trabalho. Deixe vazio para tema aleatório."
                  />
                  <p className="text-xs text-muted-foreground">A IA gerará título, conteúdo e imagem de capa automaticamente.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setAiOpen(false)} disabled={aiLoading}>Cancelar</Button>
                  <Button onClick={handleGenerateAI} disabled={aiLoading}>
                    {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</> : <><Sparkles className="mr-2 h-4 w-4" /> Gerar</>}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" /> Novo Post</Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Post' : 'Novo Post'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input required value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug (URL)</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="meu-artigo" />
              </div>
              <div className="space-y-1.5">
                <Label>Autor</Label>
                <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>URL da imagem de capa</Label>
                <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Resumo</Label>
                <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Conteúdo</Label>
                <Textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
                <Label className="!mt-0">Publicado</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publicado em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center">Nenhum post encontrado.</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>{p.author || '—'}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs ${p.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {p.published ? 'Publicado' : 'Rascunho'}
                  </span>
                </TableCell>
                <TableCell>{new Date(p.published_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja remover este post?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
