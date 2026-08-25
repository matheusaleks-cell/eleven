"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Dialog({ isOpen, onClose, title, children, className, contentClassName }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className={cn(
          "w-full max-w-lg bg-brand-surface border border-brand-border rounded-lg shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[92vh]",
          className
        )}
        style={{ borderTop: "4px solid #F5C400" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-bg/50 shrink-0">
          {title && (
            <h2 className="text-lg font-bold font-rajdhani uppercase tracking-widest text-white flex items-center gap-2">
              <span className="text-brand-accent">★</span> {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-1 text-brand-text-muted hover:text-brand-accent transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={cn("p-6 overflow-y-auto flex-1 min-h-0", contentClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
}
