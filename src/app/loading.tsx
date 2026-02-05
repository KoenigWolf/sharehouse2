"use client";

import { m } from "framer-motion";

export default function Loading() {
   return (
      <div className="fixed top-0 left-0 right-0 z-[100] h-1">
         <m.div
            className="h-full bg-brand-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: "90%" }}
            transition={{ duration: 15, ease: "linear" }}
         />
      </div>
   );
}
