import type { HTMLAttributes } from "react";
import { cn } from "@/shared/utils";

type Tone =
  | "default"
  | "primary"
  | "warn"
  | "muted"
  | "success"
  | "danger"
  | "info";

const tones: Record<Tone, string> = {
  default:
    "bg-[color:var(--accent)] text-[color:var(--primary)] border border-[color:var(--primary)]/10",
  primary: "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]",
  warn: "bg-amber-50 text-amber-800 border border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-sky-50 text-sky-700 border border-sky-200",
  muted: "bg-white text-[color:var(--muted)] border border-[color:var(--border)]",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
