import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

// Client-side image picker with live preview. Wire to Cloudinary (unsigned upload) → store the secure_url
// on PATCH /me (avatar) or PATCH /companies/{id} (logo). Preview uses an object URL until then.
export function ImageUpload({
  value,
  onChange,
  shape = 'circle',
  hint,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  shape?: 'circle' | 'square';
  hint?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onChange(URL.createObjectURL(file));
    e.target.value = '';
  }

  return (
    <div className="flex items-center gap-5">
      <div
        className={cn(
          'grid size-24 shrink-0 place-items-center overflow-hidden border border-border bg-secondary/60',
          shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
        )}
      >
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-7 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={pick} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <ImagePlus className="size-4" /> {value ? t('settings.changeImage') : t('settings.uploadImage')}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange(null)}>
              <Trash2 className="size-4" /> {t('settings.removeImage')}
            </Button>
          )}
        </div>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}
