import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:opacity-100",
        destructive:
          "border border-error-border text-error bg-transparent hover:border-error",
        outline:
          "border border-slate-200 text-slate-500 bg-transparent hover:border-slate-900 hover:text-slate-900",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost:
          "text-slate-400 hover:text-slate-500",
        link: "text-slate-900 underline-offset-4 hover:underline",
        dashed:
          "border border-dashed border-slate-300 text-slate-400 bg-transparent hover:border-slate-400 hover:text-slate-500",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs has-[>svg]:px-3",
        xs: "h-6 gap-1 px-2.5 text-[11px] has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 px-5 text-xs has-[>svg]:px-4",
        xl: "h-12 px-6",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
