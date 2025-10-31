// NOTE: 主要画面のビューポート差分をスモークテスト。代替案: Percy 等でビジュアルリグレッションを取ることも可能
import { test, expect, Page } from '@playwright/test';

const expectNoHorizontalScroll = async (page: Page) => {
  const hasOverflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth > 1;
  });
  expect(hasOverflow, 'ページが横スクロール無しで収まること').toBeFalsy();
};

test.describe('Responsive smoke checks', () => {
  test('Dashboard layout responds to viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'あなたの歌詞ノート' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    const menuButton = page.getByRole('button', { name: 'メニューを開く' });
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.getByRole('dialog')).toContainText('ダッシュボード');
    } else {
      await expect(page.getByRole('link', { name: 'ダッシュボード' })).toBeVisible();
    }

    const createButton = page.getByRole('button', { name: '新規ドキュメント' });
    await expect(createButton).toBeEnabled();
  });

  test('Editor layout keeps annotations accessible', async ({ page }) => {
    await page.goto('/editor/demo-doc');
    await expect(page.getByRole('heading', { name: 'レンダリング例' })).toBeVisible();
    await expectNoHorizontalScroll(page);

    const addAnnotationButton = page.getByRole('button', { name: 'アノテーションを追加' });
    if (await addAnnotationButton.isVisible()) {
      await addAnnotationButton.click();
      await expect(page.getByRole('heading', { name: 'アノテーションを追加' })).toBeVisible();
    } else {
      await expect(page.locator('aside').filter({ hasText: 'アノテーションパレット' })).toBeVisible();
    }
  });

  test('Public view remains readable', async ({ page }) => {
    await page.goto('/public/demo-doc');
    await expect(page.getByRole('heading', { name: /公開ビュー/ })).toBeVisible();
    await expectNoHorizontalScroll(page);
    await expect(page.locator('article')).toContainText('アノテーション一覧');
  });
});
