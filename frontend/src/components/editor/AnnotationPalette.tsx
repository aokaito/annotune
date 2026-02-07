// 注釈追加用フォーム。選択範囲とエフェクト・声質・コメントを入力させる。
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import type { AnnotationProps, EffectTag, VoiceQualityTag } from '../../types';
import { presetEffects, presetVoiceQualities } from './tagColors';

interface AnnotationPaletteProps {
  selection: { start: number; end: number; text: string } | null;
  onSubmit: (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => Promise<void>;
  isSubmitting: boolean;
  className?: string;
}

interface PaletteForm {
  effect: EffectTag | 'none';
  voiceQuality: VoiceQualityTag | 'none';
  comment?: string;
}

export const AnnotationPalette = ({ selection, onSubmit, isSubmitting, className }: AnnotationPaletteProps) => {
  const form = useForm<PaletteForm>({
    defaultValues: {
      effect: 'none',
      voiceQuality: 'none',
      comment: ''
    }
  });

  const submitAnnotation = form.handleSubmit(async (values) => {
    if (!selection) return;

    // エフェクトと声質の両方が「付与しない」の場合はコメントのみ
    const effect = values.effect !== 'none' ? values.effect : undefined;
    const voiceQuality = values.voiceQuality !== 'none' ? values.voiceQuality : undefined;

    // tagはエフェクト優先、なければ声質、両方なければcomment
    const tag = effect ?? voiceQuality ?? 'comment';

    await onSubmit({
      start: selection.start,
      end: selection.end,
      tag,
      comment: values.comment,
      props: {
        voiceQuality
      }
    });
    form.reset();
  });

  return (
    <aside className={clsx('flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm', className)}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">アノテーションパレット</h3>
        <p className="text-sm text-muted-foreground">
          テキストエリアで範囲を選択し、エフェクトや声質を追加します。
        </p>
      </div>
      <div className="flex min-h-[76px] items-center justify-center rounded border border-dashed border-border bg-card/70 px-4 text-sm">
        {selection ? (
          <div className="flex w-full flex-col gap-2 text-foreground">
            <p>
              選択範囲: <span className="font-mono">{selection.start}</span> –{' '}
              <span className="font-mono">{selection.end}</span>
            </p>
            <div className="rounded bg-muted px-3 py-2 font-mono text-sm whitespace-pre-wrap">
              {selection.text}
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground">歌詞を選択するとここに表示されます。</p>
        )}
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.stopPropagation();
          submitAnnotation(event);
        }}
      >
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
        <button
          className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-50"
          type="submit"
          disabled={!selection || isSubmitting}
        >
          {isSubmitting ? '保存中…' : 'アノテーション追加'}
        </button>
      </form>
    </aside>
  );
};
