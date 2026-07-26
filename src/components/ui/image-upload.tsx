import { useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { config } from '@/lib/config';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

async function uploadToCloudinary(file: File, folder?: string): Promise<string> {
  const { cloudName, uploadPreset } = config.cloudinary;
  if (!cloudName || !uploadPreset) {
    throw new Error('Image uploads are not configured yet. Contact your administrator.');
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  if (folder) form.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed. Please try again.');
  const body: unknown = await res.json();
  const url = body && typeof body === 'object' && 'secure_url' in body ? (body as { secure_url: unknown }).secure_url : undefined;
  if (typeof url !== 'string') throw new Error('Upload failed. Please try again.');
  return url;
}

// Picks an image, validates it client-side, uploads directly to Cloudinary (unsigned preset), and
// hands the caller the resulting secure_url — the backend only ever sees/stores that URL, never the file.
export function ImageUpload({
  value,
  onChange,
  shape = 'circle',
  hint,
  folder,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  shape?: 'circle' | 'square';
  hint?: string;
  /** One of CLOUDINARY_FOLDERS — keeps the account organized by asset type instead of a flat dump. */
  folder?: string;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t('settings.imageTypeError'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('settings.imageSizeError'));
      return;
    }

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, folder);
      onChange(url);
    } catch {
      setError(t('settings.imageUploadError'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div
        className={cn(
          'grid size-24 shrink-0 place-items-center overflow-hidden border border-border bg-secondary/60',
          shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
        )}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImagePlus className="size-7 text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="sr-only" onChange={pick} disabled={uploading} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            <ImagePlus className="size-4" /> {value ? t('settings.changeImage') : t('settings.uploadImage')}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onChange(null)}>
              <Trash2 className="size-4" /> {t('settings.removeImage')}
            </Button>
          )}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
