"use client";

import React, { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import Image from "next/image";
import { Navigation, Store as StoreIcon } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with webpack/next
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface StoreMarker {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  city: string;
  latitude: number;
  longitude: number;
}

// Custom store marker icon creator
function createStoreIcon(imageUrl: string, name: string) {
  return L.divIcon({
    className: "store-map-marker",
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
        <div style="width:48px;height:48px;border-radius:50%;border:3px solid #e03d8f;overflow:hidden;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.18);">
          <img src="${imageUrl || "/placeholder.svg"}" style="width:100%;height:100%;object-fit:cover;" alt="${name}" />
        </div>
        <div style="width:3px;height:10px;background:#e03d8f;border-radius:0 0 2px 2px;"></div>
        <div style="width:8px;height:4px;background:rgba(0,0,0,0.15);border-radius:50%;margin-top:-1px;"></div>
      </div>
    `,
    iconSize: [48, 68],
    iconAnchor: [24, 68],
    popupAnchor: [0, -72],
  });
}

// Mindoro bounds to lock the map
const MINDORO_CENTER: [number, number] = [12.88, 121.10];
const MINDORO_BOUNDS: L.LatLngBoundsExpression = [
  [12.25, 120.45], // SW
  [13.55, 121.65], // NE
];

function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const handleLocate = () => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 14 });
    map.once("locationfound", () => setLocating(false));
    map.once("locationerror", () => setLocating(false));
  };

  return (
    <button
      onClick={handleLocate}
      className="absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg border border-black/10 hover:bg-primary/10 transition-colors"
      title="Find my location"
    >
      <Navigation className={`h-5 w-5 text-primary ${locating ? "animate-pulse" : ""}`} />
    </button>
  );
}

interface MindoroStoreMapProps {
  stores: StoreMarker[];
  isLoading?: boolean;
}

export default function MindoroStoreMap({ stores, isLoading }: MindoroStoreMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  const storesWithLocation = useMemo(() => {
    return stores.filter(s => s.latitude && s.longitude);
  }, [stores]);

  if (!mapReady) {
    return (
      <div className="w-full h-[60vh] md:h-[70vh] rounded-[32px] bg-[#f5f5f5] flex items-center justify-center animate-pulse">
        <div className="text-center">
          <StoreIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[70vh] rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-black/[0.04]">
      {/* Store count badge */}
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-black/5 flex items-center gap-2">
        <StoreIcon className="h-4 w-4 text-primary" />
        <span className="text-xs font-bold">{storesWithLocation.length} {storesWithLocation.length === 1 ? "Store" : "Stores"} on Map</span>
      </div>

      <MapContainer
        center={MINDORO_CENTER}
        zoom={9}
        minZoom={8}
        maxZoom={18}
        maxBounds={MINDORO_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {storesWithLocation.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={createStoreIcon(store.imageUrl, store.name)}
          >
            <Popup>
              <div className="flex flex-col items-center gap-2 p-1 min-w-[160px]">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 bg-[#f8f8f8]">
                  {store.imageUrl ? (
                    <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <StoreIcon className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm">{store.name}</p>
                  <p className="text-[10px] text-muted-foreground">{store.category} · {store.city || "Oriental Mindoro"}</p>
                </div>
                <a
                  href={`/stores/${store.id}`}
                  className="mt-1 px-4 py-1.5 bg-primary text-white text-[10px] font-bold rounded-full hover:bg-primary/90 transition-colors"
                >
                  Visit Shop
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        <LocationButton />
      </MapContainer>

      {storesWithLocation.length === 0 && !isLoading && (
        <div className="absolute inset-0 z-[500] bg-white/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="text-center p-8">
            <StoreIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-headline tracking-tight mb-1">No stores pinned yet</p>
            <p className="text-sm text-muted-foreground">Stores will appear here once sellers pin their location.</p>
          </div>
        </div>
      )}
    </div>
  );
}
