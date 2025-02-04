export const calculateDistance = async (origin: string, destination: string, unit: 'km' | 'mi' = 'mi'): Promise<number> => {
  try {
    // First, geocode the addresses to get coordinates
    const originCoords = await geocodeAddress(origin);
    const destCoords = await geocodeAddress(destination);
    
    if (!originCoords || !destCoords) {
      throw new Error('Could not geocode addresses');
    }

    // Always calculate in kilometers first
    const distanceInKm = haversineDistance(
      originCoords.lat,
      originCoords.lng,
      destCoords.lat,
      destCoords.lng
    );

    // Convert to requested unit
    const finalDistance = unit === 'km' ? distanceInKm : convertDistance(distanceInKm, 'km', 'mi');
    
    return Number(finalDistance.toFixed(1));
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
};

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();

    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function convertDistance(distance: number, fromUnit: 'km' | 'mi', toUnit: 'km' | 'mi'): number {
  if (fromUnit === toUnit) return distance;
  
  // Use exact conversion factors
  const KM_PER_MILE = 1.60934;
  
  if (fromUnit === 'km' && toUnit === 'mi') {
    return distance / KM_PER_MILE; // Convert km to miles
  } else {
    return distance * KM_PER_MILE; // Convert miles to km
  }
}