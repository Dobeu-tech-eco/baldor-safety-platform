import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * Baldor chip / tag spec:
 * - Pill shape, small caps (.t-eyebrow), uppercase tracked 11px, font-semibold
 * - local:    Gold (#F2A813)  — "Local" category tag / peak-season / caution signage
 * - featured: Purple (#5C4E71) — "Featured" chip
 * - supply:   Sky (#79B0C8)   — "Supply Update" / info
 * - default:  Primary green background
 * - outline:  Bordered, transparent bg
 */
const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full border px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline:
          "text-foreground border [border-color:var(--badge-outline)]",
        /** Gold — Local tag, peak-season accent, caution signage */
        local:
          "border-transparent bg-[#F2A813] text-[#182230]",
        /** Purple — "Featured" chip */
        featured:
          "border-transparent bg-[#5C4E71] text-white",
        /** Sky — Supply Update / info */
        supply:
          "border-transparent bg-[#79B0C8] text-[#182230]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
