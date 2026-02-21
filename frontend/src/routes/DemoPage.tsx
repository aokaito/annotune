// デモモード：サンプル歌詞でアノテーション操作を体験できるページ
// データはローカル状態のみで管理され、サーバーには保存されない
import { useState } from 'react';
import { SelectableLyricDisplay } from '../components/editor/SelectableLyricDisplay';
import { AnnotationList } from '../components/editor/AnnotationList';
import { AnnotationEditDialog } from '../components/editor/AnnotationEditDialog';
import { DemoBanner } from '../components/DemoBanner';
import { SAMPLE_LYRICS } from '../data/sampleLyrics';
import type { Annotation, AnnotationProps } from '../types';

// デモ用のユニークID生成
const generateDemoId = () => `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const DemoPage = () => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddAnnotation = async (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    setIsSubmitting(true);
    // 少し待ってからアニメーション効果を出す
    await new Promise((resolve) => setTimeout(resolve, 200));

    const newAnnotation: Annotation = {
      annotationId: generateDemoId(),
      authorId: 'demo-user',
      start: payload.start,
      end: payload.end,
      tag: payload.tag as Annotation['tag'],
      comment: payload.comment,
      props: payload.props,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setIsSubmitting(false);
  };

  const handleUpdateAnnotation = async (payload: {
    annotationId: string;
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => {
    setAnnotations((prev) =>
      prev.map((ann) =>
        ann.annotationId === payload.annotationId
          ? {
              ...ann,
              start: payload.start,
              end: payload.end,
              tag: payload.tag as Annotation['tag'],
              comment: payload.comment,
              props: payload.props,
              updatedAt: new Date().toISOString()
            }
          : ann
      )
    );
    setEditing(null);
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.annotationId !== annotationId));
    setEditing(null);
  };

  return (
    <section className="space-y-6">
      <DemoBanner />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          {SAMPLE_LYRICS.title}
        </h1>
        <p className="text-sm text-muted-foreground">{SAMPLE_LYRICS.artist}</p>
      </header>

      <div className="rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">アノテーションを追加してみよう</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          歌詞の文字をタップして選択し、ビブラート・しゃくり・フォール・ブレスなどのテクニック記号やコメントを追加できます。
        </p>
      </div>

      <SelectableLyricDisplay
        text={SAMPLE_LYRICS.text}
        annotations={annotations}
        onAddAnnotation={handleAddAnnotation}
        onSelectAnnotation={(annotation) => setEditing(annotation)}
        isSubmitting={isSubmitting}
      />

      <section className="space-y-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm sm:p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">アノテーション一覧</h2>
          <span className="text-sm text-muted-foreground">
            {annotations.length}件のアノテーション
          </span>
        </header>
        <AnnotationList
          annotations={annotations}
          onEdit={setEditing}
          onDelete={handleDeleteAnnotation}
        />
      </section>

      {editing && (
        <AnnotationEditDialog
          annotation={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdateAnnotation}
          onDelete={handleDeleteAnnotation}
          isSaving={false}
          isDeleting={false}
        />
      )}
    </section>
  );
};
