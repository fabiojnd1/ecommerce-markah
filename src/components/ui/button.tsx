import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "pix" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export function getButtonClassName({
  variant = "primary",
  size = "default",
  className,
}: {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
} = {}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta focus-visible:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

  const variantStyles = {
    primary:
      "bg-ink text-white rounded-full shadow-subtle hover:bg-neutral-800 hover:shadow-hover",
    secondary:
      "border-[1.5px] border-ink text-ink bg-transparent rounded-full hover:bg-ink hover:text-white",
    pix:
      "bg-verde text-white rounded-full shadow-subtle hover:brightness-105",
    outline:
      "border border-border text-text bg-surface rounded-full hover:bg-surface-alt",
    ghost:
      "bg-transparent text-text hover:underline underline-offset-4 rounded-md p-0 h-auto",
  };

  const sizeStyles = {
    default: "h-12 px-6 text-base font-semibold",
    sm: "h-9 px-4 text-sm font-medium",
    lg: "h-14 px-8 text-lg font-semibold",
    icon: "h-11 w-11 p-0 rounded-full",
  };

  return cn(
    baseStyles,
    variantStyles[variant || "primary"],
    variant !== "ghost" && sizeStyles[size || "default"],
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "default",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={getButtonClassName({ variant, size, className })}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
