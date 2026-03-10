// デモモード用のサンプル歌詞データ
export const SAMPLE_LYRICS = {
  title: 'きらきら星',
  artist: 'Annotune Demo',
  text: `きらきら光る 夜空の星よ
まばたきしては みんなを見てる

高い山から 谷底までも
優しい光で 照らしてる

小さな声で 歌を歌えば
星も一緒に 踊り出す

あなたの夢を 見守りながら
今夜もそっと 輝いてる`
};

// LP用の短いサンプル歌詞（アノテーション付き）
import type { Annotation } from '../types';

export const LP_SAMPLE_LYRICS = {
  title: '夜に駆ける',
  artist: 'YOASOBI',
  text: `沈むように 溶けてゆくように
二人だけの空が広がる夜に
さよならだけだった その一言で
全てが分かった`
};

export const LP_SAMPLE_ANNOTATIONS: Annotation[] = [
  {
    annotationId: 'lp-demo-1',
    authorId: 'demo',
    start: 0,
    end: 5,
    tag: 'vibrato',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    annotationId: 'lp-demo-2',
    authorId: 'demo',
    start: 7,
    end: 14,
    tag: 'scoop',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    annotationId: 'lp-demo-3',
    authorId: 'demo',
    start: 15,
    end: 26,
    tag: 'comment',
    comment: 'ここで息継ぎ、次のフレーズに備える',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
