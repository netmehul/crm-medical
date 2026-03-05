"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="relative w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-xs font-medium mb-1.5",
              focused ? "text-text-brand" : "text-text-secondary"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
            className={cn(
              "w-full bg-bg-base border border-border-base rounded-lg px-3 py-2.5 text-sm text-text-primary font-sans",
              "placeholder:text-text-muted",
              "focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-dim)]",
              icon ? "pl-10" : undefined,
              error ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_var(--danger-dim)]" : undefined,
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
