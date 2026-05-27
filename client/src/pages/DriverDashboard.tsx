import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { CategoryIcon } from "@/components/hy3n/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { formatCedis, MOMO, type RideCategoryId } from "@shared/hy3n";
import { toast } from "sonner";
import {
  Power, MapPin, Flame, Timer, Wallet, AlertTriangle, ArrowRight, Star,
  Bike, Car, Navigation, ShieldCheck, CheckCircle2, Receipt, Sparkles,
} from "lucide-react";

function Heatmap({ pending }: { pending: any[] }) {
  // Synthesize hotspots from pending trip count by area (mock geographic grid)
  const cells = useMemo(() => {
    const grid: { x: number; y: number; intensity: number }[] = [];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 9; x++) {
        const seed = (x * 13 + y * 7 + pending.length * 5) % 100;
        const intensity = Math.max(0, Math.min(1, (seed / 100) * (0.4 + pending.length * 0.08)));
        grid.push({ x, y, intensity });
      }
    }
    return grid;
  }, [pending.length]);
  return (
    <Card className="elegant-shadow border-border/60 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold">Live demand heatmap</h3>
        </div>
        <Badge variant="outline" className="text-xs">{pending.length} pending nearby</Badge>
      </div>
      <div className="aspect-[9/6] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ring-1 ring-border/60 relative">
        <div className="absolute inset-0 grid grid-cols-9 grid-rows-6 gap-px p-1">
          {cells.map((c, i) => (
            <div
              key={i}
              className="rounded-md transition-all"
              style={{
                background: c.intensity > 0.55
                  ? `radial-gradient(circle, rgba(239,68,68,${c.intensity * 0.85}) 0%, rgba(239,68,68,0) 70%)`
                  : c.intensity > 0.3
                    ? `radial-gradient(circle, rgba(245,158,11,${c.intensity * 0.8}) 0%, rgba(245,158,11,0) 70%)`
                    : c.intensity > 0.1
                      ? `radial-gradient(circle, rgba(16,185,129,${c.intensity * 0.65}) 0%, rgba(16,185,129,0) 70%)`
                      : "transparent",
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-2.5 left-2.5 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground bg-card/85 backdrop-blur px-2 py-1 rounded">Accra metro</div>
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 text-[10px] bg-card/85 backdrop-blur px-2 py-1 rounded">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Mid</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
        </div>
      </div>
    </Card>
  );
}

function ShiftTracker({ online }: { online: boolean }) {
  const [start, setStart] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const dailyGoal = 250;
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (online && !start) setStart(Date.now());
    if (!online) setStart(null);
  }, [online]);
  useEffect(() => {
    if (!start) return;
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, [start]);

  const hours = Math.floor(elapsed / 3_600_000);
  const minutes = Math.floor((elapsed % 3_600_000) / 60_000);
  const seconds = Math.floor((elapsed % 60_000) / 1000);
  const goalPct = Math.min(100, (earned / dailyGoal) * 100);

  return (
    <Card className="elegant-shadow border-border/60 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <h3 className="font-bold">Shift tracker</h3>
        </div>
        <Badge className={online ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-muted text-muted-foreground"}>
          {online ? "Active" : "Off"}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Online" value={`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`} />
        <Stat label="Trips" value="0" />
        <Stat label="Earned" value={formatCedis(earned)} />
      </div>
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Daily goal</span>
          <span className="tabular-nums">{formatCedis(earned)} / {formatCedis(dailyGoal)}</span>
        </div>
        <Progress value={goalPct} className="h-2" />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="font-bold tabular-nums mt-0.5" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}

export default function DriverDashboard() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLoc] = useLocation();
  const meQ = trpc.drivers.me.useQuery(undefined, { enabled: isAuthenticated });
  const blockedQ = trpc.drivers.isBlocked.useQuery(undefined, { enabled: isAuthenticated && !!meQ.data });
  const pendingQ = trpc.trips.listPending.useQuery(undefined, { enabled: isAuthenticated && !!meQ.data, refetchInterval: 8000 });
  const myTripsQ = trpc.trips.listForDriver.useQuery(undefined, { enabled: isAuthenticated && !!meQ.data, refetchInterval: 8000 });
  const feedbackQ = trpc.feedback.forDriver.useQuery(undefined, { enabled: isAuthenticated && !!meQ.data });
  const utils = trpc.useUtils();
  const setOnline = trpc.drivers.setOnline.useMutation({ onSuccess: () => utils.drivers.me.invalidate() });
  const acceptTrip = trpc.trips.accept.useMutation({
    onSuccess: () => { toast.success("Trip accepted"); utils.trips.listPending.invalidate(); utils.trips.listForDriver.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (!loading && !isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = getLoginUrl("/driver");
    return null;
  }
  if (loading || meQ.isLoading) return <div className="min-h-screen bg-background"><SiteNav /><div className="container py-20 text-center text-muted-foreground">Loading dashboard…</div></div>;

  const me = meQ.data;
  // Not registered → push to driver register
  if (!me) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNav />
        <main className="container py-20 flex-1 grid place-items-center">
          <Card className="p-10 max-w-lg text-center elegant-shadow">
            <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Welcome to HY3N</h2>
            <p className="text-muted-foreground mb-6">Register your vehicle to start receiving trip requests.</p>
            <Button onClick={() => setLoc("/driver/register")} className="rounded-full">Register as a driver <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const online = !!me.isOnline;
  const blocked = blockedQ.data?.blocked ?? false;
  const dailyAmount = Number(me.dailyCommissionAmount ?? (me.vehicleType === "motorcycle" || me.vehicleType === "van" ? 30 : 50));

  const completedTrips = (myTripsQ.data ?? []).filter((t) => t.status === "completed");
  const totalEarned = completedTrips.reduce((s, t) => s + Number(t.fareEstimate || 0), 0);
  const avgRating = (feedbackQ.data ?? []).length > 0
    ? ((feedbackQ.data ?? []).reduce((s, f) => s + (f.rating ?? 0), 0) / (feedbackQ.data ?? []).length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-8 flex-1 space-y-6">
        {/* Header card */}
        <Card className="elegant-shadow border-border/60 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-emerald-700 grid place-items-center text-primary-foreground text-xl font-bold shadow-md">
              {me.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Driver</div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{me.fullName}</h1>
              <div className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                {me.vehicleType === "motorcycle" ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                {me.vehiclePlate ?? "Unplated"} · {me.vehicleType}
                <span className="mx-1">•</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {avgRating}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Daily fee</div>
              <div className="font-bold text-lg tabular-nums">{formatCedis(dailyAmount)}</div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full border ${online ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30" : "border-border bg-card"}`}>
              <Power className={`w-4 h-4 ${online ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className="font-semibold text-sm">{online ? "Online" : "Offline"}</span>
              <Switch
                checked={online}
                disabled={blocked}
                onCheckedChange={(v) => {
                  if (v && blocked) { toast.error("Pay your daily commission to go online"); return; }
                  setOnline.mutate({ online: v });
                }}
              />
            </div>
          </div>
        </Card>

        {/* Blocked banner with MoMo instructions */}
        {blocked && (
          <Card className="border-red-300 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/30 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-red-900 dark:text-red-200 text-lg">Requests blocked — pay daily fee to continue</h3>
                <p className="text-sm text-red-800/90 dark:text-red-200/80 mt-0.5">
                  You have {blockedQ.data?.openCount ?? 0} unpaid commission record(s) totalling{" "}
                  <span className="font-bold">{formatCedis((blockedQ.data?.openRecords ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0))}</span>. Send via MoMo to unlock new trips.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-card/80 backdrop-blur p-4 border border-red-200/60">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">MoMo payment details</div>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">Number</div>
                  <div className="font-bold tabular-nums">{MOMO.number}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Account name</div>
                  <div className="font-bold">{MOMO.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Business</div>
                  <div className="font-bold">{MOMO.business}</div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2.5">After sending, contact admin with the MoMo reference to unblock your account.</p>
            </div>
          </Card>
        )}

        {/* Top stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 elegant-shadow border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Today earnings</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{formatCedis(totalEarned)}</div>
            <div className="text-xs text-muted-foreground mt-1">100% of fares — fixed daily fee model</div>
          </Card>
          <Card className="p-5 elegant-shadow border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Completed trips</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{completedTrips.length}</div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </Card>
          <Card className="p-5 elegant-shadow border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{avgRating}</div>
            <div className="text-xs text-muted-foreground mt-1">{(feedbackQ.data ?? []).length} ratings</div>
          </Card>
          <Card className="p-5 elegant-shadow border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Daily commission</span>
              <Receipt className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold mt-2 tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{formatCedis(dailyAmount)}</div>
            <div className="text-xs text-muted-foreground mt-1">{me.vehicleType === "motorcycle" || me.vehicleType === "van" ? "Okada / Delivery" : "Cars & SUVs"}</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Heatmap pending={pendingQ.data ?? []} />

            {/* Pending trip requests */}
            <Card className="elegant-shadow border-border/60 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Available requests</h3>
                </div>
                <Badge variant="outline" className="text-xs">{(pendingQ.data ?? []).length} waiting</Badge>
              </div>
              {(pendingQ.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No pending trips. Stay online — the heatmap shows where demand is highest.</p>
              ) : (
                <div className="space-y-3">
                  {(pendingQ.data ?? []).map((t) => {
                    const cats = (me.rideCategories as string[]) ?? [];
                    const eligible = cats.includes(t.rideCategory);
                    return (
                      <div key={t.id} className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border ${eligible ? "border-border/60 bg-card" : "border-border/40 bg-muted/30 opacity-70"}`}>
                        <CategoryIcon id={t.rideCategory as RideCategoryId} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{t.rideCategory.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                            <Badge variant="outline" className="text-[10px]">{formatCedis(t.fareEstimate)}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground truncate"><span className="text-primary">●</span> {t.pickupAddress} → <span className="text-amber-500">●</span> {t.dropoffAddress}</div>
                        </div>
                        {eligible ? (
                          <Button onClick={() => acceptTrip.mutate({ tripId: t.id })} disabled={blocked || acceptTrip.isPending} className="rounded-full">Accept</Button>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not certified</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <aside className="space-y-6">
            <ShiftTracker online={online} />

            {/* Commission panel */}
            <Card className="elegant-shadow border-border/60 p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Daily commission</h3>
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-primary/8 to-amber-500/8 border border-primary/15 p-4 mb-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">Today's fee</div>
                <div className="text-3xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{formatCedis(dailyAmount)}</div>
                <div className="text-xs text-muted-foreground mt-1">Pay via Mobile Money to {MOMO.business}</div>
              </div>
              <div className="space-y-1.5 text-sm">
                <Row label="MoMo number" value={MOMO.number} mono />
                <Row label="Account name" value={MOMO.name} />
                <Row label="Business" value={MOMO.business} />
              </div>

            </Card>

            <Card className="elegant-shadow border-border/60 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Quick links</h3>
              </div>
              <div className="grid gap-2">
                <Link href="/driver/profile"><Button variant="ghost" className="w-full justify-start">Profile & documents</Button></Link>
                <Link href="/driver/feedback"><Button variant="ghost" className="w-full justify-start">Rider feedback</Button></Link>
                <Link href="/support"><Button variant="ghost" className="w-full justify-start">Support center</Button></Link>
              </div>
            </Card>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">{label}</span>
      <span className={`font-semibold ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}
