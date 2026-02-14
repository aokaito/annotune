// ホームページ：認証状態に応じてLandingPageまたはDashboardPageを表示
import { useAnnotuneApi } from '../hooks/useAnnotuneApi';
import { DashboardPage } from './DashboardPage';
import { LandingPage } from './LandingPage';

export const HomePage = () => {
  const { mode, isAuthenticated } = useAnnotuneApi();

  // HTTPモードで未認証の場合はランディングページを表示
  if (mode === 'http' && !isAuthenticated) {
    return <LandingPage />;
  }

  // 認証済み or デモモードの場合はダッシュボードを表示
  return <DashboardPage />;
};
