// 閲覧画面用のコンパクトなアノテーション凡例コンポーネント
import clsx from 'clsx';
import type { Annotation, EffectTag, VoiceQualityTag } from '../../types';

// エフェクトの凡例データ
const effectLegendItems: {
  id: EffectTag;
  label: string;
  symbol: string;
  colorClass: string;
}[] = [
  { id: 'vibrato', label: 'ビブラート', symbol: '〰', colorClass: 'text-amber-300' },
  { id: 'scoop', label: 'しゃくり', symbol: '↗', colorClass: 'text-orange-300' },
  { id: 'fall', label: 'フォール', symbol: '↘', colorClass: 'text-yellow-300' },
  { id: 'breath', label: 'ブレス', symbol: '●', colorClass: 'text-sky-300' }
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

// エフェクトタグのリスト
const effectTags: EffectTag[] = ['vibrato', 'scoop', 'fall', 'breath'];

interface ViewerAnnotationLegendProps {
  annotations: Annotation[];
}

export const ViewerAnnotationLegend = ({ annotations }: ViewerAnnotationLegendProps) => {
  // 使用されているエフェクトと声質をチェック
  const usedEffects = new Set<EffectTag>();
  const usedVoiceQualities = new Set<VoiceQualityTag>();

  annotations.forEach((a) => {
    if (effectTags.includes(a.tag as EffectTag)) {
      usedEffects.add(a.tag as EffectTag);
    }
    if (a.props?.voiceQuality) {
      usedVoiceQualities.add(a.props.voiceQuality);
    }
  });

  const hasEffects = usedEffects.size > 0;
  const hasVoiceQualities = usedVoiceQualities.size > 0;

  // 何も使われていなければ表示しない
  if (!hasEffects && !hasVoiceQualities) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {/* エフェクト凡例（使用されているもののみ） */}
      {hasEffects && (
        <>
          {effectLegendItems
            .filter((item) => usedEffects.has(item.id))
            .map((item) => (
              <span key={item.id} className="flex items-center gap-1">
                <span className={clsx('font-bold', item.colorClass)}>{item.symbol}</span>
                <span>{item.label}</span>
              </span>
            ))}
        </>
      )}

      {/* 区切り */}
      {hasEffects && hasVoiceQualities && (
        <span className="text-muted-foreground/30">|</span>
      )}

      {/* 声質凡例（使用されているもののみ） */}
      {hasVoiceQualities && (
        <>
          {voiceQualityLegendItems
            .filter((item) => usedVoiceQualities.has(item.id))
            .map((item) => (
              <span key={item.id} className="flex items-center gap-1">
                <span className={clsx('inline-block h-2.5 w-4 rounded border', item.colorClass)} />
                <span>{item.label}</span>
              </span>
            ))}
        </>
      )}
    </div>
  );
};
