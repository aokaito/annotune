// このモジュールは pino を使った構造化ロガーのインスタンスを提供する。
import pino from 'pino';

// 環境変数 LOG_LEVEL があればそれを使い、なければ 'info' をデフォルトにする
const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level: logLevel,
  // エラーオブジェクト全体をログに出力するための設定
  errorKey: 'err'
});
