// 歌詞本文とアノテーションを分割表示し、タグに応じた装飾を行う。
// NOTE: 横スクロール防止とタイポグラフィ改善のため wrap-anywhere を適用。代替案: prose クラスを用いても良いが装飾制御を優先
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Annotation } from '../../types';
import { getTagStyle } from './tagColors';

interface LyricDisplayProps {
  text: string;
  annotations: Annotation[];
  className?: string;
  framed?: boolean;
  showTagIndicators?: boolean;
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
  breath: '●'
};

const getTagSymbol = (tag: string) => tagSymbolMap[tag] ?? '★';
const expandLineBreaks = (value: string) => value.replace(/\n/g, '\n\n');

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
  ({ text, annotations, className, framed = true, showTagIndicators = false }, ref) => {
    const segments = buildSegments(text, annotations);
    const containerClass = clsx(
      'overflow-x-auto whitespace-pre rounded-lg font-medium leading-relaxed text-foreground',
      framed && 'border border-border bg-card p-6 shadow-sm',
      className
    );

    return (
      <div className={containerClass} ref={ref}>
        {segments.map((segment, index) => {
          const displayText = expandLineBreaks(segment.text);
          if (!segment.annotation) {
            return <span key={`plain-${index}`}>{displayText}</span>;
          }
          const style = getTagStyle(segment.annotation.tag);
          const comment = segment.annotation.comment?.trim();
          return (
            <span
              key={segment.annotation.annotationId}
              className="inline-flex flex-col items-start gap-1"
              title={comment || segment.annotation.tag}
            >
              <span className={`rounded px-1 underline decoration-2 ${style}`}>{displayText}</span>
              {comment && (
                <p className="text-sm text-muted-foreground whitespace-pre-line wrap-anywhere">
                  {comment}
                </p>
              )}
              {showTagIndicators && (
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {getTagSymbol(segment.annotation.tag)}
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  }
);

LyricDisplay.displayName = 'LyricDisplay';
