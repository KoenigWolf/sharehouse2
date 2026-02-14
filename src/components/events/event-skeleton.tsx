"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { m } from "framer-motion";

export function EventCardSkeleton() {
   return (
      <div className="premium-surface rounded-3xl overflow-hidden relative border border-border/50">
         {/* Fake Cover Image */}
         <div className="aspect-[16/9] bg-muted/30">
            <Skeleton className="w-full h-full rounded-none" />
         </div>

         <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
               <Skeleton className="h-6 w-3/4 rounded-lg" />
            </div>

            <div className="flex flex-wrap gap-2">
               <Skeleton className="h-8 w-20 rounded-xl" />
               <Skeleton className="h-8 w-24 rounded-xl" />
            </div>

            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
               <div className="flex items-center gap-3">
                  <Skeleton className="w-7 h-7 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-md" />
               </div>
               <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-20 rounded-full" />
               </div>
            </div>
         </div>
      </div>
   );
}

export function EventDetailSkeleton() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <div className="h-16 w-full border-b border-border/50" /> {/* Header spacer */}

         <main className="flex-1 pb-24 sm:pb-0 relative overflow-hidden">
            {/* Hero Skeleton */}
            <div className="relative h-[60vh] sm:h-[75vh] w-full bg-muted/20">
               <div className="absolute bottom-0 left-0 right-0 pt-20 pb-20 sm:pb-32 px-6 sm:px-12">
                  <div className="container mx-auto max-w-5xl space-y-6">
                     <div className="flex items-center gap-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                     </div>
                     <Skeleton className="h-16 sm:h-24 md:h-32 w-full max-w-2xl rounded-2xl" />
                  </div>
               </div>
            </div>

            {/* Content Body Skeleton */}
            <div className="relative z-30 -mt-16 sm:-mt-24">
               <div className="container mx-auto px-4 max-w-5xl">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                     <div className="lg:col-span-8 space-y-8">
                        <div className="premium-surface rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-black/5">
                           <div className="flex items-center gap-6 mb-10 pb-8 border-b border-border/50">
                              <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-full" />
                              <div className="space-y-2">
                                 <Skeleton className="h-3 w-20 rounded-md" />
                                 <Skeleton className="h-6 w-32 rounded-md" />
                              </div>
                           </div>
                           <div className="space-y-4">
                              <Skeleton className="h-4 w-full rounded-md" />
                              <Skeleton className="h-4 w-full rounded-md" />
                              <Skeleton className="h-4 w-3/4 rounded-md" />
                           </div>
                        </div>
                     </div>

                     <div className="lg:col-span-4 space-y-6">
                        <div className="bg-foreground/5 rounded-[2.5rem] p-8 h-80">
                           <Skeleton className="h-full w-full rounded-[2rem]" />
                        </div>
                     </div>

                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
