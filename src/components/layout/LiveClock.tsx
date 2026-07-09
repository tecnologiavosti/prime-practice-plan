import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden sm:flex flex-col items-end leading-tight text-xs">
      <span className="font-medium capitalize">
        {format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </span>
      <span className="text-muted-foreground tabular-nums">
        {format(now, 'HH:mm:ss')}
      </span>
    </div>
  );
}
