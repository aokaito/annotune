// 注釈追加用フォーム。選択範囲とタグ／コメントを入力させる。
// NOTE: デスクトップとモバイル Sheet の両方で再利用するためクラス付与を柔軟化。代替案: variant props を追加しても良い
import { useForm } from 'react-hook-form';
import { clsx } from 'clsx';
import type { AnnotationProps } from '../../types';
import { presetTags } from './tagColors';

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
  tag: string;
  comment?: string;
  intensity: 'low' | 'medium' | 'high';
  length: 'short' | 'medium' | 'long';
}

export const AnnotationPalette = ({ selection, onSubmit, isSubmitting, className }: AnnotationPaletteProps) => {
  const form = useForm<PaletteForm>({
    defaultValues: {
      tag: 'vibrato',
      comment: '',
      intensity: 'medium',
      length: 'medium'
    }
  });

  const submitAnnotation = form.handleSubmit(async (values) => {
    if (!selection) return;
    // 現在の範囲選択とフォーム入力を合わせて送信
    await onSubmit({
      start: selection.start,
      end: selection.end,
      tag: values.tag,
      comment: values.comment,
      props: {
        intensity: values.intensity,
        length: values.length
      }
    });
    form.reset();
  });

  return (
    <aside className={clsx('flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm', className)}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">アノテーションパレット</h3>
        <p className="text-sm text-muted-foreground">
          テキストエリアで範囲を選択し、タグを追加します。
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
          <span className="font-medium text-foreground">タグ</span>
          {/* プリセットタグから選択する。将来的にカスタムタグも追加予定 */}
          <select
            className="rounded border border-border bg-card px-3 py-2"
            {...form.register('tag', { required: true })}
          >
            {presetTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-foreground">コメント</span>
          <textarea
            rows={3}
            className="rounded border border-border bg-card px-3 py-2"
            {...form.register('comment')}
          />
        </label>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <label className="flex flex-col gap-2">
            <span className="font-medium text-foreground">強さ</span>
            <select className="rounded border border-border bg-card px-3 py-2" {...form.register('intensity')}>
              <option value="low">弱</option>
              <option value="medium">中</option>
              <option value="high">強</option>
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium text-foreground">長さ</span>
            <select className="rounded border border-border bg-card px-3 py-2" {...form.register('length')}>
              <option value="short">短</option>
              <option value="medium">中</option>
              <option value="long">長</option>
            </select>
          </label>
        </div>
        <button
          className="rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground disabled:opacity-50"
          type="submit"
          disabled={!selection || isSubmitting}
        >
          {/* 選択範囲が無い場合や送信中は押せない */}
          {isSubmitting ? '保存中…' : 'アノテーション追加'}
        </button>
      </form>
    </aside>
  );
};
