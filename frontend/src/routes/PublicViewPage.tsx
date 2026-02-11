// 公開リンク用の閲覧専用ページ。認証不要で表示される。
// NOTE: ViewerPageと同じ画面仕様で表示
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePublicLyric } from '../hooks/useLyrics';
import { LyricDisplay } from '../components/editor/LyricDisplay';
import { getTagLabel } from '../components/editor/tagColors';
import type { Annotation } from '../types';

export const PublicViewPage = () => {
  const { docId = '' } = useParams();
  const { data: lyric, isLoading } = usePublicLyric(docId);

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

  if (isLoading) {
    return <p className="text-muted-foreground">公開ページを読み込み中です…</p>;
  }

  if (!lyric || !lyric.isPublicView) {
    // ドキュメントが存在しないか、所有者が公開を停止している場合
    return <p className="text-muted-foreground">このドキュメントは公開されていません。</p>;
  }

  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-border bg-card/90 px-4 py-6 shadow-sm sm:px-8 sm:py-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-secondary sm:text-sm">公開ビュー</p>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{lyric.title}</h1>
        <p className="text-sm text-muted-foreground">{lyric.artist || 'アーティスト未設定'}</p>
        <p className="text-sm text-muted-foreground">
          作成者: {lyric.ownerName?.trim() || '不明'}
        </p>
        <p className="text-sm text-muted-foreground">
          バージョン {lyric.version} ・ 最終更新 {new Date(lyric.updatedAt).toLocaleString()}
        </p>
      </header>
      <section className="space-y-3 rounded-lg border border-border bg-card/70 p-3 text-sm sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex min-h-11 min-w-20 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={handleToggle}
            >
              {isPlaying ? '停止' : '再生'}
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
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">BPM</span>
            <input
              type="number"
              inputMode="numeric"
              min={40}
              max={240}
              step={1}
              className="w-16 min-h-9 rounded-lg border border-border bg-card px-2 py-1 text-center text-sm sm:w-20"
              value={bpm}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setBpm(Math.min(240, Math.max(40, next)));
              }}
            />
          </label>
          <span className="text-muted-foreground">（1行=1拍）</span>
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
        <h2 className="text-lg font-semibold text-foreground sm:text-xl">アノテーション一覧</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {lyric.annotations.map((annotation: Annotation) => (
            <li
              key={annotation.annotationId}
              className="rounded-lg border border-border bg-card/80 p-3 leading-relaxed"
            >
              <p className="text-foreground">
                <span className="font-semibold">{getTagLabel(annotation.tag)}</span> ({annotation.start} – {annotation.end})
              </p>
              <p className="wrap-anywhere">{annotation.comment ?? 'コメントなし'}</p>
            </li>
          ))}
          {lyric.annotations.length === 0 && <li>アノテーションはありません。</li>}
        </ul>
      </section>
    </article>
  );
};
