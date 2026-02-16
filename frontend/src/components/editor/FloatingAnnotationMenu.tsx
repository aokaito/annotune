// 選択範囲のアノテーション追加モーダル
import { useState } from 'react';
import clsx from 'clsx';
import type { AnnotationProps, EffectTag, VoiceQualityTag } from '../../types';
import { presetEffects, presetVoiceQualities } from './tagColors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../ui/dialog';

interface FloatingAnnotationMenuProps {
  selection: { start: number; end: number; text: string };
  onSubmit: (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  open: boolean;
}

export const FloatingAnnotationMenu = ({
  selection,
  onSubmit,
  onCancel,
  isSubmitting,
  open
}: FloatingAnnotationMenuProps) => {
  const [selectedEffect, setSelectedEffect] = useState<EffectTag | null>(null);
  const [selectedVoiceQuality, setSelectedVoiceQuality] = useState<VoiceQualityTag | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onCancel();
      // リセット
      setSelectedEffect(null);
      setSelectedVoiceQuality(null);
      setComment('');
      setShowCommentInput(false);
    }
  };

  // エフェクトのみ（noneを除く）
  const effects = presetEffects.filter((e): e is typeof e & { id: EffectTag } => e.id !== 'none');
  const voiceQualities = presetVoiceQualities.filter((v): v is typeof v & { id: VoiceQualityTag } => v.id !== 'none');

  // 何か選択されているか
  const hasSelection = selectedEffect !== null || selectedVoiceQuality !== null || comment.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton>
        {/* ヘッダー */}
        <DialogHeader>
          <DialogTitle className="pr-8">
            「{selection.text.slice(0, 20)}{selection.text.length > 20 ? '...' : ''}」
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* エフェクト */}
          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">
              エフェクト
            </span>
            <div className="grid grid-cols-2 gap-2">
              {effects.map((effect) => (
                <button
                  key={effect.id}
                  type="button"
                  onClick={() => setSelectedEffect(selectedEffect === effect.id ? null : effect.id)}
                  className={clsx(
                    'flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition',
                    selectedEffect === effect.id
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-2'
                      : 'border-border text-foreground hover:bg-muted'
                  )}
                >
                  {effect.symbol && <span className="text-base">{effect.symbol}</span>}
                  <span>{effect.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 声質 */}
          <div>
            <span className="mb-2 block text-xs font-medium text-muted-foreground">
              声質
            </span>
            <div className="grid grid-cols-3 gap-2">
              {voiceQualities.map((vq) => (
                <button
                  key={vq.id}
                  type="button"
                  onClick={() => setSelectedVoiceQuality(selectedVoiceQuality === vq.id ? null : vq.id)}
                  className={clsx(
                    'flex min-h-11 items-center justify-center rounded-xl border px-2 py-2 text-sm font-medium transition',
                    selectedVoiceQuality === vq.id
                      ? 'ring-2 ring-offset-2'
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
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowCommentInput(true)}
                className="w-full min-h-10 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground"
              >
                + コメントを追加
              </button>
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              キャンセル
            </button>
            <button
              type="button"
              disabled={!hasSelection || isSubmitting}
              onClick={handleSubmit}
              className={clsx(
                'flex-1 min-h-11 rounded-xl px-4 py-2 text-sm font-semibold transition',
                hasSelection
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
                isSubmitting && 'opacity-50'
              )}
            >
              {isSubmitting ? '追加中...' : '追加'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
