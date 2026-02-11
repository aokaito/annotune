// NOTE: shadcn/ui の Sheet を最小構成で再現。代替案: Radix Dialog をページごとに直接利用する
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = forwardRef<
  ElementRef<typeof SheetPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    className={clsx('fixed inset-0 z-40 bg-black/40 backdrop-blur-sm', className)}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

type SheetContentProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
  side?: 'left' | 'right' | 'top' | 'bottom';
};

const sideClasses: Record<NonNullable<SheetContentProps['side']>, string> = {
  left: 'inset-y-0 left-0 h-full w-64 max-w-[75vw]',
  right: 'inset-y-0 right-0 h-full w-64 max-w-[75vw]',
  top: 'inset-x-0 top-0 h-1/2 max-h-[90vh]',
  bottom: 'inset-x-0 bottom-0 h-auto max-h-[90vh] rounded-t-3xl'
};

const SheetContent = forwardRef<ElementRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ className, side = 'right', children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={clsx('fixed z-50 grid w-full border border-border bg-card p-6 shadow-lg focus-visible:outline-none', sideClasses[side], className)}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div
    className={clsx(
      'text-left',
      'space-y-1',
      'border-b border-border pb-4',
      className
    )}
    {...props}
  />
);

const SheetFooter = ({ className, ...props }: ComponentPropsWithoutRef<'div'>) => (
  <div className={clsx('mt-6 flex flex-col gap-2', className)} {...props} />
);

const SheetTitle = forwardRef<ElementRef<typeof SheetPrimitive.Title>, ComponentPropsWithoutRef<typeof SheetPrimitive.Title>>(
  ({ className, ...props }, ref) => (
    <SheetPrimitive.Title
      ref={ref}
      className={clsx('text-base font-semibold text-foreground', className)}
      {...props}
    />
  )
);
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = forwardRef<
  ElementRef<typeof SheetPrimitive.Description>,
  ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={clsx('text-sm text-muted-foreground', className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
};
