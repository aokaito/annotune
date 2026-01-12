// アノテーションタグごとの配色を定義し、表示用クラスを返す。
import type { AnnotationTag } from '../../types';

export const tagPalette: Record<AnnotationTag, string> = {
  vibrato: 'bg-amber-100 text-amber-900 border-amber-300',
  scoop: 'bg-orange-100 text-orange-900 border-orange-300',
  fall: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  slide: 'bg-stone-100 text-stone-800 border-stone-300',
  hold: 'bg-amber-200 text-amber-900 border-amber-400',
  breath: 'bg-amber-50 text-stone-600 border-amber-200',
  comment: 'bg-slate-100 text-slate-800 border-slate-300'
};

export const getTagStyle = (tag: AnnotationTag) =>
  tagPalette[tag] ?? 'bg-amber-100 text-amber-900 border-amber-300';

const tagHighlightPalette: Record<AnnotationTag, string> = {
  vibrato: 'bg-amber-100 text-amber-950 border-amber-500',
  scoop: 'bg-orange-100 text-orange-950 border-orange-500',
  fall: 'bg-yellow-100 text-yellow-950 border-yellow-500',
  slide: 'bg-stone-100 text-stone-900 border-stone-500',
  hold: 'bg-amber-200 text-amber-950 border-amber-600',
  breath: 'bg-amber-50 text-stone-700 border-amber-400',
  comment: 'bg-slate-100 text-slate-900 border-slate-500'
};

export const getTagHighlightStyle = (tag: AnnotationTag) =>
  tagHighlightPalette[tag] ?? 'bg-amber-100 text-amber-950 border-amber-500';

const tagLabelMap: Record<AnnotationTag, string> = {
  vibrato: 'ビブラート',
  scoop: 'しゃくり',
  fall: 'フォール',
  slide: 'スライド',
  hold: 'ホールド',
  breath: 'ブレス',
  comment: 'コメントのみ'
};

export const getTagLabel = (tag: AnnotationTag) => tagLabelMap[tag] ?? tag;

export const presetTags: { id: AnnotationTag; label: string }[] = [
  { id: 'vibrato', label: 'ビブラート' },
  { id: 'scoop', label: 'しゃくり' },
  { id: 'fall', label: 'フォール' },
  { id: 'slide', label: 'スライド' },
  { id: 'hold', label: 'ホールド' },
  { id: 'breath', label: 'ブレス' },
  { id: 'comment', label: 'コメントのみ' }
];
