// HY3N shared constants — used by both client and server

export const CURRENCY_SYMBOL = "GH₵";

export const EMERGENCY = {
  POLICE: "191",
  AMBULANCE: "193",
} as const;

export const MOMO = {
  number: "0546728330",
  name: "Gad Agyeman Nyantakyi",
  business: "Guydad Enterprise",
} as const;

export const DAILY_COMMISSION = {
  okada: 30,
  delivery: 30,
  car: 50,
} as const;

export type RideCategoryId =
  | "standard"
  | "comfort"
  | "kantanka"
  | "executive"
  | "okada"
  | "express_delivery";

export interface RideCategory {
  id: RideCategoryId;
  label: string;
  tagline: string;
  baseFare: number;
  perKm: number;
  perMin: number;
  minFare: number;
  capacity: number;
  vehicle: "car" | "motorcycle" | "van";
  accent: string; // tailwind class string (still used as label)
  gradient: [string, string]; // explicit hex colors for reliable rendering
}

export const RIDE_CATEGORIES: RideCategory[] = [
  {
    id: "standard",
    label: "Standard",
    tagline: "Affordable everyday rides",
    baseFare: 5,
    perKm: 2.2,
    perMin: 0.3,
    minFare: 12,
    capacity: 4,
    vehicle: "car",
    accent: "from-sky-500 to-blue-600",
    gradient: ["#0ea5e9", "#2563eb"],
  },
  {
    id: "comfort",
    label: "Comfort",
    tagline: "Newer cars, more space",
    baseFare: 7,
    perKm: 3.0,
    perMin: 0.4,
    minFare: 18,
    capacity: 4,
    vehicle: "car",
    accent: "from-violet-500 to-purple-600",
    gradient: ["#8b5cf6", "#9333ea"],
  },
  {
    id: "kantanka",
    label: "Kantanka",
    tagline: "Made-in-Ghana luxury",
    baseFare: 10,
    perKm: 4.0,
    perMin: 0.5,
    minFare: 25,
    capacity: 4,
    vehicle: "car",
    accent: "from-amber-500 to-orange-600",
    gradient: ["#f59e0b", "#ea580c"],
  },
  {
    id: "executive",
    label: "Executive",
    tagline: "Premium black-car service",
    baseFare: 15,
    perKm: 5.5,
    perMin: 0.7,
    minFare: 40,
    capacity: 4,
    vehicle: "car",
    accent: "from-slate-700 to-zinc-900",
    gradient: ["#334155", "#18181b"],
  },
  {
    id: "okada",
    label: "Okada",
    tagline: "Fast motorcycle through traffic",
    baseFare: 3,
    perKm: 1.5,
    perMin: 0.2,
    minFare: 8,
    capacity: 1,
    vehicle: "motorcycle",
    accent: "from-orange-500 to-red-600",
    gradient: ["#f97316", "#dc2626"],
  },
  {
    id: "express_delivery",
    label: "Express Delivery",
    tagline: "Same-hour parcel delivery",
    baseFare: 5,
    perKm: 2.0,
    perMin: 0.2,
    minFare: 15,
    capacity: 0,
    vehicle: "motorcycle",
    accent: "from-emerald-500 to-green-600",
    gradient: ["#10b981", "#16a34a"],
  },
];

export function getCategory(id: RideCategoryId): RideCategory {
  return RIDE_CATEGORIES.find((c) => c.id === id) ?? RIDE_CATEGORIES[0];
}

export function estimateFare(categoryId: RideCategoryId, distanceKm: number, durationMin: number = 0): number {
  const c = getCategory(categoryId);
  const raw = c.baseFare + c.perKm * Math.max(0, distanceKm) + c.perMin * Math.max(0, durationMin);
  return Math.max(c.minFare, Math.round(raw * 100) / 100);
}

export function getDailyCommissionForVehicle(vehicleType: string): number {
  if (vehicleType === "motorcycle" || vehicleType === "van") return DAILY_COMMISSION.okada;
  return DAILY_COMMISSION.car;
}

export function formatCedis(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (Number.isNaN(n)) return `${CURRENCY_SYMBOL}0.00`;
  return `${CURRENCY_SYMBOL}${n.toFixed(2)}`;
}

export const COMPLIMENTS = [
  "Great Conversation",
  "Expert Navigation",
  "Clean Vehicle",
  "Smooth Driving",
  "On-Time Pickup",
  "Friendly",
  "Safe Driver",
  "Helpful with Luggage",
] as const;

export const QUICK_REPLIES_DRIVER = [
  "On my way!",
  "I've arrived",
  "I'm in traffic",
  "Can you describe the location?",
  "Please come outside",
  "Thanks!",
] as const;

export const QUICK_REPLIES_RIDER = [
  "Thank you!",
  "I'm coming out",
  "Please wait 2 minutes",
  "Look for me at the entrance",
  "Where are you?",
] as const;
