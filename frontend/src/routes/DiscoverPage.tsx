import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
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
    <section className="space-y-4 sm:space-y-6">
      <header className="space-y-1 sm:space-y-2">
        <h1 className="text-xl font-semibold sm:text-2xl md:text-3xl">公開歌詞ライブラリ</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          他のユーザーが公開した歌詞を検索できます
        </p>
      </header>

      <form
        className="space-y-3 rounded-xl border border-border bg-card/80 p-3 sm:p-4"
        onSubmit={onSubmit}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              曲名
            </span>
            <input
              type="text"
              placeholder="例: 夜に駆ける"
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...form.register('title')}
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              アーティスト
            </span>
            <input
              type="text"
              placeholder="例: YOASOBI"
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...form.register('artist')}
            />
          </label>
          <label className="text-sm text-foreground">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              作成者
            </span>
            <input
              type="text"
              placeholder="例: ユーザー名"
              className="min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              {...form.register('author')}
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 min-h-11 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90 sm:flex-none"
          >
            検索
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border px-4 text-sm text-muted-foreground transition hover:text-foreground"
            onClick={handleReset}
          >
            クリア
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          読み込み中...
        </div>
      )}

      {showEmptyState && (
        <div className="rounded-xl border border-dashed border-border bg-card/80 p-6 text-center text-sm text-muted-foreground">
          条件にマッチする公開歌詞が見つかりませんでした
        </div>
      )}

      {lyrics && lyrics.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {lyrics.map((lyric: LyricDocument) => (
            <li
              key={lyric.docId}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md sm:gap-3 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold sm:text-lg">{lyric.title}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {lyric.artist || 'アーティスト未設定'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    by {lyric.ownerName?.trim() || '不明'}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground sm:px-3 sm:py-1 sm:text-xs">
                  公開中
                </span>
              </div>
              <Link
                to={`/public/lyrics/${lyric.docId}`}
                className="mt-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="表示する"
                title="表示する"
              >
                <Eye size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
