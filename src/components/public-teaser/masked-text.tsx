"use client";

import { cn } from "@/lib/utils";

interface MaskedTextProps {
   text: string | null | undefined;
   className?: string;
   maskChar?: string;
}

export function MaskedText({ text, className, maskChar = "●" }: MaskedTextProps) {
   if (!text) return null;

   return (
      <span className={cn("inline-flex items-center gap-1", className)}>
         <span className="font-bold">{text[0]}</span>
         <span className="flex gap-0.5 opacity-20 tracking-tighter text-[10px]">
            {Array.from({ length: Math.min(text.length - 1, 4) }).map((_, i) => (
               <span key={i}>{maskChar}</span>
            ))}
         </span>
      </span>
   );
}
