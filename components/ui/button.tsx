import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-bold cursor-pointer focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 transition-all duration-150 ease-out rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-primary text-white border-[3px] border-primary shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] hover:bg-primary-dark active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]",
        primary: "bg-primary text-white border-[3px] border-primary shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] hover:bg-primary-dark active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]",
        secondary: "bg-secondary text-white border-[3px] border-secondary shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] hover:bg-secondary-dark active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]",
        success: "bg-success text-white border-[3px] border-success shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] hover:bg-success/90 active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]",
        error: "bg-error text-white border-[3px] border-error shadow-[0.1em_0.1em_0_0_rgb(0_0_0)] hover:shadow-[0.15em_0.15em_0_0_rgb(0_0_0)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] hover:bg-error/90 active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(0_0_0)]",
        outline: "border-[3px] border-primary text-primary bg-transparent shadow-[0.1em_0.1em_0_0_rgb(124_58_237)] hover:shadow-[0.15em_0.15em_0_0_rgb(124_58_237)] hover:-translate-x-[0.05em] hover:-translate-y-[0.05em] active:translate-x-[0.05em] active:translate-y-[0.05em] active:shadow-[0.05em_0.05em_0_0_rgb(124_58_237)]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-4 py-2.5 text-sm",
        sm: "px-3 py-2 text-xs",
        lg: "px-6 py-3.5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

