import { useEffect, useRef } from 'react';

interface UseSmoothLyricScrollOptions {
  lineElementsRef: React.RefObject<HTMLElement[] | null>;
  progress: number;
  isPlaying: boolean;
}

/**
 * 歌詞の滑らかなスクロールを管理するカスタムフック
 *
 * 行変更時の離散的なscrollIntoViewではなく、
 * 進行度に基づいてwindow.scrollToで連続的にスクロールすることで
 * ページ全体の滑らかなスクロールを実現する。
 */
export const useSmoothLyricScroll = ({
  lineElementsRef,
  progress,
  isPlaying,
}: UseSmoothLyricScrollOptions) => {
  // 行の位置をキャッシュ（getBoundingClientRect取得を最小化）
  const linePositionsRef = useRef<number[]>([]);
  const baseScrollYRef = useRef(0);

  // 再生開始時に行の位置をキャッシュ
  useEffect(() => {
    if (!isPlaying) return;

    const lines = lineElementsRef.current;
    if (!lines || lines.length === 0) return;

    // 現在のスクロール位置を基準として保存
    baseScrollYRef.current = window.scrollY;

    // 各行のページ内での絶対位置を計算
    linePositionsRef.current = lines.map((line) => {
      const rect = line.getBoundingClientRect();
      return rect.top + window.scrollY;
    });
  }, [isPlaying, lineElementsRef]);

  // スクロール位置を更新
  useEffect(() => {
    if (!isPlaying) return;

    const positions = linePositionsRef.current;
    if (positions.length === 0) return;

    const totalLines = positions.length;
    const absolute = progress * totalLines;
    const lineIndex = Math.min(Math.floor(absolute), totalLines - 1);
    const lineProgress = absolute - lineIndex;

    // 現在の行と次の行の位置を取得
    const currentTop = positions[lineIndex] ?? 0;
    const nextTop = positions[Math.min(lineIndex + 1, totalLines - 1)] ?? currentTop;

    // 行間を線形補間してスクロール位置を計算
    const interpolatedTop = currentTop + (nextTop - currentTop) * lineProgress;

    // 画面の上部から少し下に配置するためのオフセット（ビューポートの1/3）
    const viewportOffset = window.innerHeight / 3;

    // 目標のスクロール位置
    const targetScrollY = Math.max(0, interpolatedTop - viewportOffset);

    // スムーズなスクロール更新
    window.scrollTo({
      top: targetScrollY,
      behavior: 'instant', // 毎フレーム更新するのでinstantで直接設定
    });
  }, [isPlaying, progress]);
};
