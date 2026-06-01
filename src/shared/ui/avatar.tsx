import { cn } from "@/shared/utils";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  color,
  size = "md",
  className,
}: {
  name: string;
  color?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const dims = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-black/5",
        dims,
        className,
      )}
      style={{ backgroundColor: color || "#0f7a4a" }}
    >
      {initials(name)}
    </span>
  );
}
