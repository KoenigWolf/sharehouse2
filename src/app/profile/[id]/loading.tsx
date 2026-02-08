import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-card border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-5xl">
               <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
                  {/* Cover Photo Skeleton */}
                  <Skeleton className="aspect-2/1 sm:aspect-21/8 w-full" />

                  <div className="px-5 sm:px-10 pb-8 sm:pb-12 -mt-12 sm:-mt-16 relative">
                     <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8">
                        {/* Avatar Skeleton */}
                        <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-card shadow-md shrink-0" />

                        <div className="flex-1 space-y-4">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-2">
                                 <Skeleton className="h-10 w-48" />
                                 <Skeleton className="h-5 w-32" />
                              </div>
                              <Skeleton className="h-10 w-32 rounded-xl" />
                           </div>
                        </div>
                     </div>

                     {/* Stats Bar Skeleton */}
                     <div className="mt-10 pt-8 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                           <div key={i} className="space-y-1">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-6 w-24" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
                           <Skeleton className="h-6 w-32" />
                           <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="space-y-8">
                     <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
                        <Skeleton className="h-6 w-24" />
                        <div className="grid grid-cols-3 gap-2">
                           {[...Array(6)].map((_, i) => (
                              <Skeleton key={i} className="aspect-square rounded-lg" />
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
