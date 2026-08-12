/**
 * Geolocation utilities for geofenced check-in verification.
 * 
 * Uses the browser Geolocation API + Haversine formula to verify
 * that a reviewer is physically near the place they're reviewing.
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeolocationResult {
  success: boolean
  coordinates?: Coordinates
  error?: string
}

/**
 * Get the user's current GPS position via the browser Geolocation API.
 * Returns a promise that resolves with coordinates or an error.
 */
export function getCurrentPosition(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation is not supported by your browser.',
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          success: true,
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        })
      },
      (error) => {
        let message = 'Unable to retrieve your location.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access to verify your check-in.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.'
            break
        }
        resolve({ success: false, error: message })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Accept cached position up to 30s old
      }
    )
  })
}

/**
 * Compute the Haversine distance between two coordinates in meters.
 * This is the standard great-circle distance formula.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Check if a user's coordinates are within the geofence radius of a place.
 * Default radius: 50 meters (accounts for dense urban areas like Pune).
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  placeLat: number,
  placeLng: number,
  radiusMeters: number = 50
): { verified: boolean; distanceMeters: number } {
  const distance = haversineDistance(userLat, userLng, placeLat, placeLng)
  return {
    verified: distance <= radiusMeters,
    distanceMeters: Math.round(distance),
  }
}

/**
 * Format distance for human-readable display.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m away`
  }
  return `${(meters / 1000).toFixed(1)}km away`
}
