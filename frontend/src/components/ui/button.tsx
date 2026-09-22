import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-label-md text-label-md uppercase tracking-wider transition-all duration-150 hover:scale-[0.985] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-container text-on-primary hover:bg-primary active:bg-primary",
        cta: "bg-primary text-on-primary hover:bg-primary-container active:bg-primary-container",
        outline:
          "border border-outline bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low hover:text-primary active:border-primary active:bg-primary-container/10 active:text-primary",
        secondary:
          "bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-primary active:bg-surface-container",
        ghost: "text-on-surface-variant hover:text-primary hover:bg-surface-container-low active:bg-surface-container",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-2.5",
        lg: "px-6 py-3.5",
        sm: "px-3 py-1.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };