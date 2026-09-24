import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

interface LocationCellProps {
  lat: number;
  lon: number;
}

const addressCache: Record<string, string> = {};

function calculateShopDistance(lat: number, lon: number): number {
  if (!lat || !lon || (lat === 0 && lon === 0)) return -1;
  const shopLat = 10.3685651;
  const shopLon = 123.9304048;
  const earthRadiusMeters = 6371e3;

  const toRad = (angle: number) => (angle * Math.PI) / 180.0;
  const dLat = toRad(lat - shopLat);
  const dLon = toRad(lon - shopLon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(shopLat)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export default function LocationCell({ lat, lon }: LocationCellProps) {
  const isNoGps = !lat || !lon || (lat === 0 && lon === 0);
  const cacheKey = isNoGps ? "" : `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const cachedAddress = cacheKey ? addressCache[cacheKey] : undefined;

  const [address, setAddress] = useState<string>(
    isNoGps ? "Shop / PC (No GPS)" : cachedAddress || "Loading location...",
  );
  const [loading, setLoading] = useState<boolean>(!isNoGps && !cachedAddress);

  const distanceMeters = calculateShopDistance(lat, lon);
  const isAtShop = distanceMeters >= 0 && distanceMeters <= 150;

  useEffect(() => {
    if (isNoGps || cachedAddress) return;

    let isMounted = true;
    const fetchAddress = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await response.json();
        if (!isMounted) return;

        if (data && data.address) {
          const addr = data.address;
          const street = addr.road || addr.suburb || addr.neighbourhood || "";
          const city = addr.city || addr.municipality || addr.town || "Mandaue";
          const formatted = street
            ? `${street}, ${city}`
            : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

          addressCache[cacheKey] = formatted;
          setAddress(formatted);
        } else {
          setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        }
      } catch {
        if (isMounted) setAddress(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAddress();
    return () => {
      isMounted = false;
    };
  }, [lat, lon, isNoGps, cachedAddress, cacheKey]);

  return (
    <div
      className="flex flex-col gap-0.5 max-w-xs"
      title={`Lat: ${lat}, Lon: ${lon}`}
    >
      <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
        <MapPin size={13} className="text-amber-700 shrink-0" />
        <span className="truncate">{loading ? "Resolving..." : address}</span>
      </div>

      <div className="flex items-center gap-1.5 pl-4">
        {isNoGps ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
            Office Network / PC
          </span>
        ) : isAtShop ? (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            At Shop (~{Math.round(distanceMeters)}m)
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
            Location (~
            {Math.round(
              distanceMeters >= 1000 ? distanceMeters / 1000 : distanceMeters,
            )}
            {distanceMeters >= 1000 ? "km" : "m"} away)
          </span>
        )}
      </div>
    </div>
  );
}
