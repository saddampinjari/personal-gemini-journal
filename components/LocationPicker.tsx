'use client';

import React, { useState } from 'react';
import { MaterialIcon } from '@/components/MaterialIcon';

import { getCoordinatesForLocation } from '@/lib/geo/coordinates';

export interface LocationData {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  location: LocationData | null;
  onChange: (loc: LocationData | null) => void;
}

const POPULAR_LOCATIONS: LocationData[] = [
  { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708 },
  { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  { name: 'New York, NY', latitude: 40.7128, longitude: -74.006 },
  { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Bengaluru, India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522 },
  { name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
];

export function LocationPicker({ location, onChange }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setDetectError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetecting(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        const detectedLoc: LocationData = {
          name: `Coordinates (${lat}, ${lng})`,
          latitude: lat,
          longitude: lng,
        };
        onChange(detectedLoc);
        setIsOpen(false);
      },
      (err) => {
        setIsDetecting(false);
        setDetectError(err.message || 'Unable to retrieve location.');
      },
      { timeout: 8000 }
    );
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    // 1. Fast match against world gazetteer
    const resolved = getCoordinatesForLocation(query);
    if (resolved) {
      onChange({
        name: resolved.name,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
      });
      setCustomInput('');
      setIsOpen(false);
      return;
    }

    // 2. Dynamic geocoding fallback via OpenStreetMap Nominatim
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lon = parseFloat(results[0].lon);
          const displayName = results[0].display_name.split(',').slice(0, 2).join(',').trim();
          onChange({
            name: displayName || query,
            latitude: lat,
            longitude: lon,
          });
          setCustomInput('');
          setIsOpen(false);
          return;
        }
      }
    } catch {
      // Fall through to default if offline
    }

    // 3. Fallback
    onChange({
      name: query,
      latitude: 25.2048,
      longitude: 55.2708,
    });
    setCustomInput('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {location ? (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-xs font-medium transition-all shadow-sm">
          <MaterialIcon name="location_on" className="text-sm text-indigo-600 dark:text-indigo-400" />
          <span className="truncate max-w-[180px]">{location.name}</span>
          <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-900 dark:text-indigo-200 ml-1">
            DLP Masked
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200 transition-colors p-0.5 rounded-full"
            title="Remove location"
          >
            <MaterialIcon name="close" className="text-xs" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="m3-chip text-xs hover:border-blue-400"
        >
          <MaterialIcon name="add_location_alt" size={14} className="text-[#2563EB] dark:text-blue-400" />
          <span>Add Location</span>
        </button>
      )}

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 bg-white/95 dark:bg-[#0E1528]/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 dark:border-blue-900/40 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <MaterialIcon name="place" size={14} className="text-[#2563EB]" />
              <span>Location Context</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="m3-btn-icon w-7 h-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <MaterialIcon name="close" size={14} />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-2 leading-tight">
            Tag where you are reflecting. The Zero-Trust Gateway will redact it to <span className="font-mono text-blue-600 dark:text-blue-300 font-semibold">[LOCATION_1]</span> before invoking Gemini.
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="m3-btn m3-btn-tonal text-xs h-8.5 w-full mb-2"
          >
            <MaterialIcon name="my_location" size={14} className={isDetecting ? 'animate-spin' : ''} />
            <span>{isDetecting ? 'Detecting GPS...' : 'Use Current Device Location'}</span>
          </button>

          {detectError && (
            <div className="text-[11px] text-red-500 mb-2 px-1">
              {detectError}
            </div>
          )}

          <div className="mb-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Popular Hubs
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    onChange(loc);
                    setIsOpen(false);
                  }}
                  className="m3-chip text-[11px] h-6 px-2.5"
                >
                  {loc.name.split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCustomSubmit} className="flex gap-1.5 mt-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Or type city/place..."
              className="flex-1 px-3 py-1 text-xs rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="m3-btn m3-btn-filled text-xs h-8 px-3.5"
            >
              Pin
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
