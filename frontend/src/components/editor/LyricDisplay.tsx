// 歌詞本文とアノテーションを分割表示し、タグに応じた装飾を行う。
// NOTE: 横スクロール防止とタイポグラフィ改善のため wrap-anywhere を適用。代替案: prose クラスを用いても良いが装飾制御を優先
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Annotation } from '../../types';
import { getTagHighlightStyle, getTagLabel } from './tagColors';

interface LyricDisplayProps {
  text: string;
  annotations: Annotation[];
  className?: string;
  framed?: boolean;
  showTagIndicators?: boolean;
  showComments?: boolean;
  activeAnnotationId?: string;
  renderLines?: boolean;
  onSelectAnnotation?: (annotation: Annotation) => void;
}

interface Segment {
  text: string;
  annotation?: Annotation;
}

// エフェクト用シンボル
const effectSymbolMap: Record<string, string> = {
  vibrato: '〰',
  scoop: '↗',
  fall: '↘',
  breath: '●'
};

// 声質用シンボル
const voiceQualitySymbolMap: Record<string, string> = {
  whisper: '💨',
  edge: '⚡',
  falsetto: '🎵'
};

// エフェクト用の色
const effectSymbolColorMap: Record<string, string> = {
  vibrato: 'text-amber-600 bg-amber-100',
  scoop: 'text-orange-600 bg-orange-100',
  fall: 'text-yellow-600 bg-yellow-100',
  breath: 'text-sky-600 bg-sky-100'
};

// 声質用の色
const voiceQualitySymbolColorMap: Record<string, string> = {
  whisper: 'text-purple-600 bg-purple-100',
  edge: 'text-rose-600 bg-rose-100',
  falsetto: 'text-indigo-600 bg-indigo-100'
};

