// 公開リンク用の閲覧専用ページ。認証不要で表示される。
// NOTE: 1カラムで読みやすさを優先し、横スクロールを防ぐ wrap-anywhere を適用。代替案: prose クラスで typograpy を調整
import { useParams } from 'react-router-dom';
import { usePublicLyric } from '../hooks/useLyrics';
import { LyricDisplay } from '../components/editor/LyricDisplay';
import type { Annotation } from '../types';

export const PublicViewPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric, isLoading } = usePublicLyric(docId);

  if (isLoading) {
    return <p className="text-muted-foreground">公開ページを読み込み中です…</p>;
  }

  if (!lyric || !lyric.isPublicView) {
    // ドキュメントが存在しないか、所有者が公開を停止している場合
    return <p className="text-muted-foreground">このドキュメントは公開されていません。</p>;
  }

  return (
    // 公開情報と注釈をカードレイアウトで表示
    <article className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-border bg-card/90 px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-secondary sm:text-sm">公開ビュー</p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{lyric.title}</h1>
        <p className="text-sm text-muted-foreground">{lyric.artist || 'アーティスト未設定'}</p>
        <p className="text-sm text-muted-foreground">
          バージョン {lyric.version} ・ 最終更新 {new Date(lyric.updatedAt).toLocaleString()}
        </p>
      </header>
      <LyricDisplay text={lyric.text} annotations={lyric.annotations} showTagIndicators />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">アノテーション一覧</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {lyric.annotations.map((annotation: Annotation) => (
            <li key={annotation.annotationId} className="wrap-anywhere">
              {/* シンプルなテキスト形式でタグ・コメント・範囲を表示 */}
              [{annotation.tag}] {annotation.comment ?? 'コメントなし'} ({annotation.start} – {annotation.end})
            </li>
          ))}
          {lyric.annotations.length === 0 && <li>アノテーションはありません。</li>}
        </ul>
      </section>
    </article>
  );
};
