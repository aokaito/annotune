// NOTE: モバイル専用のアノテーション追加モーダル
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        aria-label="アノテーションを追加"
        className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        disabled={isSubmitting}
      >
        <Plus className="h-6 w-6" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>アノテーションを追加</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <AnnotationPalette selection={selection} onSubmit={onSubmit} isSubmitting={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