const getEffectSymbol = (tag: string) => effectSymbolMap[tag] ?? '';
const getVoiceQualitySymbol = (voiceQuality?: string) => voiceQuality ? voiceQualitySymbolMap[voiceQuality] ?? '' : '';
const getEffectSymbolColor = (tag: string) => effectSymbolColorMap[tag] ?? 'text-slate-600 bg-slate-100';
const getVoiceQualitySymbolColor = (voiceQuality: string) => voiceQualitySymbolColorMap[voiceQuality] ?? 'text-slate-600 bg-slate-100';
const buildSegments = (text: string, annotations: Annotation[]): Segment[] => {
  if (annotations.length === 0) {
    return [{ text }];
  }

  const sorted = [...annotations].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  sorted.forEach((annotation) => {
    if (cursor < annotation.start) {
      segments.push({ text: text.slice(cursor, annotation.start) });
    }
    segments.push({ text: text.slice(annotation.start, annotation.end), annotation });
    cursor = annotation.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
};

const buildLineSegments = (text: string, annotations: Annotation[]) => {
  const lines = text.split('\n');
  const segmentsByLine: Segment[][] = [];
  let cursor = 0;

  lines.forEach((line) => {
    const lineStart = cursor;
    const lineEnd = lineStart + line.length;
    const lineSegments: Segment[] = [];
    const overlapping = annotations
      .filter((annotation) => annotation.start < lineEnd && annotation.end > lineStart)
      .sort((a, b) => a.start - b.start);
    let lineCursor = 0;

    overlapping.forEach((annotation) => {
      const segmentStart = Math.max(annotation.start, lineStart) - lineStart;
      const segmentEnd = Math.min(annotation.end, lineEnd) - lineStart;
      if (lineCursor < segmentStart) {
        lineSegments.push({ text: line.slice(lineCursor, segmentStart) });
      }
      lineSegments.push({
        text: line.slice(segmentStart, segmentEnd),
        annotation
      });
      lineCursor = segmentEnd;
    });

    if (lineCursor < line.length) {
      lineSegments.push({ text: line.slice(lineCursor) });
    }

    if (lineSegments.length === 0) {
      lineSegments.push({ text: '' });
    }

    segmentsByLine.push(lineSegments);
    cursor = lineEnd + 1;
  });

  return { lines, segmentsByLine };
};

export const LyricDisplay = forwardRef<HTMLDivElement, LyricDisplayProps>(
  (
    {
      text,
      annotations,
      className,
      framed = true,
      showTagIndicators = false,
      showComments = false,
      activeAnnotationId,
      renderLines = false,
      onSelectAnnotation
    },
    ref
  ) => {
    const segments = buildSegments(text, annotations);
    const lineData = renderLines ? buildLineSegments(text, annotations) : null;
    const containerClass = clsx(
      'overflow-x-auto whitespace-pre-wrap rounded-lg font-medium leading-relaxed text-foreground',
      framed && 'border border-border bg-card p-6 shadow-sm',
      className
    );

    const renderAnnotatedSegment = (segment: Segment, key: string | number) => {
      const displayText = segment.text;
      const annotation = segment.annotation;
      if (!annotation) {
        return <span key={key}>{displayText}</span>;
      }
      const style = getTagHighlightStyle(annotation.tag);
      const effectSymbol = getEffectSymbol(annotation.tag);
      const voiceQuality = annotation.props?.voiceQuality;
      const voiceQualitySymbol = getVoiceQualitySymbol(voiceQuality);
      const tagLabel = getTagLabel(annotation.tag);
      const comment = annotation.comment?.trim();
      const tooltipText = comment || tagLabel;
      const isActive = activeAnnotationId === annotation.annotationId;
      return (
        <span
          key={key}
          className={clsx(
            'relative inline',
            onSelectAnnotation && 'cursor-pointer',
            showComments && 'group'
          )}
          data-annotation-id={annotation.annotationId}
          title={tooltipText}
          onClick={() => {
            if (!onSelectAnnotation) return;
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) return;
            onSelectAnnotation(annotation);
          }}
        >
          <span className={clsx('rounded-sm px-1 border-b-4', style)}>{displayText}</span>
          {showTagIndicators && effectSymbol && (
            <span
              className={clsx(
                'ml-0.5 inline-flex select-none items-center justify-center rounded px-1 text-sm font-bold',
                getEffectSymbolColor(annotation.tag)
              )}
              aria-hidden
            >
              {effectSymbol}
            </span>
          )}
          {showTagIndicators && voiceQualitySymbol && (
            <span
              className={clsx(
                'ml-0.5 inline-flex select-none items-center justify-center rounded px-1 text-sm font-bold',
                getVoiceQualitySymbolColor(voiceQuality!)
              )}
              aria-hidden
            >
              {voiceQualitySymbol}
            </span>
          )}
          {(showComments || isActive) && tooltipText && (
            <span
              className={clsx(
                'absolute left-0 top-full z-10 mt-2 max-w-xs select-none rounded-md border border-border bg-card/95 px-2 py-1 text-xs text-foreground shadow-md',
                showComments && !isActive && 'hidden group-hover:block',
                isActive && 'block'
              )}
            >
              {tooltipText}
            </span>
          )}
        </span>
      );
    };

    return (
      <div className={containerClass} ref={ref}>
        {renderLines && lineData
          ? lineData.segmentsByLine.map((lineSegments, lineIndex) => (
              <div
                key={`line-${lineIndex}`}
                data-line-index={lineIndex}
                className="whitespace-pre-wrap"
              >
                {lineSegments.map((segment, segmentIndex) =>
                  renderAnnotatedSegment(segment, `${lineIndex}-${segmentIndex}`)
                )}
                {lineData.lines[lineIndex].length === 0 && (
                  <span className="inline-block">&nbsp;</span>
                )}
              </div>
            ))
          : segments.map((segment, index) => renderAnnotatedSegment(segment, `plain-${index}`))}
      </div>
    );
  }
);

LyricDisplay.displayName = 'LyricDisplay';
