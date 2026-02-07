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
    <section className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-border bg-card/80 px-4 py-5 shadow-sm sm:space-y-6 sm:px-8 sm:py-6">
      <header className="space-y-1 sm:space-y-2">
        <p className="text-xs uppercase tracking-wide text-secondary">アカウント</p>
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl md:text-3xl">アカウント設定</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">アカウント名や ID を確認できます。</p>
      </header>
      <div className="space-y-1.5 text-sm sm:space-y-2">
        <p className="text-xs text-muted-foreground sm:text-sm">アカウント ID</p>
        <p className="break-all rounded-lg border border-border bg-card/60 px-3 py-2 font-mono text-xs text-foreground sm:text-sm">
          {userId || '-'}
        </p>
      </div>
      <div className="space-y-3 text-sm">
        <label className="flex flex-col gap-1.5 sm:gap-2">
          <span className="font-medium text-foreground">アカウント名</span>
          <input
            type="text"
            className="min-h-11 rounded-lg border border-border bg-card px-3 py-2"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
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
