// タップ選択モード対応の歌詞表示コンポーネント
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import type { Annotation, AnnotationProps, VoiceQualityTag } from '../../types';
import { getTagHighlightStyle, getTagLabel, getVoiceQualityLabel } from './tagColors';
import { FloatingAnnotationMenu } from './FloatingAnnotationMenu';

interface SelectableLyricDisplayProps {
  text: string;
  annotations: Annotation[];
  className?: string;
  onAddAnnotation: (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => Promise<void>;
  onSelectAnnotation?: (annotation: Annotation) => void;
  isSubmitting: boolean;
}

interface SelectionState {
  mode: 'idle' | 'selecting' | 'selected';
  startIndex: number | null;
  endIndex: number | null;
}

// エフェクト用シンボル
const effectSymbolMap: Record<string, string> = {
  vibrato: '〰',
  scoop: '↗',
  fall: '↘',
  breath: '●'
};

// エフェクト用のシンボル色
const effectSymbolColorMap: Record<string, string> = {
  vibrato: 'text-amber-600',
  scoop: 'text-orange-600',
  fall: 'text-yellow-600',
  breath: 'text-sky-600'
};

// 声質用のハイライト色
const voiceQualityHighlightMap: Record<VoiceQualityTag, string> = {
  whisper: 'bg-purple-100 text-purple-950',
  edge: 'bg-rose-100 text-rose-950',
  falsetto: 'bg-indigo-100 text-indigo-950'
};

// 声質の凡例用の色
const voiceQualityLegendColors: { id: VoiceQualityTag; label: string; colorClass: string }[] = [
  { id: 'whisper', label: 'ウィスパー', colorClass: 'bg-purple-200 border-purple-400' },
  { id: 'edge', label: 'エッジ', colorClass: 'bg-rose-200 border-rose-400' },
  { id: 'falsetto', label: '裏声', colorClass: 'bg-indigo-200 border-indigo-400' }
];

const getEffectSymbol = (tag: string) => effectSymbolMap[tag] ?? '';
const getEffectSymbolColor = (tag: string) => effectSymbolColorMap[tag] ?? 'text-slate-600';

const getAnnotationStyle = (annotation: Annotation) => {
  const voiceQuality = annotation.props?.voiceQuality;
  if (voiceQuality && voiceQualityHighlightMap[voiceQuality]) {
    return voiceQualityHighlightMap[voiceQuality];
  }
  return getTagHighlightStyle(annotation.tag);
};

// 文字がどのアノテーションに属するか判定
const getAnnotationForIndex = (index: number, annotations: Annotation[]): Annotation | null => {
  for (const annotation of annotations) {
    if (index >= annotation.start && index < annotation.end) {
      return annotation;
    }
  }
  return null;
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

export const SelectableLyricDisplay = ({
  text,
  annotations,
  className,
  onAddAnnotation,
  onSelectAnnotation,
  isSubmitting
}: SelectableLyricDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    mode: 'idle',
    startIndex: null,
    endIndex: null
  });
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  // 選択範囲を計算（開始・終了の順序を正規化）
  const selectionRange = useMemo(() => {
    if (selectionState.startIndex === null) return null;
    if (selectionState.mode === 'selecting') {
      return { start: selectionState.startIndex, end: selectionState.startIndex + 1 };
    }
    if (selectionState.endIndex === null) return null;
    const start = Math.min(selectionState.startIndex, selectionState.endIndex);
    const end = Math.max(selectionState.startIndex, selectionState.endIndex) + 1;
    return { start, end };
  }, [selectionState.startIndex, selectionState.endIndex, selectionState.mode]);

  // 文字がハイライトされるべきか
  const isInSelectionRange = (index: number) => {
    if (!selectionRange) return false;
    return index >= selectionRange.start && index < selectionRange.end;
  };


