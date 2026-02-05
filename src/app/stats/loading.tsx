import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
   return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
         <header className="h-[73px] bg-white border-b border-slate-100" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl space-y-8">
               <div className="space-y-2 text-center sm:text-left">
                  <Skeleton className="h-8 w-32 mx-auto sm:mx-0" />
                  <Skeleton className="h-4 w-64 mx-auto sm:mx-0" />
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                     <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-24" />
                     </div>
                  ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                     <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="space-y-2">
                           {[...Array(5)].map((_, j) => (
                              <div key={j} className="flex items-center justify-between">
                                 <Skeleton className="h-4 w-32" />
                                 <Skeleton className="h-4 w-12" />
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </main>
      </div>
   );
}
