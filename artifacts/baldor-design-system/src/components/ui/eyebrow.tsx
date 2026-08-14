import * as React from "react"
import { cn } from "../../lib/utils"

/**
 * Eyebrow — uppercase tracked label placed above headlines.
 * Spec: UI font, 600, 12px, uppercase, letter-spacing 0.12em.
 * Color: fg-muted (default) or accent/lime when above a key headline.
 */
export interface EyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** When true, renders in lime accent instead of muted foreground */
  accent?: boolean
}

function Eyebrow({ className, accent, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        "block text-[11px] font-semibold uppercase tracking-[0.12em]",
        accent ? "text-accent" : "text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Eyebrow }
