import { Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-white border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl space-y-8">
               <div className="space-y-3">
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-5 w-72" />
               </div>

               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
                     <Skeleton className="h-10 w-24 rounded-full" />
                     <Skeleton className="h-10 w-32 rounded-xl" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
                           <Skeleton className="h-40 w-full" />
                           <div className="p-6 space-y-4 flex-1">
                              <div className="flex items-center justify-between">
                                 <Skeleton className="h-6 w-3/4" />
                                 <Skeleton className="h-4 w-12" />
                              </div>
                              <div className="space-y-2">
                                 <Skeleton className="h-4 w-full" />
                                 <Skeleton className="h-4 w-2/3" />
                              </div>
                              <div className="flex items-center gap-3 pt-2">
                                 <Skeleton className="h-8 w-8 rounded-full" />
                                 <Skeleton className="h-4 w-24" />
                              </div>
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
