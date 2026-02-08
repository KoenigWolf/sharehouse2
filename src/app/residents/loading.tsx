import { Skeleton } from "@/components/ui/skeleton";

export default function ResidentsLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-white border-b border-border" />

         <main className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-8 sm:space-y-12">
               {/* Vibe Input Skeleton */}
               <div className="max-w-2xl mx-auto w-full">
                  <Skeleton className="h-20 w-full rounded-2xl" />
               </div>

               <div className="flex flex-col gap-6">
                  <div className="flex items-end justify-between">
                     <div className="space-y-2">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-24" />
                     </div>
                     <Skeleton className="h-10 w-32 rounded-xl" />
                  </div>

                  {/* Filter Bar Skeleton */}
                  <div className="flex gap-3 overflow-hidden">
                     {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-24 shrink-0 rounded-xl" />
                     ))}
                  </div>

                  {/* Grid Skeleton */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8">
                     {[...Array(10)].map((_, i) => (
                        <div key={i} className="space-y-4">
                           <Skeleton className="aspect-square w-full rounded-2xl" />
                           <div className="space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
