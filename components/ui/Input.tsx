import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-bold uppercase tracking-military text-brand-text-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "w-full bg-brand-input border border-brand-border rounded-military px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-brand-accent placeholder:text-brand-text-muted",
            error && "border-brand-danger focus:border-brand-danger",
            type === "number" && "font-mono",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <span className="text-[10px] text-brand-danger font-medium uppercase tracking-wider">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
