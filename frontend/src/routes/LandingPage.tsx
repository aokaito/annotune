// ランディングページ：未ログインユーザー向けのSEOコンテンツを表示
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="space-y-16 pb-8 sm:space-y-20 md:space-y-24">
      {/* ヒーローセクション */}
      <section className="text-center">
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
          歌詞に歌唱テクニックを書き込める、
          <br className="hidden sm:block" />
          あなただけのボーカル練習ノート
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg">
          Annotuneは、歌詞にビブラートやしゃくりなどの歌唱テクニック記号を追加し、
          練習メモを残せるボーカル練習支援ツールです。
        </p>
        <div className="mt-8 sm:mt-10">
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:min-h-14 sm:px-10 sm:text-lg"
          >
            無料で始める
          </Link>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section>
        <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
          Annotuneでできること
        </h2>
        <ul className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
          <li className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl sm:h-12 sm:w-12">
              🎵
            </div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">歌唱テクニック記号</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              ビブラート・しゃくり・フォール・ブレスなどの歌唱テクニック記号を歌詞の任意の位置に追加できます。
            </p>
          </li>
          <li className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl sm:h-12 sm:w-12">
              💬
            </div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">コメント機能</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              歌詞の各箇所にコメントを追加して、練習のポイントやメモを残すことができます。
            </p>
          </li>
          <li className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl sm:h-12 sm:w-12">
              📜
            </div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">バージョン管理</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              練習ノートの履歴を保存し、過去のバージョンを確認・比較できます。
            </p>
          </li>
          <li className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xl sm:h-12 sm:w-12">
              🔗
            </div>
            <h3 className="text-base font-semibold text-foreground sm:text-lg">公開・共有機能</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              練習ノートを公開して、他のユーザーと共有することができます。
            </p>
          </li>
        </ul>
      </section>

      {/* 使い方セクション */}
      <section className="rounded-2xl bg-card/80 px-4 py-10 sm:px-8 sm:py-14 md:py-16">
        <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
          使い方は簡単3ステップ
        </h2>
        <ol className="mx-auto mt-8 flex max-w-3xl flex-col gap-6 sm:mt-10 sm:flex-row sm:gap-4 md:gap-8">
          <li className="flex flex-1 flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-xl">
              1
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">歌詞を入力</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              練習したい曲の歌詞を入力して、ドキュメントを作成します。
            </p>
          </li>
          <li className="flex flex-1 flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-xl">
              2
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">
              テクニック記号やコメントを追加
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              歌詞の任意の位置に歌唱テクニック記号やコメントを追加します。
            </p>
          </li>
          <li className="flex flex-1 flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground sm:h-14 sm:w-14 sm:text-xl">
              3
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground sm:text-lg">保存して練習・共有</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              ノートを保存して練習に活用。必要に応じて公開・共有もできます。
            </p>
          </li>
        </ol>
      </section>

      {/* こんな方におすすめセクション */}
      <section>
        <h2 className="text-center text-xl font-bold text-foreground sm:text-2xl md:text-3xl">
          こんな方におすすめ
        </h2>
        <ul className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:mt-10 sm:gap-4">
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 sm:px-6">
            <span className="mt-0.5 text-lg text-primary">✓</span>
            <span className="text-sm text-foreground sm:text-base">ボーカルレッスンの復習をしたい方</span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 sm:px-6">
            <span className="mt-0.5 text-lg text-primary">✓</span>
            <span className="text-sm text-foreground sm:text-base">カラオケの上達を目指す方</span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 sm:px-6">
            <span className="mt-0.5 text-lg text-primary">✓</span>
            <span className="text-sm text-foreground sm:text-base">歌唱テクニックを体系的に学びたい方</span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4 sm:px-6">
            <span className="mt-0.5 text-lg text-primary">✓</span>
            <span className="text-sm text-foreground sm:text-base">
              ボイストレーナーが生徒にフィードバックを共有したい方
            </span>
          </li>
        </ul>
        <div className="mt-10 text-center sm:mt-12">
          <Link
            to="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:min-h-14 sm:px-10 sm:text-lg"
          >
            無料で始める
          </Link>
        </div>
      </section>

      {/* フッターセクション（AppLayoutのフッターの上に表示される追加情報） */}
      <footer className="border-t border-border pt-8 text-center">
        <p className="text-lg font-semibold text-foreground">Annotune</p>
        <p className="mt-2 text-sm text-muted-foreground">
          歌詞に歌唱テクニックを書き込める、あなただけのボーカル練習ノート
        </p>
        <nav className="mt-4 flex justify-center gap-4 text-sm text-muted-foreground">
          <Link to="/discover" className="transition hover:text-foreground">
            公開ライブラリ
          </Link>
          {/* プライバシーポリシーページがあれば追加 */}
          {/* <Link to="/privacy" className="transition hover:text-foreground">プライバシーポリシー</Link> */}
        </nav>
      </footer>
    </div>
  );
};
