import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: boolean;
}

export const Card = ({ className, accent = false, ...props }: CardProps) => {
  return (
    <div
      className={cn(
        "bg-brand-surface border border-brand-border rounded-lg p-6",
        accent && "border-l-[3px] border-l-brand-accent",
        className
      )}
      {...props}
    />
  );
};

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "text-brand-accent text-[11px] font-bold uppercase tracking-military mb-4 flex items-center gap-2",
      className
    )}
    {...props}
  />
);
