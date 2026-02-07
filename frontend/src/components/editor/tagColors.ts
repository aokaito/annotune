// アノテーションタグごとの配色を定義し、表示用クラスを返す。
import type { AnnotationTag, EffectTag, VoiceQualityTag } from '../../types';

// エフェクト用の色パレット
export const effectPalette: Record<EffectTag, string> = {
  vibrato: 'bg-amber-100 text-amber-900 border-amber-300',
  scoop: 'bg-orange-100 text-orange-900 border-orange-300',
  fall: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  breath: 'bg-sky-100 text-sky-900 border-sky-300'
};

// 声質用の色パレット
export const voiceQualityPalette: Record<VoiceQualityTag, string> = {
  whisper: 'bg-purple-100 text-purple-900 border-purple-300',
  edge: 'bg-rose-100 text-rose-900 border-rose-300',
  falsetto: 'bg-indigo-100 text-indigo-900 border-indigo-300'
};

// 汎用タグパレット（後方互換性のため）
export const tagPalette: Record<AnnotationTag, string> = {
  ...effectPalette,
  ...voiceQualityPalette,
  comment: 'bg-slate-100 text-slate-800 border-slate-300'
};

export const getTagStyle = (tag: AnnotationTag) =>
  tagPalette[tag] ?? 'bg-slate-100 text-slate-800 border-slate-300';

// ハイライト用パレット
const effectHighlightPalette: Record<EffectTag, string> = {
  vibrato: 'bg-amber-100 text-amber-950 border-amber-500',
  scoop: 'bg-orange-100 text-orange-950 border-orange-500',
  fall: 'bg-yellow-100 text-yellow-950 border-yellow-500',
  breath: 'bg-sky-100 text-sky-950 border-sky-500'
};

const voiceQualityHighlightPalette: Record<VoiceQualityTag, string> = {
  whisper: 'bg-purple-100 text-purple-950 border-purple-500',
  edge: 'bg-rose-100 text-rose-950 border-rose-500',
  falsetto: 'bg-indigo-100 text-indigo-950 border-indigo-500'
};

const tagHighlightPalette: Record<AnnotationTag, string> = {
  ...effectHighlightPalette,
  ...voiceQualityHighlightPalette,
  comment: 'bg-slate-100 text-slate-900 border-slate-500'
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
export const presetEffects: { id: EffectTag | 'none'; label: string }[] = [
  { id: 'vibrato', label: 'ビブラート' },
  { id: 'scoop', label: 'しゃくり' },
  { id: 'fall', label: 'フォール' },
  { id: 'breath', label: 'ブレス' },
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
