import { useEffect, useState } from "react";
import { MapPin, Monitor, Store } from "lucide-react";

interface LocationCellProps {
  lat: number;
  lon: number;
}

const SHOP_LAT = 10.3685651;
const SHOP_LON = 123.9304048;
const AT_SHOP_RADIUS_METERS = 150;

const addressCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function calculateShopDistance(lat: number, lon: number): number {
  const earthRadiusMeters = 6371e3;
  const toRad = (angle: number) => (angle * Math.PI) / 180.0;
  const dLat = toRad(lat - SHOP_LAT);
  const dLon = toRad(lon - SHOP_LON);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(SHOP_LAT)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Reverse-geocodes once per unique coordinate, even if many rows ask at the
 * same time (Nominatim rate-limits aggressively). Failures aren't cached.
 */
function fetchAddress(lat: number, lon: number, key: string): Promise<string> {
  const fallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  const hit = addressCache.get(key);
  if (hit) return Promise.resolve(hit);

  const running = inflight.get(key);
  if (running) return running;

  const request = fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
    { headers: { "Accept-Language": "en" } },
  )
    .then((res) => res.json())
    .then((data) => {
      const addr = data?.address;
      if (!addr) return fallback;
      const street = addr.road || addr.suburb || addr.neighbourhood || "";
      const city = addr.city || addr.municipality || addr.town || "";
      const label = [street, city].filter(Boolean).join(", ") || fallback;
      addressCache.set(key, label);
      return label;
    })
    .catch(() => fallback)
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}

export default function LocationCell({ lat, lon }: LocationCellProps) {
  const hasGps = Boolean(lat && lon);
  const key = hasGps ? `${lat.toFixed(4)},${lon.toFixed(4)}` : "";
  const distance = hasGps ? calculateShopDistance(lat, lon) : -1;
  const atShop = hasGps && distance <= AT_SHOP_RADIUS_METERS;
  // Logs made at the shop don't need a street address at all.
  const needsLookup = hasGps && !atShop;

  const [resolved, setResolved] = useState<{
    key: string;
    text: string;
  } | null>(() => {
    const hit = key ? addressCache.get(key) : undefined;
    return hit ? { key, text: hit } : null;
  });
  const address = resolved?.key === key ? resolved.text : null;

  useEffect(() => {
    if (!needsLookup) return;
    let alive = true;
    fetchAddress(lat, lon, key).then((text) => {
      if (alive) setResolved({ key, text });
    });
    return () => {
      alive = false;
    };
  }, [needsLookup, lat, lon, key]);

  if (!hasGps) {
    return (
      <div
        className="flex items-center gap-2 text-xs text-slate-600"
        title="No GPS captured. Logged from the shop computer or office network."
      >
        <Monitor size={14} className="shrink-0 text-slate-400" />
        <span>Shop computer</span>
      </div>
    );
  }

  if (atShop) {
    return (
      <div
        className="flex items-center gap-2 text-xs"
        title={`Lat: ${lat}, Lon: ${lon}`}
      >
        <Store size={14} className="shrink-0 text-emerald-600" />
        <span className="font-medium text-emerald-800">At the shop</span>
        <span className="text-slate-400">~{formatDistance(distance)}</span>
      </div>
    );
  }

  return (
    <div
      className="flex min-w-0 flex-col gap-0.5"
      title={`Lat: ${lat}, Lon: ${lon}`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
        <MapPin size={14} className="shrink-0 text-amber-600" />
        {address ? (
          <span className="truncate">{address}</span>
        ) : (
          <span className="h-3 w-28 animate-pulse rounded bg-slate-200 motion-reduce:animate-none" />
        )}
      </div>
      <span className="pl-5.5 text-[11px] font-medium text-amber-700">
        {formatDistance(distance)} from the shop
      </span>
    </div>
  );
}
