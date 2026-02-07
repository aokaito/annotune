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
  const progressRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const lineElementsRef = useRef<HTMLElement[]>([]);
  const currentLineRef = useRef(0);
  const activeAnnotationRef = useRef<string | undefined>(undefined);

  const lyricText = lyric?.text ?? '';
  const lyricId = lyric?.docId ?? '';
  const annotations = lyric?.annotations ?? [];

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
    setActiveAnnotationId(undefined);
    activeAnnotationRef.current = undefined;
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
  }, [lyric, lyricText, annotations.length]);

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

      const { lineIndex, lineProgress } = getLinePosition(nextProgress);
      if (lineIndex !== currentLineRef.current) {
        currentLineRef.current = lineIndex;
        const lineElement = lineElementsRef.current[lineIndex];
        if (lineElement) {
          lineElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }

      const lineInfo = lineMeta[lineIndex];
      const lineOffset =
        lineInfo.length === 0
          ? lineInfo.start
          : lineInfo.start + Math.min(lineInfo.length - 1, Math.floor(lineProgress * lineInfo.length));
      const active = annotations.find(
        (annotation) => annotation.start <= lineOffset && annotation.end > lineOffset
      );
      if (active?.annotationId !== activeAnnotationRef.current) {
        activeAnnotationRef.current = active?.annotationId;
        setActiveAnnotationId(active?.annotationId);
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
  }, [isPlaying, lineMeta, annotations]);

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
          showComments
          activeAnnotationId={activeAnnotationId}
          renderLines
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
  );
};
