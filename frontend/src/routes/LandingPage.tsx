// ランディングページ：未ログインユーザー向けに価値を伝えるページ
// ヒーロー → 認証ボタン → 歌詞閲覧例 → デモリンク → 公開歌詞一覧 → フッター
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublicLyricsList } from '../hooks/useLyrics';
import { LyricDisplay } from '../components/editor/LyricDisplay';
import { SelectableLyricDisplay } from '../components/editor/SelectableLyricDisplay';
import { AnnotationList } from '../components/editor/AnnotationList';
import { AnnotationEditDialog } from '../components/editor/AnnotationEditDialog';
import { SAMPLE_LYRICS, LP_SAMPLE_LYRICS, LP_SAMPLE_ANNOTATIONS } from '../data/sampleLyrics';
import type { Annotation, AnnotationProps, LyricDocument } from '../types';

const generateDemoId = () => `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const LandingPage = () => {
  // 公開歌詞フィード
  const { data: publicLyrics, isLoading: isLoadingFeed } = usePublicLyricsList();
  const displayedLyrics = publicLyrics?.slice(0, 3) ?? [];

  // インタラクティブデモの状態管理
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
    <div className="space-y-12 pb-8 sm:space-y-16 md:space-y-20">
      {/* ① ヒーローセクション */}
      <section className="text-center">
        <p className="mb-4 text-lg font-semibold text-primary sm:text-xl">Annotune</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl">
          歌唱テクニックを
          <br className="sm:hidden" />
          歌詞に刻もう
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground sm:mt-6 sm:text-base">
          ビブラート・しゃくり・フォールなどの
          <br className="sm:hidden" />
          テクニック記号やコメントを歌詞に追加して、
          <br className="sm:hidden" />
          あなただけのボーカル練習ノートを作ろう。
        </p>
      </section>

      {/* ② 認証ボタン */}
      <section className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <Link
          to="/login"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:w-auto sm:px-10"
        >
          アカウント作成（無料）
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-semibold text-foreground shadow-sm transition hover:bg-muted sm:w-auto sm:px-10"
        >
          ログイン
        </Link>
      </section>

      {/* ③ 歌詞閲覧例 */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          練習ノートを覗いてみよう
        </h2>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-foreground">{LP_SAMPLE_LYRICS.title}</h3>
          <p className="mb-4 text-sm text-muted-foreground">{LP_SAMPLE_LYRICS.artist}</p>
          <LyricDisplay
            text={LP_SAMPLE_LYRICS.text}
            annotations={LP_SAMPLE_ANNOTATIONS}
            framed={false}
            showTagIndicators
            renderLines
            showInlineComments
            className="rounded-lg border border-border bg-elevated p-4"
          />
        </div>
        <a
          href="#demo"
          className="flex min-h-[52px] items-center justify-center rounded-xl bg-elevated text-sm font-medium text-primary transition hover:bg-muted"
        >
          実際に試してみる →
        </a>
      </section>

      {/* ④ 公開歌詞一覧 */}
      <section>
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
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
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {displayedLyrics.map((lyric: LyricDocument) => (
              <li key={lyric.docId}>
                <Link
                  to={`/public/lyrics/${lyric.docId}`}
                  className="flex items-center justify-between gap-3 p-4 transition hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-foreground">
                      {lyric.title}
                    </h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {lyric.artist || 'アーティスト未設定'}
                      {lyric.ownerName?.trim() && ` · by ${lyric.ownerName.trim()}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ⑤ インタラクティブデモ */}
      <section id="demo" className="scroll-mt-20 space-y-4">
        <header className="space-y-2">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            実際に操作してみよう
          </h2>
          <p className="text-sm text-muted-foreground">
            歌詞を選択してアノテーションを追加してみてください。
          </p>
        </header>

        <div
          role="alert"
          className="flex flex-col items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:gap-4"
        >
          <p className="text-center text-amber-100 sm:text-left">
            <span className="mr-2 font-semibold">デモモード</span>
            データは保存されません。保存するにはアカウント登録が必要です。
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            無料で登録
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
          <h3 className="mb-1 text-lg font-semibold">{SAMPLE_LYRICS.title}</h3>
          <p className="mb-3 text-sm text-muted-foreground">{SAMPLE_LYRICS.artist}</p>
          <p className="text-sm text-muted-foreground">
            歌詞の文字をタップして選択し、テクニック記号やコメントを追加できます。
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
            <h3 className="text-lg font-semibold">アノテーション一覧</h3>
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

      {/* ⑥ 登録CTA */}
      <section className="rounded-2xl bg-card/80 px-4 py-10 text-center sm:px-8 sm:py-12">
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          まずは無料で始める
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
          アカウント登録は無料。歌詞を作成して、あなただけのボーカル練習ノートを始めよう。
        </p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:px-10"
          >
            アカウント作成（無料）
          </Link>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-border pt-8 text-center">
        <p className="text-base font-semibold text-muted-foreground">Annotune</p>
        <p className="mt-2 text-xs text-muted-foreground">
          あなただけのボーカル練習ノート
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
