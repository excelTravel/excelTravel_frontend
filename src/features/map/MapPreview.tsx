import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveBuses } from './useLiveBuses';

const RwandaMap = lazy(() => import('./RwandaMap').then((m) => ({ default: m.RwandaMap })));

// A compact, non-interactive live-map preview for dashboard cards — deep-links to the full Live Map.
export function MapPreview({ className }: { className?: string }) {
  const { t } = useTranslation();
  const buses = useLiveBuses();
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Suspense fallback={<div className="shimmer absolute inset-0" />}>
        <RwandaMap buses={buses} interactive={false} loadingLabel={t('map.loading')} className="h-full w-full" />
      </Suspense>
      <Link
        to="/network"
        className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition-colors hover:bg-background"
      >
        {t('map.viewLive')} <ArrowUpRight className="size-3.5" />
      </Link>
    </div>
  );
}
