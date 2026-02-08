// 選択範囲の近くに表示されるフローティングメニュー
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { AnnotationProps, EffectTag, VoiceQualityTag } from '../../types';
import { presetEffects, presetVoiceQualities } from './tagColors';

interface FloatingAnnotationMenuProps {
  selection: { start: number; end: number; text: string };
  clickPosition: { x: number; y: number } | null;
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

export const FloatingAnnotationMenu = ({
  selection,
  clickPosition,
  onSubmit,
  onCancel,
  isSubmitting
}: FloatingAnnotationMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedEffect, setSelectedEffect] = useState<EffectTag | null>(null);
  const [selectedVoiceQuality, setSelectedVoiceQuality] = useState<VoiceQualityTag | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  // メニュー位置を計算（クリック位置の右側）
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (!clickPosition || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // クリック位置の右側に表示
    let top = clickPosition.y - 20;
    let left = clickPosition.x + 20;

    // 右端からはみ出す場合は左側に表示
    if (left + menuRect.width > viewportWidth - 16) {
      left = clickPosition.x - menuRect.width - 20;
    }

    // さらに左端からもはみ出す場合は下に表示
    if (left < 16) {
      left = 16;
      top = clickPosition.y + 20;
    }

    // 下端からはみ出す場合は上にずらす
    if (top + menuRect.height > viewportHeight - 16) {
      top = Math.max(16, viewportHeight - menuRect.height - 16);
    }

    // 上端からはみ出す場合
    if (top < 16) {
      top = 16;
    }

    setPosition({ top, left });
  }, [clickPosition]);

  const handleSubmit = async () => {
    // エフェクトか声質のどちらかが選択されている必要がある（コメントのみも可）
    const tag = selectedEffect ?? selectedVoiceQuality ?? 'comment';

    const payload = {
      start: selection.start,
      end: selection.end,
      tag,
      comment: comment.trim() || undefined,
      props: selectedVoiceQuality ? { voiceQuality: selectedVoiceQuality } : undefined
    };

    await onSubmit(payload);

    // リセット
    setSelectedEffect(null);
    setSelectedVoiceQuality(null);
    setComment('');
    setShowCommentInput(false);
  };

  // エフェクトのみ（noneを除く）
  const effects = presetEffects.filter((e): e is typeof e & { id: EffectTag } => e.id !== 'none');
  const voiceQualities = presetVoiceQualities.filter((v): v is typeof v & { id: VoiceQualityTag } => v.id !== 'none');

  // 何か選択されているか
  const hasSelection = selectedEffect !== null || selectedVoiceQuality !== null || comment.trim() !== '';

  return (
    <div
      ref={menuRef}
      className={clsx(
        'fixed z-50 flex flex-col rounded-xl border border-border bg-card shadow-xl',
        'animate-in fade-in-0 slide-in-from-left-2 duration-150'
      )}
      style={{ top: position.top, left: position.left, minWidth: 260, maxWidth: 300 }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          「{selection.text.slice(0, 15)}{selection.text.length > 15 ? '...' : ''}」
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

      <div className="p-3 space-y-3">
        {/* エフェクト */}
        <div>
          <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
            エフェクト
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {effects.map((effect) => (
              <button
                key={effect.id}
                type="button"
                onClick={() => setSelectedEffect(selectedEffect === effect.id ? null : effect.id)}
                className={clsx(
                  'flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition',
                  selectedEffect === effect.id
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1'
                    : 'border-border text-foreground hover:bg-muted'
                )}
              >
                {effect.symbol && <span>{effect.symbol}</span>}
                <span>{effect.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 声質 */}
        <div>
          <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
            声質
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {voiceQualities.map((vq) => (
              <button
                key={vq.id}
                type="button"
                onClick={() => setSelectedVoiceQuality(selectedVoiceQuality === vq.id ? null : vq.id)}
                className={clsx(
                  'flex min-h-10 items-center justify-center rounded-lg border px-2 py-2 text-xs font-medium transition',
                  selectedVoiceQuality === vq.id
                    ? 'ring-2 ring-offset-1'
                    : '',
                  vq.id === 'whisper' && (selectedVoiceQuality === vq.id
                    ? 'border-purple-500 bg-purple-100 text-purple-700 ring-purple-500'
                    : 'border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100'),
                  vq.id === 'edge' && (selectedVoiceQuality === vq.id
                    ? 'border-rose-500 bg-rose-100 text-rose-700 ring-rose-500'
                    : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'),
                  vq.id === 'falsetto' && (selectedVoiceQuality === vq.id
                    ? 'border-indigo-500 bg-indigo-100 text-indigo-700 ring-indigo-500'
                    : 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100')
                )}
              >
                {vq.label}
              </button>
            ))}
          </div>
        </div>

        {/* コメント */}
        <div>
          {showCommentInput ? (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="コメントを入力（任意）"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowCommentInput(true)}
              className="w-full min-h-9 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground"
            >
              + コメントを追加
            </button>
          )}
        </div>

        {/* 追加ボタン */}
        <button
          type="button"
          disabled={!hasSelection || isSubmitting}
          onClick={handleSubmit}
          className={clsx(
            'w-full min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition',
            hasSelection
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
            isSubmitting && 'opacity-50'
          )}
        >
          {isSubmitting ? '追加中...' : 'アノテーションを追加'}
        </button>
      </div>
    </div>
  );
};
