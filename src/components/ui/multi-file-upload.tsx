import { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, ExternalLink } from 'lucide-react';
import { createDocumentSignedUrl } from '@/lib/storageDocuments';

const MAX_FILES = 5;
const SEPARATOR = '|';

export const joinPaths = (paths: string[]) => paths.filter(Boolean).join(SEPARATOR);
export const splitPaths = (value?: string | null) =>
  (value || '').split(SEPARATOR).map((p) => p.trim()).filter(Boolean);

interface MultiFileUploadProps {
  /** Caminhos já salvos (separados por '|') */
  value: string;
  /** Atualiza string concatenada de caminhos */
  onChange: (value: string) => void;
  /** Pasta destino dentro do bucket 'documents' */
  folder: string;
  accept?: string;
  bucket?: string;
  maxFiles?: number;
  disabled?: boolean;
}

export function MultiFileUpload({
  value,
  onChange,
  folder,
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  bucket = 'documents',
  maxFiles = MAX_FILES,
  disabled = false,
}: MultiFileUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const existing = splitPaths(value);

  const handleSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);
    const totalAfter = existing.length + pending.length + incoming.length;
    if (totalAfter > maxFiles) {
      toast({
        variant: 'destructive',
        title: 'Limite atingido',
        description: `Você pode selecionar no máximo ${maxFiles} arquivos por vez.`,
      });
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setPending((prev) => [...prev, ...incoming]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removePending = (idx: number) => {
    setPending((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExisting = (idx: number) => {
    const next = existing.filter((_, i) => i !== idx);
    onChange(joinPaths(next));
  };

  const handleUpload = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    setProgress(0);
    const uploaded: string[] = [];
    for (let i = 0; i < pending.length; i++) {
      const file = pending[i];
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) {
        toast({ variant: 'destructive', title: `Erro no upload (${file.name})`, description: error.message });
        setUploading(false);
        return;
      }
      uploaded.push(path);
      setProgress(Math.round(((i + 1) / pending.length) * 100));
    }
    onChange(joinPaths([...existing, ...uploaded]));
    setPending([]);
    setUploading(false);
    setProgress(0);
    toast({ title: `${uploaded.length} arquivo(s) enviado(s) com sucesso!` });
  };

  const openExisting = async (path: string) => {
    const { url, error } = await createDocumentSignedUrl(path);
    if (error || !url) {
      toast({ variant: 'destructive', title: 'Erro ao abrir', description: error || 'Falha ao gerar link' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const totalCount = existing.length + pending.length;
  const canAdd = totalCount < maxFiles;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          disabled={disabled || uploading || !canAdd}
          onChange={(e) => handleSelect(e.target.files)}
          className="max-w-xs"
        />
        {pending.length > 0 && (
          <Button type="button" size="sm" onClick={handleUpload} disabled={uploading}>
            {uploading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
            Enviar {pending.length}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {totalCount}/{maxFiles} arquivos
        </span>
      </div>

      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">Enviando... {progress}%</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pending.map((f, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pr-1">
              <span className="max-w-[180px] truncate">{f.name}</span>
              <button
                type="button"
                onClick={() => removePending(i)}
                disabled={uploading}
                className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                aria-label="Remover"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {existing.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {existing.map((path, i) => {
            const name = path.split('/').pop() || path;
            return (
              <Badge key={path} variant="outline" className="gap-1 pr-1">
                <button
                  type="button"
                  onClick={() => void openExisting(path)}
                  className="flex items-center gap-1 hover:underline max-w-[200px] truncate"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeExisting(i)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  aria-label="Remover"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
