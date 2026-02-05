import { Skeleton } from "@/components/ui/skeleton";

export default function FloorPlanLoading() {
   return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
         <header className="h-[73px] bg-white border-b border-slate-100" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-8">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="space-y-3">
                     <Skeleton className="h-9 w-40 mx-auto sm:mx-0" />
                     <Skeleton className="h-5 w-64 mx-auto sm:mx-0" />
                  </div>
                  <div className="flex gap-2 mx-auto sm:mx-0">
                     {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-24 rounded-xl" />
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {[...Array(24)].map((_, i) => (
                     <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square w-full rounded-2xl" />
                        <Skeleton className="h-4 w-16 mx-auto" />
                     </div>
                  ))}
               </div>
            </div>
         </main>
      </div>
   );
}
