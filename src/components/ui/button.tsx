import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-base focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))] hover:shadow-button-hover focus-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[hsl(var(--secondary-hover))] focus-warning",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))] focus-warning",
        ghost: "hover:bg-accent/10 hover:text-accent-foreground",
        link: "text-link underline-offset-4 hover:underline hover:text-[hsl(var(--link-hover))]",
        success: "bg-success text-success-foreground hover:bg-[hsl(var(--accent-hover))] hover:shadow-glow-accent focus-success",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };