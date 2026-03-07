// 認証済みユーザー向けの閲覧ページ。非公開状態でも所有者は注釈付きで確認できる。
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLyric } from '../hooks/useLyrics';
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import { LyricDisplay } from '../components/editor/LyricDisplay';
import { useSmoothLyricScroll } from '../hooks/useSmoothLyricScroll';

export const ViewerPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric, isLoading } = useLyric(docId);
  const { mode, isAuthenticated } = useAnnotuneApi();
  const requiresSignIn = mode === 'http' && !isAuthenticated;

  const lyricDisplayRef = useRef<HTMLDivElement | null>(null);
  const [speed, setSpeed] = useState(10); // 1-20の20段階、デフォルト10
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const lineElementsRef = useRef<HTMLElement[]>([]);
  const currentLineRef = useRef(0);

  // 滑らかなスクロールフック（ページ全体をスクロール）
  useSmoothLyricScroll({
    lineElementsRef,
    progress,
    isPlaying,
  });

  const lyricText = lyric?.text ?? '';
  const lyricId = lyric?.docId ?? '';

  const lineMeta = useMemo(() => {
    const lines = lyricText.split('\n');
    let cursor = 0;
    return lines.map((line, index) => {
      const start = cursor;
      const end = start + line.length;
      if (index < lines.length - 1) {
        cursor = end + 1;
      }
      return { start, end, length: line.length };
    });
  }, [lyricText]);
  const totalBeats = Math.max(1, lineMeta.length);
  // スピード10 = BPM 30 相当として、speed * 3 でBPMを算出
  const bpm = useMemo(() => speed * 3, [speed]);
  const duration = useMemo(() => (60 / bpm) * totalBeats, [bpm, totalBeats]);

  const setProgressValue = (value: number) => {
    progressRef.current = value;
    setProgress(value);
  };

  const getLinePosition = (progressValue: number) => {
    const totalLines = Math.max(1, lineMeta.length);
    const absolute = progressValue * totalLines;
    if (absolute >= totalLines) {
      return { lineIndex: totalLines - 1, lineProgress: 1 };
    }
    if (absolute <= 0) {
      return { lineIndex: 0, lineProgress: 0 };
    }
    const lineIndex = Math.floor(absolute);
    return { lineIndex, lineProgress: absolute - lineIndex };
  };

  useEffect(() => {
    durationRef.current = duration;
    if (isPlaying && startTimeRef.current !== null) {
      startTimeRef.current = performance.now() - progressRef.current * duration * 1000;
    }
  }, [duration, isPlaying]);

  useEffect(() => {
    setProgressValue(0);
    currentLineRef.current = 0;
    startTimeRef.current = null;
  }, [lyricId]);

  useEffect(() => {
    if (!lyric) return;
    const container = lyricDisplayRef.current;
    if (!container) return;
    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>('[data-line-index]')
    );
    lineElementsRef.current = nodes;
  }, [lyric, lyricText]);

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

      const { lineIndex } = getLinePosition(nextProgress);
      currentLineRef.current = lineIndex;

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
  }, [isPlaying, lineMeta]);

  const handleToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (progressRef.current >= 1) {
      setProgressValue(0);
      startTimeRef.current = null;
    }
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgressValue(0);
    currentLineRef.current = 0;
    startTimeRef.current = null;
  };

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
    <>
    <article className="space-y-6 rounded-2xl border border-border bg-card/90 px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-secondary sm:text-sm">
          {lyric.isPublicView ? '公開中' : '非公開'}
        </p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{lyric.title}</h1>
        <p className="text-sm text-muted-foreground">{lyric.artist || 'アーティスト未設定'}</p>
      </header>
      <section className="space-y-3 rounded-lg border border-border bg-card/70 p-3 text-sm sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-lg text-primary-foreground transition hover:bg-primary/90"
              onClick={handleToggle}
              title={isPlaying ? '停止' : '再生'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
              onClick={handleReset}
              title="リセット"
            >
              ↺
            </button>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold tabular-nums">{Math.round(progress * 100)}%</div>
            <div className="text-[10px] text-muted-foreground sm:text-xs">進行状況</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
          <span className="text-muted-foreground whitespace-nowrap">1（遅い）</span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-24 sm:w-32 accent-primary"
          />
          <span className="text-muted-foreground whitespace-nowrap">20（早い）</span>
          <span className="ml-2 font-medium tabular-nums">
            {speed === 10 ? '10（デフォルト）' : speed}
          </span>
        </div>
      </section>
      <div
        onClick={() => {
          if (isPlaying) {
            setIsPlaying(false);
          }
        }}
      >
        <LyricDisplay
          ref={lyricDisplayRef}
          text={lyric.text}
          annotations={lyric.annotations}
          framed={false}
          showTagIndicators
          renderLines
          showInlineComments
          enlargedFont
          className="rounded-lg border border-border bg-card/80 p-6 shadow-inner"
        />
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
    </>
  );
};
