// NOTE: モバイル専用のアノテーション追加シート。代替案: 同等 UI をページ内で直接記述する方法もあるが再利用性を高めるため切り出し
import { Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { AnnotationPalette } from './AnnotationPalette';
import type { AnnotationProps } from '../../types';

interface AnnotationMobileActionProps {
  selection: { start: number; end: number; text: string } | null;
  onSubmit: (payload: {
    start: number;
    end: number;
    tag: string;
    comment?: string;
    props?: AnnotationProps;
  }) => Promise<void>;
  isSubmitting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AnnotationMobileAction = ({
  selection,
  onSubmit,
  isSubmitting,
  open,
  onOpenChange
}: AnnotationMobileActionProps) => (
  <div className="md:hidden">
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        aria-label="アノテーションを追加"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        disabled={isSubmitting}
      >
        <Plus className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>アノテーションを追加</SheetTitle>
        </SheetHeader>
        <div className="mt-4 pb-6">
          <AnnotationPalette selection={selection} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </div>
      </SheetContent>
    </Sheet>
  </div>
);
