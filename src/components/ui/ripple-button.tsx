"use client";

import { type ButtonHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

type RippleButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export function RippleButton({
  className,
  children,
  onClick,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  return (
    <button
      {...props}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2.5;
        const ripple: Ripple = {
          id: Date.now() + Math.random(),
          x: event.clientX - rect.left - size / 2,
          y: event.clientY - rect.top - size / 2,
          size,
        };

        setRipples((prev) => [...prev, ripple]);
        onClick?.(event);
      }}
      className={cn(
        "relative isolate overflow-hidden transition duration-200 disabled:cursor-not-allowed disabled:opacity-70",
        className,
      )}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          onAnimationEnd={() => {
            setRipples((prev) => prev.filter((item) => item.id !== ripple.id));
          }}
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          className="pointer-events-none absolute rounded-full bg-white/40 animate-ripple"
        />
      ))}
    </button>
  );
}
