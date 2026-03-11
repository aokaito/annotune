// ランディングページ：未ログインユーザー向けに価値を伝えるページ
// ヒーロー → 認証ボタン → モックアップ → 機能紹介 → ステップ → 公開歌詞一覧 → デモ → CTA → フッター
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Music, MessageSquare, Share2, Eye, Library } from 'lucide-react';
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
    <div className="mx-auto max-w-4xl space-y-12 pb-8 sm:space-y-16 md:space-y-20 lg:space-y-24">
      {/* ① ヒーローセクション */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-surface to-background px-4 py-12 text-center sm:px-8 sm:py-16 md:py-24">
        <div className="relative z-10">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Music className="h-4 w-4" />
            ボーカル練習アプリ
          </span>
          <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-5xl">
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
        </div>
      </section>

      {/* ② 認証ボタン */}
      <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
        <Link
          to="/login"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:w-auto sm:px-10"
        >
          無料で始める
        </Link>
        <Link
          to="/login"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border border-border bg-card px-8 text-base font-semibold text-foreground shadow-sm transition hover:bg-muted sm:w-auto sm:px-10"
        >
          ログイン
        </Link>
        <a
          href="#demo"
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-8 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          まず見てみる
        </a>
      </section>

      {/* ③ アプリモックアップ */}
      <section className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="border-b border-border bg-surface p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground">{LP_SAMPLE_LYRICS.title}</h3>
            <p className="text-sm text-muted-foreground">{LP_SAMPLE_LYRICS.artist}</p>
          </div>
          <div className="p-4 sm:p-6">
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
        </div>
      </section>

      {/* ④ 機能紹介 */}
      <section className="space-y-6">
        <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">できること</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">テクニック記号</h3>
            <p className="text-sm text-muted-foreground">
              ビブラート・しゃくり・フォール・ブレスなどの記号を歌詞の任意の位置に追加
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <MessageSquare className="h-6 w-6 text-accent" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">コメント追加</h3>
            <p className="text-sm text-muted-foreground">
              練習のポイントや気づきをメモとして残せる
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Share2 className="h-6 w-6 text-success" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-foreground">共有・公開</h3>
            <p className="text-sm text-muted-foreground">
              他の人の練習ノートを参考にしたり、自分のノートを公開できる
            </p>
          </div>
        </div>
      </section>

      {/* ⑤ かんたん3ステップ */}
      <section className="space-y-6">
        <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl">かんたん3ステップ</h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-center sm:gap-12">
          <div className="flex max-w-xs gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              1
            </div>
            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">歌詞を登録</h3>
              <p className="text-sm text-muted-foreground">
                練習したい曲の歌詞をコピペするだけ
              </p>
            </div>
          </div>
          <div className="flex max-w-xs gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              2
            </div>
            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">テクニックを追加</h3>
              <p className="text-sm text-muted-foreground">
                歌詞をタップして記号やコメントを追加
              </p>
            </div>
          </div>
          <div className="flex max-w-xs gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              3
            </div>
            <div>
              <h3 className="mb-1 text-base font-semibold text-foreground">練習＆共有</h3>
              <p className="text-sm text-muted-foreground">
                いつでもノートを見返して練習。公開して他の人と共有も
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ⑥ 公開歌詞一覧 */}
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

      {/* ⑦ インタラクティブデモ */}
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

      {/* ⑧ 登録CTA */}
      <section className="rounded-2xl border border-primary/20 bg-card/80 px-4 py-10 text-center sm:px-8 sm:py-12">
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
      <footer className="space-y-6 border-t border-border pt-8 text-center">
        <Link
          to="/discover"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-elevated px-6 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          <Library className="h-4 w-4 text-primary" />
          みんなの練習ノートを見る
        </Link>
        <div>
          <p className="text-base font-semibold text-primary">Annotune</p>
          <p className="mt-2 text-xs text-muted-foreground">
            あなただけのボーカル練習ノート
          </p>
        </div>
        <nav className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/discover" className="transition hover:text-foreground">
            公開ライブラリ →
          </Link>
        </nav>
      </footer>
    </div>
  );
};
