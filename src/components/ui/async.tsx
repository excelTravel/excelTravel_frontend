import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface QueryLike<T> {
  isLoading: boolean;
  isError: boolean;
  data: T | undefined;
  refetch: () => void;
}

interface AsyncProps<T> {
  query: QueryLike<T>;
  children: (data: T) => ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  skeleton?: ReactNode;
  className?: string;
}

// Standard loading (skeleton) / error (retry) / empty states for any TanStack Query. Keeps every wired
// data surface consistent so screens only render the happy path.
export function Async<T>({ query, children, isEmpty, empty, skeleton, className }: AsyncProps<T>) {
  const { t } = useTranslation();
  if (query.isLoading) {
    return <>{skeleton ?? <div className={cn('shimmer h-40 w-full rounded-xl', className)} />}</>;
  }
  if (query.isError || query.data === undefined) {
    return (
      <div className="grid place-items-center gap-3 p-10 text-center">
        <AlertCircle className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">{t('common.loadError')}</p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>{t('common.retry')}</Button>
      </div>
    );
  }
  const data = query.data;
  if (isEmpty?.(data)) {
    return <>{empty ?? <p className="p-10 text-center text-sm text-muted-foreground">{t('common.empty')}</p>}</>;
  }
  return <>{children(data)}</>;
}
