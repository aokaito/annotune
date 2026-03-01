// 再生中のコメントを画面下部に持続表示するフローティングオーバーレイ
import clsx from 'clsx';

interface CommentBarProps {
  comment: string | null;
  className?: string;
}

export const CommentBar: React.FC<CommentBarProps> = ({ comment, className }) => {
  const hasComment = comment?.trim();

  return (
    <div
      className={clsx(
        'pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex h-[40vh] items-center justify-center bg-black/70 transition-all duration-300',
        hasComment ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <p className="max-w-3xl px-6 text-center text-2xl font-bold leading-relaxed text-white sm:text-3xl md:text-4xl">
        {comment}
      </p>
    </div>
  );
};
