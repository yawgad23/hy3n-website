import { useState } from "react";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatCedis, MOMO } from "@shared/hy3n";
import { Shield, AlertTriangle, CheckCircle2, Users, Wallet, Activity, LifeBuoy, Search } from "lucide-react";

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();

  if (!loading && !isAuthenticated) {
    if (typeof window !== "undefined") window.location.href = getLoginUrl("/admin");
    return null;
  }

  if (!loading && user && user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNav />
        <main className="container py-20 flex-1 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Admin only</h1>
          <p className="text-muted-foreground mt-2">This area is reserved for HY3N administrators.</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-10 flex-1 max-w-6xl">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Operations</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>Admin control center</h1>
          <p className="text-muted-foreground mt-1.5">Manage drivers, confirm MoMo payments, and monitor active trips.</p>
        </header>

        <Tabs defaultValue="drivers">
          <TabsList className="bg-muted/50 rounded-full p-1 mb-6">
            <TabsTrigger value="drivers" className="rounded-full data-[state=active]:bg-card"><Users className="w-3.5 h-3.5 mr-1.5" /> Drivers</TabsTrigger>
            <TabsTrigger value="commissions" className="rounded-full data-[state=active]:bg-card"><Wallet className="w-3.5 h-3.5 mr-1.5" /> Commissions</TabsTrigger>
            <TabsTrigger value="trips" className="rounded-full data-[state=active]:bg-card"><Activity className="w-3.5 h-3.5 mr-1.5" /> Active trips</TabsTrigger>
            <TabsTrigger value="safety" className="rounded-full data-[state=active]:bg-card"><AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Safety</TabsTrigger>
            <TabsTrigger value="tickets" className="rounded-full data-[state=active]:bg-card"><LifeBuoy className="w-3.5 h-3.5 mr-1.5" /> Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers"><DriversTab /></TabsContent>
          <TabsContent value="commissions"><CommissionsTab /></TabsContent>
          <TabsContent value="trips"><ActiveTripsTab /></TabsContent>
          <TabsContent value="safety"><SafetyTab /></TabsContent>
          <TabsContent value="tickets"><TicketsTab /></TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function DriversTab() {
  const [q, setQ] = useState("");
  const list = trpc.drivers.listAll.useQuery();
  const filtered = (list.data ?? []).filter((d) =>
    !q.trim() || d.fullName.toLowerCase().includes(q.toLowerCase()) || d.phone.includes(q) || (d.vehiclePlate ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <Card className="elegant-shadow border-border/60 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-bold">All drivers ({list.data?.length ?? 0})</h3>
        <div className="relative w-72 max-w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, plate" className="rounded-full pl-9" />
        </div>
      </div>
      {list.isLoading ? <Loading /> : filtered.length === 0 ? <Empty msg="No drivers yet." /> : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="py-3 px-2 text-left font-semibold">Driver</th>
                <th className="py-3 px-2 text-left font-semibold">Vehicle</th>
                <th className="py-3 px-2 text-left font-semibold">Status</th>
                <th className="py-3 px-2 text-left font-semibold">Trips</th>
                <th className="py-3 px-2 text-right font-semibold">Daily fee</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-border/40 hover:bg-muted/40">
                  <td className="py-3 px-2">
                    <div className="font-semibold">{d.fullName}</div>
                    <div className="text-xs text-muted-foreground">{d.phone}</div>
                  </td>
                  <td className="py-3 px-2 capitalize">
                    <div>{d.vehicleType}</div>
                    <div className="text-xs text-muted-foreground font-mono">{d.vehiclePlate ?? "—"}</div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge className={d.isOnline ? "bg-emerald-100 text-emerald-800 border-emerald-200 border" : "bg-muted text-muted-foreground border-border border"}>
                      {d.isOnline ? "Online" : "Offline"}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1 capitalize">{d.status.replace("_", " ")}</div>
                  </td>
                  <td className="py-3 px-2 font-mono tabular-nums">{d.totalTrips ?? 0}</td>
                  <td className="py-3 px-2 text-right font-bold tabular-nums">{formatCedis(d.dailyCommissionAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function CommissionsTab() {
  const list = trpc.commissions.listAll.useQuery();
  const utils = trpc.useUtils();
  const gen = trpc.commissions.generateToday.useMutation({
    onSuccess: (r) => { toast.success(`Created ${r.created} commission records for today`); utils.commissions.listAll.invalidate(); },
  });
  const mark = trpc.commissions.markPaid.useMutation({
    onSuccess: () => { toast.success("Payment confirmed"); utils.commissions.listAll.invalidate(); },
  });

  const items = list.data ?? [];
  const pending = items.filter((c) => c.status === "pending" || c.status === "overdue" || c.status === "unpaid");
  const paid = items.filter((c) => c.status === "paid");
  const pendingTotal = pending.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <Card className="elegant-shadow border-border/60 p-6 bg-gradient-to-br from-primary/5 to-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold mb-1">Today's daily commission run</h3>
            <p className="text-sm text-muted-foreground">Charge every active driver their tiered daily fee (GH₵30 for Okada/Delivery, GH₵50 for cars).</p>
            <div className="mt-3 p-3 rounded-xl bg-card border border-border/60 text-xs">
              <div className="font-semibold mb-0.5">MoMo for payments</div>
              <div className="text-muted-foreground">{MOMO.number} · {MOMO.name} ({MOMO.business})</div>
            </div>
          </div>
          <Button onClick={() => gen.mutate()} disabled={gen.isPending} className="rounded-full">Generate today's records</Button>
        </div>
      </Card>

      <Card className="elegant-shadow border-border/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Pending payments ({pending.length})</h3>
          <span className="text-sm text-muted-foreground">Owed total <span className="font-bold text-foreground tabular-nums">{formatCedis(pendingTotal)}</span></span>
        </div>
        {pending.length === 0 ? <Empty msg="All caught up — no pending fees." /> : (
          <div className="space-y-2">
            {pending.map((c) => <CommissionRow key={c.id} c={c} onPay={(ref: string | undefined) => mark.mutate({ id: c.id, reference: ref })} pending={mark.isPending} />)}
          </div>
        )}
      </Card>

      <Card className="elegant-shadow border-border/60 p-6">
        <h3 className="font-bold mb-4">Recent paid ({paid.length})</h3>
        {paid.length === 0 ? <Empty msg="No confirmed payments yet." /> : (
          <div className="space-y-2">{paid.slice(0, 15).map((c) => <CommissionRow key={c.id} c={c} readOnly />)}</div>
        )}
      </Card>
    </div>
  );
}

function CommissionRow({ c, onPay, readOnly, pending }: any) {
  const [ref, setRef] = useState("");
  const tone = c.status === "paid" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : c.status === "pending" ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-red-100 text-red-800 border-red-200";

  return (
    <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-border/60 bg-card">
      <div className="flex-1 min-w-[180px]">
        <div className="font-semibold">{c.driverName}</div>
        <div className="text-xs text-muted-foreground">For {c.forDate} · {c.paymentReference ?? "no reference"}</div>
      </div>
      <div className="text-lg font-bold tabular-nums">{formatCedis(c.amount)}</div>
      <Badge className={`${tone} border text-xs capitalize`}>{c.status}</Badge>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="MoMo ref" className="w-32 rounded-full text-xs" />
          <Button size="sm" disabled={pending} onClick={() => onPay(ref || undefined)} className="rounded-full">Confirm</Button>
        </div>
      )}
    </div>
  );
}

function ActiveTripsTab() {
  const list = trpc.trips.listActive.useQuery();
  return (
    <Card className="elegant-shadow border-border/60 p-6">
      <h3 className="font-bold mb-4">Active trips ({list.data?.length ?? 0})</h3>
      {list.isLoading ? <Loading /> : (list.data?.length ?? 0) === 0 ? <Empty msg="No trips in progress." /> : (
        <div className="space-y-2">
          {list.data!.map((t) => (
            <div key={t.id} className="p-3.5 rounded-xl border border-border/60 bg-card">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-semibold capitalize">{t.rideCategory.replace("_", " ")} · {t.status.replace("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">{t.pickupAddress} → {t.dropoffAddress}</div>
                </div>
                <div className="font-bold tabular-nums">{formatCedis(t.fareEstimate)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SafetyTab() {
  const list = trpc.safety.listActive.useQuery();
  const utils = trpc.useUtils();
  const resolve = trpc.safety.resolve.useMutation({
    onSuccess: () => { toast.success("Alert resolved"); utils.safety.listActive.invalidate(); },
  });

  return (
    <Card className="elegant-shadow border-border/60 p-6">
      <h3 className="font-bold mb-4">Active safety alerts ({list.data?.length ?? 0})</h3>
      {list.isLoading ? <Loading /> : (list.data?.length ?? 0) === 0 ? (
        <div className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <div className="font-semibold">All clear</div>
          <div className="text-sm text-muted-foreground">No active SOS or safety alerts.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {list.data!.map((a) => (
            <div key={a.id} className="p-4 rounded-xl border border-red-200 bg-red-50">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> SOS · {a.userRole}</div>
                  <div className="text-xs text-red-700 mt-1">{a.message ?? "No message"} · Trip {a.tripId ?? "—"}</div>
                  <div className="text-xs text-red-700/80 mt-1">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => resolve.mutate({ id: a.id })} disabled={resolve.isPending} className="rounded-full bg-card border-red-300">Mark resolved</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function TicketsTab() {
  const list = trpc.support.listAll.useQuery();
  return (
    <Card className="elegant-shadow border-border/60 p-6">
      <h3 className="font-bold mb-4">Support tickets ({list.data?.length ?? 0})</h3>
      {list.isLoading ? <Loading /> : (list.data?.length ?? 0) === 0 ? <Empty msg="No tickets yet." /> : (
        <div className="space-y-2">
          {list.data!.map((t) => (
            <div key={t.id} className="p-3.5 rounded-xl border border-border/60 bg-card">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{t.subject}</div>
                <Badge className="capitalize" variant="outline">{t.category.replace("_", " ")}</Badge>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
              <div className="text-xs text-muted-foreground/80 mt-1">{t.userRole} · {t.status} · {new Date(t.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Loading() { return <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>; }
function Empty({ msg }: { msg: string }) { return <div className="py-8 text-center text-sm text-muted-foreground">{msg}</div>; }
