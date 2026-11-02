// shadcn/ui Button, adapted from the official new-york-v4 registry.
import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-3 focus-visible:ring-blue-400/50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 cursor-pointer', {
  variants: {
    variant: { default: 'bg-primary text-primary-foreground hover:bg-blue-400 shadow-xs', outline: 'border border-border bg-surface hover:bg-surface-hover text-foreground', ghost: 'hover:bg-surface-hover text-muted' },
    size: { default: 'h-10 px-4', sm: 'h-9 px-3 text-xs', icon: 'size-9' },
  }, defaultVariants: { variant: 'default', size: 'default' },
});
function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" data-variant={variant ?? "default"} data-size={size ?? "default"} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
export { Button, buttonVariants };
