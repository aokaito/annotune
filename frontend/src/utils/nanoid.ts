// ランダムな英数字 ID を生成するユーティリティ（Crypto API 優先）。
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export const nanoid = (size = 12): string => {
  let id = '';
  const cryptoObj = globalThis.crypto || undefined;
  if (cryptoObj && 'getRandomValues' in cryptoObj) {
    // ブラウザの暗号化 API を利用した高品質な乱数
    const randomValues = new Uint32Array(size);
    cryptoObj.getRandomValues(randomValues);
    for (let i = 0; i < size; i += 1) {
      id += alphabet[randomValues[i] % alphabet.length];
    }
    return id;
  }
  // Crypto API 非対応環境では Math.random にフォールバック
  for (let i = 0; i < size; i += 1) {
    const idx = Math.floor(Math.random() * alphabet.length);
    id += alphabet[idx];
  }
  return id;
};
