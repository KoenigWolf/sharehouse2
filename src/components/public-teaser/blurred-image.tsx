"use client";

import { m } from "framer-motion";
import { Lock } from "lucide-react";
import { OptimizedAvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BlurredImageProps {
   src?: string | null;
   alt: string;
   className?: string;
   isLocked?: boolean;
}

export function BlurredImage({ src, alt, className, isLocked = true }: BlurredImageProps) {
   return (
      <div className={cn("relative overflow-hidden group", className)}>
         <OptimizedAvatarImage
            src={src}
            alt={alt}
            context="card"
            className={cn(
               "w-full h-full object-cover transition-all duration-700",
               isLocked && "blur-xl scale-110"
            )}
         />

         {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 backdrop-blur-[2px]">
               <m.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-brand-600"
               >
                  <Lock className="w-4 h-4" />
               </m.div>
            </div>
         )}

         {isLocked && (
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
         )}
      </div>
   );
}
