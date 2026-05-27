import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Navigation, MapPin, Flag, Moon, Sun, ExternalLink } from "lucide-react";

interface Coord { lat?: number | string | null; lng?: number | string | null; }
interface Props {
  pickup: Coord & { address?: string };
  dropoff: Coord & { address?: string };
  riderLive?: Coord | null;
  phase?: "pickup" | "trip"; // controls active leg
  forceNight?: boolean;
}

function n(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function nightNow(): boolean {
  const h = new Date().getHours();
  return h >= 18 || h < 6;
}

export function TripMap({ pickup, dropoff, riderLive, phase = "pickup", forceNight }: Props) {
  const [isNight, setIsNight] = useState<boolean>(forceNight ?? nightNow());

  useEffect(() => {
    if (forceNight !== undefined) return;
    const t = setInterval(() => setIsNight(nightNow()), 60_000);
    return () => clearInterval(t);
  }, [forceNight]);

  const a = useMemo(() => ({ lat: n(pickup.lat), lng: n(pickup.lng) }), [pickup.lat, pickup.lng]);
  const b = useMemo(() => ({ lat: n(dropoff.lat), lng: n(dropoff.lng) }), [dropoff.lat, dropoff.lng]);
  const rider = useMemo(() => riderLive ? { lat: n(riderLive.lat), lng: n(riderLive.lng) } : null, [riderLive]);

  // Build a simple SVG diagram with markers + route line.
  // We normalize coordinates into a 0..1 viewport using min/max bounds.
  const points = [a, b, rider].filter((p): p is { lat: number; lng: number } => !!(p && p.lat !== null && p.lng !== null));
  const hasGeo = points.length >= 2;
  let aPx = { x: 25, y: 70 }, bPx = { x: 75, y: 30 }, rPx: { x: number; y: number } | null = null;
  if (hasGeo) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const padding = 0.02;
    const minLat = Math.min(...lats) - padding, maxLat = Math.max(...lats) + padding;
    const minLng = Math.min(...lngs) - padding, maxLng = Math.max(...lngs) + padding;
    const norm = (lat: number, lng: number) => ({
      x: ((lng - minLng) / Math.max(0.0001, maxLng - minLng)) * 90 + 5,
      y: 95 - ((lat - minLat) / Math.max(0.0001, maxLat - minLat)) * 90,
    });
    if (a.lat !== null && a.lng !== null) aPx = norm(a.lat, a.lng);
    if (b.lat !== null && b.lng !== null) bPx = norm(b.lat, b.lng);
    if (rider && rider.lat !== null && rider.lng !== null) rPx = norm(rider.lat!, rider.lng!);
  }

  // External GPS launchers
  const target = phase === "pickup" ? { lat: a.lat, lng: a.lng, label: pickup.address ?? "Pickup" } : { lat: b.lat, lng: b.lng, label: dropoff.address ?? "Destination" };
  const hasTarget = target.lat !== null && target.lng !== null;
  const gmapsUrl = hasTarget ? `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(target.label)}`;
  const wazeUrl = hasTarget ? `https://www.waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes` : `https://www.waze.com/ul?q=${encodeURIComponent(target.label)}`;

  // Themes
  const bg = isNight ? "linear-gradient(135deg, #0b1220 0%, #111827 100%)" : "linear-gradient(135deg, #f7fafc 0%, #e8edf3 100%)";
  const grid = isNight ? "rgba(148, 163, 184, 0.07)" : "rgba(15, 23, 42, 0.06)";
  const route = isNight ? "#60a5fa" : "#1d4ed8";
  const ink = isNight ? "#e5e7eb" : "#0f172a";

  return (
    <div className="rounded-2xl overflow-hidden border border-border/60 elegant-shadow">
      <div className="relative w-full" style={{ background: bg, aspectRatio: "16 / 9" }}>
        {/* Grid backdrop */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="hy3nGrid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke={grid} strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#hy3nGrid)" />

          {/* Route */}
          <path
            d={`M ${aPx.x} ${aPx.y} Q ${(aPx.x + bPx.x) / 2} ${(aPx.y + bPx.y) / 2 - 12} ${bPx.x} ${bPx.y}`}
            fill="none" stroke={route} strokeWidth="0.9" strokeLinecap="round" strokeDasharray="2 1.4"
            opacity={0.9}
          />

          {/* Marker A (pickup) */}
          <g transform={`translate(${aPx.x} ${aPx.y})`}>
            <circle r="2.4" fill="#16a34a" stroke="white" strokeWidth="0.7" />
            <text y="-3.2" textAnchor="middle" fontSize="2.8" fontWeight="700" fill={ink} style={{ fontFamily: "Inter, sans-serif" }}>A</text>
          </g>
          {/* Marker B (destination) */}
          <g transform={`translate(${bPx.x} ${bPx.y})`}>
            <circle r="2.4" fill="#dc2626" stroke="white" strokeWidth="0.7" />
            <text y="-3.2" textAnchor="middle" fontSize="2.8" fontWeight="700" fill={ink} style={{ fontFamily: "Inter, sans-serif" }}>B</text>
          </g>
          {/* Rider live dot (only during pickup phase) */}
          {rPx && phase === "pickup" && (
            <g transform={`translate(${rPx.x} ${rPx.y})`}>
              <circle r="2.8" fill="#3b82f6" opacity="0.25">
                <animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0;0.35" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle r="1.4" fill="#3b82f6" stroke="white" strokeWidth="0.5" />
            </g>
          )}
        </svg>

        {/* Night/day badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur"
          style={{ background: isNight ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.7)", color: ink, border: `1px solid ${isNight ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.08)"}` }}>
          {isNight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
          {isNight ? "Night mode" : "Day mode"}
        </div>

        {/* Phase label */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize backdrop-blur"
          style={{ background: isNight ? "rgba(15, 23, 42, 0.6)" : "rgba(255, 255, 255, 0.7)", color: ink, border: `1px solid ${isNight ? "rgba(148,163,184,0.25)" : "rgba(15,23,42,0.08)"}` }}>
          {phase === "pickup" ? "Heading to pickup (A)" : "On trip → (B)"}
        </div>

        {/* Address overlay */}
        <div className="absolute bottom-3 inset-x-3 grid sm:grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl px-3 py-2 backdrop-blur flex items-start gap-2"
            style={{ background: isNight ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.85)", color: ink }}>
            <MapPin className="w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-70 font-semibold">Pickup (A)</div>
              <div className="font-medium leading-tight">{pickup.address ?? "—"}</div>
            </div>
          </div>
          <div className="rounded-xl px-3 py-2 backdrop-blur flex items-start gap-2"
            style={{ background: isNight ? "rgba(15, 23, 42, 0.65)" : "rgba(255, 255, 255, 0.85)", color: ink }}>
            <Flag className="w-3.5 h-3.5 mt-0.5 text-red-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-widest opacity-70 font-semibold">Destination (B)</div>
              <div className="font-medium leading-tight">{dropoff.address ?? "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* External GPS launcher */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-card border-t border-border/60">
        <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Open in</span>
        <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="rounded-full bg-card h-8"><ExternalLink className="w-3 h-3 mr-1.5" /> Google Maps</Button>
        </a>
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="outline" className="rounded-full bg-card h-8"><ExternalLink className="w-3 h-3 mr-1.5" /> Waze</Button>
        </a>
        {!hasTarget && <span className="text-[11px] text-muted-foreground">Add lat/lng to enable turn-by-turn</span>}
      </div>
    </div>
  );
}
