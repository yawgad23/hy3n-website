import { Logo } from "./Logo";
import { Link } from "wouter";
import { Phone, ShieldCheck, MapPin } from "lucide-react";
import { EMERGENCY, MOMO } from "@shared/hy3n";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/60 mt-24">
      <div className="container py-14 grid gap-10 md:grid-cols-4">
        <div className="space-y-4 md:col-span-2">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            HY3N is Ghana's premium ride-hailing and delivery platform. Standard, Comfort, Kantanka, Executive,
            Okada and Express Delivery — all in one elegant app.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" /> Operating across Greater Accra & Kumasi
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Safety</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              In-app SOS with live trip share
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-destructive" />
              Police <span className="font-semibold text-foreground">{EMERGENCY.POLICE}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-destructive" />
              Ambulance <span className="font-semibold text-foreground">{EMERGENCY.AMBULANCE}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-sm">Driver Payments</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>MoMo: <span className="font-semibold text-foreground">{MOMO.number}</span></li>
            <li>{MOMO.name}</li>
            <li>{MOMO.business}</li>
          </ul>
          <div className="mt-4 space-y-1.5 text-sm">
            <Link href="/drive" className="block text-muted-foreground hover:text-foreground transition-colors">Become a driver</Link>
            <Link href="/support" className="block text-muted-foreground hover:text-foreground transition-colors">Support</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 py-5">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} HY3N. All rights reserved.</span>
          <span>Made with care in Ghana 🇬🇭</span>
        </div>
      </div>
    </footer>
  );
}
