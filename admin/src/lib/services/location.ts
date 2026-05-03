
export const getLocation = async ({query, limit = 1}: {query: string, limit?: number}) => {

    const location = new URLSearchParams({
        q: query,
        format: 'json',
        limit: limit.toString()
    })

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${location.toString()}`)

        return await res.json()
        
    } catch (error) {
        throw new Error("Failed to fetch location data");
    }
}

export function geoFence({expectedLocation, currentLocation, radius}: {expectedLocation: {lat: number, lon: number}, currentLocation: {lat: number, lon: number}, radius: number}) {

  if (
    expectedLocation?.lat === 0 ||
    expectedLocation?.lon === 0 ||
    currentLocation?.lat === 0 ||
    currentLocation?.lon === 0
  ) {
    throw new Error("Invalid parameters provided");
  }

  const toRadians = (degree: any) => degree * (Math.PI / 180);
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(currentLocation.lat - expectedLocation.lat);
  const dLon = toRadians(currentLocation.lon - expectedLocation.lon);
  const lat1 = toRadians(expectedLocation.lat);
  const lat2 = toRadians(currentLocation.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Add tolerance of 1 meter
  if (distance > Number(radius) + 1) {
    throw new Error("Location is outside the authorized area/radius");
  }

  return true;
} 