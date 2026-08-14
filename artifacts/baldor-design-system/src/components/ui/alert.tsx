import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/**
 * Baldor alert / callout spec:
 * - safety: alert/safety red (#E00000), strong ink border — driver comms
 * - info:   sky blue tint — supply updates
 * - default: standard surface with border
 * Icon + short imperative copy. No rounded accents (not in brand).
 */
const alertVariants = cva(
  "relative w-full border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-3.5 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default:
          "rounded-lg bg-background text-foreground border-border",
        destructive:
          "rounded-lg border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        /** Safety callout — high-visibility boxed style for driver comms */
        safety:
          "rounded-none border-2 border-destructive bg-destructive/5 text-foreground [&>svg]:text-destructive font-medium",
        /** Supply / info callout */
        info:
          "rounded-lg border-[#79B0C8] bg-[#79B0C8]/10 text-foreground [&>svg]:text-[#79B0C8]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
