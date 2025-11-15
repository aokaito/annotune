// 認証済みユーザー向けの閲覧ページ。非公開状態でも所有者は注釈付きで確認できる。
import { useParams } from 'react-router-dom';
import { useLyric } from '../hooks/useLyrics';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import { LyricDisplay } from '../components/editor/LyricDisplay';

export const ViewerPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric, isLoading } = useLyric(docId);
  const { mode, isAuthenticated } = useAnnotuneApi();
  const requiresSignIn = mode === 'http' && !isAuthenticated;

  if (requiresSignIn) {
    return <p className="text-muted-foreground">閲覧にはサインインが必要です。</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground">歌詞を読み込み中です…</p>;
  }

  if (!lyric) {
    return <p className="text-muted-foreground">歌詞が見つかりませんでした。</p>;
  }

  return (
    <article className="space-y-6 rounded-2xl border border-border bg-card/90 px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-secondary sm:text-sm">
          {lyric.isPublicView ? '公開中' : '非公開'}
        </p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{lyric.title}</h1>
        <p className="text-sm text-muted-foreground">{lyric.artist || 'アーティスト未設定'}</p>
        <p className="text-sm text-muted-foreground">
          バージョン {lyric.version} ・ 最終更新 {new Date(lyric.updatedAt).toLocaleString()}
        </p>
      </header>
      <LyricDisplay
        text={lyric.text}
        annotations={lyric.annotations}
        framed={false}
        showTagIndicators
        className="rounded-lg border border-border bg-card/80 p-6 shadow-inner"
      />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">アノテーション</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {lyric.annotations.map((annotation) => (
            <li
              key={annotation.annotationId}
              className="rounded-lg border border-border bg-card/80 p-3 leading-relaxed"
            >
              <p className="text-foreground">
                <span className="font-semibold">{annotation.tag}</span> ({annotation.start} –{' '}
                {annotation.end})
              </p>
              <p>{annotation.comment ?? 'コメントなし'}</p>
            </li>
          ))}
          {lyric.annotations.length === 0 && <li>アノテーションはまだありません。</li>}
        </ul>
      </section>
    </article>
  );
};
