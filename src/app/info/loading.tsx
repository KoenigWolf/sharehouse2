import { Skeleton } from "@/components/ui/skeleton";

export default function InfoLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-white border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl space-y-12">
               <div className="space-y-3">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-5 w-64" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                     <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-xl" />
                           <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-2/3" />
                        </div>
                     </div>
                  ))}
               </div>

               <div className="space-y-6">
                  <Skeleton className="h-7 w-48" />
                  <div className="bg-white p-8 rounded-2xl border border-border shadow-sm space-y-8">
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex flex-col sm:flex-row gap-6">
                           <Skeleton className="h-6 w-40 shrink-0" />
                           <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-5/6" />
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
