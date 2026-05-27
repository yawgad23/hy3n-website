import { useState } from "react";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { EMERGENCY } from "@shared/hy3n";
import { LifeBuoy, Phone, ShieldAlert, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { id: "trip_issue", label: "Trip issue" },
  { id: "payment", label: "Payment or commission" },
  { id: "account", label: "Account / verification" },
  { id: "safety", label: "Safety concern" },
  { id: "other", label: "Other" },
] as const;

export default function Support() {
  const { isAuthenticated, loading } = useAuth();
  const [category, setCategory] = useState<typeof CATEGORIES[number]["id"]>("trip_issue");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [userRole, setUserRole] = useState<"driver" | "rider">("rider");

  const mineQ = trpc.support.mine.useQuery(undefined, { enabled: isAuthenticated });
  const utils = trpc.useUtils();
  const submit = trpc.support.submit.useMutation({
    onSuccess: () => { toast.success("Ticket submitted — we'll respond within 24h"); setSubject(""); setDescription(""); utils.support.mine.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-10 flex-1 max-w-4xl">
        <header className="mb-8">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Help & support</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>We've got your back.</h1>
          <p className="text-muted-foreground mt-1.5">Talk to us about trips, payments, and safety. Urgent issues — call right away.</p>
        </header>

        {/* Emergency strip */}
        <Card className="elegant-shadow border-red-200 bg-gradient-to-br from-red-50 to-card p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 grid place-items-center"><ShieldAlert className="w-6 h-6" /></div>
              <div>
                <div className="font-bold">Emergencies — call immediately</div>
                <div className="text-xs text-muted-foreground">Use the SOS button during active trips for instant location sharing.</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${EMERGENCY.POLICE}`}>
                <Button variant="outline" className="rounded-full bg-card border-red-200"><Phone className="w-3.5 h-3.5 mr-2" /> Police {EMERGENCY.POLICE}</Button>
              </a>
              <a href={`tel:${EMERGENCY.AMBULANCE}`}>
                <Button variant="outline" className="rounded-full bg-card border-red-200"><Phone className="w-3.5 h-3.5 mr-2" /> Ambulance {EMERGENCY.AMBULANCE}</Button>
              </a>
            </div>
          </div>
        </Card>

        {/* Submit form */}
        <Card className="elegant-shadow border-border/60 p-6 mb-8">
          <h3 className="font-bold mb-4 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-primary" /> Report an issue</h3>
          {!loading && !isAuthenticated ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Sign in to file a ticket so we can follow up.</p>
              <a href={getLoginUrl("/support")}><Button className="rounded-full">Sign in to continue</Button></a>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submit.mutate({ userRole, category, subject, description }); }} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">I am a</Label>
                  <Select value={userRole} onValueChange={(v) => setUserRole(v as any)}>
                    <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rider">Rider</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                    <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="One line summary" className="mt-1.5 rounded-xl" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us what happened — date, trip, what we should look at." className="mt-1.5 rounded-xl min-h-28" />
              </div>
              <Button type="submit" disabled={submit.isPending || !subject || !description} className="rounded-full">Submit ticket</Button>
            </form>
          )}
        </Card>

        {isAuthenticated && (
          <Card className="elegant-shadow border-border/60 p-6">
            <h3 className="font-bold mb-4">Your tickets</h3>
            {mineQ.isLoading ? <div className="text-sm text-muted-foreground py-4">Loading…</div>
              : (mineQ.data?.length ?? 0) === 0 ? <div className="text-sm text-muted-foreground py-4">No tickets yet.</div> : (
                <div className="space-y-2">
                  {mineQ.data!.map((t) => {
                    const tone = t.status === "resolved" || t.status === "closed" ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : t.status === "in_progress" ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-muted text-muted-foreground border-border";
                    return (
                      <div key={t.id} className="p-3.5 rounded-xl border border-border/60 bg-card">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold">{t.subject}</div>
                          <Badge className={`${tone} border text-xs capitalize`}>{t.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{t.description}</div>
                        <div className="text-xs text-muted-foreground/80 mt-1 capitalize">{t.category.replace("_", " ")} · {new Date(t.createdAt).toLocaleString()}</div>
                      </div>
                    );
                  })}
                </div>
              )}
          </Card>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
