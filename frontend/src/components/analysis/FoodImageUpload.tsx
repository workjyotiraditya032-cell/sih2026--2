import { useEffect, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import type { ImageIdentification } from '../../types';
import { uploadFoodImage, toApiError } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface Props {
  foodName: string;
  confirmed: boolean;
  onConfirm: (confirmed: boolean) => void;
  onIdentification: (image: ImageIdentification | null) => void;
  onBusy: (busy: boolean) => void;
}

export const FoodImageUpload = ({ foodName, confirmed, onConfirm, onIdentification, onBusy }: Props) => {
  const [preview, setPreview] = useState('');
  const [image, setImage] = useState<ImageIdentification | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const select = async (file?: File) => {
    if (!file) return;
    setError(''); setImage(null); onIdentification(null);
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 8 * 1024 * 1024 || file.size === 0) {
      setPreview(''); setError('Choose a JPEG or PNG image, up to 8 MiB.'); return;
    }
    setPreview(URL.createObjectURL(file)); setBusy(true); onBusy(true);
    try {
      const result = await uploadFoodImage(file, (value, step) => { setProgress(value); setPhase(step); });
      setImage(result); onIdentification(result);
    } catch (err) { setError(toApiError(err).message); }
    finally { setBusy(false); onBusy(false); }
  };

  return <Card className="p-5 sm:p-6" data-testid="food-image-card">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Camera className="h-4 w-4 text-emerald-600" /> Optional food image</div>
    <p className="mt-2 text-xs leading-relaxed text-slate-500" data-testid="image-privacy-note">Identify or verify the food—not its chemistry. Images are stored securely and sent to Groq for identification. JPEG / PNG, up to 8 MiB.</p>
    <input type="file" accept="image/jpeg,image/png" disabled={busy} aria-label="Upload food image" data-testid="food-image-input"
      className="mt-4 w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700"
      onChange={(e) => { select(e.target.files?.[0]); e.target.value = ''; }} />
    {preview && <div className="mt-4 flex items-start gap-4">
      <img src={preview} alt="Your food for identification" className="h-24 w-24 rounded-lg border border-slate-200 object-cover" data-testid="food-image-preview" />
      <div className="flex-1">
        {busy && <div role="status" aria-live="polite" data-testid="image-upload-progress">
          <p className="flex gap-2 text-xs text-emerald-700"><Loader2 className="h-4 w-4 animate-spin" />{phase}</p>
          <progress className="mt-2 w-full accent-emerald-600" value={progress} max={100} />
          <p className="text-xs text-slate-500">Upload {progress}% · Identification follows storage</p>
        </div>}
        {image && <div className="text-sm" data-testid="food-identification-result">
          <p className="font-semibold text-slate-900">{image.food_name ? `${image.food_name} detected` : 'Please identify the food manually'}</p>
          <p className="mt-1 text-xs text-slate-600">{image.explanation}</p>
          <p className="mt-1 text-xs capitalize text-slate-500">Identification confidence: {image.confidence}</p>
          <label className="mt-3 flex items-start gap-2 text-xs font-medium text-emerald-800">
            <input type="checkbox" checked={confirmed} disabled={!foodName.trim()} onChange={(e) => onConfirm(e.target.checked)} data-testid="confirm-food-image-checkbox" />
            I confirm the food is {foodName.trim() || 'the name entered above'}. I have corrected the name above if needed.
          </label>
        </div>}
        {!busy && <Button variant="ghost" className="mt-2" onClick={() => { setPreview(''); setImage(null); setError(''); onIdentification(null); }} data-testid="remove-food-image-button"><X className="h-3 w-3" />Remove image</Button>}
      </div>
    </div>}
    {error && <p role="alert" className="mt-3 text-xs text-red-600" data-testid="food-image-error">{error} You can continue without an image.</p>}
    <p className="mt-3 text-xs text-slate-500" data-testid="image-measurement-disclaimer">An ordinary image cannot measure pH, moisture, fat, acidity or respiration.</p>
  </Card>;
};
