import { Skeleton } from "@/components/ui/skeleton";

export default function RoomPhotosLoading() {
   return (
      <div className="min-h-screen bg-background flex flex-col">
         <header className="h-[73px] bg-white border-b border-border" />

         <main className="flex-1 pb-20 sm:pb-0">
            <div className="container mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-8">
               <div className="space-y-3 text-center sm:text-left">
                  <Skeleton className="h-9 w-40 mx-auto sm:mx-0" />
                  <Skeleton className="h-5 w-64 mx-auto sm:mx-0" />
               </div>

               <div className="grid grid-cols-3 gap-[2px] sm:gap-1 bg-secondary/50 rounded-sm overflow-hidden">
                  {[...Array(24)].map((_, i) => (
                     <Skeleton key={i} className="aspect-square w-full rounded-none" />
                  ))}
               </div>
            </div>
         </main>
      </div>
   );
}
