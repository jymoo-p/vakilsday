import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-base font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
        outline:
          "border-2 border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
        secondary:
          "bg-slate-100 text-slate-900 hover:bg-slate-200",
        ghost:
          "hover:bg-slate-100 text-slate-700",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        link: "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        xs: "h-8 gap-1.5 rounded-lg px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        sm: "h-9 gap-1.5 rounded-lg px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "h-12 gap-2.5 px-6 text-lg [&_svg:not([class*='size-'])]:size-5",
        xl: "h-14 gap-3 px-8 text-lg [&_svg:not([class*='size-'])]:size-6",
        icon: "size-11",
        "icon-xs": "size-8 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-sm": "size-9 rounded-lg [&_svg:not([class*='size-'])]:size-4",
        "icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
