import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#1a1a1a] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#1a1a1a] text-white hover:bg-[#333] disabled:bg-[#a3a3a3] disabled:opacity-100",
        destructive:
          "border border-[#c9a0a0] text-[#8b6b6b] bg-transparent hover:border-[#8b6b6b]",
        outline:
          "border border-[#e5e5e5] text-[#737373] bg-transparent hover:border-[#1a1a1a] hover:text-[#1a1a1a]",
        secondary:
          "bg-[#f5f5f3] text-[#1a1a1a] hover:bg-[#f0f0ee]",
        ghost:
          "text-[#a3a3a3] hover:text-[#737373]",
        link: "text-[#1a1a1a] underline-offset-4 hover:underline",
        dashed:
          "border border-dashed border-[#d4d4d4] text-[#a3a3a3] bg-transparent hover:border-[#a3a3a3] hover:text-[#737373]",
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
