/**
 * Comprehensive World Gazetteer & Geospatial Geocoder
 * 
 * Provides high-accuracy offline coordinate resolution for hundreds of world cities,
 * regional tech hubs, and countries, ensuring reflections containing locations like "Dubai",
 * "Tokyo", "London", or "Bengaluru" are pinned with pinpoint precision on the map.
 */

export interface GeoLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export const WORLD_GAZETTEER: Record<string, GeoLocation> = {
  // --- Middle East ---
  'dubai': { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708 },
  'abu dhabi': { name: 'Abu Dhabi, UAE', latitude: 24.4539, longitude: 54.3773 },
  'sharjah': { name: 'Sharjah, UAE', latitude: 25.3463, longitude: 55.4209 },
  'uae': { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708 },
  'united arab emirates': { name: 'Dubai, UAE', latitude: 25.2048, longitude: 55.2708 },
  'riyadh': { name: 'Riyadh, Saudi Arabia', latitude: 24.7136, longitude: 46.6753 },
  'jeddah': { name: 'Jeddah, Saudi Arabia', latitude: 21.4858, longitude: 39.1925 },
  'doha': { name: 'Doha, Qatar', latitude: 25.2854, longitude: 51.5310 },
  'qatar': { name: 'Doha, Qatar', latitude: 25.2854, longitude: 51.5310 },
  'manama': { name: 'Manama, Bahrain', latitude: 26.2285, longitude: 50.5860 },
  'kuwait': { name: 'Kuwait City, Kuwait', latitude: 29.3759, longitude: 47.9774 },
  'kuwait city': { name: 'Kuwait City, Kuwait', latitude: 29.3759, longitude: 47.9774 },
  'muscat': { name: 'Muscat, Oman', latitude: 23.5880, longitude: 58.3829 },
  'cairo': { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357 },
  'egypt': { name: 'Cairo, Egypt', latitude: 30.0444, longitude: 31.2357 },
  'istanbul': { name: 'Istanbul, Turkey', latitude: 41.0082, longitude: 28.9784 },
  'turkey': { name: 'Istanbul, Turkey', latitude: 41.0082, longitude: 28.9784 },
  'tel aviv': { name: 'Tel Aviv, Israel', latitude: 32.0853, longitude: 34.7818 },
  'amman': { name: 'Amman, Jordan', latitude: 31.9454, longitude: 35.9284 },
  'beirut': { name: 'Beirut, Lebanon', latitude: 33.8938, longitude: 35.5018 },

  // --- Asia & Pacific ---
  'tokyo': { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503 },
  'kyoto': { name: 'Kyoto, Japan', latitude: 35.0116, longitude: 135.7681 },
  'osaka': { name: 'Osaka, Japan', latitude: 34.6937, longitude: 135.5023 },
  'japan': { name: 'Tokyo, Japan', latitude: 35.6762, longitude: 139.6503 },
  'seoul': { name: 'Seoul, South Korea', latitude: 37.5665, longitude: 126.9780 },
  'korea': { name: 'Seoul, South Korea', latitude: 37.5665, longitude: 126.9780 },
  'beijing': { name: 'Beijing, China', latitude: 39.9042, longitude: 116.4074 },
  'shanghai': { name: 'Shanghai, China', latitude: 31.2304, longitude: 121.4737 },
  'shenzhen': { name: 'Shenzhen, China', latitude: 22.5431, longitude: 114.0579 },
  'hong kong': { name: 'Hong Kong', latitude: 22.3193, longitude: 114.1694 },
  'taipei': { name: 'Taipei, Taiwan', latitude: 25.0330, longitude: 121.5654 },
  'taiwan': { name: 'Taipei, Taiwan', latitude: 25.0330, longitude: 121.5654 },
  'singapore': { name: 'Singapore', latitude: 1.3521, longitude: 103.8198 },
  'bangkok': { name: 'Bangkok, Thailand', latitude: 13.7563, longitude: 100.5018 },
  'thailand': { name: 'Bangkok, Thailand', latitude: 13.7563, longitude: 100.5018 },
  'kuala lumpur': { name: 'Kuala Lumpur, Malaysia', latitude: 3.1390, longitude: 101.6869 },
  'malaysia': { name: 'Kuala Lumpur, Malaysia', latitude: 3.1390, longitude: 101.6869 },
  'jakarta': { name: 'Jakarta, Indonesia', latitude: -6.2088, longitude: 106.8456 },
  'manila': { name: 'Manila, Philippines', latitude: 14.5995, longitude: 120.9842 },
  'hanoi': { name: 'Hanoi, Vietnam', latitude: 21.0285, longitude: 105.8542 },
  'ho chi minh': { name: 'Ho Chi Minh City, Vietnam', latitude: 10.8231, longitude: 106.6297 },
  'bengaluru': { name: 'Bengaluru, India', latitude: 12.9716, longitude: 77.5946 },
  'bangalore': { name: 'Bengaluru, India', latitude: 12.9716, longitude: 77.5946 },
  'mumbai': { name: 'Mumbai, India', latitude: 19.0760, longitude: 72.8777 },
  'delhi': { name: 'Delhi, India', latitude: 28.6139, longitude: 77.2090 },
  'new delhi': { name: 'New Delhi, India', latitude: 28.6139, longitude: 77.2090 },
  'hyderabad': { name: 'Hyderabad, India', latitude: 17.3850, longitude: 78.4867 },
  'chennai': { name: 'Chennai, India', latitude: 13.0827, longitude: 80.2707 },
  'pune': { name: 'Pune, India', latitude: 18.5204, longitude: 73.8567 },
  'kolkata': { name: 'Kolkata, India', latitude: 22.5726, longitude: 88.3639 },
  'india': { name: 'Bengaluru, India', latitude: 12.9716, longitude: 77.5946 },
  'sydney': { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093 },
  'melbourne': { name: 'Melbourne, Australia', latitude: -37.8136, longitude: 144.9631 },
  'brisbane': { name: 'Brisbane, Australia', latitude: -27.4698, longitude: 153.0251 },
  'perth': { name: 'Perth, Australia', latitude: -31.9505, longitude: 115.8605 },
  'australia': { name: 'Sydney, Australia', latitude: -33.8688, longitude: 151.2093 },
  'auckland': { name: 'Auckland, New Zealand', latitude: -36.8485, longitude: 174.7633 },
  'wellington': { name: 'Wellington, New Zealand', latitude: -41.2865, longitude: 174.7762 },

