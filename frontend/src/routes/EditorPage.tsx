// エディタ画面：歌詞本文の編集、注釈 CRUD、共有トグルをまとめた中核ページ。
// NOTE: レイアウトを調整し、レンダリング例で直接範囲を選択してアノテーションを付与できるようにした。
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
import { AnnotationMobileAction } from '../components/editor/AnnotationMobileAction';
import type { Annotation, AnnotationProps } from '../types';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';

interface FormValues {
  title: string;
  artist: string;
  text: string;
  version: number;
}

export const EditorPage = () => {
  const { docId = '' } = useParams();
  const navigate = useNavigate();
  const lyricDisplayRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [isAnnotationSheetOpen, setIsAnnotationSheetOpen] = useState(false);

  const { data: lyric, isLoading } = useLyric(docId);
  const updateLyric = useUpdateLyric(docId);
  const deleteLyric = useDeleteLyric(docId);
  const shareLyric = useShareLyric(docId);
  const annotations = useAnnotationMutations(docId);
  const { mode, isAuthenticated } = useAnnotuneApi();
  const requiresSignIn = mode === 'http' && !isAuthenticated;

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      artist: '',
      text: '',
      version: 1
    }
  });
  const textFieldRegister = form.register('text', { required: true });
  const watchedText = form.watch('text') ?? '';

  useEffect(() => {
    if (lyric) {
      form.reset({
        title: lyric.title,
        artist: lyric.artist,
        text: lyric.text,
        version: lyric.version
      });
    }
  }, [lyric, form]);

  useEffect(() => {
    if (!selection) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsAnnotationSheetOpen(true);
    }
  }, [selection]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const container = lyricDisplayRef.current;
      if (!container) return;
      const selected = window.getSelection();
      if (!selected || selected.rangeCount === 0 || selected.isCollapsed) {
        return;
      }
      const range = selected.getRangeAt(0);
      const { startContainer, endContainer } = range;
      if (!container.contains(startContainer) || !container.contains(endContainer)) {
        setSelection(null);
        return;
      }
      const preRange = range.cloneRange();
      preRange.selectNodeContents(container);
      preRange.setEnd(range.startContainer, range.startOffset);
      const start = preRange.toString().length;
      const selectedText = range.toString();
      if (selectedText.length === 0) {
        return;
      }
      setSelection({ start, end: start + selectedText.length, text: selectedText });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleSave = form.handleSubmit(async (values) => {
    await updateLyric.mutateAsync({
      title: values.title,
      artist: values.artist,
      text: values.text,
      version: values.version
    });
    setIsLyricsModalOpen(false);
    setSelection(null);
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
    props?: AnnotationProps;
  }) => {
    await annotations.create.mutateAsync(payload);
    setSelection(null);
    setIsAnnotationSheetOpen(false);
  };

  const handleUpdateAnnotation = async (payload: {
    annotationId: string;
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    await annotations.update.mutateAsync(payload);
  };

  if (requiresSignIn) {
    return <p className="text-muted-foreground">エディタを利用するにはサインインしてください。</p>;
  }

  if (isLoading || !lyric) {
    return <p className="text-muted-foreground">エディタを読み込み中です…</p>;
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{lyric.title}</h1>
          <p className="text-sm text-muted-foreground">{lyric.artist || 'アーティスト未設定'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label={lyric.isPublicView ? '公開リンクをオフにする' : '公開リンクをオンにする'}
            className={`inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold transition ${
              lyric.isPublicView
                ? 'bg-secondary text-secondary-foreground'
                : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
            onClick={handleToggleShare}
          >
            {lyric.isPublicView ? '公開リンクをオフにする' : '公開リンクをオンにする'}
          </button>
          <button
            type="button"
            aria-label="ドキュメントを削除"
            className="inline-flex min-h-11 items-center rounded-md border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <form
          className="flex flex-col gap-5 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6"
          onSubmit={handleSave}
        >
          <input type="hidden" {...form.register('version', { valueAsNumber: true })} />
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">タイトル</span>
              <input
                type="text"
                className="min-h-11 rounded-md border border-border bg-card px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                {...form.register('title', { required: true })}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex flex-col gap-2">
              <span className="font-medium text-foreground">アーティスト</span>
              <input
                type="text"
                className="min-h-11 rounded-md border border-border bg-card px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                {...form.register('artist', { required: true })}
              />
            </label>
          </div>
          <div className="space-y-3 text-sm">
            <span className="font-medium text-foreground">レンダリング例</span>
            <p className="text-xs text-muted-foreground">
              この表示で範囲を選択し、右側のパレットからアノテーションを追加してください。
            </p>
            <div ref={lyricDisplayRef} className="rounded-lg border border-border bg-card p-3 shadow-sm">
              <LyricDisplay
                text={watchedText}
                annotations={lyric.annotations}
                framed={false}
                showTagIndicators
                className="p-0 shadow-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <button
              type="button"
              className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-muted-foreground transition hover:text-foreground"
              onClick={() => {
                setIsLyricsModalOpen(true);
                setSelection(null);
              }}
            >
              編集
            </button>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              disabled={updateLyric.isPending}
            >
              {updateLyric.isPending ? '保存中…' : '保存'}
            </button>
          </div>
        </form>
        <div className="hidden md:block md:sticky md:top-28">
          <AnnotationPalette
            selection={selection}
            onSubmit={handleAddAnnotation}
            isSubmitting={annotations.create.isPending}
            className="max-h-[calc(100dvh-10rem)] overflow-y-auto"
          />
        </div>
      </div>
      <section className="space-y-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">アノテーション一覧</h2>
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
      <AnnotationMobileAction
        selection={selection}
        onSubmit={handleAddAnnotation}
        isSubmitting={annotations.create.isPending}
        open={isAnnotationSheetOpen}
        onOpenChange={setIsAnnotationSheetOpen}
      />
      {isLyricsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">歌詞を編集</h3>
              <button
                type="button"
                className="text-muted-foreground transition hover:text-foreground"
                onClick={() => setIsLyricsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <textarea
              rows={14}
              className="w-full rounded-md border border-border bg-card px-3 py-3 font-mono leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...textFieldRegister}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                onClick={() => setIsLyricsModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                onClick={() => handleSave()}
                disabled={updateLyric.isPending}
              >
                {updateLyric.isPending ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
