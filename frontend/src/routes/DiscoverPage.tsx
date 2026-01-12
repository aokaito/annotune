import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { usePublicLyricsList } from '../hooks/useLyrics';
import type { LyricDocument } from '../types';

type SearchFormValues = {
  title: string;
  artist: string;
  author: string;
};

export const DiscoverPage = () => {
  const form = useForm<SearchFormValues>({
    defaultValues: {
      title: '',
      artist: '',
      author: ''
    }
  });
  const [filters, setFilters] = useState<SearchFormValues>({
    title: '',
    artist: '',
    author: ''
  });
  const { data: lyrics, isLoading } = usePublicLyricsList(filters);

  const onSubmit = form.handleSubmit((values) => {
    setFilters({
      title: values.title.trim(),
      artist: values.artist.trim(),
      author: values.author.trim()
    });
  });

  const handleReset = () => {
    form.reset();
    setFilters({ title: '', artist: '', author: '' });
  };

  const showEmptyState = !isLoading && lyrics && lyrics.length === 0;

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">公開歌詞ライブラリを探す</h1>
        <p className="text-sm text-muted-foreground">
          他のユーザーが公開した歌詞を曲名・アーティスト名で検索できます。最新バージョンのみが表示され、編集はできません。
        </p>
      </header>

      <form className="grid gap-3 rounded-xl border border-border bg-card/80 p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)_auto]" onSubmit={onSubmit}>
        <label className="text-sm text-foreground">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            曲名
          </span>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            {...form.register('title')}
          />
        </label>
        <label className="text-sm text-foreground">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            アーティスト
          </span>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            {...form.register('artist')}
          />
        </label>
        <label className="text-sm text-foreground">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            作成者
          </span>
          <input
            type="text"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            {...form.register('author')}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-md bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
          >
            検索
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
            onClick={handleReset}
          >
            条件クリア
          </button>
        </div>
      </form>

      {isLoading && <p className="text-muted-foreground">公開歌詞を読み込み中です…</p>}

      {showEmptyState && (
        <div className="rounded-xl border border-dashed border-border bg-card/80 p-6 text-center text-sm text-muted-foreground">
          条件にマッチする公開歌詞が見つかりませんでした。
        </div>
      )}

      {lyrics && lyrics.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lyrics.map((lyric: LyricDocument) => (
            <li
              key={lyric.docId}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="truncate text-lg font-semibold">{lyric.title}</h2>
                  <p className="text-xs text-muted-foreground">{lyric.artist || 'アーティスト未設定'}</p>
                  <p className="text-xs text-muted-foreground">
                    作成者: {lyric.ownerName?.trim() || '不明'}
                  </p>
                </div>
                <span className="inline-flex min-h-8 items-center whitespace-nowrap rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground">
                  公開中
                </span>
              </div>
              <p className="wrap-anywhere whitespace-pre-line text-sm text-muted-foreground line-clamp-5">
                {lyric.text}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/public/${lyric.docId}`}
                  className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  公開ビューで見る
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
