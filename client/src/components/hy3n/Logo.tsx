import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWord?: boolean;
}

export function Logo({ className, showWord = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-md shadow-primary/20">
        <span className="text-primary-foreground font-extrabold text-lg leading-none" style={{ fontFamily: 'var(--font-display)' }}>H</span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-accent border-2 border-background" />
      </div>
      {showWord && (
        <span className="font-extrabold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          HY3N
        </span>
      )}
    </div>
  );
}
