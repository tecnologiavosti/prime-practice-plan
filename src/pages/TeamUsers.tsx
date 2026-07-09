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
import { UserPlus, Trash2, Mail, Stethoscope, Shield, ShieldCheck, Pencil } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ADMIN_MODULES } from '@/lib/adminModules';
import { z } from 'zod';
import { useRealtime } from '@/hooks/useRealtime';

const createSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(72),
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
  allowed_modules: string[] | null;
}

export default function TeamUsers() {
  const { user, hasRole, loading } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<AuthorizedAdmin[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ full_name: string; email: string; password: string; role: 'administrador' | 'profissional' }>({ full_name: '', email: '', password: '', role: 'administrador' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<AuthorizedAdmin | null>(null);
  const [permEditing, setPermEditing] = useState<AuthorizedAdmin | null>(null);
  const [permSelected, setPermSelected] = useState<string[]>([]);
  const [permSaving, setPermSaving] = useState(false);
  const [editUser, setEditUser] = useState<AuthorizedAdmin | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'administrador' | 'profissional'>('administrador');
  const [editPassword, setEditPassword] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);

  const openEdit = (it: AuthorizedAdmin) => {
    setEditUser(it);
    setEditName(it.full_name);
    setEditRole(it.role);
    setEditPassword('');
    setEditActive(true);
  };


  const isAdmin = hasRole('administrador');

  const openPermissions = (item: AuthorizedAdmin) => {
    setPermEditing(item);
    setPermSelected(item.allowed_modules ?? []);
  };

  const togglePerm = (key: string, checked: boolean) => {
    setPermSelected((prev) => (checked ? Array.from(new Set([...prev, key])) : prev.filter((k) => k !== key)));
  };

  const savePermissions = async () => {
    if (!permEditing) return;
    setPermSaving(true);
    const { error } = await (supabase.from('authorized_admins') as any)
      .update({ allowed_modules: permSelected })
      .eq('id', permEditing.id);
    setPermSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    toast({ title: 'Permissões atualizadas', description: 'O usuário verá apenas os módulos selecionados.' });
    setPermEditing(null);
    fetchData();
  };

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('authorized_admins')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
      return;
    }
    setItems((data as any) || []);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleCreate = async () => {
    setErrors({});
    const result = createSchema.safeParse(form);
    if (!result.success) {
      const fe: Record<string, string> = {};
      result.error.errors.forEach((e) => { if (e.path[0]) fe[e.path[0].toString()] = e.message; });
      setErrors(fe);
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: {
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        password: form.password,
        role: form.role,
      },
    });
    setSaving(false);

    const errMsg = (error as any)?.message || (data as any)?.error;
    if (errMsg) {
      toast({ variant: 'destructive', title: 'Erro ao cadastrar', description: errMsg });
      return;
    }

    const roleLabel = form.role === 'profissional' ? 'Profissional' : 'Administrador';
    toast({ title: 'Usuário cadastrado', description: `${form.full_name} já pode acessar como ${roleLabel}.` });
    setForm({ full_name: '', email: '', password: '', role: 'administrador' });
    setOpen(false);
    fetchData();
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

  useRealtime(['user_roles','professionals'], fetchData);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipe / Usuários</h1>
          <p className="text-sm text-muted-foreground">Cadastre usuários (administradores ou profissionais) com email e senha de acesso.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setForm({ full_name: '', email: '', password: '', role: 'administrador' }); setOpen(true); }} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Convidado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum convite cadastrado.
                </TableCell>
              </TableRow>
            ) : items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.full_name}</TableCell>
                <TableCell className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{it.email}</TableCell>
                <TableCell>
                  {it.role === 'profissional' ? (
                    <Badge variant="outline" className="gap-1"><Stethoscope className="h-3 w-3" />Profissional</Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />Administrador</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {it.used
                    ? <Badge variant="secondary">Ativo</Badge>
                    : <Badge>Pendente</Badge>}
                </TableCell>
                <TableCell>{new Date(it.created_at).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(it)} title="Editar usuário">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openPermissions(it)} title="Permissões / Módulos">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(it)} title="Remover">
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
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inv-role">Tipo de acesso</Label>
              <Select value={form.role} onValueChange={(v: 'administrador' | 'profissional') => setForm({ ...form, role: v })}>
                <SelectTrigger id="inv-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="profissional">Profissional (Médico)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="inv-password">Senha de acesso</Label>
              <Input id="inv-password" type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              O usuário poderá entrar imediatamente em <span className="font-mono">/admin/auth</span> com este e-mail e senha.
              {form.role === 'profissional' && ' Um cadastro de profissional vinculado será criado automaticamente.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Salvando...' : 'Cadastrar'}</Button>
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

      <Dialog open={!!permEditing} onOpenChange={(o) => !o && setPermEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Permissões de acesso</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione os módulos que <span className="font-medium">{permEditing?.full_name}</span> poderá acessar no painel.
              Se nada for selecionado, o usuário verá todos os módulos do seu perfil.
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPermSelected(ADMIN_MODULES.map((m) => m.key))}>
                Selecionar todos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setPermSelected([])}>
                Limpar
              </Button>
            </div>
            <ScrollArea className="h-72 rounded border p-3">
              <div className="grid grid-cols-1 gap-2">
                {ADMIN_MODULES.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={permSelected.includes(m.key)}
                      onCheckedChange={(c) => togglePerm(m.key, !!c)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermEditing(null)}>Cancelar</Button>
            <Button onClick={savePermissions} disabled={permSaving}>{permSaving ? 'Salvando...' : 'Salvar permissões'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground font-mono">{editUser.email}</div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome completo</Label>
                <Input id="edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Tipo de acesso</Label>
                <Select value={editRole} onValueChange={(v: 'administrador' | 'profissional') => setEditRole(v)}>
                  <SelectTrigger id="edit-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrador">Administrador</SelectItem>
                    <SelectItem value="profissional">Profissional (Médico)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-pass">Nova senha (opcional)</Label>
                <Input id="edit-pass" type="text" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Deixe em branco para não alterar" />
              </div>
              <div className="flex items-center justify-between rounded border p-3">
                <div>
                  <Label htmlFor="edit-active" className="cursor-pointer">Acesso ativo</Label>
                  <p className="text-xs text-muted-foreground">Desative para bloquear o login imediatamente.</p>
                </div>
                <Switch id="edit-active" checked={editActive} onCheckedChange={setEditActive} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button
              disabled={editSaving}
              onClick={async () => {
                if (!editUser) return;
                if (editName.trim().length < 3) {
                  toast({ variant: 'destructive', title: 'Nome mínimo 3 caracteres' });
                  return;
                }
                if (editPassword && editPassword.length < 6) {
                  toast({ variant: 'destructive', title: 'Senha mínima 6 caracteres' });
                  return;
                }
                setEditSaving(true);
                const { data, error } = await supabase.functions.invoke('admin-update-user', {
                  body: {
                    email: editUser.email,
                    full_name: editName.trim(),
                    role: editRole,
                    password: editPassword || undefined,
                    active: editActive,
                  },
                });
                setEditSaving(false);
                const errMsg = (error as any)?.message || (data as any)?.error;
                if (errMsg) {
                  toast({ variant: 'destructive', title: 'Erro', description: errMsg });
                  return;
                }
                toast({ title: 'Usuário atualizado' });
                setEditUser(null);
                fetchData();
              }}
            >
              {editSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
