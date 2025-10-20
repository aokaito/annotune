// エディタ画面：歌詞本文の編集、注釈 CRUD、共有トグルをまとめた中核ページ。
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

  // 歌詞データと各種ミューテーションを取得
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
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handleSelection = () => {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      if (start !== end) {
        // 範囲が選択されている場合は開始位置と終了位置を保持
        setSelection({ start, end });
      } else {
        // 選択が解除されたらパレット表示もリセット
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

  // 保存ボタン押下で歌詞ドキュメントを更新
  const handleSave = form.handleSubmit(async (values) => {
    await updateLyric.mutateAsync({
      title: values.title,
      text: values.text,
      version: values.version
    });
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
    props?: { intensity?: string; length?: string };
  }) => {
    // ミューテーションを呼び出したあと選択を解除し、次の入力に備える
    await annotations.create.mutateAsync(payload);
    setSelection(null);
  };

  // 注釈編集完了時のハンドラ
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
    return <p className="text-muted-foreground">エディタを読み込み中です…</p>;
  }

  return (
    // 画面全体を縦並びのセクションで構築
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{lyric.title}</h1>
          <p className="text-sm text-muted-foreground">ドキュメント ID: {lyric.docId}</p>
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
            {/* 公開状態に応じてボタン表示を切り替える */}
            {lyric.isPublicView ? '公開リンクをオフにする' : '公開リンクをオンにする'}
          </button>
          <button className="rounded border border-red-200 bg-card px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={handleDelete}>
            {/* ドキュメントを削除。確認ダイアログあり */}
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
              {/* 保存中はボタンを無効化して状態を表示 */}
              {updateLyric.isPending ? '保存中…' : '保存'}
            </button>
          </div>
          <div>
            <h2 className="text-lg font-semibold">レンダリング例</h2>
            {/* 歌詞本文に注釈を当てたプレビュー */}
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
          {/* 編集操作中のみ更新ボタンを無効化 */}
          isSaving={annotations.update.isPending}
        />
      )}
    </section>
  );
};
