import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Shown for any route that doesn't match one of ours (typo'd URL, stale bookmark, a link into a
// screen the caller's role can't see). Deliberately generic — no route path, status code, or other
// diagnostic detail rendered to the user.
export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="glass grid min-h-[60vh] place-items-center rounded-2xl p-8 text-center shadow-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="grid size-14 place-items-center rounded-full bg-secondary">
          <MapPinOff className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">{t('notFound.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('notFound.subtitle')}</p>
        </div>
        <Button asChild>
          <Link to="/">{t('notFound.goHome')}</Link>
        </Button>
      </div>
    </div>
  );
}
