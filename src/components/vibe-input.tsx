"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { createBulletin } from "@/lib/bulletin/actions";
import { BULLETIN } from "@/lib/constants/config";
import { Spinner } from "@/components/ui/spinner";

interface VibeInputProps {
   currentVibe?: string;
   isLoggedIn: boolean;
}

export function VibeInput({ currentVibe = "", isLoggedIn }: VibeInputProps) {
   const t = useI18n();
   const router = useRouter();
   const [message, setMessage] = useState(currentVibe);
   const [isFocused, setIsFocused] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      setMessage(currentVibe);
   }, [currentVibe]);

   const handlePost = useCallback(async () => {
      const trimmed = message.trim();
      if (trimmed === (currentVibe || "") && currentVibe !== "") {
         setIsFocused(false);
         return;
      }

      if (!trimmed && !currentVibe) {
         setIsFocused(false);
         return;
      }

      setIsSubmitting(true);
      setError(null);

      const result = await createBulletin(trimmed);
      setIsSubmitting(false);

      if ("error" in result) {
         setError(result.error);
      } else {
         setMessage(trimmed);
         setIsFocused(false);
         router.refresh();
      }
   }, [message, currentVibe, router]);

   if (!isLoggedIn) return null;

   return (
      <div className="w-full">
         <div
            className={`premium-surface rounded-xl transition-all duration-300 bg-card border ${isFocused ? "ring-2 ring-brand-500/20 border-brand-500 shadow-lg" : "border-border hover:border-brand-500/30"
               }`}
         >
            <div className="p-4 sm:p-5 flex flex-col gap-3">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                     <MessageCircle className="w-4 h-4 text-brand-500" />
                  </div>
                  <textarea
                     value={message}
                     onChange={(e) => setMessage(e.target.value)}
                     onFocus={() => setIsFocused(true)}
                     placeholder={t("bulletin.placeholder")}
                     maxLength={BULLETIN.maxMessageLength}
                     rows={isFocused ? 3 : 1}
                     className="flex-1 text-sm font-medium text-foreground/90 placeholder:text-muted-foreground bg-transparent resize-none focus:outline-none py-1.5"
                  />
               </div>

               <AnimatePresence>
                  {isFocused && (
                     <m.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between pt-2 border-t border-border/50 overflow-hidden"
                     >
                        <div className="flex flex-col gap-1">
                           <span className="text-[10px] font-bold text-muted-foreground/70 tracking-widest uppercase">
                              {message.length}/{BULLETIN.maxMessageLength}
                           </span>
                           {error && <span className="text-[10px] text-error font-medium">{error}</span>}
                        </div>
                        <div className="flex gap-2">
                           <button
                              type="button"
                              onClick={() => {
                                 setIsFocused(false);
                                 setMessage(currentVibe);
                                 setError(null);
                              }}
                              className="h-8 px-4 rounded-full text-[10px] font-bold text-muted-foreground hover:text-foreground/80 uppercase tracking-wider transition-colors"
                           >
                              {t("common.cancel")}
                           </button>
                           <button
                              type="button"
                              onClick={handlePost}
                              disabled={isSubmitting || (message.trim() === (currentVibe || ""))}
                              className="h-8 px-5 rounded-full bg-brand-500 hover:bg-brand-700 disabled:bg-secondary disabled:text-muted-foreground text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm shadow-brand-100 flex items-center gap-2"
                           >
                              {isSubmitting && <Spinner size="xs" variant="light" />}
                              {t("bulletin.post")}
                           </button>
                        </div>
                     </m.div>
                  )}
               </AnimatePresence>
            </div>
         </div>
      </div>
   );
}
