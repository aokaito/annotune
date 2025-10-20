// 既存アノテーションを編集するモーダルダイアログ。
import { useForm } from 'react-hook-form';
import { Annotation } from '../../types';
import { presetTags } from './tagColors';

interface Props {
  annotation: Annotation;
  onClose(): void;
  onSave: (payload: {
    annotationId: string;
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: { intensity?: string; length?: string };
  }) => Promise<void>;
  isSaving: boolean;
}

type FormValues = {
  start: number;
  end: number;
  tag: string;
  comment?: string;
  intensity?: string;
  length?: string;
};

export const AnnotationEditDialog = ({ annotation, onClose, onSave, isSaving }: Props) => {
  const form = useForm<FormValues>({
    defaultValues: {
      start: annotation.start,
      end: annotation.end,
      tag: annotation.tag,
      comment: annotation.comment,
      intensity: annotation.props?.intensity as string,
      length: annotation.props?.length as string
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSave({
      annotationId: annotation.annotationId,
      start: Number(values.start),
      end: Number(values.end),
      tag: values.tag,
      comment: values.comment,
      props: {
        intensity: values.intensity,
        length: values.length
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
              <span className="font-medium text-foreground">Start</span>
              <input
                type="number"
                className="rounded border border-border bg-card px-3 py-2"
                {...form.register('start', { valueAsNumber: true, required: true })}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">End</span>
              <input
                type="number"
                className="rounded border border-border bg-card px-3 py-2"
                {...form.register('end', { valueAsNumber: true, required: true })}
              />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">タグ</span>
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
              <span className="font-medium text-foreground">Intensity</span>
              <select className="rounded border border-border bg-card px-3 py-2" {...form.register('intensity')}>
                <option value="low">弱</option>
                <option value="medium">中</option>
                <option value="high">強</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">Length</span>
              <select className="rounded border border-border bg-card px-3 py-2" {...form.register('length')}>
                <option value="short">短</option>
                <option value="medium">中</option>
                <option value="long">長</option>
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : '更新する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
