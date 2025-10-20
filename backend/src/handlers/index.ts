// このファイルは Lambda エントリーポイントで利用しやすいようハンドラを再エクスポートする。
export {
  createLyricHandler,
  listLyricsHandler,
  getLyricHandler,
  updateLyricHandler,
  deleteLyricHandler,
  shareLyricHandler,
  createAnnotationHandler,
  updateAnnotationHandler,
  deleteAnnotationHandler,
  listVersionsHandler,
  getVersionHandler
} from './lyrics';
export { getPublicLyricHandler } from './public';
