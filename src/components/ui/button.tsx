import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#18181b] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#18181b] text-white hover:bg-[#27272a] disabled:bg-[#a1a1aa] disabled:opacity-100",
        destructive:
          "border border-error-border text-error bg-transparent hover:border-error",
        outline:
          "border border-[#e4e4e7] text-[#71717a] bg-transparent hover:border-[#18181b] hover:text-[#18181b]",
        secondary:
          "bg-[#f4f4f5] text-[#18181b] hover:bg-[#e4e4e7]",
        ghost:
          "text-[#a1a1aa] hover:text-[#71717a]",
        link: "text-[#18181b] underline-offset-4 hover:underline",
        dashed:
          "border border-dashed border-[#d4d4d8] text-[#a1a1aa] bg-transparent hover:border-[#a1a1aa] hover:text-[#71717a]",
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
