// 既存アノテーションを編集するモーダルダイアログ。
import { useForm } from 'react-hook-form';
import { Annotation, AnnotationProps, EffectTag, VoiceQualityTag } from '../../types';
import { presetEffects, presetVoiceQualities } from './tagColors';

interface Props {
  annotation: Annotation;
  onClose(): void;
  onSave: (payload: {
    annotationId: string;
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => Promise<void>;
  onDelete?: (annotationId: string) => Promise<void>;
  isSaving: boolean;
  isDeleting?: boolean;
}

type FormValues = {
  start: number;
  end: number;
  effect: EffectTag | 'none';
  voiceQuality: VoiceQualityTag | 'none';
  comment?: string;
};

// タグからエフェクトを判定
const getEffectFromTag = (tag: string): EffectTag | 'none' => {
  const effects: EffectTag[] = ['vibrato', 'scoop', 'fall', 'breath'];
  return effects.includes(tag as EffectTag) ? (tag as EffectTag) : 'none';
};

// タグから声質を判定（propsにvoiceQualityがある場合はそちらを優先）
const getVoiceQualityFromAnnotation = (annotation: Annotation): VoiceQualityTag | 'none' => {
  if (annotation.props?.voiceQuality) {
    return annotation.props.voiceQuality;
  }
  const voiceQualities: VoiceQualityTag[] = ['whisper', 'edge', 'falsetto'];
  return voiceQualities.includes(annotation.tag as VoiceQualityTag) ? (annotation.tag as VoiceQualityTag) : 'none';
};

export const AnnotationEditDialog = ({ annotation, onClose, onSave, onDelete, isSaving, isDeleting }: Props) => {
  const form = useForm<FormValues>({
    defaultValues: {
      start: annotation.start,
      end: annotation.end,
      effect: getEffectFromTag(annotation.tag),
      voiceQuality: getVoiceQualityFromAnnotation(annotation),
      comment: annotation.comment
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    // エフェクトと声質の両方が「付与しない」の場合はコメントのみ
    const effect = values.effect !== 'none' ? values.effect : undefined;
    const voiceQuality = values.voiceQuality !== 'none' ? values.voiceQuality : undefined;

    // tagはエフェクト優先、なければ声質、両方なければcomment
    const tag = effect ?? voiceQuality ?? 'comment';

    await onSave({
      annotationId: annotation.annotationId,
      start: Number(values.start),
      end: Number(values.end),
      tag,
      comment: values.comment,
      props: {
        voiceQuality
      }
    });
    onClose();
  });

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 px-2 pb-2 sm:items-center sm:px-4 sm:pb-0">
      <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-card p-4 shadow-xl sm:max-h-[90dvh] sm:rounded-lg sm:p-6">
        <div className="flex items-center justify-between pb-3 sm:pb-4">
          <h2 className="text-base font-semibold text-foreground sm:text-lg">アノテーションの編集</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            ✕
          </button>
        </div>
        <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
            <label className="flex flex-col gap-1.5 sm:gap-2">
              <span className="font-medium text-foreground">開始位置</span>
              <input
                type="number"
                inputMode="numeric"
                className="min-h-11 rounded-lg border border-border bg-card px-3 py-2"
                {...form.register('start', { valueAsNumber: true, required: true })}
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:gap-2">
              <span className="font-medium text-foreground">終了位置</span>
              <input
                type="number"
                inputMode="numeric"
                className="min-h-11 rounded-lg border border-border bg-card px-3 py-2"
                {...form.register('end', { valueAsNumber: true, required: true })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm sm:gap-2">
            <span className="font-medium text-foreground">エフェクト</span>
            <select
              className="min-h-11 rounded-lg border border-border bg-card px-3 py-2"
              {...form.register('effect')}
            >
              {presetEffects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:gap-2">
            <span className="font-medium text-foreground">声質</span>
            <select
              className="min-h-11 rounded-lg border border-border bg-card px-3 py-2"
              {...form.register('voiceQuality')}
            >
              {presetVoiceQualities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:gap-2">
            <span className="font-medium text-foreground">コメント</span>
            <textarea
              rows={2}
              className="rounded-lg border border-border bg-card px-3 py-2"
              placeholder="任意のメモを入力できます"
              {...form.register('comment')}
            />
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {onDelete && (
              <button
                type="button"
                className="order-3 min-h-11 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 sm:order-1"
                onClick={async () => {
                  if (!window.confirm('このアノテーションを削除しますか？')) return;
                  await onDelete(annotation.annotationId);
                  onClose();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中…' : '削除'}
              </button>
            )}
            <button
              type="button"
              className="order-2 min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="order-1 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground sm:order-3"
              disabled={isSaving}
            >
              {isSaving ? '保存中…' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
