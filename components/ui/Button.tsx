import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-brand-accent text-brand-bg hover:bg-brand-accent-hover border-none",
      secondary: "border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-bg bg-transparent",
      danger: "border border-brand-danger text-brand-danger hover:bg-brand-danger hover:text-white bg-transparent",
      ghost: "text-brand-text-secondary hover:text-brand-text-primary bg-transparent",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-5 py-2.5 text-sm",
      lg: "px-8 py-3.5 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold uppercase tracking-military transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-military",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
