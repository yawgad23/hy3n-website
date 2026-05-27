import { Bike, Package, Car, Crown, Gem, Sparkles } from "lucide-react";
import type { RideCategoryId } from "@shared/hy3n";
import { getCategory } from "@shared/hy3n";
import { cn } from "@/lib/utils";

const ICONS: Record<RideCategoryId, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  standard: Car,
  comfort: Gem,
  kantanka: Sparkles,
  executive: Crown,
  okada: Bike,
  express_delivery: Package,
};

interface Props {
  id: RideCategoryId;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: "w-9 h-9 rounded-lg", icon: "w-4 h-4" },
  md: { box: "w-10 h-10 rounded-lg", icon: "w-5 h-5" },
  lg: { box: "w-12 h-12 rounded-xl", icon: "w-6 h-6" },
};

export function CategoryIcon({ id, size = "md", className }: Props) {
  const cat = getCategory(id);
  const Icon = ICONS[id] ?? Car;
  const s = SIZES[size];
  const [a, b] = cat.gradient;
  return (
    <div
      className={cn("grid place-items-center text-white shadow-md ring-1 ring-black/5", s.box, className)}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <Icon className={s.icon} strokeWidth={2.4} />
    </div>
  );
}
