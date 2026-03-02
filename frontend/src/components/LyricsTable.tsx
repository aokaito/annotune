import { MoreHorizontal, Pencil, Globe, Lock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from './ui/dropdown-menu';
import type { LyricDocument } from '../types';

type LyricsTableProps = {
  lyrics: LyricDocument[];
  variant: 'personal' | 'public';
  onNavigate: (docId: string) => void;
  onEdit?: (docId: string) => void;
  onTogglePublic?: (docId: string, currentIsPublic: boolean) => void;
};

export const LyricsTable = ({
  lyrics,
  variant,
  onNavigate,
  onEdit,
  onTogglePublic
}: LyricsTableProps) => {
  const isPersonal = variant === 'personal';

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border">
      {/* テーブルヘッダー */}
      <div className="hidden border-b border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground sm:flex">
        <div className="flex-1 min-w-0">曲名</div>
        <div className="w-40 shrink-0 hidden md:block">アーティスト</div>
        {isPersonal ? (
          <div className="w-24 shrink-0 text-center">ステータス</div>
        ) : (
          <div className="w-32 shrink-0">作成者</div>
        )}
        {isPersonal && <div className="w-10 shrink-0" />}
      </div>

      {/* テーブル行 */}
      <div className="divide-y divide-border">
        {lyrics.map((lyric) => (
          <div
            key={lyric.docId}
            className="group flex cursor-pointer items-center px-4 py-3 transition-colors hover:bg-muted/50"
            onClick={() => onNavigate(lyric.docId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onNavigate(lyric.docId);
              }
            }}
          >
            {/* 曲名とアーティスト（モバイル: 2行表示、デスクトップ: 別カラム） */}
            <div className="flex-1 min-w-0 pr-2">
              <p className="truncate text-sm font-medium text-foreground sm:text-base">
                {lyric.title}
              </p>
              {/* モバイル: アーティスト + 作成者をサブ行に表示 */}
              <p className="truncate text-xs text-muted-foreground md:hidden">
                {isPersonal
                  ? lyric.artist || 'アーティスト未設定'
                  : `${lyric.artist || 'アーティスト未設定'} · ${lyric.ownerName?.trim() || '不明'}`}
              </p>
            </div>

            {/* アーティスト（デスクトップのみ） */}
            <div className="hidden w-40 shrink-0 truncate text-sm text-muted-foreground md:block">
              {lyric.artist || 'アーティスト未設定'}
            </div>

            {/* ステータス or 作成者 */}
            {isPersonal ? (
              <div className="w-auto sm:w-24 shrink-0 flex justify-center">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium sm:px-2.5 sm:py-1 sm:text-xs ${
                    lyric.isPublicView
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {lyric.isPublicView ? '公開中' : '非公開'}
                </span>
              </div>
            ) : (
              <div className="hidden w-32 shrink-0 truncate text-sm text-muted-foreground md:block">
                {lyric.ownerName?.trim() || '不明'}
              </div>
            )}

            {/* 三点メニュー（個人のみ） */}
            {isPersonal && (
              <div className="w-10 shrink-0 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-100 transition-colors hover:bg-muted hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="メニューを開く"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(lyric.docId);
                      }}
                    >
                      <Pencil size={14} className="mr-2" />
                      歌詞を編集
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePublic?.(lyric.docId, lyric.isPublicView);
                      }}
                    >
                      {lyric.isPublicView ? (
                        <>
                          <Lock size={14} className="mr-2" />
                          非公開にする
                        </>
                      ) : (
                        <>
                          <Globe size={14} className="mr-2" />
                          公開する
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
