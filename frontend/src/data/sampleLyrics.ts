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
  title: 'きらきら星',
  artist: 'Annotune Demo',
  text: `きらきら光る 夜空の星よ
まばたきしては みんなを見てる
高い山から 谷底までも
優しい光で 照らしてる`
};

export const LP_SAMPLE_ANNOTATIONS: Annotation[] = [
  {
    annotationId: 'lp-demo-1',
    authorId: 'demo',
    start: 16,
    end: 22,
    tag: 'vibrato',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    annotationId: 'lp-demo-2',
    authorId: 'demo',
    start: 23,
    end: 35,
    tag: 'fall',
    comment: '力を抜いて優しく歌う',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
