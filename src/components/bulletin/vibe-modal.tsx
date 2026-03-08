"use client";

import { useState, useCallback, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { createBulletin } from "@/lib/bulletin/actions";
import { BULLETIN } from "@/lib/constants/config";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, OptimizedAvatarImage } from "@/components/ui/avatar";
import { getInitials, getDisplayName } from "@/lib/utils";
import { EASE_MODAL } from "@/lib/animation";
import { logError } from "@/lib/errors";

interface VibeUpdateModalProps {
   isOpen: boolean;
   onClose: () => void;
   currentVibe?: string;
   userProfile?: {
      name: string;
      nickname: string | null;
      avatar_url: string | null;
   };
}

export function VibeUpdateModal({
   isOpen,
   onClose,
   currentVibe = "",
   userProfile,
}: VibeUpdateModalProps) {
   const t = useI18n();
   const router = useRouter();
   const id = useId();
   const [message, setMessage] = useState(currentVibe);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Focus trap for accessibility (WCAG 2.1 Level AA)
   const focusTrapRef = useFocusTrap<HTMLDivElement>({
      isActive: isOpen,
      onEscape: isSubmitting ? undefined : onClose,
      restoreFocus: true,
   });

   // Sync message when modal opens or currentVibe changes
   useEffect(() => {
      if (isOpen) {
         setMessage(currentVibe || "");
      }
   }, [isOpen, currentVibe]);

   const handleSubmit = useCallback(async () => {
      const trimmed = message.trim();
      if (trimmed === (currentVibe || "") && currentVibe !== "") {
         onClose();
         return;
      }

      if (!trimmed && !currentVibe) {
         onClose();
         return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
         const result = await createBulletin(trimmed);

         if ("error" in result) {
            setError(result.error);
         } else {
            setMessage(trimmed);
            onClose();
            router.refresh();
         }
      } catch (error) {
         logError(error);
         setError(t("errors.serverError"));
      } finally {
         setIsSubmitting(false);
      }
   }, [message, currentVibe, router, onClose, t]);

   // Lock body scroll
   useBodyScrollLock(isOpen);

   const displayName = getDisplayName(userProfile);
   const canSubmit = message.trim() !== (currentVibe || "") || (message.trim() !== "" && !currentVibe);

   return (
      <AnimatePresence>
         {isOpen && (
            <m.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 0.2 }}
               className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm sm:bg-black/50"
               onClick={isSubmitting ? undefined : onClose}
            >
               <m.div
                  ref={focusTrapRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${id}-title`}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.3, ease: EASE_MODAL }}
                  className="fixed inset-x-4 top-[20%] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="flex items-center justify-between mb-6">
                     <h2 id={`${id}-title`} className="text-xl font-bold text-foreground">
                        {t("bulletin.updateVibe")}
                     </h2>
                     <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                        aria-label={t("common.close")}
                     >
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex gap-4 mb-6">
                     <Avatar className="w-12 h-12 rounded-xl border border-border/50 shrink-0">
                        <OptimizedAvatarImage
                           src={userProfile?.avatar_url}
                           alt={displayName}
                           context="card"
                           fallback={
                              <span className="text-lg font-semibold text-muted-foreground">
                                 {getInitials(displayName)}
                              </span>
                           }
                           fallbackClassName="bg-muted"
                        />
                     </Avatar>

                     <div className="flex-1">
                        <textarea
                           value={message}
                           onChange={(e) => setMessage(e.target.value)}
                           placeholder={t("bulletin.placeholderVibe")}
                           maxLength={BULLETIN.maxMessageLength}
                           rows={3}
                           autoFocus
                           className="w-full bg-transparent text-lg font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none leading-relaxed"
                        />
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-xs text-muted-foreground font-medium">
                              {message.length}/{BULLETIN.maxMessageLength}
                           </span>
                           {error && (
                              <span className="text-xs text-error font-medium">{error}</span>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="flex justify-end gap-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
                     >
                        {t("common.cancel")}
                     </button>
                     <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canSubmit}
                        className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
                     >
                        {isSubmitting && <Spinner size="xs" variant="light" />}
                        {t("common.save")}
                     </button>
                  </div>
               </m.div>
            </m.div>
         )}
      </AnimatePresence>
   );
}
