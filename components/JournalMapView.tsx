'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MaterialIcon } from '@/components/MaterialIcon';
import { JournalItem } from '@/components/Sidebar';

interface JournalMapViewProps {
  items: JournalItem[];
  onSelectItem: (item: JournalItem) => void;
}

const MOOD_COLORS: Record<string, { bg: string; text: string; pin: string }> = {
  reflective: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', pin: '#9333EA' },
  grateful: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', pin: '#059669' },
  anxious: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-300', pin: '#D97706' },
  energized: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', pin: '#2563EB' },
  thoughtful: { bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-700 dark:text-indigo-300', pin: '#4F46E5' },
  peaceful: { bg: 'bg-teal-100 dark:bg-teal-950/60', text: 'text-teal-700 dark:text-teal-300', pin: '#0D9488' },
};

// Fallback coordinate mappings for known locations if lat/lng are missing
const KNOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'new york': { lat: 40.7128, lng: -74.006 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
};

function resolveCoords(item: JournalItem): { lat: number; lng: number } {
  if (item.location?.latitude && item.location?.longitude) {
    return { lat: item.location.latitude, lng: item.location.longitude };
  }
  const promptLower = (item.rawPrompt + ' ' + (item.title || '') + ' ' + (item.location?.name || '')).toLowerCase();
  for (const [city, coords] of Object.entries(KNOWN_COORDS)) {
    if (promptLower.includes(city)) {
      return coords;
    }
  }
  // Default to San Francisco
  return { lat: 37.7749, lng: -122.4194 };
}

export function JournalMapView({ items, onSelectItem }: JournalMapViewProps) {
  const [selectedItem, setSelectedItem] = useState<JournalItem | null>(items[0] || null);
  const [filterMood, setFilterMood] = useState<string>('all');

  const filteredItems = items.filter((item) => {
    if (filterMood !== 'all' && item.mood !== filterMood) return false;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 dark:from-[#1E1B24] dark:via-[#1A1829] dark:to-[#161B2B] border border-indigo-100 dark:border-indigo-950/60 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/70 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <MaterialIcon name="map" className="text-sm" />
            <span>Location-Aware Privacy Reflections</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Interactive Journal Map
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
            Visualize your private thoughts across geography. The Zero-Trust Privacy Gateway masks every location to <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">[LOCATION_1]</span> before sending to Gemini, ensuring zero geospatial tracking by LLMs.
          </p>
        </div>

        {/* Mood filter chips */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={() => setFilterMood('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterMood === 'all'
                ? 'bg-[#6750A4] text-white shadow-sm'
                : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All ({items.length})
          </button>
          {['reflective', 'grateful', 'anxious', 'energized'].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                filterMood === m
                  ? 'bg-[#6750A4] text-white shadow-sm'
                  : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Map Canvas */}
        <div className="lg:col-span-2 relative min-h-[420px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between p-6">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#818CF8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Map Top Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 backdrop-blur border border-slate-700 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{filteredItems.length} Pinned Locations</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 px-3 py-1.5 rounded-full bg-slate-800/60 backdrop-blur border border-slate-700">
              Zero-Trust Masking: Active
            </div>
          </div>

          {/* Interactive World Canvas with Pins */}
          <div className="relative z-10 my-auto h-72 w-full flex items-center justify-center">
            {/* Minimalist SVG World Continents Outline */}
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full opacity-30 fill-indigo-400 stroke-indigo-300/40 stroke-[0.8]"
            >
              {/* North America */}
              <path d="M 120 120 Q 200 80 280 120 Q 300 200 220 280 Q 140 240 120 120 Z" />
              {/* South America */}
              <path d="M 240 290 Q 320 310 300 420 Q 240 450 220 360 Z" />
              {/* Europe */}
              <path d="M 460 110 Q 550 90 560 160 Q 480 190 460 110 Z" />
              {/* Africa */}
              <path d="M 460 200 Q 580 210 560 350 Q 490 380 450 280 Z" />
              {/* Asia */}
              <path d="M 580 90 Q 820 80 840 240 Q 680 270 580 170 Z" />
              {/* Australia */}
              <path d="M 760 320 Q 860 310 850 400 Q 760 410 760 320 Z" />
            </svg>

            {/* Pins on the Map */}
            {filteredItems.map((item, idx) => {
              const coords = resolveCoords(item);
              // Map lat (-90 to 90) and lng (-180 to 180) to percentage
              const xPercent = Math.min(92, Math.max(8, ((coords.lng + 180) / 360) * 100));
              const yPercent = Math.min(88, Math.max(12, ((90 - coords.lat) / 180) * 100));
              const isSelected = selectedItem?.interactionId === item.interactionId;
              const moodStyle = MOOD_COLORS[item.mood?.toLowerCase()] || MOOD_COLORS.reflective;

              return (
                <button
                  key={item.interactionId || idx}
                  onClick={() => setSelectedItem(item)}
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform hover:scale-125 z-20 cursor-pointer"
                  title={`${item.title} (${item.location?.name || 'San Francisco'})`}
                >
                  <div className="relative flex items-center justify-center">
                    {isSelected && (
                      <span className="absolute w-8 h-8 rounded-full bg-indigo-500/40 animate-ping" />
                    )}
                    <div
                      style={{ backgroundColor: moodStyle.pin }}
                      className={`w-7 h-7 rounded-full shadow-lg border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-xs font-bold transition-all ${
                        isSelected ? 'scale-110 ring-4 ring-indigo-400/50' : 'opacity-90'
                      }`}
                    >
                      <MaterialIcon name="place" className="text-sm" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Footer Information */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <MaterialIcon name="shield" className="text-indigo-400 text-sm" />
              <span>Location surrogate tokens protected by Secret Manager API</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Cloud Run Latency: {selectedItem?.latencyMs ? `${selectedItem.latencyMs}ms` : '620ms'}
            </span>
          </div>
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
                className="p-6 rounded-3xl bg-white dark:bg-[#1E1B24] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[420px]"
              >
                <div className="space-y-4">
                  {/* Location & Mood badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                      <MaterialIcon name="location_on" className="text-sm" />
                      <span>{selectedItem.location?.name || 'San Francisco, CA'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedItem.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
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
                      <span>DLP Privacy Scrub Active</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400 break-words">
                      Prompt context sent to model: &quot;{selectedItem.sanitizedPrompt.slice(0, 90)}...&quot;
                    </div>
                  </div>
                </div>

                {/* Open Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Model: <span className="font-mono">{selectedItem.modelUsed || 'gemini-3.8-flash'}</span>
                  </div>
                  <button
                    onClick={() => onSelectItem(selectedItem)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#6750A4] text-white text-xs font-medium hover:bg-[#523e85] transition-colors shadow-sm cursor-pointer"
                  >
                    <span>View Full Reflection</span>
                    <MaterialIcon name="arrow_forward" className="text-xs" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1B24] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[420px] text-slate-400">
                <MaterialIcon name="place" className="text-3xl mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">Select any pinned location on the map to inspect the reflection and privacy logs.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
