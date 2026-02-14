import { Skeleton } from "@/components/ui/skeleton";
import { EventCardSkeleton } from "@/components/events/event-skeleton";

export default function EventsLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-card border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-12">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl space-y-8">
               <div className="space-y-3">
                  <Skeleton className="h-9 w-40 rounded-lg" />
                  <Skeleton className="h-5 w-72 rounded-md" />
               </div>

               <div className="space-y-10">
                  {/* Calendar Strip Skeleton */}
                  <div className="premium-surface rounded-3xl p-6 sm:p-8">
                     <div className="flex items-center gap-2 mb-6">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-3 w-32 rounded-md" />
                     </div>
                     <div className="flex gap-3 overflow-hidden">
                        {[...Array(10)].map((_, i) => (
                           <Skeleton key={i} className="h-16 w-14 rounded-2xl flex-shrink-0" />
                        ))}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {[...Array(4)].map((_, i) => (
                        <EventCardSkeleton key={i} />
                     ))}
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
