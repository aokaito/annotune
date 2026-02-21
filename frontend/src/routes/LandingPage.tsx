// ランディングページ：未ログインユーザー向けに価値を伝えるページ
// ヒーロー → 公開歌詞フィード → インタラクティブデモ → 登録CTA
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicLyricsList } from '../hooks/useLyrics';
import { SelectableLyricDisplay } from '../components/editor/SelectableLyricDisplay';
import { AnnotationList } from '../components/editor/AnnotationList';
import { AnnotationEditDialog } from '../components/editor/AnnotationEditDialog';
import { SAMPLE_LYRICS } from '../data/sampleLyrics';
import type { Annotation, AnnotationProps, LyricDocument } from '../types';

const generateDemoId = () => `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const LandingPage = () => {
  // ② 公開歌詞フィード
  const { data: publicLyrics, isLoading: isLoadingFeed } = usePublicLyricsList();
  const displayedLyrics = publicLyrics?.slice(0, 6) ?? [];

  // ③ インタラクティブデモの状態管理
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAnnotation = async (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const newAnnotation: Annotation = {
      annotationId: generateDemoId(),
      authorId: 'demo-user',
      start: payload.start,
      end: payload.end,
      tag: payload.tag as Annotation['tag'],
      comment: payload.comment,
      props: payload.props,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
    setIsSubmitting(false);
  };

  const handleUpdateAnnotation = async (payload: {
    annotationId: string;
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    setAnnotations((prev) =>
      prev.map((ann) =>
        ann.annotationId === payload.annotationId
          ? {
              ...ann,
              start: payload.start,
              end: payload.end,
              tag: payload.tag as Annotation['tag'],
              comment: payload.comment,
              props: payload.props,
              updatedAt: new Date().toISOString()
            }
          : ann
      )
    );
    setEditing(null);
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.annotationId !== annotationId));
    setEditing(null);
  };

  return (
    <div className="space-y-16 pb-8 sm:space-y-20 md:space-y-24">
      {/* ① ヒーローセクション */}
      <section className="text-center">
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
          歌唱テクニックを歌詞に刻もう
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
          ビブラート・しゃくり・フォールなどのテクニック記号やコメントを歌詞の好きな箇所に追加して、
          あなただけのボーカル練習ノートを作ろう。
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
          <Link
            to="/login"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:min-h-14 sm:w-auto sm:px-10 sm:text-lg"
          >
            アカウント作成（無料）
          </Link>
          <a
            href="#demo"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-border bg-card px-8 text-base font-semibold text-foreground shadow-sm transition hover:bg-muted sm:min-h-14 sm:w-auto sm:px-10 sm:text-lg"
          >
            デモを試す
          </a>
        </div>
      </section>

      {/* ② 公開歌詞フィード */}
      <section>
        <header className="mb-6 flex items-baseline justify-between sm:mb-8">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
            みんなの練習ノート
          </h2>
          <Link
            to="/discover"
            className="text-sm font-medium text-primary transition hover:text-primary/80"
          >
            もっと見る →
          </Link>
        </header>

        {isLoadingFeed && (
          <div className="py-8 text-center text-sm text-muted-foreground">読み込み中...</div>
        )}

        {!isLoadingFeed && displayedLyrics.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card/80 p-8 text-center text-sm text-muted-foreground">
            まだ公開された練習ノートはありません
          </div>
        )}

        {displayedLyrics.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {displayedLyrics.map((lyric: LyricDocument) => (
              <li
                key={lyric.docId}
                className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md sm:gap-3 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold sm:text-lg">{lyric.title}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {lyric.artist || 'アーティスト未設定'}
                    </p>
                    {lyric.ownerName?.trim() && (
                      <p className="truncate text-xs text-muted-foreground">
                        by {lyric.ownerName.trim()}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground sm:px-3 sm:py-1 sm:text-xs">
                    公開中
                  </span>
                </div>
                <p className="wrap-anywhere whitespace-pre-line text-xs text-muted-foreground line-clamp-3 sm:text-sm sm:line-clamp-4">
                  {lyric.text}
                </p>
                <Link
                  to={`/public/lyrics/${lyric.docId}`}
                  className="mt-auto flex min-h-10 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground sm:min-h-11"
                >
                  詳細を見る
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground sm:mt-8">
          <Link
            to="/login"
            className="font-medium text-foreground underline transition hover:text-primary"
          >
            アカウント登録
          </Link>{' '}
          して、あなたの歌詞を公開しよう →
        </p>
      </section>

      {/* ③ インタラクティブデモ */}
      <section id="demo" className="scroll-mt-20 space-y-4">
        <header className="space-y-2">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
            実際に操作してみよう
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            歌詞を選択してアノテーションを追加してみてください。
          </p>
        </header>

        <div
          role="alert"
          className="flex flex-col items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:gap-4"
        >
          <p className="text-center text-amber-100 sm:text-left">
            <span className="mr-2 font-semibold">デモモード</span>
            これはデモです。データは保存されません。保存するにはアカウント登録が必要です。
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            無料で登録
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
          <h3 className="mb-1 text-lg font-semibold">{SAMPLE_LYRICS.title}</h3>
          <p className="mb-3 text-sm text-muted-foreground">{SAMPLE_LYRICS.artist}</p>
          <p className="text-sm text-muted-foreground">
            歌詞の文字をタップして選択し、ビブラート・しゃくり・フォール・ブレスなどのテクニック記号やコメントを追加できます。
          </p>
        </div>

        <SelectableLyricDisplay
          text={SAMPLE_LYRICS.text}
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onSelectAnnotation={(annotation) => setEditing(annotation)}
          isSubmitting={isSubmitting}
        />

        <div className="space-y-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold sm:text-xl">アノテーション一覧</h3>
            <span className="text-sm text-muted-foreground">
              {annotations.length}件のアノテーション
            </span>
          </div>
          <AnnotationList
            annotations={annotations}
            onEdit={setEditing}
            onDelete={handleDeleteAnnotation}
          />
        </div>

        {editing && (
          <AnnotationEditDialog
            annotation={editing}
            onClose={() => setEditing(null)}
            onSave={handleUpdateAnnotation}
            onDelete={handleDeleteAnnotation}
            isSaving={false}
            isDeleting={false}
          />
        )}
      </section>

      {/* ④ 登録CTA */}
      <section className="rounded-2xl bg-card/80 px-4 py-10 text-center sm:px-8 sm:py-14 md:py-16">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
          まずは無料で始める
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
          アカウント登録は無料。歌詞を作成して、あなただけのボーカル練習ノートを始めよう。
        </p>
        <div className="mt-8">
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:min-h-14 sm:px-10 sm:text-lg"
          >
            アカウント作成（無料）
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-border pt-8 text-center">
        <p className="text-lg font-semibold text-foreground">Annotune</p>
        <p className="mt-2 text-sm text-muted-foreground">
          歌詞に歌唱テクニックを書き込める、あなただけのボーカル練習ノート
        </p>
        <nav className="mt-4 flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/discover" className="transition hover:text-foreground">
            公開ライブラリ
          </Link>
        </nav>
      </footer>
    </div>
  );
};
