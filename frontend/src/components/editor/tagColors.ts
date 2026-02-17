// アノテーションタグごとの配色を定義し、表示用クラスを返す。
import type { AnnotationTag, EffectTag, VoiceQualityTag } from '../../types';

// エフェクト用の色パレット（ダークテーマ対応）
export const effectPalette: Record<EffectTag, string> = {
  vibrato: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
  scoop: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  fall: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  breath: 'bg-sky-500/20 text-sky-300 border-sky-500/50'
};

// 声質用の色パレット（ダークテーマ対応）
export const voiceQualityPalette: Record<VoiceQualityTag, string> = {
  whisper: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  edge: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
  falsetto: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
};

// 汎用タグパレット（後方互換性のため）
export const tagPalette: Record<AnnotationTag, string> = {
  ...effectPalette,
  ...voiceQualityPalette,
  comment: 'bg-stone-500/20 text-stone-300 border-stone-500/50'
};

export const getTagStyle = (tag: AnnotationTag) =>
  tagPalette[tag] ?? 'bg-slate-100 text-slate-800 border-slate-300';

// ハイライト用パレット（ダークテーマ対応）
const effectHighlightPalette: Record<EffectTag, string> = {
  vibrato: 'bg-amber-500/30 text-amber-200 border-amber-400',
  scoop: 'bg-orange-500/30 text-orange-200 border-orange-400',
  fall: 'bg-yellow-500/30 text-yellow-200 border-yellow-400',
  breath: 'bg-sky-500/30 text-sky-200 border-sky-400'
};

const voiceQualityHighlightPalette: Record<VoiceQualityTag, string> = {
  whisper: 'bg-purple-500/30 text-purple-200 border-purple-400',
  edge: 'bg-rose-500/30 text-rose-200 border-rose-400',
  falsetto: 'bg-indigo-500/30 text-indigo-200 border-indigo-400'
};

const tagHighlightPalette: Record<AnnotationTag, string> = {
  ...effectHighlightPalette,
  ...voiceQualityHighlightPalette,
  comment: 'bg-stone-500/30 text-stone-200 border-stone-400'
};

export const getTagHighlightStyle = (tag: AnnotationTag) =>
  tagHighlightPalette[tag] ?? 'bg-slate-100 text-slate-900 border-slate-500';

// ラベルマップ
const effectLabelMap: Record<EffectTag, string> = {
  vibrato: 'ビブラート',
  scoop: 'しゃくり',
  fall: 'フォール',
  breath: 'ブレス'
};

const voiceQualityLabelMap: Record<VoiceQualityTag, string> = {
  whisper: 'ウィスパー',
  edge: 'エッジ',
  falsetto: '裏声'
};

const tagLabelMap: Record<AnnotationTag, string> = {
  ...effectLabelMap,
  ...voiceQualityLabelMap,
  comment: 'コメントのみ'
};

export const getTagLabel = (tag: AnnotationTag) => tagLabelMap[tag] ?? tag;
export const getEffectLabel = (effect: EffectTag) => effectLabelMap[effect];
export const getVoiceQualityLabel = (voiceQuality: VoiceQualityTag) => voiceQualityLabelMap[voiceQuality];

// プリセットエフェクト
export const presetEffects: { id: EffectTag | 'none'; label: string; symbol?: string }[] = [
  { id: 'vibrato', label: 'ビブラート', symbol: '〰' },
  { id: 'scoop', label: 'しゃくり', symbol: '↗' },
  { id: 'fall', label: 'フォール', symbol: '↘' },
  { id: 'breath', label: 'ブレス', symbol: '●' },
  { id: 'none', label: '付与しない' }
];

// プリセット声質
export const presetVoiceQualities: { id: VoiceQualityTag | 'none'; label: string }[] = [
  { id: 'whisper', label: 'ウィスパー' },
  { id: 'edge', label: 'エッジ' },
  { id: 'falsetto', label: '裏声' },
  { id: 'none', label: '付与しない' }
];

// 後方互換性のためのpresetTags（非推奨）
export const presetTags: { id: AnnotationTag; label: string }[] = [
  { id: 'vibrato', label: 'ビブラート' },
  { id: 'scoop', label: 'しゃくり' },
  { id: 'fall', label: 'フォール' },
  { id: 'breath', label: 'ブレス' },
  { id: 'whisper', label: 'ウィスパー' },
  { id: 'edge', label: 'エッジ' },
  { id: 'falsetto', label: '裏声' },
  { id: 'comment', label: 'コメントのみ' }
];
