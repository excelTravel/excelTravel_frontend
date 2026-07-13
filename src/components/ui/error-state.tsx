import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

// Informational error — friendly message + optional reference id + recovery action. Never raw backend text.
export function ErrorState({
  message,
  traceId,
  onRetry,
}: {
  message: string;
  traceId?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-6" aria-hidden />
      </div>
      <p className="max-w-sm text-sm font-medium">{message}</p>
      {traceId && <p className="text-xs text-muted-foreground">Ref: {traceId}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
