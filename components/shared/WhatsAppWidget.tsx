"use client";

import React, { useState } from "react";
import { MessageSquare, X, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4 font-rajdhani">
      {/* Popover */}
      {isOpen && (
        <div className="w-[320px] bg-brand-surface border border-brand-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
           {/* Header */}
           <div className="bg-brand-accent p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center text-brand-accent">
                    <MessageSquare size={20} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-brand-bg font-bold text-sm uppercase leading-none">Eleven Firearms</span>
                    <span className="text-brand-bg/70 text-[9px] font-bold uppercase tracking-widest mt-1">Online agora</span>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-brand-bg/60 hover:text-brand-bg">
                 <X size={20} />
              </button>
           </div>

           {/* Body */}
           <div className="p-4 bg-brand-bg/50 max-h-[300px] overflow-y-auto space-y-4">
              <div className="bg-brand-surface p-3 rounded-tr-xl rounded-b-xl border border-brand-border max-w-[85%]">
                 <p className="text-xs text-white">Olá! Seja bem-vindo à Eleven Firearms. Como podemos ajudar no seu próximo armamento hoje?</p>
                 <span className="text-[8px] text-brand-text-muted uppercase mt-1 block">10:42</span>
              </div>
              <div className="bg-brand-accent/5 p-3 rounded-xl border border-brand-accent/20 flex items-center gap-3">
                 <ShieldCheck size={20} className="text-brand-accent shrink-0" />
                 <p className="text-[10px] text-brand-text-secondary uppercase font-bold leading-tight">Canal de atendimento seguro e homologado.</p>
              </div>
           </div>

           {/* Footer */}
           <div className="p-4 border-t border-brand-border bg-brand-surface">
              <button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-widest">
                 <Send size={16} />
                 INICIAR CONVERSA
              </button>
           </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
          isOpen ? "bg-brand-surface text-brand-text-muted rotate-90" : "bg-brand-accent text-brand-bg hover:scale-110 active:scale-95"
        )}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        {!isOpen && (
           <span className="absolute -top-1 -right-1 flex h-4 w-4">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
             <span className="relative inline-flex rounded-full h-4 w-4 bg-brand-accent"></span>
           </span>
        )}
      </button>
    </div>
  );
}