  // --- North America ---
  'san francisco': { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  'silicon valley': { name: 'Silicon Valley, CA', latitude: 37.3861, longitude: -122.0839 },
  'san jose': { name: 'San Jose, CA', latitude: 37.3382, longitude: -121.8863 },
  'los angeles': { name: 'Los Angeles, CA', latitude: 34.0522, longitude: -118.2437 },
  'san diego': { name: 'San Diego, CA', latitude: 32.7157, longitude: -117.1611 },
  'seattle': { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321 },
  'portland': { name: 'Portland, OR', latitude: 45.5152, longitude: -122.6784 },
  'new york': { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 },
  'nyc': { name: 'New York, NY', latitude: 40.7128, longitude: -74.0060 },
  'boston': { name: 'Boston, MA', latitude: 42.3601, longitude: -71.0589 },
  'washington dc': { name: 'Washington DC', latitude: 38.9072, longitude: -77.0369 },
  'washington': { name: 'Seattle, WA', latitude: 47.6062, longitude: -122.3321 },
  'chicago': { name: 'Chicago, IL', latitude: 41.8781, longitude: -87.6298 },
  'austin': { name: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
  'dallas': { name: 'Dallas, TX', latitude: 32.7767, longitude: -96.7970 },
  'houston': { name: 'Houston, TX', latitude: 29.7604, longitude: -95.3698 },
  'denver': { name: 'Denver, CO', latitude: 39.7392, longitude: -104.9903 },
  'miami': { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918 },
  'atlanta': { name: 'Atlanta, GA', latitude: 33.7490, longitude: -84.3880 },
  'california': { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  'texas': { name: 'Austin, TX', latitude: 30.2672, longitude: -97.7431 },
  'florida': { name: 'Miami, FL', latitude: 25.7617, longitude: -80.1918 },
  'toronto': { name: 'Toronto, Canada', latitude: 43.6532, longitude: -79.3832 },
  'vancouver': { name: 'Vancouver, Canada', latitude: 49.2827, longitude: -123.1207 },
  'montreal': { name: 'Montreal, Canada', latitude: 45.5017, longitude: -73.5673 },
  'canada': { name: 'Toronto, Canada', latitude: 43.6532, longitude: -79.3832 },
  'mexico city': { name: 'Mexico City, Mexico', latitude: 19.4326, longitude: -99.1332 },
  'mexico': { name: 'Mexico City, Mexico', latitude: 19.4326, longitude: -99.1332 },

  // --- Europe ---
  'london': { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  'manchester': { name: 'Manchester, UK', latitude: 53.4808, longitude: -2.2426 },
  'edinburgh': { name: 'Edinburgh, UK', latitude: 55.9533, longitude: -3.1883 },
  'uk': { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  'united kingdom': { name: 'London, UK', latitude: 51.5074, longitude: -0.1278 },
  'dublin': { name: 'Dublin, Ireland', latitude: 53.3498, longitude: -6.2603 },
  'ireland': { name: 'Dublin, Ireland', latitude: 53.3498, longitude: -6.2603 },
  'paris': { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522 },
  'france': { name: 'Paris, France', latitude: 48.8566, longitude: 2.3522 },
  'berlin': { name: 'Berlin, Germany', latitude: 52.5200, longitude: 13.4050 },
  'munich': { name: 'Munich, Germany', latitude: 48.1351, longitude: 11.5820 },
  'frankfurt': { name: 'Frankfurt, Germany', latitude: 50.1109, longitude: 8.6821 },
  'germany': { name: 'Berlin, Germany', latitude: 52.5200, longitude: 13.4050 },
  'amsterdam': { name: 'Amsterdam, Netherlands', latitude: 52.3676, longitude: 4.9041 },
  'netherlands': { name: 'Amsterdam, Netherlands', latitude: 52.3676, longitude: 4.9041 },
  'brussels': { name: 'Brussels, Belgium', latitude: 50.8503, longitude: 4.3517 },
  'zurich': { name: 'Zurich, Switzerland', latitude: 47.3769, longitude: 8.5417 },
  'geneva': { name: 'Geneva, Switzerland', latitude: 46.2044, longitude: 6.1432 },
  'switzerland': { name: 'Zurich, Switzerland', latitude: 47.3769, longitude: 8.5417 },
  'madrid': { name: 'Madrid, Spain', latitude: 40.4168, longitude: -3.7038 },
  'barcelona': { name: 'Barcelona, Spain', latitude: 41.3851, longitude: 2.1734 },
  'spain': { name: 'Madrid, Spain', latitude: 40.4168, longitude: -3.7038 },
  'rome': { name: 'Rome, Italy', latitude: 41.9028, longitude: 12.4964 },
  'milan': { name: 'Milan, Italy', latitude: 45.4642, longitude: 9.1900 },
  'italy': { name: 'Rome, Italy', latitude: 41.9028, longitude: 12.4964 },
  'vienna': { name: 'Vienna, Austria', latitude: 48.2082, longitude: 16.3738 },
  'stockholm': { name: 'Stockholm, Sweden', latitude: 59.3293, longitude: 18.0686 },
  'oslo': { name: 'Oslo, Norway', latitude: 59.9139, longitude: 10.7522 },
  'copenhagen': { name: 'Copenhagen, Denmark', latitude: 55.6761, longitude: 12.5683 },
  'helsinki': { name: 'Helsinki, Finland', latitude: 60.1699, longitude: 24.9384 },
  'warsaw': { name: 'Warsaw, Poland', latitude: 52.2297, longitude: 21.0122 },
  'prague': { name: 'Prague, Czech Republic', latitude: 50.0755, longitude: 14.4378 },
  'athens': { name: 'Athens, Greece', latitude: 37.9838, longitude: 23.7275 },
  'lisbon': { name: 'Lisbon, Portugal', latitude: 38.7223, longitude: -9.1393 },

  // --- South America & Africa ---
  'sao paulo': { name: 'São Paulo, Brazil', latitude: -23.5505, longitude: -46.6333 },
  'brazil': { name: 'São Paulo, Brazil', latitude: -23.5505, longitude: -46.6333 },
  'rio de janeiro': { name: 'Rio de Janeiro, Brazil', latitude: -22.9068, longitude: -43.1729 },
  'buenos aires': { name: 'Buenos Aires, Argentina', latitude: -34.6037, longitude: -58.3816 },
  'santiago': { name: 'Santiago, Chile', latitude: -33.4489, longitude: -70.6693 },
  'johannesburg': { name: 'Johannesburg, South Africa', latitude: -26.2041, longitude: 28.0473 },
  'cape town': { name: 'Cape Town, South Africa', latitude: -33.9249, longitude: 18.4241 },
  'nairobi': { name: 'Nairobi, Kenya', latitude: -1.2921, longitude: 36.8219 },
  'lagos': { name: 'Lagos, Nigeria', latitude: 6.5244, longitude: 3.3792 },
  'casablanca': { name: 'Casablanca, Morocco', latitude: 33.5731, longitude: -7.5898 },
  'kigali': { name: 'Kigali, Rwanda', latitude: -1.9706, longitude: 30.1044 },
};

/**
 * Searches text for any mention of known world cities or countries.
 * Prioritizes longer/more specific matches first (e.g. "Abu Dhabi" before "Dhabi").
 */
export function findLocationInText(text: string): GeoLocation | null {
  if (!text || typeof text !== 'string') return null;

  const normalized = text.toLowerCase();

  // Sort keys by descending length so multi-word locations (e.g., "san francisco", "abu dhabi") match before sub-words
  const sortedKeys = Object.keys(WORLD_GAZETTEER).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    // Word boundary regex check to prevent partial word false positives
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(normalized)) {
      return WORLD_GAZETTEER[key];
    }
  }

  return null;
}

/**
 * Resolves coordinates for a location string or search query.
 */
export function getCoordinatesForLocation(query: string): GeoLocation | null {
  if (!query || typeof query !== 'string') return null;

  const cleaned = query.toLowerCase().trim();

  if (WORLD_GAZETTEER[cleaned]) {
    return WORLD_GAZETTEER[cleaned];
  }

  // Check if query contains any city key
  return findLocationInText(query);
}
