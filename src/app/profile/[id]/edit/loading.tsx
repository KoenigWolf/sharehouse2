import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileEditLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-card border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 max-w-4xl space-y-8">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                     <Skeleton className="h-8 w-48" />
                     <Skeleton className="h-4 w-64" />
                  </div>
               </div>

               <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-6 sm:p-8 space-y-8">
                     {/* Profile Photo Edit Skeleton */}
                     <div className="flex items-center gap-6">
                        <Skeleton className="h-24 w-24 rounded-full" />
                        <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[...Array(6)].map((_, i) => (
                           <div key={i} className="space-y-2">
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-10 w-full rounded-xl" />
                           </div>
                        ))}
                     </div>

                     <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                     </div>

                     <div className="flex justify-end gap-3 pt-4">
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
