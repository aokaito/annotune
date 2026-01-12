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
  onDeleteAnnotation?: (annotationId: string) => void;
}

interface Segment {
  text: string;
  annotation?: Annotation;
}

const tagSymbolMap: Record<string, string> = {
  vibrato: '〰',
  scoop: '↗',
  fall: '↘',
  slide: '⇄',
  hold: '―',
  breath: '●',
  comment: ''
};

const getTagSymbol = (tag: string) => tagSymbolMap[tag] ?? '★';
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

export const LyricDisplay = forwardRef<HTMLDivElement, LyricDisplayProps>(
  ({ text, annotations, className, framed = true, showTagIndicators = false, onDeleteAnnotation }, ref) => {
    const segments = buildSegments(text, annotations);
    const containerClass = clsx(
      'overflow-x-auto whitespace-pre-wrap rounded-lg font-medium leading-relaxed text-foreground',
      framed && 'border border-border bg-card p-6 shadow-sm',
      className
    );

    return (
      <div className={containerClass} ref={ref}>
        {segments.map((segment, index) => {
          const displayText = segment.text;
          const annotation = segment.annotation;
          if (!annotation) {
            return <span key={`plain-${index}`}>{displayText}</span>;
          }
          const style = getTagHighlightStyle(annotation.tag);
          const tagSymbol = getTagSymbol(annotation.tag);
          const tagLabel = getTagLabel(annotation.tag);
          return (
            <span
              key={annotation.annotationId}
              className="inline"
              title={annotation.comment?.trim() || tagLabel}
            >
              <span className={clsx('rounded-sm px-1 border-b-4', style)}>{displayText}</span>
              {showTagIndicators && tagSymbol && (
                <span className="ml-1 select-none text-[10px] font-semibold text-muted-foreground" aria-hidden>
                  {tagSymbol}
                </span>
              )}
              {onDeleteAnnotation && (
                <button
                  type="button"
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground select-none"
                  aria-label={`${tagLabel}アノテーションを削除`}
                  onClick={() => onDeleteAnnotation(annotation.annotationId)}
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
      </div>
    );
  }
);

LyricDisplay.displayName = 'LyricDisplay';
