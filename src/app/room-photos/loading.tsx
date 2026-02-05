import { Skeleton } from "@/components/ui/skeleton";

export default function RoomPhotosLoading() {
   return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
         <header className="h-[73px] bg-white border-b border-slate-100" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-8">
               <div className="space-y-3 text-center sm:text-left">
                  <Skeleton className="h-9 w-40 mx-auto sm:mx-0" />
                  <Skeleton className="h-5 w-64 mx-auto sm:mx-0" />
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(12)].map((_, i) => (
                     <div key={i} className="space-y-3">
                        <Skeleton className="aspect-4/3 w-full rounded-2xl" />
                        <Skeleton className="h-4 w-2/3 mx-auto sm:mx-0" />
                     </div>
                  ))}
               </div>
            </div>
         </main>
      </div>
   );
}
