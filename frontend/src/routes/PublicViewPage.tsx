// 公開リンク用の閲覧専用ページ。認証不要で表示される。
import { useParams } from 'react-router-dom';
import { useLyric } from '../hooks/useLyrics';
import { LyricDisplay } from '../components/editor/LyricDisplay';

export const PublicViewPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric, isLoading } = useLyric(docId);

  if (isLoading) {
    return <p className="text-muted-foreground">公開ページを読み込み中です…</p>;
  }

  if (!lyric || !lyric.isPublicView) {
    // ドキュメントが存在しないか、所有者が公開を停止している場合
    return <p className="text-muted-foreground">このドキュメントは公開されていません。</p>;
  }

  return (
    // 公開情報と注釈をカードレイアウトで表示
    <article className="mx-auto max-w-3xl space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-secondary">公開ビュー</p>
        <h1 className="text-3xl font-bold text-foreground">{lyric.title}</h1>
        <p className="text-sm text-muted-foreground">
          バージョン {lyric.version} ・ 最終更新 {new Date(lyric.updatedAt).toLocaleString()}
        </p>
      </header>
      <LyricDisplay text={lyric.text} annotations={lyric.annotations} />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">アノテーション一覧</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {lyric.annotations.map((annotation) => (
            <li key={annotation.annotationId}>
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
