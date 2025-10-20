// バックエンドで一意な ID を生成するユーティリティ。
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

export const nanoid = (size = 16): string => {
  let id = '';
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj?.getRandomValues) {
    // ブラウザの暗号化 API を利用して高品質な乱数を取得
    const values = new Uint32Array(size);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < size; i += 1) {
      id += alphabet[values[i] % alphabet.length];
    }
    return id;
  }
  // 暗号化 API が使えない環境では Math.random() を使用
  for (let i = 0; i < size; i += 1) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return id;
};
