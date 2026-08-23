import { useTranslation } from 'react-i18next';
import { ImageUpload } from './image-upload';

// A small fixed-size gallery of report photos (maintenance/insurance records) — `max` stacked
// `ImageUpload` slots bound to a `string[]`, reusing the single-image component as-is rather than a new
// multi-file dropzone.
export function PhotoGallery({
  value,
  onChange,
  folder,
  hint,
  max = 3,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  hint?: string;
  max?: number;
}) {
  const { t } = useTranslation();
  const slots = Array.from({ length: max }, (_, i) => value[i] ?? null);

  function setSlot(i: number, url: string | null) {
    const next = [...slots];
    next[i] = url;
    onChange(next.filter((u): u is string => Boolean(u)));
  }

  return (
    <div className="space-y-3">
      {slots.map((url, i) => (
        <div key={i} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{t('forms.photoN', { n: i + 1 })}</p>
          <ImageUpload value={url} onChange={(u) => setSlot(i, u)} shape="square" folder={folder} hint={i === 0 ? hint : undefined} />
        </div>
      ))}
    </div>
  );
}
