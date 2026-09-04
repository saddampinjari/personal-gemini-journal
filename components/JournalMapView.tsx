'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { JournalItem } from '@/components/Sidebar';
import type * as LeafletType from 'leaflet';

interface JournalMapViewProps {
  items: JournalItem[];
  onSelectItem: (item: JournalItem) => void;
}

const MOOD_COLORS: Record<string, { bg: string; text: string; pinHex: string }> = {
  reflective: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', pinHex: '#9333EA' },
  grateful: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', pinHex: '#059669' },
  anxious: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', pinHex: '#D97706' },
  energized: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', pinHex: '#2563EB' },
  thoughtful: { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', pinHex: '#4F46E5' },
  peaceful: { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', pinHex: '#0D9488' },
};

import { findLocationInText, getCoordinatesForLocation } from '@/lib/geo/coordinates';

function resolveCoords(item: JournalItem, index: number): { lat: number; lng: number; cityName: string } {
  // 1. Direct coordinates from item.location
  if (item.location?.latitude && item.location?.longitude) {
    return {
      lat: item.location.latitude,
      lng: item.location.longitude,
      cityName: item.location.name || 'Custom Location',
    };
  }

  // 2. Resolve location name if present
  if (item.location?.name) {
    const geo = getCoordinatesForLocation(item.location.name);
    if (geo) {
      return { lat: geo.latitude, lng: geo.longitude, cityName: geo.name };
    }
  }

  // 3. Scan prompt, title, and full conversation thread for city/country mentions (e.g. Dubai, Tokyo, London)
  const fullText = (
    (item.rawPrompt || '') +
    ' ' +
    (item.title || '') +
    ' ' +
    (item.location?.name || '') +
    ' ' +
    (item.conversation?.map((c) => c.content).join(' ') || '')
  );

  const detected = findLocationInText(fullText);
  if (detected) {
    return { lat: detected.latitude, lng: detected.longitude, cityName: detected.name };
  }

  // 4. Default fallback hubs if no location detected
  const DEFAULT_HUBS = [
    { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'New York, NY', lat: 40.7128, lng: -74.006 },
    { name: 'Bengaluru, India', lat: 12.9716, lng: 77.5946 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  ];
  const fallback = DEFAULT_HUBS[index % DEFAULT_HUBS.length];
  return { lat: fallback.lat, lng: fallback.lng, cityName: fallback.name };
}

export function JournalMapView({ items, onSelectItem }: JournalMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletType.Map | null>(null);
  const tileLayerRef = useRef<LeafletType.TileLayer | null>(null);
  const markersGroupRef = useRef<LeafletType.LayerGroup | null>(null);
  const leafletModuleRef = useRef<typeof LeafletType | null>(null);

  const [selectedItem, setSelectedItem] = useState<JournalItem | null>(items[0] || null);
  const [filterMood, setFilterMood] = useState<string>('all');
  const [mapStyle, setMapStyle] = useState<'clean' | 'dark' | 'standard'>('clean');
  const [isMapReady, setIsMapReady] = useState(false);

  const filteredItems = items.filter((item) => {
    if (filterMood !== 'all' && item.mood !== filterMood) return false;
    return true;
  });

  // Switch Tile Layer Helper
  const applyTileLayer = useCallback((style: 'clean' | 'dark' | 'standard') => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let url: string;
    let options: LeafletType.TileLayerOptions;

    if (style === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      options = {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      };
    } else if (style === 'clean') {
      url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      options = {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      };
    } else {
      url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      options = {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      };
    }

    const newLayer = L.tileLayer(url, options).addTo(map);
    tileLayerRef.current = newLayer;
  }, []);

  // Initialize Map ONCE on mount
  useEffect(() => {
    let isMounted = true;
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    import('leaflet').then((module) => {
      if (!isMounted || !mapContainerRef.current) return;
      const L = (module.default || module) as typeof LeafletType;
      leafletModuleRef.current = L;

      // In case Leaflet was previously attached to this container
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [25, 10],
        zoom: 2,
        minZoom: 1,
        maxZoom: 18,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      // Apply initial tile layer
      applyTileLayer(mapStyle);

      // Trigger size invalidations to ensure proper rendering inside tabs & animations
      const invalidate = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };

      invalidate();
      const t1 = setTimeout(invalidate, 100);
      const t2 = setTimeout(invalidate, 300);
      const t3 = setTimeout(invalidate, 600);

      // Set up ResizeObserver to auto-adapt if window or layout flexes
      let resizeObserver: ResizeObserver | null = null;
      if (mapContainerRef.current && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          invalidate();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      setIsMapReady(true);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        if (resizeObserver) resizeObserver.disconnect();
      };
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Update tile style when user changes it
  useEffect(() => {
    if (isMapReady) {
      applyTileLayer(mapStyle);
    }
  }, [mapStyle, isMapReady, applyTileLayer]);

  // Update Markers when items or filter change
  useEffect(() => {
    const L = leafletModuleRef.current;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!isMapReady || !L || !map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds: [number, number][] = [];

    filteredItems.forEach((item, index) => {
      const { lat, lng, cityName } = resolveCoords(item, index);
      bounds.push([lat, lng]);

      const moodConfig = MOOD_COLORS[item.mood?.toLowerCase()] || MOOD_COLORS.reflective;
      const isSelected = selectedItem?.interactionId === item.interactionId;

      // Custom Clean Pin Icon
      const pinHtml = `
        <div class="group relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-115'}">
          <div style="
            background: radial-gradient(circle at 30% 30%, ${moodConfig.pinHex}, #1E1B24);
            width: ${isSelected ? '36px' : '30px'};
            height: ${isSelected ? '36px' : '30px'};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: 13px;
              color: white;
            ">📍</span>
          </div>
          ${isSelected ? `
            <span style="
              position: absolute;
              top: -6px;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background-color: ${moodConfig.pinHex};
              opacity: 0.35;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></span>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: pinHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersGroup);

      marker.on('click', () => {
        setSelectedItem(item);
        map.setView([lat, lng], Math.max(map.getZoom(), 5), { animate: true });
      });

      marker.bindTooltip(
        `<div style="font-family: sans-serif; font-size: 12px; padding: 2px 4px;">
           <strong style="color: #111827;">${item.title || 'Journal Entry'}</strong><br/>
           <span style="color: #6750A4; font-weight: 600;">📍 ${cityName}</span>
         </div>`,
        { direction: 'top', offset: [0, -28] }
      );
    });

    // Auto fit bounds if items exist
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 4, { animate: true });
      } else {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 7, animate: true });
      }
    }
  }, [filteredItems, isMapReady, selectedItem?.interactionId]);

  // View reset helper
  const handleResetWorld = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([25, 10], 2, { animate: true });
    }
  };

  const handleFitPins = () => {
    if (!mapInstanceRef.current || filteredItems.length === 0) return;
    const bounds: [number, number][] = filteredItems.map((item, idx) => {
      const c = resolveCoords(item, idx);
      return [c.lat, c.lng];
    });
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 7, animate: true });
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1E1B24] dark:via-[#1A1829] dark:to-[#161B2B] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <MaterialIcon name="map" className="text-sm" />
            <span>Interactive Geospatial Journal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Location-Aware Reflections Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Explore your reflections across cities and continents. The Zero-Trust Privacy Gateway masks every location name to <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">[LOCATION_1]</span> before sending to Gemini, preserving complete privacy.
          </p>
        </div>

        {/* Mood filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={() => setFilterMood('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filterMood === 'all'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            All ({items.length})
          </button>
          {['reflective', 'grateful', 'anxious', 'energized'].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                filterMood === m
                  ? 'bg-[#6750A4] text-white shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Leaflet Map Container */}
        <div className="lg:col-span-2 relative h-[520px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 flex flex-col">
          {/* Map Controls Top Bar */}
          <div className="absolute top-4 left-4 right-4 z-[500] flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-md pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{filteredItems.length} Entries Plotted</span>
              </div>

              <button
                onClick={handleFitPins}
                title="Fit to All Locations"
                className="px-2.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md pointer-events-auto flex items-center gap-1 cursor-pointer transition-colors"
              >
                <MaterialIcon name="my_location" className="text-sm" />
                <span className="hidden sm:inline">Fit Pins</span>
              </button>

              <button
                onClick={handleResetWorld}
                title="Reset to World View"
                className="px-2.5 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-md pointer-events-auto flex items-center gap-1 cursor-pointer transition-colors"
              >
                <MaterialIcon name="public" className="text-sm" />
                <span className="hidden sm:inline">World</span>
              </button>
            </div>

            {/* Tile Layer Switcher */}
            <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-md pointer-events-auto text-xs">
              <button
                onClick={() => setMapStyle('clean')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  mapStyle === 'clean'
                    ? 'bg-[#6750A4] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                }`}
              >
                Clean
              </button>
              <button
                onClick={() => setMapStyle('dark')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  mapStyle === 'dark'
                    ? 'bg-[#6750A4] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setMapStyle('standard')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  mapStyle === 'standard'
                    ? 'bg-[#6750A4] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white'
                }`}
              >
                Street
              </button>
            </div>
          </div>

          {/* Leaflet Map DOM Node */}
          <div
            ref={mapContainerRef}
            className="w-full h-full min-h-[520px] z-0 rounded-3xl"
          />
        </div>

        {/* Selected Location Entry Detail Card */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.interactionId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="p-6 rounded-3xl bg-white dark:bg-[#1E1B24] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[520px]"
              >
                <div className="space-y-4 overflow-y-auto pr-1">
                  {/* Location & Mood badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                      <MaterialIcon name="location_on" className="text-sm text-indigo-600 dark:text-indigo-400" />
                      <span>{selectedItem.location?.name || 'San Francisco, CA'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedItem.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Title & Entry Snippet */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                      {selectedItem.title || 'Journal Reflection'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-4 leading-relaxed">
                      {selectedItem.rawPrompt}
                    </p>
                  </div>

                  {/* Privacy Shield Verification Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <MaterialIcon name="verified_user" className="text-sm" />
                      <span>Zero-Trust Privacy Scrub Active</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 break-words line-clamp-3">
                      Prompt context sent to model: &quot;{selectedItem.sanitizedPrompt}&quot;
                    </div>
                  </div>

                  {/* AI Reflection preview */}
                  <div className="p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                    <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1 mb-1">
                      <MaterialIcon name="psychology" className="text-xs" />
                      <span>Gemini Reflection Preview</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 italic">
                      {selectedItem.reflection.replace(/###.*?\n/g, '').slice(0, 160)}...
                    </p>
                  </div>
                </div>

                {/* Open Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Model: <span className="font-mono text-indigo-600 dark:text-indigo-400">{selectedItem.modelUsed || 'gemini-2.5-flash'}</span>
                  </div>
                  <button
                    onClick={() => onSelectItem(selectedItem)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-semibold hover:bg-[#523e85] transition-colors shadow-sm cursor-pointer"
                  >
                    <span>Open in Workspace</span>
                    <MaterialIcon name="arrow_forward" className="text-xs" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1B24] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center h-[520px] text-slate-400">
                <MaterialIcon name="place" className="text-3xl mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">Click any location pin on the map to inspect the reflection and privacy logs.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
