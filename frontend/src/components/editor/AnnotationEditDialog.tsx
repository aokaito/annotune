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
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-semibold text-foreground">アノテーションの編集</h2>
          <button onClick={onClose} className="text-muted-foreground">
            ✕
          </button>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">開始位置</span>
              <input
                type="number"
                className="rounded border border-border bg-card px-3 py-2"
                {...form.register('start', { valueAsNumber: true, required: true })}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">終了位置</span>
              <input
                type="number"
                className="rounded border border-border bg-card px-3 py-2"
                {...form.register('end', { valueAsNumber: true, required: true })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">エフェクト</span>
            <select
              className="rounded border border-border bg-card px-3 py-2"
              {...form.register('effect')}
            >
              {presetEffects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">声質</span>
            <select
              className="rounded border border-border bg-card px-3 py-2"
              {...form.register('voiceQuality')}
            >
              {presetVoiceQualities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">コメント</span>
            <textarea
              rows={3}
              className="rounded border border-border bg-card px-3 py-2"
              placeholder="任意のメモを入力できます"
              {...form.register('comment')}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={onClose}>
              キャンセル
            </button>
            {onDelete && (
              <button
                type="button"
                className="rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
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
