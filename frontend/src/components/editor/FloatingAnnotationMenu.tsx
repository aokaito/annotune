// 選択範囲の近くに表示されるフローティングメニュー
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { AnnotationProps, VoiceQualityTag } from '../../types';
import { presetEffects, presetVoiceQualities } from './tagColors';

interface FloatingAnnotationMenuProps {
  selection: { start: number; end: number; text: string };
  anchorRect: DOMRect | null;
  onSubmit: (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

type MenuStep = 'main' | 'comment';

export const FloatingAnnotationMenu = ({
  selection,
  anchorRect,
  onSubmit,
  onCancel,
  isSubmitting
}: FloatingAnnotationMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<MenuStep>('main');
  const [pendingTag, setPendingTag] = useState<{ tag: string; voiceQuality?: VoiceQualityTag } | null>(null);
  const [comment, setComment] = useState('');

  // メニュー位置を計算
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRect || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 選択範囲の下に表示、画面外なら上に
    let top = anchorRect.bottom + 8;
    let left = anchorRect.left + anchorRect.width / 2 - menuRect.width / 2;

    // 右端からはみ出す場合
    if (left + menuRect.width > viewportWidth - 16) {
      left = viewportWidth - menuRect.width - 16;
    }
    // 左端からはみ出す場合
    if (left < 16) {
      left = 16;
    }
    // 下端からはみ出す場合は上に表示
    if (top + menuRect.height > viewportHeight - 16) {
      top = anchorRect.top - menuRect.height - 8;
    }

    setPosition({ top, left });
  }, [anchorRect]);

  const handleQuickAdd = async (tag: string, voiceQuality?: VoiceQualityTag) => {
    await onSubmit({
      start: selection.start,
      end: selection.end,
      tag,
      props: voiceQuality ? { voiceQuality } : undefined
    });
  };

  const handleAddWithComment = (tag: string, voiceQuality?: VoiceQualityTag) => {
    setPendingTag({ tag, voiceQuality });
    setStep('comment');
  };

  const handleSubmitComment = async () => {
    if (!pendingTag) return;
    await onSubmit({
      start: selection.start,
      end: selection.end,
      tag: pendingTag.tag,
      comment: comment.trim() || undefined,
      props: pendingTag.voiceQuality ? { voiceQuality: pendingTag.voiceQuality } : undefined
    });
    setComment('');
    setPendingTag(null);
    setStep('main');
  };

  // エフェクトのみ（声質除外、noneを除く）
  const effects = presetEffects.filter((e): e is typeof e & { id: Exclude<typeof e.id, 'none'> } => e.id !== 'none');
  const voiceQualities = presetVoiceQualities.filter((v): v is typeof v & { id: VoiceQualityTag } => v.id !== 'none');

  return (
    <div
      ref={menuRef}
      className={clsx(
        'fixed z-50 flex flex-col rounded-xl border border-border bg-card shadow-xl',
        'animate-in fade-in-0 zoom-in-95 duration-150'
      )}
      style={{ top: position.top, left: position.left, minWidth: 280 }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {step === 'main' ? `「${selection.text.slice(0, 10)}${selection.text.length > 10 ? '...' : ''}」` : 'コメント追加'}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted"
          aria-label="キャンセル"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {step === 'main' && (
        <div className="p-2">
          {/* エフェクト */}
          <div className="mb-2">
            <span className="mb-1.5 block px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              エフェクト
            </span>
            <div className="grid grid-cols-2 gap-1">
              {effects.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickAdd(effect.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleAddWithComment(effect.id);
                  }}
                  className="flex min-h-10 items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  {effect.symbol && <span className="mr-1.5">{effect.symbol}</span>}
                  {effect.label.replace('付与しない', '')}
                </button>
              ))}
            </div>
          </div>

          {/* 声質 */}
          <div className="mb-2">
            <span className="mb-1.5 block px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              声質
            </span>
            <div className="grid grid-cols-3 gap-1">
              {voiceQualities.map((vq) => (
                <button
                  key={vq.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleQuickAdd(vq.id, vq.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleAddWithComment(vq.id, vq.id);
                  }}
                  className={clsx(
                    'flex min-h-10 items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium transition disabled:opacity-50',
                    vq.id === 'whisper' && 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100',
                    vq.id === 'edge' && 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100',
                    vq.id === 'falsetto' && 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  )}
                >
                  {vq.label.replace('付与しない', '')}
                </button>
              ))}
            </div>
          </div>

          {/* コメントのみ追加 */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleAddWithComment('comment')}
            className="flex w-full min-h-10 items-center justify-center rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
          >
            コメントのみ追加
          </button>

          <p className="mt-2 px-1 text-[10px] text-muted-foreground">
            長押しでコメント付きで追加
          </p>
        </div>
      )}

      {step === 'comment' && (
        <div className="p-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメントを入力（任意）"
            rows={3}
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('main');
                setPendingTag(null);
                setComment('');
              }}
              className="flex-1 min-h-10 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              戻る
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitComment}
              className="flex-1 min-h-10 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? '追加中...' : '追加'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
