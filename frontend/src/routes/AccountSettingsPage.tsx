import { useState } from 'react';
import { useAuthStore } from '../store/auth';

export const AccountSettingsPage = () => {
  const displayName = useAuthStore((state) => state.displayName);
  const userId = useAuthStore((state) => state.userId);
  const setDisplayName = useAuthStore((state) => state.setDisplayName);
  const [value, setValue] = useState(displayName);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed) {
      setDisplayName(trimmed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 rounded-2xl border border-border bg-card/80 px-4 py-6 shadow-sm sm:px-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-secondary">アカウント</p>
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">アカウント設定</h1>
        <p className="text-sm text-muted-foreground">アカウント名や ID を確認できます。</p>
      </header>
      <div className="space-y-2 text-sm">
        <p className="text-muted-foreground">アカウント ID</p>
        <p className="rounded-lg border border-border bg-card/60 px-3 py-2 font-mono text-foreground">
          {userId || '-'}
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex flex-col gap-2">
          <span className="font-medium text-foreground">アカウント名</span>
          <input
            type="text"
            className="rounded-md border border-border bg-card px-3 py-2"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="inline-flex min-h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          onClick={handleSave}
          disabled={!value.trim()}
        >
          保存
        </button>
        {saved && <p className="text-xs text-secondary">保存しました。</p>}
      </div>
    </section>
  );
};
