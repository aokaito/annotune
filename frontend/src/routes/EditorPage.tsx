import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useAnnotationMutations,
  useDeleteLyric,
  useLyric,
  useShareLyric,
  useUpdateLyric
} from '../hooks/useLyrics';
import { AnnotationPalette } from '../components/editor/AnnotationPalette';
import { LyricDisplay } from '../components/editor/LyricDisplay';
import { AnnotationList } from '../components/editor/AnnotationList';
import { AnnotationEditDialog } from '../components/editor/AnnotationEditDialog';
import type { Annotation } from '../types';

interface FormValues {
  title: string;
  text: string;
  version: number;
}

export const EditorPage = () => {
  const { docId = '' } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [editing, setEditing] = useState<Annotation | null>(null);

  const { data: lyric, isLoading } = useLyric(docId);
  const updateLyric = useUpdateLyric(docId);
  const deleteLyric = useDeleteLyric(docId);
  const shareLyric = useShareLyric(docId);
  const annotations = useAnnotationMutations(docId);

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      text: '',
      version: 1
    }
  });

  useEffect(() => {
    if (lyric) {
      form.reset({
        title: lyric.title,
        text: lyric.text,
        version: lyric.version
      });
    }
  }, [lyric, form]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleSelection = () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        setSelection({ start, end });
      } else {
        setSelection(null);
      }
    };
    textarea.addEventListener('select', handleSelection);
    textarea.addEventListener('mouseup', handleSelection);
    textarea.addEventListener('keyup', handleSelection);
    return () => {
      textarea.removeEventListener('select', handleSelection);
      textarea.removeEventListener('mouseup', handleSelection);
      textarea.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const handleSave = form.handleSubmit(async (values) => {
    await updateLyric.mutateAsync({
      title: values.title,
      text: values.text,
      version: values.version
    });
  });

  const handleDelete = async () => {
    if (!window.confirm('本当に削除しますか？')) return;
    await deleteLyric.mutateAsync();
    navigate('/');
  };

  const handleToggleShare = async () => {
    if (!lyric) return;
    await shareLyric.mutateAsync(!lyric.isPublicView);
  };

  const handleAddAnnotation = async (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: { intensity?: string; length?: string };
  }) => {
    await annotations.create.mutateAsync(payload);
    setSelection(null);
  };

  const handleUpdateAnnotation = async (payload: {
    annotationId: string;
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: { intensity?: string; length?: string };
  }) => {
    await annotations.update.mutateAsync(payload);
  };

  if (isLoading || !lyric) {
    return <p className="text-muted-foreground">Loading editor…</p>;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{lyric.title}</h1>
          <p className="text-sm text-muted-foreground">Doc ID: {lyric.docId}</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`rounded px-3 py-2 text-sm font-medium transition ${
              lyric.isPublicView
                ? 'bg-secondary text-secondary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
            onClick={handleToggleShare}
          >
            {lyric.isPublicView ? '公開リンクをオフにする' : '公開リンクをオンにする'}
          </button>
          <button className="rounded border border-red-200 bg-card px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={handleDelete}>
            削除
          </button>
        </div>
      </div>
      <form className="grid gap-6 lg:grid-cols-[2fr_1fr]" onSubmit={handleSave}>
        <div className="flex flex-col gap-4">
          <input type="hidden" {...form.register('version', { valueAsNumber: true })} />
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">タイトル</span>
            <input
              type="text"
              className="rounded border border-border bg-card px-3 py-2"
              {...form.register('title', { required: true })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">歌詞</span>
            <textarea
              ref={textareaRef}
              rows={10}
              className="rounded border border-border bg-card px-3 py-2 font-mono"
              {...form.register('text', { required: true })}
            />
          </label>
          <div className="flex justify-end gap-2 text-sm">
            <button
              type="submit"
              className="rounded bg-primary px-5 py-2 font-semibold text-primary-foreground disabled:opacity-50"
              disabled={updateLyric.isPending}
            >
              {updateLyric.isPending ? '保存中…' : '保存'}
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold">レンダリング例</h2>
            <LyricDisplay text={lyric.text} annotations={lyric.annotations} />
          </div>
        </div>
        <AnnotationPalette
          selection={selection}
          onSubmit={handleAddAnnotation}
          isSubmitting={annotations.create.isPending}
        />
      </form>
      <section className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">アノテーション一覧</h2>
          <span className="text-sm text-muted-foreground">{lyric.annotations.length} 件</span>
        </header>
        <AnnotationList
          annotations={lyric.annotations}
          onEdit={setEditing}
          onDelete={(annotationId) => annotations.remove.mutate(annotationId)}
        />
      </section>
      {editing && (
        <AnnotationEditDialog
          annotation={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdateAnnotation}
          isSaving={annotations.update.isPending}
        />
      )}
    </section>
  );
};
