// エディタ画面：歌詞本文の編集、注釈 CRUD、共有トグルをまとめた中核ページ。
// NOTE: タップ選択モードでアノテーションを付与できるように改善。
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  useAnnotationMutations,
  useDeleteLyric,
  useLyric,
  useShareLyric,
  useUpdateLyric
} from '../hooks/useLyrics';
import { SelectableLyricDisplay } from '../components/editor/SelectableLyricDisplay';
import { AnnotationList } from '../components/editor/AnnotationList';
import { AnnotationEditDialog } from '../components/editor/AnnotationEditDialog';
import type { Annotation, AnnotationProps } from '../types';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import { useAuthStore } from '../store/auth';

interface FormValues {
  title: string;
  artist: string;
  text: string;
  version: number;
}

export const EditorPage = () => {
  const { docId = '' } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);

  const { data: lyric, isLoading } = useLyric(docId);
  const updateLyric = useUpdateLyric(docId);
  const deleteLyric = useDeleteLyric(docId);
  const shareLyric = useShareLyric(docId);
  const annotations = useAnnotationMutations(docId);
  const { mode, isAuthenticated } = useAnnotuneApi();
  const displayName = useAuthStore((state) => state.displayName);
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

  const handleSave = form.handleSubmit(async (values) => {
    await updateLyric.mutateAsync({
      title: values.title,
      artist: values.artist,
      text: values.text,
      version: values.version
    });
    setIsLyricsModalOpen(false);
  });

  const handleDelete = async () => {
    if (!window.confirm('本当に削除しますか？')) return;
    await deleteLyric.mutateAsync();
    navigate('/');
  };

  const handleToggleShare = async () => {
    if (!lyric) return;
    const newPublicState = !lyric.isPublicView;
    // 公開時は現在の表示名を送信
    await shareLyric.mutateAsync({
      isPublic: newPublicState,
      ownerName: newPublicState ? displayName : undefined
    });
  };

  const handleAddAnnotation = async (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    await annotations.create.mutateAsync(payload);
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
            className="inline-flex min-h-11 items-center rounded-md border border-destructive/30 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/10"
            onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </div>
      {/* メタ情報編集フォーム */}
      <form
        className="flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6"
        onSubmit={handleSave}
      >
        <input type="hidden" {...form.register('version', { valueAsNumber: true })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">タイトル</span>
            <input
              type="text"
              className="min-h-11 rounded-md border border-border bg-card px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...form.register('title', { required: true })}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">アーティスト</span>
            <input
              type="text"
              className="min-h-11 rounded-md border border-border bg-card px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...form.register('artist', { required: true })}
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 font-semibold text-muted-foreground transition hover:text-foreground"
            onClick={() => setIsLyricsModalOpen(true)}
          >
            歌詞を編集
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

      {/* タップ選択可能な歌詞表示 */}
      <SelectableLyricDisplay
        text={lyric.text}
        annotations={lyric.annotations}
        onAddAnnotation={handleAddAnnotation}
        onSelectAnnotation={(annotation) => setEditing(annotation)}
        isSubmitting={annotations.create.isPending}
      />
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
          onDelete={async (annotationId) => {
            await annotations.remove.mutateAsync(annotationId);
          }}
          isSaving={annotations.update.isPending}
          isDeleting={annotations.remove.isPending}
        />
      )}
      {isLyricsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-2 pb-2 sm:items-center sm:px-4 sm:pb-0">
          <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-xl border border-border bg-card p-4 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">歌詞を編集</h3>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                onClick={() => setIsLyricsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <textarea
              rows={10}
              className="min-h-0 flex-1 w-full rounded-lg border border-border bg-card px-3 py-3 font-mono text-sm leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:text-base"
              {...textFieldRegister}
            />
            <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="order-2 min-h-11 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:order-1"
                onClick={() => setIsLyricsModalOpen(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="order-1 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:order-2"
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
