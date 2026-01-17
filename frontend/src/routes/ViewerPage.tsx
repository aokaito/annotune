// 認証済みユーザー向けの閲覧ページ。非公開状態でも所有者は注釈付きで確認できる。
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLyric } from '../hooks/useLyrics';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import { LyricDisplay } from '../components/editor/LyricDisplay';

export const ViewerPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric, isLoading } = useLyric(docId);
  const { mode, isAuthenticated } = useAnnotuneApi();
  const requiresSignIn = mode === 'http' && !isAuthenticated;

  const lyricDisplayRef = useRef<HTMLDivElement | null>(null);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | undefined>(undefined);
  const [containerHeight, setContainerHeight] = useState(0);
  const progressRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const annotationPositionsRef = useRef<{ id: string; top: number; bottom: number }[]>([]);
  const containerTopRef = useRef(0);
  const lastScrollRef = useRef(0);
  const activeAnnotationRef = useRef<string | undefined>(undefined);

  const lyricText = lyric?.text ?? '';
  const lyricId = lyric?.docId ?? '';
  const annotationCount = lyric?.annotations.length ?? 0;

  const totalBeats = useMemo(
    () => Math.max(1, lyricText.split('\n').length),
    [lyricText]
  );
  const duration = useMemo(() => (60 / bpm) * totalBeats, [bpm, totalBeats]);

  const setProgressValue = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };

  useEffect(() => {
    durationRef.current = duration;
    if (isPlaying && startTimeRef.current !== null) {
      startTimeRef.current = performance.now() - progressRef.current * duration * 1000;
    }
  }, [duration, isPlaying]);

  useEffect(() => {
    setProgressValue(0);
    setActiveAnnotationId(undefined);
    activeAnnotationRef.current = undefined;
    startTimeRef.current = null;
  }, [lyricId]);

  useEffect(() => {
    if (!lyric) return;
    const updateLayout = () => {
      const container = lyricDisplayRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      containerTopRef.current = containerRect.top + window.scrollY;
      setContainerHeight(container.scrollHeight);
      const nodes = Array.from(
        container.querySelectorAll<HTMLElement>('[data-annotation-id]')
      );
      annotationPositionsRef.current = nodes
        .map((node) => {
          const id = node.dataset.annotationId;
          if (!id) return null;
          const rect = node.getBoundingClientRect();
          return {
            id,
            top: rect.top - containerRect.top,
            bottom: rect.bottom - containerRect.top
          };
        })
        .filter((item): item is { id: string; top: number; bottom: number } => !!item);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => {
      window.removeEventListener('resize', updateLayout);
    };
  }, [lyric, lyricText, annotationCount]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = null;
      return;
    }

    const tick = (now: number) => {
      const durationSeconds = durationRef.current || 0.01;
      if (startTimeRef.current === null) {
        startTimeRef.current = now - progressRef.current * durationSeconds * 1000;
      }
      const elapsedSeconds = (now - startTimeRef.current) / 1000;
      const nextProgress = Math.min(1, elapsedSeconds / durationSeconds);
      setProgressValue(nextProgress);

      const height = containerHeight || 0;
      const currentY = nextProgress * height;
      const active = annotationPositionsRef.current.find(
        (item) => currentY >= item.top && currentY <= item.bottom
      );
      if (active?.id !== activeAnnotationRef.current) {
        activeAnnotationRef.current = active?.id;
        setActiveAnnotationId(active?.id);
      }

      if (now - lastScrollRef.current > 120 && height > 0) {
        const targetTop = Math.max(0, containerTopRef.current + currentY - window.innerHeight * 0.35);
        window.scrollTo({ top: targetTop, behavior: 'auto' });
        lastScrollRef.current = now;
      }

      if (nextProgress >= 1) {
        setIsPlaying(false);
        return;
      }
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = null;
    };
  }, [isPlaying, containerHeight]);

  const handleToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (progressRef.current >= 1) {
      setProgressValue(0);
      activeAnnotationRef.current = undefined;
      setActiveAnnotationId(undefined);
      startTimeRef.current = null;
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgressValue(0);
    setActiveAnnotationId(undefined);
    activeAnnotationRef.current = undefined;
    startTimeRef.current = null;
  };

  const barOffset = containerHeight * progress;

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
      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card/70 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">BPM</span>
            <input
              type="number"
              min={40}
              max={240}
              step={1}
              className="w-24 rounded-md border border-border bg-card px-2 py-1 text-sm"
              value={bpm}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setBpm(Math.min(240, Math.max(40, next)));
              }}
            />
          </label>
          <span className="text-xs text-muted-foreground">
            1行=1拍として進行
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            onClick={handleToggle}
          >
            {isPlaying ? '一時停止' : '再生'}
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            onClick={handleReset}
          >
            リセット
          </button>
          <span className="text-xs text-muted-foreground">
            進行 {Math.round(progress * 100)}%
          </span>
        </div>
      </section>
      <div className="relative">
        <LyricDisplay
          ref={lyricDisplayRef}
          text={lyric.text}
          annotations={lyric.annotations}
          framed={false}
          showTagIndicators
          showComments
          activeAnnotationId={activeAnnotationId}
          className="rounded-lg border border-border bg-card/80 p-6 shadow-inner"
        />
        <div
          className="pointer-events-none absolute left-0 right-0 top-0"
          style={{ transform: `translateY(${barOffset}px)` }}
          aria-hidden
        >
          <div className="h-0.5 w-full bg-primary/70 shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
        </div>
      </div>
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
