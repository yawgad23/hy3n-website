import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { CategoryIcon } from "@/components/hy3n/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCedis, EMERGENCY, QUICK_REPLIES_RIDER, COMPLIMENTS, type RideCategoryId } from "@shared/hy3n";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { MapPin, ShieldAlert, Share2, Phone, Send, Star, MessageCircle, LifeBuoy } from "lucide-react";
import { TripMap } from "@/components/hy3n/TripMap";

export default function Trip() {
  const params = useParams<{ id: string }>();
  const tripId = Number(params.id);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const tripQ = trpc.trips.get.useQuery({ id: tripId }, { refetchInterval: 6000, enabled: !!tripId && isAuthenticated });
  const messagesQ = trpc.messages.list.useQuery({ tripId }, { refetchInterval: 5000, enabled: !!tripId && isAuthenticated });
  const sendMsg = trpc.messages.send.useMutation({ onSuccess: () => utils.messages.list.invalidate({ tripId }) });
  const sos = trpc.safety.sos.useMutation({ onSuccess: () => toast.success("SOS alert sent. Stay safe.") });
  const submitFeedback = trpc.feedback.submit.useMutation({ onSuccess: () => toast.success("Feedback sent. Thank you!") });

  const [chatText, setChatText] = useState("");
  const [rating, setRating] = useState(5);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNav />
        <main className="container py-20 flex-1 grid place-items-center">
          <Card className="p-8 max-w-md text-center elegant-shadow">
            <h2 className="text-2xl font-bold mb-2">Sign in required</h2>
            <p className="text-muted-foreground mb-6">View your trip status, message your driver and access safety tools.</p>
            <Button onClick={() => (window.location.href = getLoginUrl(`/trip/${tripId}`))} className="rounded-full">Sign in</Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const trip = tripQ.data;
  const status = trip?.status ?? "loading";

  const statusMeta = useMemo(() => {
    switch (status) {
      case "pending": return { label: "Finding a driver", tone: "bg-amber-100 text-amber-800 border-amber-200" };
      case "matched": return { label: "Driver matched", tone: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      case "en_route_pickup": return { label: "Driver on the way", tone: "bg-blue-100 text-blue-800 border-blue-200" };
      case "arrived_pickup": return { label: "Driver has arrived", tone: "bg-blue-100 text-blue-900 border-blue-300" };
      case "in_progress": return { label: "On trip", tone: "bg-violet-100 text-violet-800 border-violet-200" };
      case "completed": return { label: "Completed", tone: "bg-emerald-100 text-emerald-900 border-emerald-300" };
      case "cancelled": return { label: "Cancelled", tone: "bg-red-100 text-red-800 border-red-200" };
      default: return { label: "Loading…", tone: "bg-muted text-foreground border-border" };
    }
  }, [status]);

  function shareTrip() {
    const url = `${window.location.origin}/trip/${tripId}`;
    if (navigator.share) {
      navigator.share({ title: "HY3N trip", text: "Follow my HY3N trip", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Trip link copied to clipboard");
    }
  }

  function triggerSOS() {
    sos.mutate({ userRole: "rider", tripId, message: "Rider requested emergency assistance" });
  }

  function sendChat(body?: string) {
    const t = (body ?? chatText).trim();
    if (!t) return;
    sendMsg.mutate({ tripId, body: t, senderRole: "rider", isQuickReply: !!body });
    setChatText("");
  }

  function submitRating() {
    if (!trip?.driverId) return;
    submitFeedback.mutate({ tripId, driverId: trip.driverId, rating, compliments: picked, comment: comment.trim() || undefined });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-10 flex-1 grid lg:grid-cols-3 gap-6">
        {/* Trip summary */}
        <section className="lg:col-span-2 space-y-6">
          <Card className="elegant-shadow border-border/60 p-0 overflow-hidden">
            <div className="p-6 flex flex-wrap items-center gap-4 justify-between border-b border-border/60">
              <div className="flex items-center gap-3">
                {trip && <CategoryIcon id={trip.rideCategory as RideCategoryId} size="lg" />}
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Trip #{tripId}</div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {trip ? trip.rideCategory.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Loading"}
                  </h1>
                </div>
              </div>
              <Badge className={`border ${statusMeta.tone} font-semibold`}>{statusMeta.label}</Badge>
            </div>

            <div className="p-6 grid sm:grid-cols-2 gap-5">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Pickup</div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1 w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0" />
                  <p className="font-medium">{trip?.pickupAddress ?? "—"}</p>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Destination</div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="font-medium">{trip?.dropoffAddress ?? "—"}</p>
                </div>
              </div>
              {Array.isArray(trip?.stops) && (trip!.stops as any[]).length > 0 && (
                <div className="sm:col-span-2">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Stops</div>
                  <ul className="space-y-1.5">
                    {(trip!.stops as any[]).map((s, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <span className="w-5 h-5 rounded-full bg-muted text-xs font-bold grid place-items-center">{i + 1}</span>
                        {s.address}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Fare estimate</div>
                <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
                  {formatCedis(trip?.fareEstimate)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1.5">Payment</div>
                <div className="font-semibold capitalize">{trip?.paymentMethod ?? "cash"}</div>
              </div>
            </div>
          </Card>

          {/* Live trip map */}
          {trip && (
            <TripMap
              pickup={{ lat: trip.pickupLat, lng: trip.pickupLng, address: trip.pickupAddress }}
              dropoff={{ lat: trip.dropoffLat, lng: trip.dropoffLng, address: trip.dropoffAddress }}
              phase={status === "in_progress" ? "trip" : "pickup"}
            />
          )}

          {/* Safety toolkit */}
          <Card className="elegant-shadow border-border/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="font-bold">Safety toolkit</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Button variant="destructive" className="rounded-xl h-12 font-bold" onClick={triggerSOS} disabled={sos.isPending}>
                <ShieldAlert className="w-4 h-4 mr-1.5" /> SOS Emergency
              </Button>
              <Button variant="outline" className="rounded-xl h-12 bg-card" onClick={shareTrip}>
                <Share2 className="w-4 h-4 mr-1.5" /> Share trip
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <a href={`tel:${EMERGENCY.POLICE}`}>
                  <Button variant="outline" className="rounded-xl h-12 bg-card w-full text-xs">
                    <Phone className="w-3.5 h-3.5 mr-1" /> Police {EMERGENCY.POLICE}
                  </Button>
                </a>
                <a href={`tel:${EMERGENCY.AMBULANCE}`}>
                  <Button variant="outline" className="rounded-xl h-12 bg-card w-full text-xs">
                    <Phone className="w-3.5 h-3.5 mr-1" /> Amb. {EMERGENCY.AMBULANCE}
                  </Button>
                </a>
              </div>
            </div>
          </Card>

          {/* Feedback (after completion) */}
          {status === "completed" && trip?.driverId && (
            <Card className="elegant-shadow border-border/60 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold">Rate your trip</h3>
              </div>
              <div className="flex items-center gap-1.5 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`w-8 h-8 transition-transform ${n <= rating ? "fill-amber-400 text-amber-400 scale-110" : "text-muted-foreground/40"}`} />
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {COMPLIMENTS.map((c) => {
                  const sel = picked.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPicked(sel ? picked.filter((x) => x !== c) : [...picked, c])}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border/60 hover:border-primary/40"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment (optional)" className="mb-3 rounded-xl" />
              <Button onClick={submitRating} disabled={submitFeedback.isPending} className="rounded-full">Submit feedback</Button>
            </Card>
          )}
        </section>

        {/* Chat & meta */}
        <aside className="space-y-6">
          <Card className="elegant-shadow border-border/60 p-0 overflow-hidden flex flex-col h-[28rem]">
            <div className="p-4 border-b border-border/60 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Chat with driver</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {(messagesQ.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Messages appear here once a driver is matched.</p>
              ) : (
                (messagesQ.data ?? []).map((m) => (
                  <div key={m.id} className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.senderRole === "rider" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.body}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border/60 p-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES_RIDER.map((q) => (
                  <button key={q} onClick={() => sendChat(q)} className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-card hover:bg-muted transition-colors">
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Type a message" className="rounded-xl" onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <Button onClick={() => sendChat()} disabled={sendMsg.isPending} size="icon" className="rounded-xl"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>

          <Card className="elegant-shadow border-border/60 p-5">
            <div className="flex items-center gap-2 mb-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <h3 className="font-semibold">Need help?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Report an issue with this trip or contact support.</p>
            <Link href="/support">
              <Button variant="outline" className="rounded-full bg-card w-full">Open support center</Button>
            </Link>
          </Card>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}
