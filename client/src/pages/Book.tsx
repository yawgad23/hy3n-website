import { useMemo, useState } from "react";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, MapPin, Navigation, ArrowRight, Wallet, BadgeCheck, CheckCircle2 } from "lucide-react";
import { RIDE_CATEGORIES, estimateFare, formatCedis, type RideCategoryId } from "@shared/hy3n";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CategoryIcon } from "@/components/hy3n/CategoryIcon";

interface Stop { address: string; }

export default function Book() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLoc] = useLocation();
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [category, setCategory] = useState<RideCategoryId>("standard");
  const [distanceKm, setDistanceKm] = useState<number>(8);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "momo" | "wallet">("cash");
  const [notes, setNotes] = useState("");
  const [riderPhone, setRiderPhone] = useState("");

  const createTrip = trpc.trips.create.useMutation({
    onSuccess: ({ id, fare }) => {
      toast.success(`Trip booked! Fare ${formatCedis(fare)}. Finding a driver…`);
      setLoc(`/trip/${id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Live fare estimate per category
  const estimates = useMemo(() => {
    const totalKm = distanceKm + stops.length * 2.5; // approximate detour
    return RIDE_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      tagline: c.tagline,
      accent: c.accent,
      fare: estimateFare(c.id, totalKm, totalKm * 2.5), // rough duration
    }));
  }, [distanceKm, stops.length]);

  const selected = RIDE_CATEGORIES.find((c) => c.id === category)!;
  const selectedFare = estimates.find((e) => e.id === category)?.fare ?? 0;

  function addStop() {
    if (stops.length >= 3) {
      toast.info("Up to 3 intermediate stops");
      return;
    }
    setStops([...stops, { address: "" }]);
  }
  function updateStop(i: number, value: string) {
    setStops(stops.map((s, idx) => (idx === i ? { ...s, address: value } : s)));
  }
  function removeStop(i: number) {
    setStops(stops.filter((_, idx) => idx !== i));
  }

  function handleBook() {
    if (!isAuthenticated) { window.location.href = getLoginUrl("/book"); return; }
    if (!pickup.trim() || !destination.trim()) { toast.error("Add pickup and destination"); return; }
    createTrip.mutate({
      rideCategory: category,
      pickupAddress: pickup.trim(),
      dropoffAddress: destination.trim(),
      stops: stops.filter((s) => s.address.trim()).map((s, i) => ({ address: s.address.trim(), order: i + 1 })),
      distanceKm,
      durationMin: distanceKm * 2.5,
      paymentMethod,
      riderPhone: riderPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      <section className="container py-10 md:py-14">
        <div className="max-w-3xl">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Book a ride</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            Where would you like to go?
          </h1>
          <p className="text-muted-foreground mt-1.5">Add stops, pick a category, see your fare in GH₵ — instantly.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mt-8">
          {/* LEFT — form */}
          <div className="lg:col-span-3 space-y-5">
            <Card className="p-6 elegant-shadow border-border/60">
              <div className="space-y-4">
                {/* Pickup */}
                <div className="relative">
                  <Label htmlFor="pickup" className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Pickup</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
                    <Input id="pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="e.g. Airport City, Accra" className="pl-10 h-12 rounded-xl" />
                  </div>
                </div>

                {/* Stops */}
                {stops.map((s, i) => (
                  <div key={i} className="relative">
                    <Label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Stop {i + 1}</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/15" />
                      <Input value={s.address} onChange={(e) => updateStop(i, e.target.value)} placeholder="Add an intermediate stop" className="pl-10 pr-10 h-12 rounded-xl" />
                      <button type="button" onClick={() => removeStop(i)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive rounded-md">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Destination */}
                <div className="relative">
                  <Label htmlFor="dest" className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Destination</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-sm bg-foreground" />
                    <Input id="dest" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. East Legon, Accra" className="pl-10 h-12 rounded-xl" />
                  </div>
                </div>

                <Button type="button" variant="ghost" size="sm" onClick={addStop} className="text-primary hover:text-primary -ml-2">
                  <Plus className="w-4 h-4 mr-1.5" /> Add another stop {stops.length > 0 && `(${stops.length}/3)`}
                </Button>
              </div>

              {/* Distance estimate slider */}
              <div className="mt-6 p-4 rounded-xl bg-muted/60 border border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Estimated distance</Label>
                  <span className="font-bold tabular-nums">{distanceKm.toFixed(1)} km</span>
                </div>
                <input type="range" min={1} max={50} step={0.5} value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} className="w-full accent-primary" />
                <p className="text-xs text-muted-foreground mt-1.5">Used for the live fare estimate. Final fare is set after the trip.</p>
              </div>
            </Card>

            {/* Category selector */}
            <Card className="p-6 elegant-shadow border-border/60">
              <h3 className="font-semibold flex items-center gap-2"><Navigation className="w-4 h-4 text-primary" /> Choose your ride</h3>
              <div className="grid sm:grid-cols-2 gap-2.5 mt-4">
                {estimates.map((e) => {
                  const isSel = category === e.id;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setCategory(e.id as RideCategoryId)}
                      className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 ${isSel ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-foreground/30 bg-card"}`}
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIcon id={e.id as RideCategoryId} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold leading-tight">{e.label}</div>
                          <div className="text-xs text-muted-foreground truncate">{e.tagline}</div>
                        </div>
                        <div className="font-bold tabular-nums">{formatCedis(e.fare)}</div>
                      </div>
                      {isSel && <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 elegant-shadow border-border/60">
              <h3 className="font-semibold">Trip details</h3>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Contact phone</Label>
                  <Input value={riderPhone} onChange={(e) => setRiderPhone(e.target.value)} placeholder="e.g. 024XXXXXXX" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Payment</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                    <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="momo">Mobile Money</SelectItem>
                      <SelectItem value="wallet">HY3N Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Notes for driver (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Apartment 3B, ring the bell." className="mt-1.5 rounded-xl resize-none" rows={3} />
              </div>
            </Card>
          </div>

          {/* RIGHT — summary */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Card className="p-6 elegant-shadow border-border/60">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold">
                  <BadgeCheck className="w-4 h-4" /> Trip summary
                </div>
                <div className="mt-4 space-y-2.5 text-sm">
                  <Row icon={<span className="h-2 w-2 rounded-full bg-primary inline-block" />} label="Pickup" value={pickup || "—"} />
                  {stops.map((s, i) => (
                    <Row key={i} icon={<span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />} label={`Stop ${i + 1}`} value={s.address || "—"} />
                  ))}
                  <Row icon={<span className="h-2 w-2 rounded-sm bg-foreground inline-block" />} label="Destination" value={destination || "—"} />
                </div>

                <div className="mt-5 pt-5 border-t border-border/60 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="font-semibold">{selected.label}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-semibold tabular-nums">{(distanceKm + stops.length * 2.5).toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-semibold capitalize">{paymentMethod === "momo" ? "Mobile Money" : paymentMethod}</span>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-border/60 flex items-end justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Estimated fare</div>
                    <div className="text-3xl font-extrabold tabular-nums mt-1" style={{ fontFamily: "var(--font-display)" }}>{formatCedis(selectedFare)}</div>
                  </div>
                  <Wallet className="w-6 h-6 text-primary" />
                </div>

                <Button onClick={handleBook} disabled={createTrip.isPending || loading} size="lg" className="w-full mt-5 h-12 rounded-xl text-base shadow-lg shadow-primary/20">
                  {createTrip.isPending ? "Booking…" : isAuthenticated ? "Confirm booking" : "Sign in to book"}
                  {!createTrip.isPending && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed text-center">
                  By booking you agree to HY3N's terms. Drivers keep 100% of every fare.
                </p>
              </Card>

              <Card className="p-5 border-border/60 bg-card">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="w-4 h-4 text-primary" /> Safety first
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Every trip includes one-tap SOS and live trip sharing. Police 191 • Ambulance 193.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="pt-1.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
        <div className="text-sm font-medium truncate">{value}</div>
      </div>
    </div>
  );
}
