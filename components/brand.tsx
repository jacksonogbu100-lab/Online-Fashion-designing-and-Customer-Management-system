import { cn } from "@/lib/utils";

type BrandProps = {
  className?: string;
  inverted?: boolean;
};

export function Brand({ className, inverted = false }: BrandProps) {
  return (
    <span
      className={cn(
        "inline-flex flex-col leading-none",
        inverted ? "text-sidebar-foreground" : "text-foreground",
        className,
      )}
    >
      <span className="font-heading text-2xl tracking-[0.16em] uppercase">
        Sunnex
      </span>
      <span
        className={cn(
          "mt-1 text-[0.65rem] tracking-[0.32em] uppercase",
          inverted ? "text-sidebar-foreground/70" : "text-muted-foreground",
        )}
      >
        Clothing
      </span>
    </span>
  );
}
