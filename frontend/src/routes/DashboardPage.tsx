// ダッシュボード画面：歌詞ドキュメントの一覧表示と新規作成を担当。
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCreateLyric, useLyricsList } from '../hooks/useLyrics';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import type { LyricDocument } from '../types';

type FormValues = {
  title: string;
  artist: string;
  text: string;
};

const CreateLyricForm = ({ onClose }: { onClose(): void }) => {
  // フォームの初期値とバリデーションを設定
  const form = useForm<FormValues>({
    defaultValues: {
      title: 'New Song',
      artist: '',
      text: ''
    }
  });
  // 歌詞ドキュメント作成用のミューテーション
  const mutation = useCreateLyric();

  // 送信時に API を呼び出し、完了後にダイアログを閉じる
  const onSubmit = form.handleSubmit(async (values: FormValues) => {
    await mutation.mutateAsync(values);
    onClose();
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Title</span>
        {/* 曲名を入力するテキストボックス */}
        <input
          type="text"
          className="rounded border border-border bg-card px-3 py-2"
          {...form.register('title', { required: true })}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Artist</span>
        <input
          type="text"
          className="rounded border border-border bg-card px-3 py-2"
          {...form.register('artist', { required: true })}
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-foreground">Lyrics</span>
        {/* 歌詞本文を入力するテキストエリア。プレーンテキストで保存 */}
        <textarea
          rows={5}
          className="rounded border border-border bg-card px-3 py-2"
          {...form.register('text', { required: true })}
        />
      </label>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
          onClick={onClose}
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          disabled={mutation.isPending}
        >
          {/* 送信中は「Saving…」を表示して二重送信を防ぐ */}
          {mutation.isPending ? 'Saving…' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export const DashboardPage = () => {
  const { data: lyrics, isLoading } = useLyricsList();
  const { mode, isAuthenticated } = useAnnotuneApi();
  const [open, setOpen] = useState(false);
  const loginHref = import.meta.env.VITE_COGNITO_LOGIN_URL?.trim() || '#';
  const requiresSignIn = mode === 'http' && !isAuthenticated;

  return (
    // 一覧・ホルダー・モーダルを段組みで構成
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold sm:text-3xl">あなたの歌詞ノート</h1>
          <p className="text-sm text-muted-foreground">歌詞に注釈を付けて練習メモを整理しましょう。</p>
        </div>
        <button
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
          disabled={requiresSignIn}
          onClick={() => setOpen(true)}
        >
          {/* 新規ドキュメント作成モーダルを開く */}
          新規ドキュメント
        </button>
      </div>
      {requiresSignIn && (
        <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center text-muted-foreground">
          <p className="mb-4">歌詞ノートを利用するにはサインインしてください。</p>
          <a
            className="inline-flex min-h-10 items-center rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
            href={loginHref}
          >
            サインインページへ移動
          </a>
        </div>
      )}
      {isLoading && !requiresSignIn && (
        <p className="text-muted-foreground">歌詞一覧を読み込み中です…</p>
      )}
      {lyrics && lyrics.length === 0 && !requiresSignIn && (
        <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center text-muted-foreground">
          <p>まだ歌詞ドキュメントがありません。右上のボタンから作成しましょう。</p>
        </div>
      )}
      {lyrics && lyrics.length > 0 && !requiresSignIn && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lyrics.map((lyric: LyricDocument) => (
            <li
              key={lyric.docId}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* タイトル・更新日・公開状態を表示 */}
                <div className="min-w-0 space-y-1">
                  <h2 className="truncate text-lg font-semibold sm:text-xl">{lyric.title}</h2>
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">
                    {lyric.artist || 'アーティスト未設定'}
                  </p>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    最終更新 {new Date(lyric.updatedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex min-h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-medium ${
                    lyric.isPublicView
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {/* 公開状態を色付きバッジで表現 */}
                  {lyric.isPublicView ? '公開中' : '非公開'}
                </span>
              </div>
              <p className="wrap-anywhere whitespace-pre-line text-sm text-muted-foreground line-clamp-5">
                {lyric.text}
              </p>
              <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Link
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
                    to={`/editor/${lyric.docId}`}
                  >
                    {/* 詳細エディタ画面へ遷移 */}
                    編集
                  </Link>
                  <Link
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
                    to={`/viewer/${lyric.docId}`}
                  >
                    閲覧
                  </Link>
                  <Link
                    className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
                    to={`/versions/${lyric.docId}`}
                  >
                    {/* バージョン履歴画面へ遷移 */}
                    履歴
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-semibold">新しい歌詞ドキュメント</h2>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
                aria-label="モーダルを閉じる"
              >
                {/* モーダルを閉じるボタン */}
                ✕
              </button>
            </div>
            <CreateLyricForm onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </section>
  );
};
