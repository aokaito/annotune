// アノテーションタグごとの配色を定義し、表示用クラスを返す。
import type { AnnotationTag } from '../../types';

export const tagPalette: Record<AnnotationTag, string> = {
  vibrato: 'bg-amber-100 text-amber-900 border-amber-300',
  scoop: 'bg-orange-100 text-orange-900 border-orange-300',
  fall: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  slide: 'bg-stone-100 text-stone-800 border-stone-300',
  hold: 'bg-amber-200 text-amber-900 border-amber-400',
  breath: 'bg-amber-50 text-stone-600 border-amber-200'
};

export const getTagStyle = (tag: AnnotationTag) =>
  tagPalette[tag] ?? 'bg-amber-100 text-amber-900 border-amber-300';

export const presetTags: { id: AnnotationTag; label: string }[] = [
  { id: 'vibrato', label: 'Vibrato' },
  { id: 'scoop', label: 'Scoop' },
  { id: 'fall', label: 'Fall' },
  { id: 'slide', label: 'Slide' },
  { id: 'hold', label: 'Hold' },
  { id: 'breath', label: 'Breath' }
];
