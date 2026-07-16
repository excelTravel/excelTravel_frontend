import { useEffect, useRef, useState } from 'react';
import maplibregl, { type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { config } from '@/lib/config';
import { cn } from '@/lib/utils';
import { RWANDA_ROUTES, type LiveBus } from './useLiveBuses';

// Keyless, zero-billing base map: OpenStreetMap raster tiles. If VITE_MAP_STYLE_URL is set (e.g. a MapTiler
// vector style), that wins. NOTE: OSM's public tiles suit dev/MVP; for heavy production traffic, swap in a
// keyed provider or self-hosted tiles (see docs/integration.md).
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const KIGALI: [number, number] = [30.0606, -1.9441];

// A pulsing teal marker with a bus glyph; status drives the accent via a data attribute (CSS in index.css).
function makeMarkerEl(bus: LiveBus): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'et-bus-marker';
  el.dataset.status = bus.status;
  el.setAttribute('aria-label', `${bus.code} · ${bus.routeName}`);
  // Static, trusted markup only — no user/dynamic data is interpolated here (bus data uses dataset/aria-label above).
  el.innerHTML =
    '<span class="et-bus-ring" aria-hidden="true"></span>' +
    '<span class="et-bus-dot" aria-hidden="true">' +
    '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>' +
    '<circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>' +
    '</span>';
  return el;
}

export interface MapStop { id: string; name: string; lng: number; lat: number }

interface RwandaMapProps {
  buses: LiveBus[];
  selectedId?: string | null;
  onSelectBus?: (id: string) => void;
  interactive?: boolean;
  loadingLabel?: string;
  className?: string;
  stops?: MapStop[]; // static station/stop markers
  pinMode?: boolean; // when true, clicking the map drops a pin
  onPick?: (lng: number, lat: number) => void;
}

export function RwandaMap({
  buses,
  selectedId,
  onSelectBus,
  interactive = true,
  loadingLabel = 'Loading map…',
  className,
  stops,
  pinMode = false,
  onPick,
}: RwandaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const stopMarkersRef = useRef<maplibregl.Marker[]>([]);
  const selectRef = useRef(onSelectBus);
  selectRef.current = onSelectBus;
  const pinRef = useRef(pinMode);
  pinRef.current = pinMode;
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const [ready, setReady] = useState(false);

  // Initialise the map exactly once.
  useEffect(() => {
    if (!containerRef.current) return;
    const markers = markersRef.current; // stable Map instance — safe to use in cleanup
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: config.mapStyleUrl || OSM_STYLE,
      center: KIGALI,
      zoom: interactive ? 7.4 : 6.9,
      interactive,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }
    // Pin mode: a click drops a stop where the user tapped.
    map.on('click', (e) => {
      if (pinRef.current) pickRef.current?.(e.lngLat.lng, e.lngLat.lat);
    });
    // Add the route overlay once the style is up. Guarded + wrapped so a StrictMode double-mount or a
    // failed layer add can NEVER leave the loading shimmer covering the map (ready always flips).
    const onStyleReady = () => {
      try {
        if (!map.getSource('routes')) {
          map.addSource('routes', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: RWANDA_ROUTES.map((r) => ({
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: r.coords },
              })),
            },
          });
          map.addLayer({
            id: 'routes-line',
            type: 'line',
            source: 'routes',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#14B8A6', 'line-width': 3, 'line-opacity': 0.55, 'line-dasharray': [1, 1.6] },
          });
        }
      } catch {
        // Route lines are decorative — never block the map on them.
      }
      setReady(true);
      map.resize(); // guard against a zero-size container race on first paint
    };
    if (map.isStyleLoaded()) onStyleReady();
    else map.once('load', onStyleReady);
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconcile markers whenever the bus set, positions, or selection change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const existing = markersRef.current;
    const seen = new Set<string>();
    for (const bus of buses) {
      seen.add(bus.id);
      let marker = existing.get(bus.id);
      if (!marker) {
        const el = makeMarkerEl(bus);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          selectRef.current?.(bus.id);
        });
        marker = new maplibregl.Marker({ element: el }).setLngLat([bus.lng, bus.lat]).addTo(map);
        existing.set(bus.id, marker);
      } else {
        marker.setLngLat([bus.lng, bus.lat]);
      }
      marker.getElement().dataset.selected = String(bus.id === selectedId);
    }
    for (const [id, marker] of existing) {
      if (!seen.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    }
  }, [buses, selectedId, ready]);

  // Fly to the selected bus.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const bus = buses.find((b) => b.id === selectedId);
    if (bus) map.flyTo({ center: [bus.lng, bus.lat], zoom: 8.6, duration: 900 });
  }, [selectedId, ready, buses]);

  // Render static station/stop markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const layer = stopMarkersRef.current;
    for (const m of layer) m.remove();
    layer.length = 0;
    for (const s of stops ?? []) {
      const el = document.createElement('div');
      el.title = s.name;
      el.style.cssText = 'width:12px;height:12px;border-radius:9999px;background:#0F766E;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4)';
      layer.push(new maplibregl.Marker({ element: el }).setLngLat([s.lng, s.lat]).addTo(map));
    }
  }, [stops, ready]);

  // Crosshair cursor while pinning.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.getCanvas().style.cursor = pinMode ? 'crosshair' : '';
  }, [pinMode, ready]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* h-full (not absolute inset-0): MapLibre's own CSS forces `.maplibregl-map{position:relative}`,
          which would cancel `absolute` and collapse the container to 0 height. */}
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 z-10 grid place-items-center">
          <div className="shimmer absolute inset-0" />
          <span className="relative rounded-full bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            {loadingLabel}
          </span>
        </div>
      )}
    </div>
  );
}
