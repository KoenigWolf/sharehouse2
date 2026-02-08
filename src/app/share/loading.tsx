import { Skeleton } from "@/components/ui/skeleton";

export default function ShareLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-card border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-12">
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-4xl space-y-8">
               <div className="space-y-3">
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-5 w-64" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                     <div key={i} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-[320px]">
                        <Skeleton className="h-48 w-full" />
                        <div className="p-5 space-y-4">
                           <div className="flex items-center justify-between">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-5 w-12 rounded-full" />
                           </div>
                           <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                           </div>
                           <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-2">
                                 <Skeleton className="h-6 w-6 rounded-full" />
                                 <Skeleton className="h-4 w-20" />
                              </div>
                              <Skeleton className="h-4 w-16" />
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </main>
      </div>
   );
}
