// 注釈の一覧をカード表示し、編集・削除操作を提供する。
import { Annotation } from '../../types';
import { getTagStyle } from './tagColors';

interface AnnotationListProps {
  annotations: Annotation[];
  onEdit: (annotation: Annotation) => void;
  onDelete: (annotationId: string) => void;
}

export const AnnotationList = ({ annotations, onEdit, onDelete }: AnnotationListProps) => {
  if (annotations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/70 p-4 text-sm text-muted-foreground">
        まだアノテーションはありません。歌詞の範囲を選択して追加しましょう。
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {annotations.map((annotation) => (
        <li key={annotation.annotationId} className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {/* タグ名と位置情報をまとめて表示 */}
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getTagStyle(annotation.tag)}`}>
              {annotation.tag}
              <span className="font-mono text-[10px] text-muted-foreground">
                {annotation.start} – {annotation.end}
              </span>
            </span>
            <div className="flex gap-2 text-xs">
              <button
                className="rounded border border-border px-2 py-1 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(annotation)}
              >
                {/* ダイアログを開いて編集 */}
                編集
              </button>
              <button
                className="rounded border border-red-200 bg-card px-2 py-1 text-red-600 hover:bg-red-50"
                onClick={() => onDelete(annotation.annotationId)}
              >
                {/* 即削除。バックエンドでも所有者チェックあり */}
                削除
              </button>
            </div>
          </div>
          {annotation.comment && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">
              {annotation.comment}
            </p>
          )}
          {annotation.props && (
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {annotation.props.intensity && (
                <div>
                  {/* 強弱情報 */}
                  <dt className="font-semibold">強さ</dt>
                  <dd>{annotation.props.intensity}</dd>
                </div>
              )}
              {annotation.props.length && (
                <div>
                  {/* 長さ情報 */}
                  <dt className="font-semibold">長さ</dt>
                  <dd>{annotation.props.length}</dd>
                </div>
              )}
            </dl>
          )}
        </li>
      ))}
    </ul>
  );
};
