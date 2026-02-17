// 歌詞本文とアノテーションを分割表示し、タグに応じた装飾を行う。
// NOTE: 横スクロール防止とタイポグラフィ改善のため wrap-anywhere を適用。代替案: prose クラスを用いても良いが装飾制御を優先
import clsx from 'clsx';
import { forwardRef } from 'react';
import { Annotation, VoiceQualityTag } from '../../types';
import { getTagLabel, getVoiceQualityLabel } from './tagColors';

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

// エフェクト用のシンボル色（ダークテーマ対応）
const effectSymbolColorMap: Record<string, string> = {
  vibrato: 'text-amber-300 bg-amber-500/20',
  scoop: 'text-orange-300 bg-orange-500/20',
  fall: 'text-yellow-300 bg-yellow-500/20',
  breath: 'text-sky-300 bg-sky-500/20'
};

// 声質用のハイライト色（歌詞の背景色として使用）（ダークテーマ対応）
const voiceQualityHighlightMap: Record<VoiceQualityTag, string> = {
  whisper: 'bg-purple-500/30 text-purple-100 border-purple-400',
  edge: 'bg-rose-500/30 text-rose-100 border-rose-400',
  falsetto: 'bg-indigo-500/30 text-indigo-100 border-indigo-400'
};

// 声質の凡例用の色（ダークテーマ対応）
const voiceQualityLegendColors: { id: VoiceQualityTag; label: string; colorClass: string }[] = [
  { id: 'whisper', label: 'ウィスパー', colorClass: 'bg-purple-500/30 border-purple-400' },
  { id: 'edge', label: 'エッジ', colorClass: 'bg-rose-500/30 border-rose-400' },
  { id: 'falsetto', label: '裏声', colorClass: 'bg-indigo-500/30 border-indigo-400' }
];

const getEffectSymbol = (tag: string) => effectSymbolMap[tag] ?? '';
const getEffectSymbolColor = (tag: string) => effectSymbolColorMap[tag] ?? 'text-slate-600 bg-slate-100';

// 声質がある場合は声質の色でハイライト、エフェクトのみの場合はハイライトしない
const getAnnotationStyle = (annotation: Annotation) => {
  const voiceQuality = annotation.props?.voiceQuality;
  if (voiceQuality && voiceQualityHighlightMap[voiceQuality]) {
    return voiceQualityHighlightMap[voiceQuality];
  }
  // エフェクトのみの場合はハイライトしない（記号のみ表示）
  return '';
};

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

// 声質の凡例コンポーネント
const VoiceQualityLegend = () => (
  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
    <span className="font-medium">声質:</span>
    {voiceQualityLegendColors.map((item) => (
      <span key={item.id} className="flex items-center gap-1.5">
        <span className={clsx('inline-block h-3 w-3 rounded border', item.colorClass)} />
        <span>{item.label}</span>
      </span>
    ))}
  </div>
);

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

    // 声質が使われているかチェック
    const hasVoiceQuality = annotations.some((a) => a.props?.voiceQuality);

    const renderAnnotatedSegment = (segment: Segment, key: string | number) => {
      const displayText = segment.text;
      const annotation = segment.annotation;
      if (!annotation) {
        return <span key={key}>{displayText}</span>;
      }
      // 声質優先でスタイルを取得
      const style = getAnnotationStyle(annotation);
      const effectSymbol = getEffectSymbol(annotation.tag);
      const tagLabel = getTagLabel(annotation.tag);
      const voiceQuality = annotation.props?.voiceQuality;
      const voiceQualityLabel = voiceQuality ? getVoiceQualityLabel(voiceQuality) : '';
      const comment = annotation.comment?.trim();
      // ツールチップにはエフェクトと声質の両方を表示
      const tooltipParts = [tagLabel, voiceQualityLabel, comment].filter(Boolean);
      const tooltipText = tooltipParts.join(' / ');
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
          <span className={clsx('rounded-sm px-1', style && 'border-b-4', style)}>{displayText}</span>
          {/* エフェクトの記号のみ表示（声質は色のみ） */}
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
      <div className={containerClass}>
        {/* 声質が使われている場合のみ凡例を表示 */}
        {showTagIndicators && hasVoiceQuality && <VoiceQualityLegend />}
        {/* refは歌詞本体のみに設定（選択位置計算のため凡例を除外） */}
        <div ref={ref}>
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
      </div>
    );
  }
);

LyricDisplay.displayName = 'LyricDisplay';
