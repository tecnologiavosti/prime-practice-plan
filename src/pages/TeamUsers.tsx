import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Trash2, Mail, Copy, Stethoscope, Shield } from 'lucide-react';
import { z } from 'zod';

const inviteSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  role: z.enum(['administrador', 'profissional']),
});

interface AuthorizedAdmin {
  id: string;
  email: string;
  full_name: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
  role: 'administrador' | 'profissional';
}

export default function TeamUsers() {
  const { user, hasRole, loading } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AuthorizedAdmin[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ full_name: string; email: string; role: 'administrador' | 'profissional' }>({ full_name: '', email: '', role: 'administrador' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<AuthorizedAdmin | null>(null);

  const isAdmin = hasRole('administrador');

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('authorized_admins')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
      return;
    }
    setItems(data || []);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleInvite = async () => {
    setErrors({});
    const result = inviteSchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.errors.forEach((e) => { if (e.path[0]) fe[e.path[0].toString()] = e.message; });
      setErrors(fe);
      return;
    }

    setSaving(true);
    const { error } = await (supabase.from('authorized_admins') as any).insert({
      email: form.email.trim().toLowerCase(),
      full_name: form.full_name.trim(),
      role: form.role,
      invited_by: user?.id,
    });
    setSaving(false);

    if (error) {
      const msg = error.message.includes('duplicate') || error.code === '23505'
        ? 'Este email já foi convidado'
        : error.message;
      toast({ variant: 'destructive', title: 'Erro ao convidar', description: msg });
      return;
    }

    const roleLabel = form.role === 'profissional' ? 'Profissional' : 'Administrador';
    toast({ title: 'Convite criado', description: `${form.full_name} pode agora se cadastrar como ${roleLabel}.` });
    setForm({ full_name: '', email: '', role: 'administrador' });
    setOpen(false);
    fetchData();
  };

  const copySignupLink = () => {
    const link = `${window.location.origin}/admin/auth`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado', description: link });
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('authorized_admins').delete().eq('id', toDelete.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao remover', description: error.message });
      return;
    }
    toast({ title: 'Convite removido' });
    setToDelete(null);
    fetchData();
  };

  if (loading) return <div className="p-6">Carregando...</div>;
  if (!isAdmin) return <div className="p-6 text-muted-foreground">Acesso restrito a administradores.</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe / Usuários</h1>
          <p className="text-sm text-muted-foreground">Convide e-mails autorizados a criar conta de administrador.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Convidar Novo Administrador
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Convidado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum convite cadastrado.
                </TableCell>
              </TableRow>
            ) : items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.full_name}</TableCell>
                <TableCell className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{it.email}</TableCell>
                <TableCell>
                  {it.used
                    ? <Badge variant="secondary">Cadastrado</Badge>
                    : <Badge>Pendente</Badge>}
                </TableCell>
                <TableCell>{new Date(it.created_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(it)} title="Remover convite">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Novo Administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-name">Nome Completo</Label>
              <Input id="inv-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-email">E-mail</Label>
              <Input id="inv-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              A pessoa deverá criar a conta usando exatamente este e-mail. Ao se cadastrar, receberá o papel de Administrador automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={saving}>{saving ? 'Salvando...' : 'Convidar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover convite?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.email} não poderá mais criar uma conta de administrador. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
