// アプリケーション固有のエラークラスを定義する
// これにより、エラーの種類に応じたハンドリングが可能になる

/**
 * リソースが見つからなかったことを示すエラー
 */
export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
