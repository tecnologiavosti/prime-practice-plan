import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PendingPatient {
  id: string;
  full_name: string;
  email: string | null;
  cpf: string | null;
  created_at: string;
  active: boolean;
  user_id: string | null;
}

export default function PendingPatients() {
  const [patients, setPatients] = useState<PendingPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const fetchPendingPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, email, cpf, created_at, active, user_id')
      .eq('active', false)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending patients:', error);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingPatients();
  }, []);

  const handleApprove = async () => {
    if (!actionId) return;
    setProcessing(true);

    const { error } = await supabase
      .from('patients')
      .update({ active: true })
      .eq('id', actionId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao aprovar paciente.' });
    } else {
      toast({ title: 'Aprovado!', description: 'O paciente agora pode acessar o portal.' });
      fetchPendingPatients();
    }
    setProcessing(false);
    setActionId(null);
    setActionType(null);
  };

  const handleReject = async () => {
    if (!actionId) return;
    setProcessing(true);

    const patient = patients.find(p => p.id === actionId);

    // Remove patient role
    if (patient?.user_id) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', patient.user_id)
        .eq('role', 'paciente');
    }

    // Delete patient record
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', actionId);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao recusar paciente.' });
    } else {
      toast({ title: 'Recusado', description: 'O acesso do paciente foi removido.' });
      fetchPendingPatients();
    }
    setProcessing(false);
    setActionId(null);
    setActionType(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Pacientes Pendentes
          </h1>
          <p className="text-muted-foreground">Aprovação de acesso de novos pacientes ao portal</p>
        </div>
        <Badge variant="secondary" className="text-base px-3 py-1">
          {patients.length} pendente{patients.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">Nenhuma solicitação pendente</p>
              <p className="text-sm">Todos os pacientes já foram aprovados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.full_name}</TableCell>
                    <TableCell>{patient.email || '-'}</TableCell>
                    <TableCell>{patient.cpf || '-'}</TableCell>
                    <TableCell>{new Date(patient.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50">
                        Pendente
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => { setActionId(patient.id); setActionType('approve'); }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => { setActionId(patient.id); setActionType('reject'); }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={actionType === 'approve'} onOpenChange={() => { setActionId(null); setActionType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Acesso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar o acesso deste paciente? Ele poderá acessar o portal imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={processing}>
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Aprovação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={actionType === 'reject'} onOpenChange={() => { setActionId(null); setActionType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar Acesso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja recusar e remover este paciente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Recusa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
