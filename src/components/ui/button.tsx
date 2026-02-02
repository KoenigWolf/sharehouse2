import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#272a26] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#272a26] text-white hover:bg-[#363933] disabled:bg-[#959892] disabled:opacity-100",
        destructive:
          "border border-[#c7a099] text-[#856259] bg-transparent hover:border-[#856259]",
        outline:
          "border border-[#dddfd9] text-[#636861] bg-transparent hover:border-[#272a26] hover:text-[#272a26]",
        secondary:
          "bg-[#eceee9] text-[#272a26] hover:bg-[#e5e8e2]",
        ghost:
          "text-[#959892] hover:text-[#636861]",
        link: "text-[#272a26] underline-offset-4 hover:underline",
        dashed:
          "border border-dashed border-[#bdc0ba] text-[#959892] bg-transparent hover:border-[#959892] hover:text-[#636861]",
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
