import { useMemo } from "react";
import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Star, Award, MessageCircle, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

export default function DriverFeedback() {
  const { isAuthenticated, loading } = useAuth();
  const fbQ = trpc.feedback.forDriver.useQuery(undefined, { enabled: isAuthenticated });

  const feedback = fbQ.data ?? [];
  const stats = useMemo(() => {
    if (feedback.length === 0) return { avg: 0, count: 0, complimentsByLabel: [] as { label: string; count: number }[] };
    const total = feedback.reduce((s, f) => s + (f.rating ?? 0), 0);
    const tally = new Map<string, number>();
    for (const f of feedback) {
      const list = (f.compliments as string[]) ?? [];
      for (const c of list) tally.set(c, (tally.get(c) ?? 0) + 1);
    }
    return {
      avg: total / feedback.length,
      count: feedback.length,
      complimentsByLabel: Array.from(tally.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
    };
  }, [feedback]);

  if (!loading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteNav />
        <main className="container py-20 flex-1 grid place-items-center">
          <Card className="p-8 max-w-md text-center elegant-shadow">
            <h2 className="text-2xl font-bold mb-2">Sign in</h2>
            <p className="text-muted-foreground mb-6">Sign in as a driver to view your feedback.</p>
            <Button onClick={() => (window.location.href = getLoginUrl("/driver/feedback"))} className="rounded-full">Sign in</Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="container py-10 flex-1 max-w-5xl">
        <Link href="/driver">
          <Button variant="ghost" size="sm" className="mb-4"><ChevronLeft className="w-4 h-4 mr-1" /> Back to dashboard</Button>
        </Link>
        <header className="mb-8">
          <span className="text-xs uppercase tracking-widest text-primary font-semibold">Rider feedback</span>
          <h1 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>What riders say about you.</h1>
          <p className="text-muted-foreground mt-1.5">Ratings, compliments and comments from completed trips.</p>
        </header>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="elegant-shadow border-border/60 p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Average rating</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-4xl font-bold tabular-nums" style={{ fontFamily: "var(--font-display)" }}>{stats.avg.toFixed(2)}</div>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-xs text-muted-foreground mt-1">{stats.count} review{stats.count === 1 ? "" : "s"}</div>
          </Card>
          <Card className="elegant-shadow border-border/60 p-5 sm:col-span-2">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Top compliments</div>
            {stats.complimentsByLabel.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-3">Compliments will appear here once you have completed trips.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {stats.complimentsByLabel.map((c) => (
                  <Badge key={c.label} variant="secondary" className="px-3 py-1.5 rounded-full text-xs">
                    <span className="font-semibold mr-1">{c.label}</span> · <span className="text-muted-foreground ml-1">{c.count}</span>
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* List */}
        <Card className="elegant-shadow border-border/60 p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><MessageCircle className="w-4 h-4 text-primary" /> Recent reviews</h3>
          {fbQ.isLoading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
          ) : feedback.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No reviews yet.</div>
          ) : (
            <ul className="divide-y divide-border/50">
              {feedback.map((f) => (
                <li key={f.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${n <= (f.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  {Array.isArray(f.compliments) && (f.compliments as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(f.compliments as string[]).map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                    </div>
                  )}
                  {f.comment && <p className="text-sm mt-2 text-foreground/90 italic">"{f.comment}"</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