  // ESCキーで選択解除
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectionState({ mode: 'idle', startIndex: null, endIndex: null });
        setClickPosition(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 状態変更を監視
  useEffect(() => {
    console.log('=== STATE CHANGED ===');
    console.log('selectionState:', selectionState);
    console.log('selectionRange:', selectionRange);
    console.log('clickPosition:', clickPosition);
  }, [selectionState, selectionRange, clickPosition]);

  // 文字クリック時の処理
  const handleCharClick = (index: number, annotation: Annotation | null, event?: React.MouseEvent) => {
    // 既存アノテーションをクリックした場合は編集ダイアログを開く
    if (annotation && selectionState.mode === 'idle' && onSelectAnnotation) {
      onSelectAnnotation(annotation);
      return;
    }

    if (selectionState.mode === 'idle') {
      // 選択開始
      console.log('Setting selecting mode, index:', index);
      setSelectionState({ mode: 'selecting', startIndex: index, endIndex: null });
    } else if (selectionState.mode === 'selecting') {
      // 選択確定 - クリック位置を保存
      console.log('Setting selected mode, index:', index, 'event:', event);
      if (event) {
        setClickPosition({ x: event.clientX, y: event.clientY });
      }
      setSelectionState((prev) => ({
        mode: 'selected',
        startIndex: prev.startIndex,
        endIndex: index
      }));
    }
  };

  // アノテーション追加完了
  const handleSubmit = async (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    await onAddAnnotation(payload);
    setSelectionState({ mode: 'idle', startIndex: null, endIndex: null });
    setClickPosition(null);
  };

  // 選択キャンセル
  const handleCancel = () => {
    setSelectionState({ mode: 'idle', startIndex: null, endIndex: null });
    setClickPosition(null);
  };

  // 声質が使われているかチェック
  const hasVoiceQuality = annotations.some((a) => a.props?.voiceQuality);

  // 文字ごとにレンダリング
  const renderCharacters = () => {
    const chars = text.split('');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < chars.length) {
      const char = chars[i];
      const annotation = getAnnotationForIndex(i, annotations);

      if (char === '\n') {
        // 改行
        elements.push(<br key={`br-${i}`} />);
        i++;
        continue;
      }

      // アノテーション付きの範囲を一括でレンダリング
      if (annotation) {
        const annotationChars: string[] = [];
        const startI = i;
        while (i < annotation.end && i < chars.length) {
          if (chars[i] === '\n') break;
          annotationChars.push(chars[i]);
          i++;
        }

        const style = getAnnotationStyle(annotation);
        const effectSymbol = getEffectSymbol(annotation.tag);
        const tagLabel = getTagLabel(annotation.tag);
        const voiceQuality = annotation.props?.voiceQuality;
        const voiceQualityLabel = voiceQuality ? getVoiceQualityLabel(voiceQuality) : '';
        const comment = annotation.comment?.trim();
        const tooltipParts = [tagLabel, voiceQualityLabel, comment].filter(Boolean);
        const tooltipText = tooltipParts.join(' / ');

        elements.push(
          <span
            key={`ann-${startI}`}
            className={clsx(
              'relative inline cursor-pointer rounded-sm border-b-4 px-0.5 transition-all',
              style,
              'hover:opacity-80'
            )}
            title={tooltipText}
            onClick={() => {
              if (selectionState.mode === 'idle' && onSelectAnnotation) {
                onSelectAnnotation(annotation);
              }
            }}
          >
            {annotationChars.map((c, idx) => {
              const charIndex = startI + idx;
              const isCharInRange = isInSelectionRange(charIndex);
              const isCharStart = selectionState.startIndex === charIndex && selectionState.mode === 'selecting';
              return (
                <span
                  key={`${startI}-${idx}`}
                  data-char-index={charIndex}
                  onClick={(e) => {
                    if (selectionState.mode !== 'idle') {
                      e.stopPropagation();
                      handleCharClick(charIndex, null, e);
                    }
                  }}
                  className={clsx(
                    selectionState.mode !== 'idle' && 'cursor-pointer',
                    isCharInRange && 'bg-blue-400/60 text-blue-900',
                    isCharStart && 'bg-blue-500 text-white rounded'
                  )}
                >
                  {c}
                </span>
              );
            })}
            {effectSymbol && (
              <span
                className={clsx(
                  'ml-0.5 inline-flex select-none items-center text-sm font-bold',
                  getEffectSymbolColor(annotation.tag)
                )}
                aria-hidden
              >
                {effectSymbol}
              </span>
            )}
          </span>
        );
        continue;
      }

      // 通常の文字
      const isStartChar = selectionState.startIndex === i;
      const isEndChar = selectionState.endIndex === i;
      const isInRange = isInSelectionRange(i);

      // 選択された文字のデバッグ
      if (isStartChar || isInRange) {
        console.log(`Char ${i}: isStartChar=${isStartChar}, isInRange=${isInRange}, mode=${selectionState.mode}`);
      }

      const charClassName = clsx(
        'cursor-pointer transition-all duration-100',
        // 選択範囲内
        isInRange && 'bg-blue-300 text-blue-900',
        // 開始位置（選択中モードで開始点のみの場合）
        isStartChar && selectionState.mode === 'selecting' && 'bg-blue-500 text-white rounded px-0.5',
        // 開始位置（範囲選択済み）
        isStartChar && selectionState.mode === 'selected' && 'rounded-l bg-blue-400',
        // 終了位置
        isEndChar && selectionState.mode === 'selected' && 'rounded-r bg-blue-400',
        // ホバー
        !isInRange && !isStartChar && 'hover:bg-blue-100'
      );

      if (isStartChar || isInRange) {
        console.log(`Char ${i} className:`, charClassName);
      }

      elements.push(
        <span
          key={`char-${i}`}
          data-char-index={i}
          onClick={(e) => handleCharClick(i, null, e)}
          className={charClassName}
        >
          {char}
        </span>
      );
      i++;
    }

    return elements;
  };

  return (
    <>
      <div
        ref={containerRef}
        className={clsx(
          'overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-card p-4 font-medium leading-loose text-foreground shadow-sm sm:p-6',
          'select-none',
          className
        )}
      >
        {/* 操作ガイド */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={clsx(
              'rounded px-2 py-1 font-medium',
              selectionState.mode === 'idle' && 'bg-muted text-muted-foreground',
              selectionState.mode === 'selecting' && 'bg-blue-100 text-blue-700',
              selectionState.mode === 'selected' && 'bg-green-100 text-green-700'
            )}
          >
            {selectionState.mode === 'idle' && '歌詞をタップして選択開始'}
            {selectionState.mode === 'selecting' && '終了位置をタップしてください'}
            {selectionState.mode === 'selected' && '右のパレットからアノテーションを追加'}
          </span>
          {selectionState.mode !== 'idle' && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded bg-red-100 px-2 py-1 text-red-600 transition hover:bg-red-200"
            >
              キャンセル
            </button>
          )}
        </div>

        {/* 声質凡例 */}
        {hasVoiceQuality && <VoiceQualityLegend />}

        {/* 歌詞本体 */}
        <div className="text-base leading-loose sm:text-lg">{renderCharacters()}</div>
      </div>

      {/* フローティングメニュー */}
      {selectionState.mode === 'selected' && selectionRange && (
        <FloatingAnnotationMenu
          selection={{
            start: selectionRange.start,
            end: selectionRange.end,
            text: text.slice(selectionRange.start, selectionRange.end)
          }}
          clickPosition={clickPosition}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      )}
    </>
  );
};
