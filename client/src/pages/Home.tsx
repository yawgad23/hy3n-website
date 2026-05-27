import { SiteNav } from "@/components/hy3n/SiteNav";
import { SiteFooter } from "@/components/hy3n/SiteFooter";
import { CategoryIcon } from "@/components/hy3n/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, MapPin, BadgeCheck, Clock, Bike, Car, Zap } from "lucide-react";
import { RIDE_CATEGORIES, formatCedis, type RideCategory } from "@shared/hy3n";

function CategoryCard({ cat }: { cat: RideCategory }) {
  return (
    <Card className="group relative overflow-hidden border-border/60 hover:border-primary/40 transition-all duration-300 hover:-translate-y-0.5 elegant-shadow p-0">
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${cat.gradient[0]}, ${cat.gradient[1]})` }} />
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <CategoryIcon id={cat.id} size="lg" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {cat.vehicle === "motorcycle" ? "2-wheeler" : cat.vehicle === "van" ? "Van" : "Sedan"}
          </span>
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {cat.label}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{cat.tagline}</p>
        </div>
        <div className="pt-3 border-t border-border/60 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">From</div>
            <div className="font-bold text-lg tabular-nums">{formatCedis(cat.minFare)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Per km</div>
            <div className="font-semibold tabular-nums">{formatCedis(cat.perKm)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />

      {/* HERO */}
      <section className="relative bg-mesh overflow-hidden">
        <div className="container pt-20 pb-24 md:pt-28 md:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-7">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border/60 text-xs font-medium text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Now live in Greater Accra & Kumasi
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-balance" style={{ fontFamily: "var(--font-display)" }}>
              Ghana's most <span className="bg-gradient-to-r from-primary via-emerald-600 to-amber-600 bg-clip-text text-transparent">elegant ride</span>, on demand.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
              From everyday Standard rides to luxurious Kantanka and lightning-fast Okada. HY3N moves you — and your parcels — with care, transparency and pride.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/book">
                <Button size="lg" className="rounded-full px-7 h-12 text-base shadow-lg shadow-primary/20">
                  Book a ride <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/drive">
                <Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-base bg-card">
                  Drive with HY3N
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> In-app SOS</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Live trip share</div>
              <div className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-primary" /> Verified drivers</div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> 24/7 support</div>
            </div>
          </div>

          {/* Hero card */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-amber-400/10 to-transparent blur-2xl" />
              <Card className="relative elegant-shadow border-border/60 p-0 overflow-hidden">
                <div className="p-6 border-b border-border/60 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Quick fare</span>
                  <span className="text-xs text-muted-foreground">Accra → Airport</span>
                </div>
                <div className="p-6 space-y-3.5">
                  {RIDE_CATEGORIES.slice(0, 4).map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <CategoryIcon id={cat.id} size="md" />
                        <div>
                          <div className="font-semibold text-sm">{cat.label}</div>
                          <div className="text-xs text-muted-foreground">{cat.tagline}</div>
                        </div>
                      </div>
                      <div className="font-bold tabular-nums">{formatCedis(cat.minFare + cat.perKm * 12)}</div>
                    </div>
                  ))}
                </div>
                <div className="p-6 pt-0">
                  <Link href="/book"><Button className="w-full rounded-xl h-11">Continue to booking</Button></Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="container py-20">
        <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">Ride categories</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 tracking-tight text-balance" style={{ fontFamily: "var(--font-display)" }}>
              A category for every moment, every budget.
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Transparent GH₵ pricing. No surprises. From a quick Okada hop to an Executive black-car
              experience or same-hour parcel delivery.
            </p>
          </div>
          <Link href="/book">
            <Button variant="outline" className="rounded-full">
              Compare all <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RIDE_CATEGORIES.map((c) => <CategoryCard key={c.id} cat={c} />)}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-card/60 border-y border-border/60">
        <div className="container py-20 grid md:grid-cols-2 gap-14">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">For riders</span>
            <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-7 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Three taps to your ride.
            </h3>
            <ol className="space-y-5">
              {[
                ["Enter pickup & destination", "Add up to 3 stops along the way."],
                ["Pick a category", "Live fare estimate in GH₵."],
                ["Track & travel safe", "Share your trip, SOS one tap away."],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-4">
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground grid place-items-center font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{title}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/book"><Button className="mt-7 rounded-full">Book your first ride</Button></Link>
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-accent-foreground font-semibold">For drivers</span>
            <h3 className="text-2xl md:text-3xl font-bold mt-2 mb-7 tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Keep 100% of every fare.
            </h3>
            <div className="grid sm:grid-cols-2 gap-3.5">
              <Card className="p-5 border-border/60">
                <Bike className="w-7 h-7 text-orange-500 mb-2.5" />
                <div className="font-bold text-lg">GH₵30 / day</div>
                <div className="text-sm text-muted-foreground">Okada & Express Delivery</div>
              </Card>
              <Card className="p-5 border-border/60">
                <Car className="w-7 h-7 text-primary mb-2.5" />
                <div className="font-bold text-lg">GH₵50 / day</div>
                <div className="text-sm text-muted-foreground">Cars & SUVs</div>
              </Card>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Live demand heatmap</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Tiered fixed daily fee — no per-trip commission</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Pay daily via MoMo, stay online</li>
            </ul>
            <Link href="/drive"><Button variant="outline" className="mt-7 rounded-full bg-card">Become a driver</Button></Link>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 text-primary-foreground elegant-shadow">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 0%, transparent 40%), radial-gradient(circle at 80% 80%, white 0%, transparent 40%)" }} />
          <div className="relative p-10 md:p-16 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-balance" style={{ fontFamily: "var(--font-display)" }}>
                Ready to move? Your driver is closer than you think.
              </h3>
              <p className="mt-3 text-primary-foreground/85 max-w-md">
                Open HY3N, set your destination, and ride with confidence.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Link href="/book"><Button size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90 px-7">Book a ride</Button></Link>
              <Link href="/drive"><Button size="lg" variant="outline" className="rounded-full bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-7">Drive with HY3N</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
