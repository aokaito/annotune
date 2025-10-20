// ダッシュボード画面：歌詞ドキュメントの一覧表示と新規作成を担当。
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCreateLyric, useLyricsList } from '../hooks/useLyrics';

type FormValues = {
  title: string;
  text: string;
};

const CreateLyricForm = ({ onClose }: { onClose(): void }) => {
  // フォームの初期値とバリデーションを設定
  const form = useForm<FormValues>({
    defaultValues: {
      title: 'New Song',
      text: ''
    }
  });
  // 歌詞ドキュメント作成用のミューテーション
  const mutation = useCreateLyric();

  // 送信時に API を呼び出し、完了後にダイアログを閉じる
  const onSubmit = form.handleSubmit(async (values) => {
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
  const [open, setOpen] = useState(false);

  return (
    // 一覧・ホルダー・モーダルを段組みで構成
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">あなたの歌詞ノート</h1>
          <p className="text-muted-foreground">歌詞に注釈を付けて練習メモを整理しましょう。</p>
        </div>
        <button
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => setOpen(true)}
        >
          {/* 新規ドキュメント作成モーダルを開く */}
          新規ドキュメント
        </button>
      </div>
      {isLoading && <p className="text-muted-foreground">歌詞一覧を読み込み中です…</p>}
      {lyrics && lyrics.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card/80 p-10 text-center text-muted-foreground">
          <p>まだ歌詞ドキュメントがありません。右上のボタンから作成しましょう。</p>
        </div>
      )}
      {lyrics && lyrics.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lyrics.map((lyric) => (
            <li key={lyric.docId} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                {/* タイトル・更新日・公開状態を表示 */}
                <div>
                  <h2 className="text-xl font-semibold">{lyric.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    バージョン {lyric.version} ・ 最終更新 {new Date(lyric.updatedAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    lyric.isPublicView
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {/* 公開状態を色付きバッジで表現 */}
                  {lyric.isPublicView ? '公開中' : '非公開'}
                </span>
              </div>
              <p className="mt-3 max-h-24 overflow-hidden whitespace-pre-line text-sm text-muted-foreground">
                {lyric.text}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">アノテーション {lyric.annotations.length} 件</span>
                <div className="flex gap-2">
                  <Link
                    className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:text-foreground"
                    to={`/editor/${lyric.docId}`}
                  >
                    {/* 詳細エディタ画面へ遷移 */}
                    編集
                  </Link>
                  <Link
                    className="rounded-md border border-border px-3 py-1 text-muted-foreground hover:text-foreground"
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
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4">
              <h2 className="text-lg font-semibold">新しい歌詞ドキュメント</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground">
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
