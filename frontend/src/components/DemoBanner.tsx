// デモモード用のバナーコンポーネント
import { Link } from 'react-router-dom';

export const DemoBanner = () => {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-col items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm sm:flex-row sm:gap-4"
    >
      <p className="text-center text-amber-100 sm:text-left">
        <span className="mr-2 font-semibold">デモモード</span>
        これはデモです。データは保存されません。保存するにはアカウント登録が必要です。
      </p>
      <Link
        to="/login"
        className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        無料で登録
      </Link>
    </div>
  );
};
