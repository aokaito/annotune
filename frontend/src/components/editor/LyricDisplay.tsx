// 歌詞本文とアノテーションを分割表示し、タグに応じた装飾を行う。
import { Annotation } from '../../types';
import { getTagStyle } from './tagColors';

interface LyricDisplayProps {
  text: string;
  annotations: Annotation[];
}

interface Segment {
  text: string;
  annotation?: Annotation;
}

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

export const LyricDisplay = ({ text, annotations }: LyricDisplayProps) => {
  const segments = buildSegments(text, annotations);

  return (
    <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-6 font-medium text-foreground shadow-sm">
      {segments.map((segment, index) => {
        if (!segment.annotation) {
          // アノテーションが付いていない部分はそのまま表示
          return <span key={`plain-${index}`}>{segment.text}</span>;
        }
        const style = getTagStyle(segment.annotation.tag);
        return (
          <span
            key={segment.annotation.annotationId}
            className={`rounded px-1 underline decoration-2 ${style}`}
            title={segment.annotation.comment ?? segment.annotation.tag}
          >
            {/* タグ付きの範囲は色付き背景と下線で強調 */}
            {segment.text}
          </span>
        );
      })}
    </div>
  );
};
