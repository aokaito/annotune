// 画面上部に固定表示するナビゲーションヘッダー。
import { Link, NavLink } from 'react-router-dom';

const navClasses = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

export const Header = () => (
  <header className="border-b border-border bg-card/80 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      {/* ロゴ兼ホームリンク */}
      <Link to="/" className="text-xl font-semibold text-foreground">
        Annotune
      </Link>
      <nav className="flex items-center gap-2">
        {/* 主要画面への遷移リンク */}
        <NavLink to="/" className={navClasses} end>
          ダッシュボード
        </NavLink>
        <NavLink to="/versions/demo" className={navClasses}>
          履歴
        </NavLink>
        <a
          className="rounded-md px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground"
          href={import.meta.env.VITE_COGNITO_LOGIN_URL || '#'}
        >
          {/* Cognito Hosted UI のサインイン画面へ遷移 */}
          サインイン
        </a>
      </nav>
    </div>
  </header>
);
