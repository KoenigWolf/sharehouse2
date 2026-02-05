import { Skeleton } from "@/components/ui/skeleton";

export default function BulletinLoading() {
   return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
         <header className="h-[73px] bg-white border-b border-slate-100" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl space-y-8">
               <div className="space-y-3">
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-5 w-72" />
               </div>

               <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                     <div className="flex gap-2">
                        <Skeleton className="h-10 w-24 rounded-full" />
                        <Skeleton className="h-10 w-24 rounded-full" />
                     </div>
                     <Skeleton className="h-10 w-32 rounded-xl" />
                  </div>

                  <div className="space-y-4">
                     {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                           <div className="flex items-center gap-3">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="space-y-1.5 flex-1">
                                 <Skeleton className="h-4 w-32" />
                                 <Skeleton className="h-3 w-20" />
                              </div>
                           </div>
                           <div className="space-y-2">
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
