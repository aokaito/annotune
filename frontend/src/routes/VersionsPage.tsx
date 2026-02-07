// バージョン履歴を一覧表示するページ。スナップショットを時系列で確認できる。
import { useParams } from 'react-router-dom';
import { useLyric, useLyricVersions } from '../hooks/useLyrics';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import type { LyricVersionSnapshot } from '../types';

export const VersionsPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric } = useLyric(docId);
  const { data: versions, isLoading } = useLyricVersions(docId);
  const { mode, isAuthenticated } = useAnnotuneApi();
  const requiresSignIn = mode === 'http' && !isAuthenticated;

  if (requiresSignIn) {
    return <p className="text-muted-foreground">バージョン履歴を表示するにはサインインしてください。</p>;
  }

  if (isLoading) {
    return <p className="text-muted-foreground">バージョン履歴を読み込み中です…</p>;
  }

  if (!versions || versions.length === 0) {
    return <p className="text-muted-foreground">まだバージョン履歴がありません。</p>;
  }

  return (
    <section className="space-y-4 sm:space-y-6">
      <header className="space-y-1">
        {/* 対象ドキュメント名と説明 */}
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">{lyric?.title ?? 'Lyric'} のバージョン履歴</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{lyric?.artist || 'アーティスト未設定'}</p>
        <p className="text-xs text-muted-foreground sm:text-sm">最新が上に表示されます。</p>
      </header>
      <ul className="space-y-3 sm:space-y-4">
        {versions.map((version: LyricVersionSnapshot) => (
          <li key={version.version} className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              {/* バージョン番号と作成日時を表示 */}
              <h2 className="text-base font-semibold text-foreground sm:text-lg">バージョン {version.version}</h2>
              <span className="text-xs text-muted-foreground sm:text-sm">
                {new Date(version.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">{version.artist || 'アーティスト未設定'}</p>
            <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/60 p-3 text-xs text-foreground sm:p-4 sm:text-sm">
              {/* その時点の歌詞全文を表示。長文の場合はスクロール可能 */}
              {version.text}
            </pre>
          </li>
        ))}
      </ul>
    </section>
  );
};
