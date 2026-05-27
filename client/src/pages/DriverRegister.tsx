import { useState } from "react";
import { useLocation, Link } from "wouter";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { CategoryIcon } from "@/components/hy3n/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RIDE_CATEGORIES, DAILY_COMMISSION, formatCedis, type RideCategoryId } from "@shared/hy3n";
import { Bike, Car, Truck, Package, Shield, CheckCircle2, ArrowRight } from "lucide-react";

const VEHICLES = [
  { id: "car" as const, label: "Car (Sedan)", icon: Car, fee: DAILY_COMMISSION.car, defaultCats: ["standard", "comfort"] },
  { id: "suv" as const, label: "SUV / 4x4", icon: Car, fee: DAILY_COMMISSION.car, defaultCats: ["standard", "comfort", "executive"] },
  { id: "motorcycle" as const, label: "Motorcycle (Okada)", icon: Bike, fee: DAILY_COMMISSION.okada, defaultCats: ["okada"] },
  { id: "van" as const, label: "Van (Delivery)", icon: Truck, fee: DAILY_COMMISSION.delivery, defaultCats: ["express_delivery"] },
];

export default function DriverRegister() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLoc] = useLocation();
  const utils = trpc.useUtils();
  const meQ = trpc.drivers.me.useQuery(undefined, { enabled: isAuthenticated });
  const register = trpc.drivers.register.useMutation({
    onSuccess: () => { toast.success("Welcome aboard! Profile created."); utils.drivers.me.invalidate(); setLoc("/driver"); },
    onError: (e) => toast.error(e.message),
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleType, setVehicleType] = useState<"car" | "suv" | "motorcycle" | "van">("car");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState<string>("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [rideCategories, setRideCategories] = useState<RideCategoryId[]>(["standard"]);
  const [hasHelmet, setHasHelmet] = useState(false);
  const [hasDeliveryBox, setHasDeliveryBox] = useState(false);

  if (!loading && !isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = getLoginUrl("/driver/register");
    return null;
  }
  if (meQ.data) {
    // Already registered
    if (typeof window !== "undefined") setLoc("/driver");
    return null;
  }

  const v = VEHICLES.find((x) => x.id === vehicleType)!;
  const isBike = vehicleType === "motorcycle" || vehicleType === "van";
  const availableCats = isBike
    ? RIDE_CATEGORIES.filter((c) => c.vehicle !== "car")
    : RIDE_CATEGORIES.filter((c) => c.vehicle === "car");

  function toggleCat(id: RideCategoryId) {
    setRideCategories((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function switchVehicle(id: typeof vehicleType) {
    setVehicleType(id);
    const veh = VEHICLES.find((x) => x.id === id)!;
    setRideCategories(veh.defaultCats as RideCategoryId[]);
  }

  function submit() {
    if (!fullName.trim() || !phone.trim()) return toast.error("Full name and phone required");
    if (rideCategories.length === 0) return toast.error("Pick at least one ride category");
    register.mutate({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      vehicleType,
      vehicleMake: vehicleMake.trim() || undefined,
      vehicleModel: vehicleModel.trim() || undefined,
      vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      vehicleColor: vehicleColor.trim() || undefined,
      rideCategories,
      hasHelmet,
      hasDeliveryBox,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-10 flex-1 max-w-3xl">
        <div className="mb-8">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Driver registration</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Drive with HY3N
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Keep 100% of every fare. Pay a flat daily fee in Ghanaian cedis — no surprises, no per-trip commissions.
          </p>
        </div>

        <div className="space-y-6">
          {/* Personal info */}
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-4">Your details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl mt-1.5" placeholder="Kwame Mensah" /></div>
              <div><Label>Phone (MoMo)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl mt-1.5" placeholder="0541234567" /></div>
              <div><Label>Email (optional)</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl mt-1.5" placeholder="you@example.com" /></div>
            </div>
          </Card>

          {/* Vehicle type */}
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-1">Vehicle type</h3>
            <p className="text-sm text-muted-foreground mb-4">Determines your daily commission tier.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {VEHICLES.map((veh) => {
                const sel = vehicleType === veh.id;
                const Icon = veh.icon;
                return (
                  <button
                    key={veh.id}
                    type="button"
                    onClick={() => switchVehicle(veh.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${sel ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-foreground/30 bg-card"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-muted grid place-items-center"><Icon className="w-5 h-5" /></div>
                        <div>
                          <div className="font-semibold">{veh.label}</div>
                          <div className="text-xs text-muted-foreground tabular-nums">{formatCedis(veh.fee)} / day</div>
                        </div>
                      </div>
                      {sel && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              <div><Label>Make</Label><Input value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} className="rounded-xl mt-1.5" placeholder="Toyota" /></div>
              <div><Label>Model</Label><Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="rounded-xl mt-1.5" placeholder="Corolla" /></div>
              <div><Label>Year</Label><Input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="rounded-xl mt-1.5" type="number" placeholder="2018" /></div>
              <div><Label>Plate number</Label><Input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} className="rounded-xl mt-1.5" placeholder="GR 1234-22" /></div>
              <div><Label>Color</Label><Input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} className="rounded-xl mt-1.5" placeholder="Silver" /></div>
            </div>

            {isBike && (
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors">
                  <Checkbox checked={hasHelmet} onCheckedChange={(v) => setHasHelmet(Boolean(v))} />
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Spare helmet provided</span>
                </label>
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card cursor-pointer hover:border-primary/40 transition-colors">
                  <Checkbox checked={hasDeliveryBox} onCheckedChange={(v) => setHasDeliveryBox(Boolean(v))} />
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Delivery box mounted</span>
                </label>
              </div>
            )}
          </Card>

          {/* Ride categories */}
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-1">Ride categories you accept</h3>
            <p className="text-sm text-muted-foreground mb-4">Pick all that match your vehicle.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {availableCats.map((c) => {
                const sel = rideCategories.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={`flex items-center gap-3 text-left p-3.5 rounded-xl border transition-all ${sel ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-foreground/30 bg-card"}`}
                  >
                    <CategoryIcon id={c.id} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{c.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{c.tagline}</div>
                    </div>
                    {sel && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Link href="/"><Button variant="ghost">Cancel</Button></Link>
            <Button onClick={submit} disabled={register.isPending} size="lg" className="rounded-full">
              Complete registration <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
