import { useState } from "react";
import { Link } from "wouter";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { CategoryIcon } from "@/components/hy3n/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RIDE_CATEGORIES, formatCedis, type RideCategoryId } from "@shared/hy3n";
import { Bike, Car, Truck, FileText, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

const DOC_FIELDS = [
  { key: "licenseUrl" as const, label: "Driver's License", icon: FileText },
  { key: "insuranceUrl" as const, label: "Vehicle Insurance", icon: FileText },
  { key: "roadworthyUrl" as const, label: "Roadworthiness Certificate", icon: FileText },
];

export default function DriverProfile() {
  const { isAuthenticated, loading } = useAuth();
  const meQ = trpc.drivers.me.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const update = trpc.drivers.update.useMutation({
    onSuccess: () => { toast.success("Profile updated"); utils.drivers.me.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (!loading && !isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = getLoginUrl("/driver/profile");
    return null;
  }

  if (meQ.isLoading || !meQ.data) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNav />
        <div className="container py-20 text-center text-muted-foreground flex-1">Loading…</div>
        <SiteFooter />
      </div>
    );
  }

  const me = meQ.data;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-10 flex-1 max-w-4xl">
        <Link href="/driver">
          <Button variant="ghost" size="sm" className="mb-4 -ml-3"><ArrowLeft className="w-4 h-4 mr-1.5" /> Back to dashboard</Button>
        </Link>

        <header className="mb-8">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Driver profile</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {me.fullName}
          </h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1.5">
            {me.vehicleType === "motorcycle" ? <Bike className="w-4 h-4" /> : me.vehicleType === "van" ? <Truck className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            <span className="capitalize">{me.vehicleType}</span>
            <span>•</span>
            <span>{me.vehiclePlate ?? "Unplated"}</span>
            <span>•</span>
            <span>Daily fee {formatCedis(me.dailyCommissionAmount)}</span>
          </div>
        </header>

        <div className="space-y-6">
          {/* Vehicle info */}
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-4">Vehicle</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Row label="Make" value={me.vehicleMake ?? "—"} />
              <Row label="Model" value={me.vehicleModel ?? "—"} />
              <Row label="Year" value={me.vehicleYear?.toString() ?? "—"} />
              <Row label="Color" value={me.vehicleColor ?? "—"} />
              <Row label="Plate" value={me.vehiclePlate ?? "—"} mono />
              <Row label="Type" value={me.vehicleType} />
              {(me.vehicleType === "motorcycle" || me.vehicleType === "van") && (
                <>
                  <Row label="Spare helmet" value={me.hasHelmet ? "Yes" : "No"} />
                  <Row label="Delivery box" value={me.hasDeliveryBox ? "Yes" : "No"} />
                </>
              )}
            </div>
          </Card>

          {/* Ride categories */}
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-1">Ride categories</h3>
            <p className="text-sm text-muted-foreground mb-4">Toggle the categories you currently accept.</p>
            <CategoryPicker
              currentVehicle={me.vehicleType}
              selected={(me.rideCategories as RideCategoryId[]) ?? []}
              onSave={(cats) => update.mutate({ rideCategories: cats })}
              saving={update.isPending}
            />
          </Card>

          {/* Documents */}
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-1">Documents</h3>
            <p className="text-sm text-muted-foreground mb-4">Provide your compliance documents. Paste a secure storage link (admin verifies within 24h).</p>
            <div className="space-y-3">
              {DOC_FIELDS.map((d) => (
                <DocRow
                  key={d.key}
                  fieldKey={d.key}
                  label={d.label}
                  currentUrl={(me as any)[d.key] ?? ""}
                  onSave={(url) => update.mutate({ [d.key]: url } as any)}
                  saving={update.isPending}
                />
              ))}
            </div>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</span>
      <span className={`font-semibold capitalize ${mono ? "font-mono tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}

function CategoryPicker({ currentVehicle, selected, onSave, saving }: {
  currentVehicle: string;
  selected: RideCategoryId[];
  onSave: (cats: RideCategoryId[]) => void;
  saving: boolean;
}) {
  const [picked, setPicked] = useState<RideCategoryId[]>(selected);
  const isBike = currentVehicle === "motorcycle" || currentVehicle === "van";
  const available = isBike ? RIDE_CATEGORIES.filter((c) => c.vehicle !== "car") : RIDE_CATEGORIES.filter((c) => c.vehicle === "car");

  function toggle(id: RideCategoryId) {
    setPicked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  const dirty = JSON.stringify(picked.slice().sort()) !== JSON.stringify(selected.slice().sort());

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        {available.map((c) => {
          const sel = picked.includes(c.id);
          return (
            <button key={c.id} onClick={() => toggle(c.id)} type="button"
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
      <Button onClick={() => onSave(picked)} disabled={!dirty || saving} className="rounded-full">Save changes</Button>
    </>
  );
}

function DocRow({ fieldKey, label, currentUrl, onSave, saving }: {
  fieldKey: string; label: string; currentUrl: string; onSave: (url: string) => void; saving: boolean;
}) {
  const [url, setUrl] = useState(currentUrl);
  const hasDoc = !!currentUrl;
  const dirty = url.trim() !== currentUrl.trim();

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border/60 bg-card">
      <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center"><FileText className="w-5 h-5 text-muted-foreground" /></div>
      <div className="flex-1 min-w-[180px]">
        <div className="font-semibold">{label}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {hasDoc ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border text-xs">Submitted</Badge>
          ) : (
            <Badge variant="outline" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1 inline" /> Required</Badge>
          )}
        </div>
      </div>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="rounded-xl w-64 text-sm" />
      <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={() => onSave(url.trim())} className="rounded-full bg-card">Save</Button>
    </div>
  );
}
