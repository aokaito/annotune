import { useEffect, useRef } from 'react';

interface UseSmoothLyricScrollOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  lineElementsRef: React.RefObject<HTMLElement[] | null>;
  progress: number;
  isPlaying: boolean;
}

/**
 * 歌詞の滑らかなスクロールを管理するカスタムフック
 *
 * 行変更時の離散的なscrollIntoViewではなく、
 * 進行度に基づいて連続的にscrollTopを更新することで
 * 滑らかなスクロールを実現する。
 */
export const useSmoothLyricScroll = ({
  containerRef,
  lineElementsRef,
  progress,
  isPlaying,
}: UseSmoothLyricScrollOptions) => {
  // 行の位置をキャッシュ（offsetTop取得はレイアウト強制を避けるため）
  const linePositionsRef = useRef<number[]>([]);
  const containerHeightRef = useRef(0);
  const contentHeightRef = useRef(0);

  // 行の位置をキャッシュ
  useEffect(() => {
    const lines = lineElementsRef.current;
    const container = containerRef.current;
    if (!lines || lines.length === 0 || !container) return;

    // 行の offsetTop を一括取得してキャッシュ
    linePositionsRef.current = lines.map((line) => line.offsetTop);
    containerHeightRef.current = container.clientHeight;
    // 最後の行の下端をコンテンツの高さとして計算
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      contentHeightRef.current = lastLine.offsetTop + lastLine.offsetHeight;
    }
  }, [containerRef, lineElementsRef, lineElementsRef.current?.length]);

  // スクロール位置を更新
  useEffect(() => {
    const container = containerRef.current;
    const positions = linePositionsRef.current;
    if (!container || positions.length === 0) return;

    const totalLines = positions.length;
    const absolute = progress * totalLines;
    const lineIndex = Math.min(Math.floor(absolute), totalLines - 1);
    const lineProgress = absolute - lineIndex;

    // 現在の行と次の行の位置を取得
    const currentTop = positions[lineIndex] ?? 0;
    const nextTop = positions[Math.min(lineIndex + 1, totalLines - 1)] ?? currentTop;

    // 行間を線形補間してスクロール位置を計算
    const interpolatedTop = currentTop + (nextTop - currentTop) * lineProgress;

    // コンテナの中央に配置するためのオフセット
    const containerHeight = containerHeightRef.current;
    const centerOffset = containerHeight / 2;

    // 目標のスクロール位置（行を中央に配置）
    const targetScrollTop = Math.max(0, interpolatedTop - centerOffset + 20);

    // スムーズなスクロール更新
    container.scrollTop = targetScrollTop;
  }, [containerRef, progress]);

  // 再生停止時にキャッシュを更新（リサイズ対応）
  useEffect(() => {
    if (isPlaying) return;

    const lines = lineElementsRef.current;
    const container = containerRef.current;
    if (!lines || lines.length === 0 || !container) return;

    linePositionsRef.current = lines.map((line) => line.offsetTop);
    containerHeightRef.current = container.clientHeight;
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      contentHeightRef.current = lastLine.offsetTop + lastLine.offsetHeight;
    }
  }, [containerRef, lineElementsRef, isPlaying]);
};
