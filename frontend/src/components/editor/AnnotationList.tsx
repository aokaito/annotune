// 注釈の一覧をカード表示し、編集・削除操作を提供する。
// NOTE: モバイルでの折返しとタップ領域確保のためレイアウトを調整。代替案: テーブル表示に切り替えることも可能
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
        <li key={annotation.annotationId} className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {/* タグ名と位置情報をまとめて表示 */}
            <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getTagStyle(annotation.tag)} wrap-anywhere`}>
              {annotation.tag}
              <span className="font-mono text-[11px] text-muted-foreground">
                {annotation.start} – {annotation.end}
              </span>
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                className="inline-flex min-h-11 items-center rounded border border-border px-3 text-sm text-muted-foreground transition hover:text-foreground"
                onClick={() => onEdit(annotation)}
              >
                {/* ダイアログを開いて編集 */}
                編集
              </button>
              <button
                className="inline-flex min-h-11 items-center rounded border border-red-200 bg-card px-3 text-sm text-red-600 transition hover:bg-red-50"
                onClick={() => onDelete(annotation.annotationId)}
              >
                {/* 即削除。バックエンドでも所有者チェックあり */}
                削除
              </button>
            </div>
          </div>
          {annotation.comment && (
            <p className="text-sm text-muted-foreground whitespace-pre-line wrap-anywhere">{annotation.comment}</p>
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
