// バージョン履歴を一覧表示するページ。スナップショットを時系列で確認できる。
import { useParams } from 'react-router-dom';
import { useLyric, useLyricVersions } from '../hooks/useLyrics';

export const VersionsPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric } = useLyric(docId);
  const { data: versions, isLoading } = useLyricVersions(docId);

  if (isLoading) {
    return <p className="text-muted-foreground">バージョン履歴を読み込み中です…</p>;
  }

  if (!versions || versions.length === 0) {
    return <p className="text-muted-foreground">まだバージョン履歴がありません。</p>;
  }

  return (
    <section className="space-y-4">
      <header>
        {/* 対象ドキュメント名と説明 */}
        <h1 className="text-2xl font-semibold text-foreground">{lyric?.title ?? 'Lyric'} のバージョン履歴</h1>
        <p className="text-sm text-muted-foreground">最新が上に表示されます。</p>
      </header>
      <ul className="space-y-4">
        {versions.map((version) => (
          <li key={version.version} className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              {/* バージョン番号と作成日時を表示 */}
              <h2 className="text-lg font-semibold text-foreground">バージョン {version.version}</h2>
              <span className="text-sm text-muted-foreground">
                {new Date(version.createdAt).toLocaleString()}
              </span>
            </div>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-muted/60 p-4 text-sm text-foreground">
              {/* その時点の歌詞全文を表示。長文の場合はスクロール可能 */}
              {version.text}
            </pre>
          </li>
        ))}
      </ul>
    </section>
  );
};
