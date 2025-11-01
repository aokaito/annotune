// エディタ画面：歌詞本文の編集、注釈 CRUD、共有トグルをまとめた中核ページ。
// NOTE: 2カラム/モバイル Drawer 両対応へ再設計。代替案: コンテンツ切替をタブ構成にしても良いが編集とアノテ作成を同画面で扱う設計を優先
import { useCallback, useEffect, useRef, useState } from 'react';
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
  text: string;
  version: number;
}

export const EditorPage = () => {
  const { docId = '' } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lyricDisplayRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [isAnnotationSheetOpen, setIsAnnotationSheetOpen] = useState(false);

  // 歌詞データと各種ミューテーションを取得
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
      text: '',
      version: 1
    }
  });
  const {
    ref: textFieldRef,
    ...textFieldProps
  } = form.register('text', { required: true });
  const bindTextareaRef = useCallback(
    (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      textFieldRef(element);
    },
    [textFieldRef]
  );
  const watchedText = form.watch('text') ?? '';

  // 取得した歌詞データでフォーム値を初期化
  useEffect(() => {
    if (lyric) {
      form.reset({
        title: lyric.title,
        text: lyric.text,
        version: lyric.version
      });
    }
  }, [lyric, form]);

  // テキストエリアの選択範囲を監視し、注釈パレットへ渡す
  useEffect(() => {
    if (!isEditingLyrics) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleSelection = () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        const text = textarea.value.slice(start, end);
        setSelection({ start, end, text });
      } else if (document.activeElement === textarea) {
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
  }, [isEditingLyrics]);

  useEffect(() => {
    if (!selection) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(max-width: 767px)').matches) {
      setIsAnnotationSheetOpen(true);
    }
  }, [selection]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (isEditingLyrics) return;
      const container = lyricDisplayRef.current;
      if (!container) return;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return;
      }
      const range = selection.getRangeAt(0);
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
      const selectedTextLength = selectedText.length;
      if (selectedTextLength === 0) {
        return;
      }
      setSelection({ start, end: start + selectedTextLength, text: selectedText });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isEditingLyrics]);

  // 保存ボタン押下で歌詞ドキュメントを更新
  const handleSave = form.handleSubmit(async (values) => {
    await updateLyric.mutateAsync({
      title: values.title,
      text: values.text,
      version: values.version
    });
    setIsEditingLyrics(false);
    setSelection(null);
  });

  // ドキュメント削除を実行しダッシュボードに戻る
  const handleDelete = async () => {
    if (!window.confirm('本当に削除しますか？')) return;
    await deleteLyric.mutateAsync();
    navigate('/');
  };

  // 公開設定のトグル
  const handleToggleShare = async () => {
    if (!lyric) return;
    await shareLyric.mutateAsync(!lyric.isPublicView);
  };

  // 新規注釈作成後に選択状態をクリア
  const handleAddAnnotation = async (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    // ミューテーションを呼び出したあと選択を解除し、次の入力に備える
    await annotations.create.mutateAsync(payload);
    setSelection(null);
    setIsAnnotationSheetOpen(false);
  };

  // 注釈編集完了時のハンドラ
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
          <p className="text-xs text-muted-foreground sm:text-sm">ドキュメント ID: {lyric.docId}</p>
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
      <form
        className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        onSubmit={handleSave}
      >
        <section className="flex flex-col gap-5 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
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
            <span className="font-medium text-foreground">歌詞</span>
            {isEditingLyrics ? (
              <textarea
                ref={bindTextareaRef}
                rows={12}
                className="min-h-[12rem] rounded-md border border-border bg-card px-3 py-3 font-mono leading-relaxed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                {...textFieldProps}
              />
            ) : (
              <div
                ref={lyricDisplayRef}
                className="min-h-[12rem] rounded-md border border-border bg-card px-3 py-3 font-mono leading-relaxed wrap-anywhere"
              >
                {watchedText}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-card px-4 font-semibold text-foreground transition hover:bg-muted disabled:opacity-50"
              onClick={() => {
                setIsEditingLyrics(true);
                setSelection(null);
              }}
              disabled={isEditingLyrics}
            >
              編集
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              disabled={!isEditingLyrics || updateLyric.isPending}
            >
              {updateLyric.isPending ? '保存中…' : '保存'}
            </button>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">レンダリング例</h2>
            <LyricDisplay text={watchedText} annotations={lyric.annotations} />
          </div>
        </section>
        <div className="hidden md:block md:sticky md:top-28">
          <AnnotationPalette
            selection={selection}
            onSubmit={handleAddAnnotation}
            isSubmitting={annotations.create.isPending}
            className="max-h-[calc(100dvh-10rem)] overflow-y-auto"
          />
        </div>
      </form>
      <section className="space-y-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">アノテーション一覧</h2>
          <span className="text-xs text-muted-foreground sm:text-sm">
            {lyric.annotations.length} 件
          </span>
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
          isSaving={annotations.update.isPending /* 編集操作中のみ更新ボタンを無効化 */}
        />
      )}
      <AnnotationMobileAction
        selection={selection}
        onSubmit={handleAddAnnotation}
        isSubmitting={annotations.create.isPending}
        open={isAnnotationSheetOpen}
        onOpenChange={setIsAnnotationSheetOpen}
      />
    </section>
  );
};
