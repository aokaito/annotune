// 編集画面用のアノテーション操作ガイド＆凡例コンポーネント
import clsx from 'clsx';
import type { EffectTag, VoiceQualityTag } from '../../types';

// エフェクトの凡例データ
const effectLegendItems: {
  id: EffectTag;
  label: string;
  symbol: string;
  colorClass: string;
}[] = [
  { id: 'vibrato', label: 'ビブラート', symbol: '〰', colorClass: 'text-amber-300 bg-amber-500/20 border-amber-500/50' },
  { id: 'scoop', label: 'しゃくり', symbol: '↗', colorClass: 'text-orange-300 bg-orange-500/20 border-orange-500/50' },
  { id: 'fall', label: 'フォール', symbol: '↘', colorClass: 'text-yellow-300 bg-yellow-500/20 border-yellow-500/50' },
  { id: 'breath', label: 'ブレス', symbol: '●', colorClass: 'text-sky-300 bg-sky-500/20 border-sky-500/50' }
];

// 声質の凡例データ
const voiceQualityLegendItems: {
  id: VoiceQualityTag;
  label: string;
  colorClass: string;
}[] = [
  { id: 'whisper', label: 'ウィスパー', colorClass: 'bg-purple-500/30 border-purple-400' },
  { id: 'edge', label: 'エッジ', colorClass: 'bg-rose-500/30 border-rose-400' },
  { id: 'falsetto', label: '裏声', colorClass: 'bg-indigo-500/30 border-indigo-400' }
];

export const EditorAnnotationGuide = () => {
  return (
    <div className="mb-4 space-y-3 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
      {/* エフェクト凡例 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-semibold text-muted-foreground">エフェクト:</span>
        {effectLegendItems.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <span
              className={clsx(
                'inline-flex h-5 w-5 items-center justify-center rounded border text-sm font-bold',
                item.colorClass
              )}
            >
              {item.symbol}
            </span>
            <span className="text-muted-foreground">{item.label}</span>
          </span>
        ))}
      </div>

      {/* 声質凡例 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-semibold text-muted-foreground">声質:</span>
        {voiceQualityLegendItems.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <span className={clsx('inline-block h-3 w-6 rounded border', item.colorClass)} />
            <span className="text-muted-foreground">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
